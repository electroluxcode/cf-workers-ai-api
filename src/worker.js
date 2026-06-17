import {
  handleV1Models,
  handleChatCompletions,
  handleResponses,
  handleImageGenerations,
  openaiError,
} from "./openai.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/health") {
      return cors(json({ status: "healthy", timestamp: new Date().toISOString() }));
    }

    if (url.pathname === "/v1/models" && request.method === "GET") {
      const auth = requireUserToken(request);
      if (auth.error) return cors(auth.error);
      return cors(handleV1Models(request));
    }

    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      const auth = requireUserToken(request);
      if (auth.error) return cors(auth.error);
      return cors(await handleChatCompletions(request, auth.token, env));
    }

    if (url.pathname === "/v1/responses" && request.method === "POST") {
      const auth = requireUserToken(request);
      if (auth.error) return cors(auth.error);
      return cors(await handleResponses(request, auth.token, env));
    }

    if (url.pathname === "/v1/images/generations" && request.method === "POST") {
      const auth = requireUserToken(request);
      if (auth.error) return cors(auth.error);
      return cors(await handleImageGenerations(request, auth.token, env));
    }

    return env.ASSETS.fetch(request);
  },
};

function requireUserToken(request) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { error: openaiError("Missing Authorization header", 401, "invalid_api_key") };
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return { error: openaiError("Incorrect API key provided", 401, "invalid_api_key") };
  }

  return { token };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
