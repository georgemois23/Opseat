import type { Restaurant } from "@/features/restaurants/types/RestaurantData";
import api from "@/lib/axios";

export type SearchRestaurantHit = {
  id: Restaurant["id"];
  name: Restaurant["name"];
  slug?: Restaurant["slug"];
  city?: Restaurant["city"];
  categories: string[];
  imageUrl?: string | null;
  minimumOrderAmount?: string | number | null;
};

export type SearchCuisineHit = {
  key: string;
  label: string;
};

export type GlobalSearchResult = {
  restaurants: SearchRestaurantHit[];
  cuisines: SearchCuisineHit[];
};

function normalizeRestaurantHits(raw: unknown): SearchRestaurantHit[] {
  if (!Array.isArray(raw)) return [];
  const out: SearchRestaurantHit[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : null;
    const name = typeof r.name === "string" ? r.name : null;
    if (!id || !name) continue;
    const categories = Array.isArray(r.categories)
      ? r.categories.filter((c): c is string => typeof c === "string")
      : [];
    out.push({
      id,
      name,
      slug: typeof r.slug === "string" ? r.slug : undefined,
      city: typeof r.city === "string" ? r.city : undefined,
      categories,
      imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : null,
      minimumOrderAmount:
        typeof r.minimumOrderAmount === "string" || typeof r.minimumOrderAmount === "number"
          ? r.minimumOrderAmount
          : null,
    });
  }
  return out;
}

function normalizeCuisineHits(raw: unknown): SearchCuisineHit[] {
  if (!Array.isArray(raw)) return [];
  const out: SearchCuisineHit[] = [];
  for (const row of raw) {
    if (typeof row === "string") {
      const key = row.trim().toLowerCase();
      if (key.length) {
        out.push({ key, label: key.replace(/_/g, " ") });
      }
      continue;
    }
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const keyRaw = r.key ?? r.category ?? r.name;
    if (typeof keyRaw !== "string") continue;
    const key = keyRaw.trim().toLowerCase();
    if (!key) continue;
    const labelRaw = r.label ?? r.name ?? key;
    out.push({
      key,
      label: typeof labelRaw === "string" ? labelRaw : key.replace(/_/g, " "),
    });
  }
  return out;
}

export async function searchRestaurantsAndCuisines(
  q: string,
  coords?: { latitude: number; longitude: number }
): Promise<GlobalSearchResult> {
  const query = q.trim();
  if (query.length < 2) return { restaurants: [], cuisines: [] };

  const params = new URLSearchParams();
  params.append("q", query);
  if (coords) {
    params.append("latitude", String(coords.latitude));
    params.append("longitude", String(coords.longitude));
  }

  const url = `/restaurants/search?${params.toString()}`;
  const res = await api.get(url, { withCredentials: true });
  const data = res.data as
    | { restaurants?: unknown; cuisines?: unknown; categories?: unknown }
    | unknown[];

  if (Array.isArray(data)) {
    return {
      restaurants: normalizeRestaurantHits(data),
      cuisines: [],
    };
  }

  const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    restaurants: normalizeRestaurantHits(obj.restaurants),
    cuisines: normalizeCuisineHits(obj.cuisines ?? obj.categories),
  };
}

