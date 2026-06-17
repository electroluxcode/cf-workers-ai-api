# 部署指南

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
