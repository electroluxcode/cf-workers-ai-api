# 部署指南 — cf-workers-ai-api

## 本地开发

```bash
npm install
wrangler login
npm run dev
```

无需 `.dev.vars`。Demo 右上角填写 Cloudflare API Token 即可。

访问 http://127.0.0.1:8787/demo.html

## 线上部署

```bash
npm run deploy
```

## 验证

```bash
export BASE=https://your-worker.workers.dev
export CF_API_TOKEN=your-cloudflare-api-token

curl $BASE/health

curl $BASE/v1/models -H "Authorization: Bearer $CF_API_TOKEN"

curl -N -X POST $BASE/v1/chat/completions \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/meta/llama-3.1-8b-instruct-fast","messages":[{"role":"user","content":"hi"}],"stream":true}'
```

## 国内访问

详见 [README · 国内访问说明](./README.md#国内访问说明)。
