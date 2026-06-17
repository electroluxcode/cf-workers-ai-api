/**
 * Workers AI 模型目录
 * 参考: https://developers.cloudflare.com/workers-ai/models/
 * 共 80 个官方模型（已排除需上传图片的 img2img / inpainting）
 */

/** @typedef {{ id: string, name: string, type: string, author: string, description: string, default?: boolean, deprecated?: boolean, beta?: boolean, multipart?: boolean }} Model */

/** @type {Model[]} */
export const MODELS = [
  // ── Text Generation ──────────────────────────────────────────
  { id: "@cf/moonshotai/kimi-k2.7-code", name: "Kimi K2.7 Code", type: "text-generation", author: "Moonshot AI", description: "1T 参数，262k 上下文，工具调用与视觉" },
  { id: "@cf/zhipu-ai/glm-4.7-flash", name: "GLM-4.7 Flash", type: "text-generation", author: "Zhipu AI", description: "快速多语言，131k 上下文，工具调用" },
  { id: "@cf/openai/gpt-oss-120b", name: "GPT-OSS 120B", type: "text-generation", author: "OpenAI", description: "开源大模型，强推理与 Agent 任务" },
  { id: "@cf/meta/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", type: "text-generation", author: "Meta", description: "MoE 多模态，文本与图像理解" },
  { id: "@cf/zhipu-ai/glm-5.2", name: "GLM-5.2", type: "text-generation", author: "Zhipu AI", description: "旗舰 Agent 编程模型" },
  { id: "@cf/moonshotai/kimi-k2.6", name: "Kimi K2.6", type: "text-generation", author: "Moonshot AI", description: "1T 参数，262k 上下文，多轮工具调用" },
  { id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B", type: "text-generation", author: "Google", description: "Gemini 3 研究驱动，高智能密度" },
  { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B", type: "text-generation", author: "NVIDIA", description: "MoE 混合模型，多 Agent 应用" },
  { id: "@cf/moonshotai/kimi-k2.5", name: "Kimi K2.5", type: "text-generation", author: "Moonshot AI", description: "256k 上下文，多模态 Agent", deprecated: true },
  { id: "@cf/ibm/granite-4.0-h-micro", name: "Granite 4.0 Micro", type: "text-generation", author: "IBM", description: "指令跟随与函数调用，适合 RAG" },
  { id: "@cf/aisingapore/gemma-sea-lion-v4-27b-it", name: "SEA-LION v4 27B", type: "text-generation", author: "aisingapore", description: "东南亚多语言 LLM" },
  { id: "@cf/openai/gpt-oss-20b", name: "GPT-OSS 20B", type: "text-generation", author: "OpenAI", description: "低延迟开源模型，本地/专用场景" },
  { id: "@cf/qwen/qwen3-30b-a3b-fp8", name: "Qwen3 30B", type: "text-generation", author: "Qwen", description: "推理、指令跟随与多语言" },
  { id: "@cf/google/gemma-3-12b-it", name: "Gemma 3 12B", type: "text-generation", author: "Google", description: "多模态，128K 上下文，140+ 语言", deprecated: true },
  { id: "@cf/mistralai/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1", type: "text-generation", author: "MistralAI", description: "24B 视觉理解，128k 上下文" },
  { id: "@cf/qwen/qwq-32b", name: "QwQ 32B", type: "text-generation", author: "Qwen", description: "推理模型，复杂问题求解" },
  { id: "@cf/qwen/qwen2.5-coder-32b-instruct", name: "Qwen2.5 Coder 32B", type: "text-generation", author: "Qwen", description: "代码专用 LLM" },
  { id: "@cf/meta/llama-guard-3-8b", name: "Llama Guard 3 8B", type: "text-generation", author: "Meta", description: "内容安全分类" },
  { id: "@cf/deepseek/deepseek-r1-distill-qwen-32b", name: "DeepSeek R1 Distill 32B", type: "text-generation", author: "DeepSeek", description: "蒸馏推理模型" },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B Fast", type: "text-generation", author: "Meta", description: "70B fp8 量化，更快推理" },
  { id: "@cf/meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B", type: "text-generation", author: "Meta", description: "轻量多语言对话" },
  { id: "@cf/meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B", type: "text-generation", author: "Meta", description: "轻量多语言对话" },
  { id: "@cf/meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision", type: "text-generation", author: "Meta", description: "视觉识别、图像推理与描述" },
  { id: "@cf/meta/llama-3.1-8b-instruct-fast", name: "Llama 3.1 8B Fast", type: "text-generation", author: "Meta", description: "快速文本生成，适合对话与摘要", default: true },
  { id: "@cf/meta/llama-3.1-8b-instruct-fp8", name: "Llama 3.1 8B FP8", type: "text-generation", author: "Meta", description: "8B FP8 量化" },
  { id: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B", type: "text-generation", author: "Meta", description: "多语言对话", deprecated: true },
  { id: "@cf/meta/llama-3.1-8b-instruct-awq", name: "Llama 3.1 8B AWQ", type: "text-generation", author: "Meta", description: "int4 量化", deprecated: true },
  { id: "@cf/meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B", type: "text-generation", author: "Meta", description: "大参数量多语言对话", deprecated: true },
  { id: "@cf/meta/meta-llama-3-8b-instruct", name: "Llama 3 8B", type: "text-generation", author: "Meta", description: "Llama 3 指令微调", deprecated: true },
  { id: "@cf/meta/llama-3-8b-instruct", name: "Llama 3 8B Instruct", type: "text-generation", author: "Meta", description: "Llama 3 8B", deprecated: true },
  { id: "@cf/meta/llama-3-8b-instruct-awq", name: "Llama 3 8B AWQ", type: "text-generation", author: "Meta", description: "int4 量化", deprecated: true },
  { id: "@cf/meta/llama-2-7b-chat-fp16", name: "Llama 2 7B FP16", type: "text-generation", author: "Meta", description: "全精度 7B 对话", deprecated: true },
  { id: "@cf/meta/llama-2-7b-chat-int8", name: "Llama 2 7B INT8", type: "text-generation", author: "Meta", description: "int8 量化 7B", deprecated: true },
  { id: "@cf/meta/llama-2-7b-chat-hf-lora", name: "Llama 2 7B LoRA", type: "text-generation", author: "Meta", description: "LoRA 适配推理", beta: true },
  { id: "@cf/mistralai/mistral-7b-instruct-v0.2", name: "Mistral 7B v0.2", type: "text-generation", author: "MistralAI", description: "32k 上下文", deprecated: true, beta: true },
  { id: "@cf/mistralai/mistral-7b-instruct-v0.2-lora", name: "Mistral 7B LoRA", type: "text-generation", author: "MistralAI", description: "LoRA 适配", beta: true },
  { id: "@cf/mistralai/mistral-7b-instruct-v0.1", name: "Mistral 7B v0.1", type: "text-generation", author: "MistralAI", description: "7B 指令微调", deprecated: true },
  { id: "@cf/google/gemma-7b-it-lora", name: "Gemma 7B LoRA", type: "text-generation", author: "Google", description: "LoRA 适配", beta: true },
  { id: "@cf/google/gemma-2b-it-lora", name: "Gemma 2B LoRA", type: "text-generation", author: "Google", description: "LoRA 适配", beta: true },
  { id: "@cf/google/gemma-7b-it", name: "Gemma 7B", type: "text-generation", author: "Google", description: "轻量开源模型", deprecated: true, beta: true },
  { id: "@cf/nousresearch/hermes-2-pro-mistral-7b", name: "Hermes 2 Pro 7B", type: "text-generation", author: "nousresearch", description: "函数调用与 JSON 模式", deprecated: true, beta: true },
  { id: "@cf/microsoft/phi-2", name: "Phi-2", type: "text-generation", author: "Microsoft", description: "2.7B 小模型", deprecated: true, beta: true },
  { id: "@cf/defog/sqlcoder-7b-2", name: "SQLCoder 7B", type: "text-generation", author: "Defog", description: "自然语言查 SQL", deprecated: true, beta: true },

  // ── Text-to-Image ──────────────────────────────────────────
  { id: "@cf/black-forest-labs/flux-2-klein-9b", name: "FLUX.2 Klein 9B", type: "text-to-image", author: "Black Forest Labs", description: "超快蒸馏，生成与编辑统一", multipart: true },
  { id: "@cf/black-forest-labs/flux-2-klein-4b", name: "FLUX.2 Klein 4B", type: "text-to-image", author: "Black Forest Labs", description: "超快蒸馏文生图", multipart: true },
  { id: "@cf/black-forest-labs/flux-2-dev", name: "FLUX.2 Dev", type: "text-to-image", author: "Black Forest Labs", description: "高写实，多参考支持", multipart: true },
  { id: "@cf/black-forest-labs/flux-1-schnell", name: "FLUX.1 Schnell", type: "text-to-image", author: "Black Forest Labs", description: "快速文生图，适合实时预览", default: true },
  { id: "@cf/leonardo/lucid-origin", name: "Lucid Origin", type: "text-to-image", author: "Leonardo", description: "高 prompt 遵循，多样视觉风格" },
  { id: "@cf/leonardo/phoenix-1.0", name: "Phoenix 1.0", type: "text-to-image", author: "Leonardo", description: "精准 prompt 与文字渲染" },
  { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", name: "Stable Diffusion XL", type: "text-to-image", author: "Stability.ai", description: "高质量文生图，细节丰富", beta: true },
  { id: "@cf/bytedance/stable-diffusion-xl-lightning", name: "SDXL Lightning", type: "text-to-image", author: "ByteDance", description: "极速 SDXL，几步出图", beta: true },
  { id: "@cf/lykon/dreamshaper-8-lcm", name: "DreamShaper 8 LCM", type: "text-to-image", author: "lykon", description: "写实风格文生图" },

  // ── Text Embeddings ──────────────────────────────────────────
  { id: "@cf/pfnet/plamo-embedding-1b", name: "PLaMo Embedding 1B", type: "text-embeddings", author: "pfnet", description: "日语文本嵌入" },
  { id: "@cf/google/embeddinggemma-300m", name: "EmbeddingGemma 300M", type: "text-embeddings", author: "Google", description: "100+ 语言，搜索与检索", default: true },
  { id: "@cf/qwen/qwen3-embedding-0.6b", name: "Qwen3 Embedding 0.6B", type: "text-embeddings", author: "Qwen", description: "文本嵌入与排序" },
  { id: "@cf/baai/bge-m3", name: "BGE-M3", type: "text-embeddings", author: "BAAI", description: "多语言多粒度嵌入" },
  { id: "@cf/baai/bge-large-en-v1.5", name: "BGE Large EN", type: "text-embeddings", author: "BAAI", description: "1024 维英文嵌入" },
  { id: "@cf/baai/bge-base-en-v1.5", name: "BGE Base EN", type: "text-embeddings", author: "BAAI", description: "768 维英文嵌入" },
  { id: "@cf/baai/bge-small-en-v1.5", name: "BGE Small EN", type: "text-embeddings", author: "BAAI", description: "384 维英文嵌入" },

  // ── Automatic Speech Recognition ───────────────────────────
  { id: "@cf/deepgram/flux", name: "Deepgram Flux", type: "automatic-speech-recognition", author: "Deepgram", description: "对话式语音识别，语音 Agent" },
  { id: "@cf/deepgram/nova-3", name: "Deepgram Nova 3", type: "automatic-speech-recognition", author: "Deepgram", description: "Deepgram 语音转文字", default: true },
  { id: "@cf/openai/whisper-large-v3-turbo", name: "Whisper Large V3 Turbo", type: "automatic-speech-recognition", author: "OpenAI", description: "快速多语言 ASR" },
  { id: "@cf/openai/whisper", name: "Whisper", type: "automatic-speech-recognition", author: "OpenAI", description: "通用语音识别与翻译" },
  { id: "@cf/openai/whisper-tiny-en", name: "Whisper Tiny EN", type: "automatic-speech-recognition", author: "OpenAI", description: "英文轻量 ASR", beta: true },

  // ── Text-to-Speech ───────────────────────────────────────────
  { id: "@cf/deepgram/aura-2-es", name: "Aura 2 ES", type: "text-to-speech", author: "Deepgram", description: "西班牙语 TTS，上下文感知" },
  { id: "@cf/deepgram/aura-2-en", name: "Aura 2 EN", type: "text-to-speech", author: "Deepgram", description: "英语 TTS，上下文感知", default: true },
  { id: "@cf/deepgram/aura-1", name: "Aura 1", type: "text-to-speech", author: "Deepgram", description: "上下文感知 TTS" },
  { id: "@cf/myshell-ai/melotts", name: "MeloTTS", type: "text-to-speech", author: "MyShell", description: "高质量多语言 TTS" },

  // ── Translation ──────────────────────────────────────────────
  { id: "@cf/ai4bharat/indictrans2-en-indic-1B", name: "IndicTrans2", type: "translation", author: "ai4bharat", description: "英语 ↔ 22 种印度语言", default: true },
  { id: "@cf/meta/m2m100-1.2b", name: "M2M100 1.2B", type: "translation", author: "Meta", description: "多语言互译" },

  // ── Summarization ────────────────────────────────────────────
  { id: "@cf/meta/bart-large-cnn", name: "BART Large CNN", type: "summarization", author: "Meta", description: "文本摘要", deprecated: true, beta: true, default: true },

  // ── Text Classification ──────────────────────────────────────
  { id: "@cf/baai/bge-reranker-base", name: "BGE Reranker Base", type: "text-classification", author: "BAAI", description: "query-passage 相关性排序", default: true },
  { id: "@cf/huggingface/distilbert-sst-2-int8", name: "DistilBERT SST-2", type: "text-classification", author: "HuggingFace", description: "情感分类" },

  // ── Image-to-Text ────────────────────────────────────────────
  { id: "@cf/llava-hf/llava-1.5-7b-hf", name: "LLaVA 1.5 7B", type: "image-to-text", author: "llava-hf", description: "多模态指令跟随", beta: true, default: true },
  { id: "@cf/unum/uform-gen2-qwen-500m", name: "UForm Gen2 Qwen 500M", type: "image-to-text", author: "Unum", description: "图像描述与 VQA", deprecated: true, beta: true },

  // ── Image Classification ─────────────────────────────────────
  { id: "@cf/microsoft/resnet-50", name: "ResNet-50", type: "image-classification", author: "Microsoft", description: "ImageNet 图像分类", default: true },

  // ── Object Detection ─────────────────────────────────────────
  { id: "@cf/meta/detr-resnet-50", name: "DETR ResNet-50", type: "object-detection", author: "Meta", description: "COCO 目标检测", beta: true, default: true },

  // ── Voice Activity Detection ─────────────────────────────────
  { id: "@cf/pipecat-ai/smart-turn-v2", name: "Smart Turn v2", type: "voice-activity-detection", author: "Pipecat", description: "语音轮次检测", default: true },
];

export const MODEL_TYPES = [
  "text-generation",
  "text-to-image",
  "text-embeddings",
  "automatic-speech-recognition",
  "text-to-speech",
  "translation",
  "summarization",
  "text-classification",
  "image-to-text",
  "image-classification",
  "object-detection",
  "voice-activity-detection",
];

export const MODEL_MAP = Object.fromEntries(MODELS.map((m) => [m.id, m]));

export function getDefaultModel(type) {
  return MODELS.find((m) => m.type === type && m.default && !m.deprecated) ?? MODELS.find((m) => m.type === type && !m.deprecated) ?? MODELS.find((m) => m.type === type);
}

export function resolveModel(modelId, type) {
  if (modelId && MODEL_MAP[modelId]) {
    return MODEL_MAP[modelId];
  }
  return getDefaultModel(type);
}

export function getModelsByType(type) {
  if (!type) return MODELS;
  return MODELS.filter((m) => m.type === type);
}
