const CF_API = "https://api.cloudflare.com/client/v4";

const accountCache = new Map();

async function cfFetch(path, token) {
  const res = await fetch(`${CF_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export async function verifyUserToken(token) {
  const { res, data } = await cfFetch("/user/tokens/verify", token);
  if (!res.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message || "Invalid API token");
  }
  if (data.result?.status && data.result.status !== "active") {
    throw new Error("API token is not active");
  }
}

async function resolveAccountId(token) {
  if (accountCache.has(token)) return accountCache.get(token);

  const { data: accountsData } = await cfFetch("/accounts?per_page=1", token);
  const fromAccounts = accountsData.result?.[0]?.id;
  if (fromAccounts) {
    accountCache.set(token, fromAccounts);
    return fromAccounts;
  }

  const { data: membershipsData } = await cfFetch("/memberships?per_page=1", token);
  const fromMemberships =
    membershipsData.result?.[0]?.account?.id ?? membershipsData.result?.[0]?.account_id;
  if (fromMemberships) {
    accountCache.set(token, fromMemberships);
    return fromMemberships;
  }

  return null;
}

async function runViaRest(token, accountId, modelId, input) {
  const url = `${CF_API}/accounts/${accountId}/ai/run/${modelId}`;
  const stream = !!input.stream;
  const { stream: _stream, multipart, ...rest } = input;

  if (multipart) {
    return fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: multipart.body,
    });
  }

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...rest, stream }),
  });
}

async function runViaBinding(ai, modelId, input) {
  const stream = !!input.stream;
  const { stream: _stream, multipart, ...rest } = input;

  if (multipart) {
    return ai.run(modelId, {
      multipart: {
        body: input.multipart.body,
        contentType: input.multipart.contentType,
      },
    });
  }

  if (stream) {
    return ai.run(modelId, { ...rest, stream: true });
  }

  return ai.run(modelId, rest);
}

async function parseAiResponse(response, stream) {
  if (stream) {
    return response.body ?? response;
  }

  if (response instanceof ArrayBuffer || response instanceof Uint8Array) {
    return response;
  }

  const contentType = response.headers?.get?.("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (data.success === false) {
      throw new Error(data.errors?.[0]?.message || "Cloudflare AI request failed");
    }
    return data.result ?? data;
  }

  if (typeof response?.response === "string" || response?.result) {
    return response;
  }

  return response.arrayBuffer();
}

export async function cfAiRun(token, modelId, input = {}, env) {
  if (!token) {
    throw new Error("Missing API token");
  }

  await verifyUserToken(token);

  const accountId = await resolveAccountId(token);
  let result;

  if (accountId) {
    const response = await runViaRest(token, accountId, modelId, input);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || `Cloudflare AI request failed (${response.status})`);
    }
    result = await parseAiResponse(response, !!input.stream);
  } else if (env?.AI) {
    result = await runViaBinding(env.AI, modelId, input);
  } else {
    throw new Error(
      "Unable to resolve account for this API token. Deploy with Workers AI binding, or use a token with Account Read permission."
    );
  }

  return result;
}
