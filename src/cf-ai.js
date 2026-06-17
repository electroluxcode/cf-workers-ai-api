const CF_API = "https://api.cloudflare.com/client/v4";

export async function cfAiRun({ token, accountId, modelId, input = {} }) {
  if (!token) throw new Error("Missing API token");
  if (!accountId) throw new Error("Missing CF-Account-Id header");

  const url = `${CF_API}/accounts/${accountId}/ai/run/${modelId}`;
  const stream = !!input.stream;
  const { stream: _stream, formData, ...rest } = input;

  const response = formData
    ? await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
    : await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...rest, stream }),
      });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || `Cloudflare AI request failed (${response.status})`);
  }

  if (stream) return response.body;

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
