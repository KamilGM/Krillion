import test from "node:test";
import assert from "node:assert/strict";
import judge from "./index.mjs";

const origin = "https://game.example";
const input = {
  prompt: "Name a planet in our solar system.",
  guess: "Earth",
  categories: [{ id: "common", name: "Common", points: 10 }],
  references: [{ text: "Mars", categoryId: "common" }],
};
const allowedRateLimit = { limit: async () => ({ success: true }) };

function request(body, options = {}) {
  return new Request("https://judge.example/judge", {
    method: options.method || "POST",
    headers: {
      Origin: options.origin || origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.42",
    },
    body: options.method === "OPTIONS" ? undefined : JSON.stringify(body),
  });
}

test("returns a validated AI judgment and enables CORS for the configured site", async () => {
  const response = await judge.fetch(request(input), {
    ALLOWED_ORIGIN: origin,
    ANSWER_RATE_LIMITER: allowedRateLimit,
    AI: {
      run: async (model, options) => {
        assert.equal(model, "@cf/google/gemma-4-26b-a4b-it");
        assert.equal(options.messages[1].content.includes("Earth"), true);
        return {
          response: JSON.stringify({
            verdict: "correct",
            categoryId: "common",
            reason: "Earth is a planet in the solar system.",
          }),
        };
      },
    },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.deepEqual(await response.json(), {
    verdict: "correct",
    categoryId: "common",
    reason: "Earth is a planet in the solar system.",
    sources: [],
  });
});

test("uses Claude Mythos web search when a server-side Anthropic key is configured", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl, requestOptions;
  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return Response.json({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            verdict: "correct",
            categoryId: "common",
            reason: "Earth is a planet in the solar system.",
          }),
          citations: [
            {
              type: "web_search_result_location",
              title: "Solar System Facts",
              url: "https://example.com/solar-system",
            },
          ],
        },
      ],
    });
  };
  try {
    const response = await judge.fetch(request(input), {
      ALLOWED_ORIGIN: origin,
      ANSWER_RATE_LIMITER: allowedRateLimit,
      ANTHROPIC_API_KEY: "server-only-test-key",
      AI: { run: async () => assert.fail("Workers AI should not run when Mythos is configured") },
    });
    const body = await response.json();

    assert.equal(requestUrl, "https://api.anthropic.com/v1/messages");
    assert.equal(requestOptions.headers["x-api-key"], "server-only-test-key");
    assert.equal(JSON.parse(requestOptions.body).model, "claude-mythos-5-2");
    assert.deepEqual(JSON.parse(requestOptions.body).tools, [
      { type: "web_search_20250305", name: "web_search", max_uses: 2 },
    ]);
    assert.deepEqual(body.sources, [{ title: "Solar System Facts", url: "https://example.com/solar-system" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("includes Mythos search results when citation metadata is not attached to text", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            verdict: "correct",
            categoryId: "common",
            reason: "Earth is a planet.",
          }),
        },
        {
          type: "web_search_tool_result",
          content: [
            {
              type: "web_search_result",
              title: "Solar System Facts",
              url: "https://example.com/solar-system",
            },
          ],
        },
      ],
    });
  try {
    const response = await judge.fetch(request(input), {
      ALLOWED_ORIGIN: origin,
      ANSWER_RATE_LIMITER: allowedRateLimit,
      ANTHROPIC_API_KEY: "server-only-test-key",
      AI: { run: async () => assert.fail("Workers AI should not run when Mythos is configured") },
    });

    assert.deepEqual(await response.json(), {
      verdict: "correct",
      categoryId: "common",
      reason: "Earth is a planet.",
      sources: [{ title: "Solar System Facts", url: "https://example.com/solar-system" }],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not accept a Mythos answer without a web citation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            verdict: "correct",
            categoryId: "common",
            reason: "Earth is a planet.",
          }),
        },
      ],
    });
  try {
    const response = await judge.fetch(request(input), {
      ALLOWED_ORIGIN: origin,
      ANSWER_RATE_LIMITER: allowedRateLimit,
      ANTHROPIC_API_KEY: "server-only-test-key",
      AI: { run: async () => assert.fail("Workers AI should not run when Mythos is configured") },
    });

    assert.deepEqual(await response.json(), {
      verdict: "uncertain",
      categoryId: null,
      reason: "No web citation was available to verify this answer.",
      sources: [],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects requests from origins other than the configured game site", async () => {
  const response = await judge.fetch(request(input, { origin: "https://other.example" }), {
    ALLOWED_ORIGIN: origin,
    AI: { run: async () => assert.fail("AI should not run for a blocked origin") },
  });

  assert.equal(response.status, 403);
});

test("rejects malformed or out-of-range model judgments", async () => {
  const response = await judge.fetch(request(input), {
    ALLOWED_ORIGIN: origin,
    ANSWER_RATE_LIMITER: allowedRateLimit,
    AI: {
      run: async () => ({
        response: JSON.stringify({
          verdict: "correct",
          categoryId: "not-a-real-tier",
          reason: "This tier was not supplied.",
        }),
      }),
    },
  });

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "The AI judge returned an invalid scoring tier." });
});

test("enforces the rate limit before spending on an AI request", async () => {
  const response = await judge.fetch(request(input), {
    ALLOWED_ORIGIN: origin,
    ANSWER_RATE_LIMITER: { limit: async () => ({ success: false }) },
    ANTHROPIC_API_KEY: "server-only-test-key",
    AI: { run: async () => assert.fail("AI should not run after rate limit") },
  });

  assert.equal(response.status, 429);
});

test("answers preflight requests without running the model", async () => {
  const response = await judge.fetch(request(null, { method: "OPTIONS" }), {
    ALLOWED_ORIGIN: origin,
    AI: { run: async () => assert.fail("AI should not run for preflight requests") },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "POST, OPTIONS");
});
