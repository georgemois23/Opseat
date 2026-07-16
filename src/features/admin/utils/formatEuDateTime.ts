/** EU-style date/time: dd/mm/yyyy, 24h (en-GB). Handles ISO strings and Unix s/ms. */
export function formatEuDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  let d: Date | null = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    d = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    d = new Date(ms);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      const ms = trimmed.length <= 10 ? n * 1000 : n;
      d = new Date(ms);
    } else {
      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) d = new Date(parsed);
    }
  }
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
