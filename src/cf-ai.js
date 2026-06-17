const CF_API = "https://api.cloudflare.com/client/v4";

const accountCache = new Map();

async function resolveAccountId(token) {
  if (accountCache.has(token)) return accountCache.get(token);

  const res = await fetch(`${CF_API}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message || "Invalid API token");
  }

  const id = data.result?.[0]?.id;
  if (!id) {
    throw new Error("No accessible account for this API token");
  }

  accountCache.set(token, id);
  return id;
}

export async function cfAiRun(token, modelId, input = {}) {
  if (!token) {
    throw new Error("Missing API token");
  }

  const accountId = await resolveAccountId(token);
  const url = `${CF_API}/accounts/${accountId}/ai/run/${modelId}`;
  const stream = !!input.stream;
  const { stream: _stream, multipart, ...rest } = input;

  let response;
  if (multipart) {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: multipart.body,
    });
  } else {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...rest, stream }),
    });
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.errors?.[0]?.message || `Cloudflare AI request failed (${response.status})`;
    throw new Error(msg);
  }

  if (stream) {
    return response.body;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.errors?.[0]?.message || "Cloudflare AI request failed");
    }
    return data.result ?? data;
  }

  return response.arrayBuffer();
}
