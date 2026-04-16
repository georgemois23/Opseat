/** Normalize axios / API errors into a single user-facing string. */
export function formatAuthError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: unknown }; message?: string };
  const data = e?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const msg = rec.message;
    if (Array.isArray(msg)) {
      return msg.map(String).filter(Boolean).join(" ");
    }
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim();
    }
    if (typeof rec.error === "string" && rec.error.trim()) {
      return rec.error.trim();
    }
  }

  if (e?.message && typeof e.message === "string" && !e.message.startsWith("Request failed")) {
    return e.message;
  }

  return fallback;
}
