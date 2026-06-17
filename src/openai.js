import { resolveModel, getModelsByType } from "./models.js";

const CHAT_TYPES = new Set(["text-generation", "summarization"]);

export function openaiError(message, status = 400, type = "invalid_request_error") {
  return json({ error: { message, type, param: null, code: null } }, status);
}

export function handleV1Models(request) {
  const type = new URL(request.url).searchParams.get("type");
  const created = Math.floor(Date.now() / 1000);
  return json({
    object: "list",
    data: getModelsByType(type).map((m) => ({
      id: m.id,
      object: "model",
      created,
      owned_by: m.author.toLowerCase().replace(/\s+/g, "-"),
      cf_type: m.type,
      cf_name: m.name,
      cf_description: m.description,
      cf_default: !!m.default,
    })),
  });
}

export async function handleChatCompletions(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return openaiError("Invalid JSON body");
  }

  const { model: modelId, messages, stream = false, temperature, max_tokens } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return openaiError("messages is required and must be a non-empty array");
  }

  const model = resolveModel(modelId, "text-generation");
  if (!model || !CHAT_TYPES.has(model.type)) {
    return openaiError(`Model ${modelId || "(default)"} is not a chat model`, 404, "model_not_found");
  }

  const cfMessages = messages.map(normalizeMessage).filter(Boolean);
  if (!cfMessages.length) {
    return openaiError("messages must contain at least one valid message");
  }

  const input = {
    messages: cfMessages,
    max_tokens: max_tokens ?? 2048,
  };
  if (temperature != null) input.temperature = temperature;

  const id = makeId("chatcmpl");
  const created = Math.floor(Date.now() / 1000);

  try {
    if (stream) {
      const cfStream = await env.AI.run(model.id, { ...input, stream: true });
      const streamBody = transformCfStreamToOpenAIChat(cfStream, { id, model: model.id, created });
      return sseResponse(streamBody);
    }

    const result = await env.AI.run(model.id, input);
    const content = extractText(result);

    return json({
      id,
      object: "chat.completion",
      created,
      model: model.id,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  } catch (err) {
    return openaiError(err.message || "Generation failed", 500, "server_error");
  }
}

export async function handleResponses(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return openaiError("Invalid JSON body");
  }

  const { model: modelId, input, stream = false, temperature, max_output_tokens, instructions } = body;

  if (input == null) {
    return openaiError("input is required");
  }

  const model = resolveModel(modelId, "text-generation");
  if (!model || !CHAT_TYPES.has(model.type)) {
    return openaiError(`Model ${modelId || "(default)"} is not supported`, 404, "model_not_found");
  }

  const messages = inputToMessages(input, instructions);
  const aiInput = {
    messages,
    max_tokens: max_output_tokens ?? 2048,
  };
  if (temperature != null) aiInput.temperature = temperature;

  const respId = makeId("resp");
  const msgId = makeId("msg");
  const createdAt = Math.floor(Date.now() / 1000);

  try {
    if (stream) {
      const cfStream = await env.AI.run(model.id, { ...aiInput, stream: true });
      const streamBody = transformCfStreamToOpenAIResponses(cfStream, {
        respId,
        msgId,
        model: model.id,
        createdAt,
      });
      return sseResponse(streamBody);
    }

    const result = await env.AI.run(model.id, aiInput);
    const text = extractText(result);

    return json({
      id: respId,
      object: "response",
      created_at: createdAt,
      status: "completed",
      model: model.id,
      output: [
        {
          type: "message",
          id: msgId,
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text }],
        },
      ],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    });
  } catch (err) {
    return openaiError(err.message || "Generation failed", 500, "server_error");
  }
}

export async function handleImageGenerations(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return openaiError("Invalid JSON body");
  }

  const { model: modelId, prompt, size = "1024x1024", n = 1 } = body;

  if (!prompt?.trim()) {
    return openaiError("prompt is required");
  }

  const model = resolveModel(modelId, "text-to-image");
  if (!model || model.type !== "text-to-image") {
    return openaiError(`Model ${modelId || "(default)"} is not an image model`, 404, "model_not_found");
  }

  const [width, height] = parseSize(size);

  try {
    let result;
    if (model.multipart) {
      const form = new FormData();
      form.append("prompt", prompt.trim());
      form.append("width", String(width));
      form.append("height", String(height));
      const formResponse = new Response(form);
      result = await env.AI.run(model.id, {
        multipart: {
          body: formResponse.body,
          contentType: formResponse.headers.get("content-type"),
        },
      });
    } else {
      result = await env.AI.run(model.id, { prompt: prompt.trim() });
    }

    const b64 = imageToBase64(result);
    const count = Math.min(Math.max(1, n), 1);
    const data = Array.from({ length: count }, () => ({ b64_json: b64 }));

    return json({
      created: Math.floor(Date.now() / 1000),
      data,
    });
  } catch (err) {
    return openaiError(err.message || "Image generation failed", 500, "server_error");
  }
}

function normalizeMessage(msg) {
  if (!msg?.role) return null;
  const content = messageContent(msg);
  if (!content && msg.role !== "assistant") return null;
  return { role: msg.role, content: content || "" };
}

function messageContent(msg) {
  const { content } = msg;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p?.type === "text" && p.text)
      .map((p) => p.text)
      .join("\n");
  }
  return content != null ? String(content) : "";
}

function inputToMessages(input, instructions) {
  const messages = [];
  if (instructions) {
    messages.push({ role: "system", content: instructions });
  }

  if (typeof input === "string") {
    messages.push({ role: "user", content: input });
    return messages;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === "string") {
        messages.push({ role: "user", content: item });
        continue;
      }
      if (item?.role && item.content != null) {
        messages.push(normalizeMessage(item));
        continue;
      }
      if (item?.type === "message") {
        messages.push(normalizeMessage(item));
        continue;
      }
      if (item?.type === "input_text" && item.text) {
        messages.push({ role: "user", content: item.text });
      }
    }
    return messages.filter(Boolean);
  }

  messages.push({ role: "user", content: String(input) });
  return messages;
}

function extractText(result) {
  return result?.response ?? result?.result?.response ?? String(result ?? "");
}

function imageToBase64(result) {
  if (result instanceof ArrayBuffer) {
    return bufferToBase64(new Uint8Array(result));
  }
  if (result instanceof Uint8Array) {
    return bufferToBase64(result);
  }
  if (result?.image) {
    return String(result.image).replace(/^data:image\/\w+;base64,/, "");
  }
  throw new Error("Unexpected image response format");
}

function bufferToBase64(bytes) {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function parseSize(size) {
  const match = String(size).match(/^(\d+)x(\d+)$/);
  if (!match) return [1024, 1024];
  return [Number(match[1]), Number(match[2])];
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

function transformCfStreamToOpenAIChat(cfStream, meta) {
  const { id, model, created } = meta;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let first = true;

  return new ReadableStream({
    async start(controller) {
      const reader = cfStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const chunk = parseCfSseLine(line);
            if (!chunk) continue;

            const delta = first ? { role: "assistant", content: chunk } : { content: chunk };
            first = false;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  id,
                  object: "chat.completion.chunk",
                  created,
                  model,
                  choices: [{ index: 0, delta, finish_reason: null }],
                })}\n\n`
              )
            );
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              id,
              object: "chat.completion.chunk",
              created,
              model,
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function transformCfStreamToOpenAIResponses(cfStream, meta) {
  const { respId, msgId, model, createdAt } = meta;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const baseResponse = {
    id: respId,
    object: "response",
    created_at: createdAt,
    status: "in_progress",
    model,
    output: [],
  };

  return new ReadableStream({
    async start(controller) {
      const emit = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      emit({ type: "response.created", response: { ...baseResponse, status: "in_progress" } });

      const reader = cfStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const chunk = parseCfSseLine(line);
            if (!chunk) continue;
            fullText += chunk;
            emit({
              type: "response.output_text.delta",
              item_id: msgId,
              output_index: 0,
              content_index: 0,
              delta: chunk,
            });
          }
        }

        emit({
          type: "response.completed",
          response: {
            ...baseResponse,
            status: "completed",
            output: [
              {
                type: "message",
                id: msgId,
                role: "assistant",
                status: "completed",
                content: [{ type: "output_text", text: fullText }],
              },
            ],
          },
        });
        controller.close();
      } catch (err) {
        emit({ type: "error", error: { message: err.message || "Stream failed" } });
        controller.close();
      }
    },
  });
}

function parseCfSseLine(line) {
  if (!line.startsWith("data: ")) return null;
  const data = line.slice(6).trim();
  if (!data || data === "[DONE]") return null;
  try {
    const parsed = JSON.parse(data);
    return parsed.response ?? parsed.text ?? parsed.content ?? null;
  } catch {
    return null;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseResponse(body) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
