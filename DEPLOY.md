# 部署指南 — cf-workers-ai-api

## 本地开发

### 1. 安装依赖

```bash
npm install
wrangler login
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入与 Cloudflare Dashboard Worker 环境变量一致的 `API_KEY`。

### 2. 启动（推荐）

```bash
npm run dev
```

默认使用 `wrangler dev --remote`，Worker 运行在 [Cloudflare 边缘](https://developers.cloudflare.com/workers/development-testing/)，Workers AI 与线上一致，可正常调用 `/generate`。

访问：

- 主页：http://127.0.0.1:8787/
- 文档：http://127.0.0.1:8787/docs.html
- 示例：http://127.0.0.1:8787/demo.html

### 3. 纯本地模式（不推荐 AI 调试）

```bash
npm run dev:local
```

本地 Miniflare 代理 Workers AI 远程绑定时，生成请求可能在 ~75s 超时（[wrangler 已知问题](https://github.com/cloudflare/workers-sdk/issues/10857)）。仅适合调试静态页面和 `/models` 等非 AI 接口。

## 线上部署

### Fork + Dashboard

1. Fork 仓库 → Cloudflare Dashboard → Workers & Pages → 连接 GitHub
2. Deploy command: `npx wrangler deploy`
3. Settings → Variables → `API_KEY`（Secret）
4. Settings → Bindings → Workers AI，变量名 `AI`

### Wrangler CLI

```bash
printf '%s' 'your-token' | npx wrangler secret put API_KEY
npm run deploy
```

## 验证

```bash
export BASE=https://your-worker.workers.dev
export API_KEY=your-token

curl $BASE/health
curl $BASE/models

curl -X POST $BASE/generate \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cat","type":"text-to-image"}' \
  -o test.jpg
```

## 独立静态页面

离线打开示例页（需指定 Worker 地址）：

```bash
npx serve public
# 访问 http://localhost:3000/standalone-demo.html
```

## 国内访问

国内用户请优先阅读 [README · 国内访问说明](./README.md#国内访问说明)。要点：

1. **绑定自定义域名**（参考 [cf-proxy DEPLOY.md](https://github.com/electroluxcode/cf-proxy/blob/main/DEPLOY.md)）— 比 `*.workers.dev` 更稳定
2. **AI 调试走线上** — `npm run deploy` 后用线上 URL 测 `/generate`，本地 dev 易 pending/超时
3. **可选 cf-proxy** — 无法直连 workers.dev 时，用 cf-proxy 做 `/proxy/<你的-worker>.workers.dev/...` 转发

### 自定义域名（推荐）

1. 域名 Nameserver 指向 Cloudflare
2. Worker → **Settings** → **Triggers** → **Custom domains** → **Add Custom Domain**
3. 填写如 `api.example.com`，保持 DNS **Proxied**（橙色云朵）
4. 部署后访问 `https://api.example.com/demo.html`

### 本地开发（国内网络）

```bash
# 需能访问 Cloudflare API
wrangler login

# 推荐：先部署，用线上地址调 AI
npm run deploy

# 本地仅适合调试静态页 /models（AI 可能超时）
npm run dev
```

若 `wrangler dev` 长时间 pending，属 [Workers AI 远程绑定](https://developers.cloudflare.com/workers/development-testing/) 在国内网络下的常见现象，**不是项目配置缺失**，改用线上 Worker 即可。
