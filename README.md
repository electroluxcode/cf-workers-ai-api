# Free CF API

基于 [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) 的免费 AI API，支持文生图与文本生成（Markdown 输出）。

每日免费额度约 10,000 次调用（https://cloudflaredoc.ubitools.com/workers-ai/platform/pricing/）。

## 特性

- 80 个 Workers AI 模型，支持文生图与文本生成
- **Access Token** 需在 Cloudflare Worker 环境变量中配置 `API_KEY`（见下方说明）
- 暗黑赛博朋克 UI（Orbitron + JetBrains Mono）
- 零配置 Fork 部署
- CORS 支持

## Access Token 说明

`API_KEY` 是 Worker 的访问凭证，需在 Cloudflare 完成 Worker 部署与 Workers AI 绑定后配置：

1. 本地：写入 `.dev.vars`（参考 `.dev.vars.example`）
2. 线上：Cloudflare Dashboard → Worker → **Settings → Variables** → 添加 `API_KEY`

客户端请求时在 Header 带上：

```
Authorization: Bearer <你在 Dashboard 配置的 API_KEY>
```

## 快速部署

### 方法 1：Fork + Cloudflare Dashboard（推荐）

1. Fork 本仓库到你的 GitHub
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 进入 **Workers & Pages** → **Create application** → 连接 GitHub 仓库
4. 部署完成后，在 Worker **Settings → Variables** 添加：
   - `API_KEY` = 你的密钥
5. 在 **Settings → Bindings** 添加 AI Binding：
   - Variable name: `AI`
   - Service: **Workers AI**
6. 访问 `https://<worker-name>.<account>.workers.dev/` 打开 Demo

### 方法 2：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler secret put API_KEY
wrangler deploy
```

## API 用法

### 获取模型列表

```bash
curl https://<your-worker>.workers.dev/models
```

### 文生图

方式：

```bash
curl -X POST https://<your-worker>.workers.dev/generate \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute robot cooking breakfast",
    "model": "@cf/black-forest-labs/flux-1-schnell",
    "type": "text-to-image"
  }' \
  --output image.jpg
```

### 文本生成（Markdown 输出）

```bash
curl -X POST https://<your-worker>.workers.dev/generate \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain React hooks in markdown",
    "model": "@cf/meta/llama-3.1-8b-instruct-fast",
    "type": "text-generation"
  }'
```

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | 是 | 输入提示词 |
| `model` | string | 否 | 模型 ID，默认按 type 选取 |
| `type` | string | 否 | `text-to-image` 或 `text-generation` |
| `stream` | boolean | 否 | 文本流式输出（SSE） |

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

`GET /models` 返回全部模型；`GET /models?type=text-generation` 按类型筛选。

可在 `src/models.js` 中维护模型目录。

## 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 主页 |
| `/docs.html` | GET | API 文档 |
| `/demo.html` | GET | 示例 playground |
| `/models` | GET | 模型列表 |
| `/generate` | POST | 生成（需 Token） |
| `/health` | GET | 健康检查 |

## 项目结构

```
free-cf-api/
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
│   └── models.js           # 80 个模型目录
├── package.json            # npm run dev (--remote)
└── wrangler.toml
```

## 页面

布局参考 [Nth Me AI 工坊](https://www.nthme.org/portal)：顶部导航（主页 / 文档 / 示例）+ 右上角 Token，示例页为左侧控制面板、右侧输出区。

本地开发：

```bash
npm install && npm run dev
```

Token 填写一次后会保存在 `localStorage`，三个页面共享。

## 参考

- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [cf-proxy](https://github.com/electroluxcode/cf-proxy) — 零配置部署参考

## License

MIT
