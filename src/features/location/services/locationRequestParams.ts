export type CachedGpsContext = {
  latitude: number;
  longitude: number;
  city?: string;
};

export function readCachedGpsContext(): CachedGpsContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("opseat:gps-coords:v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { latitude?: unknown; longitude?: unknown };
    if (typeof parsed.latitude !== "number" || typeof parsed.longitude !== "number") return null;
    const cityRaw = sessionStorage.getItem("opseat:gps-city:v1")?.trim();
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      city: cityRaw || undefined,
    };
  } catch {
    return null;
  }
}

export function buildNearbyParamsFromGps(
  gps: { latitude: number; longitude: number } | null | undefined
): { latitude: number; longitude: number; lat: number; lng: number } | undefined {
  if (!gps) return undefined;
  return {
    latitude: gps.latitude,
    longitude: gps.longitude,
    lat: gps.latitude,
    lng: gps.longitude,
  };
}

