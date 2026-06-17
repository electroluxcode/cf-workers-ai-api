import { MODELS, MODEL_MAP, resolveModel, getModelsByType, MODEL_TYPES } from "./models.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    if (url.pathname === "/health") {
      return cors(json({ status: "healthy", timestamp: new Date().toISOString() }));
    }

    if (url.pathname === "/models" && request.method === "GET") {
      const type = url.searchParams.get("type");
      const models = getModelsByType(type);
      return cors(json({ models, types: MODEL_TYPES, total: models.length }));
    }

    if (url.pathname === "/generate" && request.method === "POST") {
      return cors(await handleGenerate(request, env));
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleGenerate(request, env) {
  const authError = checkAuth(request, env);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { prompt, model: modelId, type = "text-to-image", stream = false, text } = body;

  const inputText = (prompt ?? text)?.trim();
  if (!inputText) {
    return json({ error: "prompt (or text) is required" }, 400);
  }

  const model = resolveModel(modelId, type);
  if (!model) {
    return json({ error: `No model available for type: ${type}`, types: MODEL_TYPES }, 400);
  }

  if (model.type !== type) {
    return json(
      {
        error: `Model ${model.id} is type "${model.type}", not "${type}"`,
        model: model.id,
      },
      400
    );
  }

  try {
    switch (model.type) {
      case "text-to-image":
        return await generateImage(env, model, inputText, body);
      case "text-generation":
      case "summarization":
        return await generateText(env, model, inputText, stream);
      case "text-embeddings":
        return await generateEmbedding(env, model, inputText);
      case "translation":
        return await generateTranslation(env, model, inputText, body);
      case "text-classification":
        return await generateClassification(env, model, inputText, body);
      default:
        return json(
          {
            error: `Type "${model.type}" requires specialized input (audio/image).`,
            model: model.id,
            type: model.type,
          },
          501
        );
    }
  } catch (err) {
    return json(
      {
        error: "Generation failed",
        details: err.message,
        model: model.id,
      },
      500
    );
  }
}

async function generateImage(env, model, prompt, options = {}) {
  let result;

  if (model.multipart) {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("width", String(options.width ?? 1024));
    form.append("height", String(options.height ?? 1024));

    const formResponse = new Response(form);
    result = await env.AI.run(model.id, {
      multipart: {
        body: formResponse.body,
        contentType: formResponse.headers.get("content-type"),
      },
    });
  } else {
    result = await env.AI.run(model.id, { prompt });
  }

  return imageResponseFromResult(result, model.id);
}

function imageResponseFromResult(result, modelId) {
  if (result instanceof ArrayBuffer || result instanceof Uint8Array) {
    return new Response(result, {
      headers: { "Content-Type": "image/jpeg", "X-Model": modelId },
    });
  }

  if (result?.image) {
    const b64 = String(result.image).replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return new Response(binary, {
      headers: { "Content-Type": "image/png", "X-Model": modelId },
    });
  }

  throw new Error("Unexpected image response format");
}

async function generateEmbedding(env, model, text) {
  const result = await env.AI.run(model.id, { text: [text] });
  return json({ model: model.id, result }, 200, model.id);
}

async function generateTranslation(env, model, text, body) {
  const result = await env.AI.run(model.id, {
    text,
    source_lang: body.source_lang ?? "english",
    target_lang: body.target_lang ?? "hindi",
  });
  return json({ model: model.id, result }, 200, model.id);
}

async function generateClassification(env, model, text, body) {
  const input = model.id.includes("reranker")
    ? { query: body.query ?? text, contexts: body.contexts ?? [{ text }] }
    : { text };
  const result = await env.AI.run(model.id, input);
  return json({ model: model.id, result }, 200, model.id);
}

async function generateText(env, model, prompt, stream) {
  const systemPrompt =
    "You are a helpful assistant. Always respond in well-structured Markdown with headings, lists, and code blocks when appropriate.";

  const input = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    max_tokens: 2048,
  };

  if (stream) {
    const result = await env.AI.run(model.id, { ...input, stream: true });
    return new Response(result, {
      headers: { "Content-Type": "text/event-stream", "X-Model": model.id },
    });
  }

  const result = await env.AI.run(model.id, input);
  const text = result?.response ?? result?.result?.response ?? String(result);

  return new Response(text, {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "X-Model": model.id },
  });
}

function checkAuth(request, env) {
  const apiKey = env.API_KEY;
  if (!apiKey) return null;

  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  return null;
}

function json(data, status = 200, modelId) {
  const headers = { "Content-Type": "application/json" };
  if (modelId) headers["X-Model"] = modelId;
  return new Response(JSON.stringify(data, null, 2), { status, headers });
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
