# cf-workers-ai-api

基于 [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) 的免费 AI API，支持文生图与文本生成（Markdown 输出）。

每日免费额度约 10,000 次调用（https://cloudflaredoc.ubitools.com/workers-ai/platform/pricing/）。

## 特性

- 80 个 Workers AI 模型，支持文生图与文本生成
- **用户自带 Token**：调用方传入 Cloudflare API Token，Worker 代发 Workers AI 请求
- 暗黑赛博朋克 UI（Orbitron + JetBrains Mono）
- 零配置 Fork 部署
- CORS 支持

## 凭证说明

用户/API 调用方只需传入 **Cloudflare API Token**：

```
Authorization: Bearer <Cloudflare API Token>
```

### 架构

```
网页 Demo / API 调用方
  └─ input 优先读取 Token → Authorization 请求头
       ↓
Worker 读取请求头，自动解析 Account ID，转发 Workers AI REST API
```

Worker 不读 env 密钥；Account ID 由 Token 自动解析（`GET /accounts`），**用户无需填写**。

### 用户如何获取 Token

Cloudflare Dashboard → **My Profile → API Tokens → Create Token**（需 Workers AI 权限）

### 网页 Demo

右上角 **TOKEN** 输入框填写；`getApiKey()` 优先读 input，再读 localStorage，经 `apiAuthHeaders()` 放入 `Authorization`。

### API 调用示例

```bash
curl -X POST https://<worker>/v1/chat/completions \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/meta/llama-3.1-8b-instruct-fast","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 快速部署

### 方法 1：Fork + Cloudflare Dashboard（推荐）

1. Fork 本仓库到你的 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → 连接 GitHub 仓库
4. 访问 `https://<worker-name>.<account>.workers.dev/` 打开 Demo，右上角填入 **Cloudflare API Token**

### 方法 2：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

## API 用法

本 API 采用 **OpenAI 兼容** 路由，可直接配合 OpenAI SDK、Vercel AI SDK 等使用，将 `baseURL` 设为 `https://<your-worker>.workers.dev/v1`。

### 获取模型列表

```bash
curl https://<your-worker>.workers.dev/v1/models \
  -H "Authorization: Bearer your-cloudflare-api-token"
```

Demo 页使用 `GET /v1/models?type=text-generation` 按类型筛选模型。

### 对话补全（流式）

```bash
curl -X POST https://<your-worker>.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer your-cloudflare-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/moonshotai/kimi-k2.7-code",
    "messages": [
      {"role": "user", "content": "Explain React hooks in markdown"}
    ],
    "stream": true
  }'
```

返回 OpenAI 标准 SSE：`data: {"choices":[{"delta":{"content":"..."}}]}`，结尾 `data: [DONE]`。

### Responses API（流式）

```bash
curl -X POST https://<your-worker>.workers.dev/v1/responses \
  -H "Authorization: Bearer your-cloudflare-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/moonshotai/kimi-k2.7-code",
    "input": "你好",
    "stream": true
  }'
```

### 文生图

```bash
curl -X POST https://<your-worker>.workers.dev/v1/images/generations \
  -H "Authorization: Bearer your-cloudflare-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute robot cooking breakfast",
    "model": "@cf/black-forest-labs/flux-1-schnell"
  }'
```

响应 JSON 含 `data[0].b64_json`，解码即为图片。

### FLUX.2 文生图

[FLUX.2](https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/)（Klein 4B / Klein 9B / Dev）在 Cloudflare 侧必须使用 `multipart/form-data`。直接调用 Workers AI 时若只传 `{ prompt }` 会报错：`required properties at '/' are 'multipart'`。

**本项目的 `/v1/images/generations` 仍用 JSON**，Worker 会自动转为 multipart：

```bash
curl -X POST https://<your-worker>.workers.dev/v1/images/generations \
  -H "Authorization: Bearer your-cloudflare-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cat on the beach",
    "model": "@cf/black-forest-labs/flux-2-klein-4b",
    "size": "1024x1024"
  }'
```

`size` 格式为 `宽x高`，默认 `1024x1024`。FLUX.1 Schnell 等其它文生图模型不受影响。

### OpenAI SDK 示例

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CF_API_TOKEN,
  baseURL: "https://<your-worker>.workers.dev/v1",
});

const stream = await client.chat.completions.create({
  model: "@cf/moonshotai/kimi-k2.7-code",
  messages: [{ role: "user", content: "hello" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}
```

### Chat Completions 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `model` | string | 是 | Workers AI 模型 ID |
| `messages` | array | 是 | `[{ role, content }]` |
| `stream` | boolean | 否 | 流式 SSE（OpenAI 格式） |
| `temperature` | number | 否 | 采样温度 |
| `max_tokens` | number | 否 | 最大输出 token，默认 2048 |

### Images 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | 是 | 输入提示词 |
| `model` | string | 否 | 模型 ID，默认按 type 选取 |
| `size` | string | 否 | 如 `1024x1024`（FLUX.2） |

### 可用模型

完整列表见 [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)。本项目收录全部 **80 个**官方模型，按类型分组：

| 类型 | 数量 | 示例 |
|------|------|------|
| text-generation | 43 | Llama 4 Scout, Kimi K2.7, GPT-OSS 120B |
| text-to-image | 11 | FLUX.2 Klein, FLUX.1 Schnell, SDXL |
| text-embeddings | 7 | EmbeddingGemma, BGE-M3, Qwen3 Embedding |
| automatic-speech-recognition | 5 | Whisper, Deepgram Nova 3 |
| text-to-speech | 4 | Aura 2, MeloTTS |
| translation | 2 | IndicTrans2, M2M100 |
| 其他 | 8 | 摘要、分类、图像理解、目标检测等 |

`GET /v1/models` 返回全部模型；`GET /v1/models?type=text-generation` 按类型筛选。响应含 `cf_type`、`cf_name`、`cf_description` 扩展字段供 UI 使用。

可在 `src/models.js` 中维护模型目录。

## 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 主页 |
| `/docs.html` | GET | API 文档 |
| `/demo.html` | GET | 示例 playground（流式对话 + 文生图） |
| `/v1/models` | GET | 模型列表（OpenAI 格式） |
| `/v1/chat/completions` | POST | 对话补全，支持流式 |
| `/v1/responses` | POST | Responses API，支持流式 |
| `/v1/images/generations` | POST | 文生图 |
| `/health` | GET | 健康检查 |

## 项目结构

```
cf-workers-ai-api/
├── public/
│   ├── index.html          # 主页
│   ├── docs.html           # 文档
│   ├── demo.html           # 示例（控制面板 + 输出）
│   ├── standalone-demo.html # 离线独立示例
│   ├── css/theme.css
│   └── js/
│       ├── common.js       # Token 共享、API 基址
│       └── demo.js         # 生成逻辑
├── src/
│   ├── worker.js           # API Worker
│   ├── openai.js           # OpenAI 兼容层
│   ├── cf-ai.js            # 用户 Token 转发 Workers AI REST API
│   └── models.js           # 80 个模型目录
├── package.json            # npm run dev (--remote)
└── wrangler.toml
```

## 页面

本地开发：

```bash
npm install && npm run dev
```

Token 填写一次后会保存在 `localStorage`，三个页面共享。

- **PC 端**：在页面右上角 **TOKEN** 输入框填写
- **移动端**：点击右上角 ☰ 打开侧边栏，在底部 **ACCESS TOKEN** 填写

## 国内访问说明

国内网络访问 Cloudflare 相关服务时，可能遇到 **慢、超时、pending** 等情况。参考 [cf-proxy](https://github.com/electroluxcode/cf-proxy) 的部署思路，建议如下：

### 1. 绑定自定义域名（推荐）

`*.workers.dev` 在国内可能不稳定。**推荐在 Cloudflare Dashboard 为 Worker 绑定自定义域名**，通常比默认 workers.dev 地址更可用。

1. 将域名接入 [Cloudflare DNS](https://dash.cloudflare.com/)（Nameserver 指向 Cloudflare）
2. 进入 Worker → **Settings** → **Triggers** → **Custom domains**
3. 点击 **Add Custom Domain**，例如 `api.example.com`
4. 确认 DNS 记录为**已代理**（橙色云朵 ☁️）
5. 等待 1–2 分钟 DNS 生效后，用 `https://api.example.com/` 访问主页与 API

详细步骤可参考 [cf-proxy 部署指南 · 配置自定义域名](https://github.com/electroluxcode/cf-proxy/blob/main/DEPLOY.md#步骤-3-配置自定义域名可选)。

### 2. 本地开发

| 现象 | 原因 | 建议 |
|------|------|------|
| `wrangler login` 失败 | 无法访问 `dash.cloudflare.com` / `api.cloudflare.com` | 使用稳定网络或代理后再登录 |
| `npm run dev` 页面 pending | 远程预览需连接 Cloudflare | 先 `npm run deploy`，用**线上地址**调试 |
| `POST /v1/*` 超时 / 503 | Workers AI 远程绑定在本地易超时 | **AI 请求请走线上 Worker**，本地只调 UI |

本地调试 AI 的推荐流程：

```bash
wrangler login
npm run deploy
# 浏览器打开 https://<你的域名或 workers.dev>/demo.html
# 右上角填入 Cloudflare API Token，直接调用线上 /v1/chat/completions
```

静态资源（字体、CSS、JS）已托管在 `public/`，**不依赖 Google Fonts**，国内可正常加载。

### 3. 通过 cf-proxy 反向代理（可选）

若 `*.workers.dev` 无法直接访问，可另部署一个 [cf-proxy](https://github.com/electroluxcode/cf-proxy) Worker，将本 API 代理出去：

```bash
# 健康检查
curl https://<你的-proxy>.workers.dev/proxy/<你的-api>.workers.dev/health

# 模型列表
curl https://<你的-proxy>.workers.dev/proxy/<你的-api>.workers.dev/v1/models

# 流式对话
curl -N -X POST "https://<你的-proxy>.workers.dev/proxy/<你的-api>.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/meta/llama-3.1-8b-instruct-fast","messages":[{"role":"user","content":"hi"}],"stream":true}'

# 文生图
curl -X POST "https://<你的-proxy>.workers.dev/proxy/<你的-api>.workers.dev/v1/images/generations" \
  -H "Authorization: Bearer YOUR_CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat","model":"@cf/black-forest-labs/flux-1-schnell"}'
```

也可在 `standalone-demo.html` 的 **NODE** 字段填入代理后的地址。

### 4. 故障排查

- **部署后无法访问**：等待 DNS 传播，清除缓存或用无痕模式重试（cf-proxy FAQ 同类问题）
- **自定义域名失败**：确认域名在 Cloudflare 托管、DNS 为橙色云朵
- **仅 AI 接口失败**：检查 Token 权限（需 Workers AI）；优先用线上环境验证

## 参考

- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [cf-proxy](https://github.com/electroluxcode/cf-proxy) — 零配置部署参考

## License

MIT
