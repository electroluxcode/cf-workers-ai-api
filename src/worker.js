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
      return cors(handleV1Models(request));
    }

    if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
      const authError = checkAuth(request, env);
      if (authError) return cors(authError);
      return cors(await handleChatCompletions(request, env));
    }

    if (url.pathname === "/v1/responses" && request.method === "POST") {
      const authError = checkAuth(request, env);
      if (authError) return cors(authError);
      return cors(await handleResponses(request, env));
    }

    if (url.pathname === "/v1/images/generations" && request.method === "POST") {
      const authError = checkAuth(request, env);
      if (authError) return cors(authError);
      return cors(await handleImageGenerations(request, env));
    }

    return env.ASSETS.fetch(request);
  },
};

function checkAuth(request, env) {
  const apiKey = env.API_KEY;
  if (!apiKey) return null;

  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return openaiError("Incorrect API key provided", 401, "invalid_api_key");
  }
  return null;
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
