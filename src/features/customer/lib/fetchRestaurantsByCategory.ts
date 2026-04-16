import api from "@/lib/axios";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";
type NearbyCategoryQuery = {
  categories?: string[];
  gpsCoords?: { latitude: number; longitude: number } | null;
};

/** Customer browse: nearby restaurants by categories from backend endpoint. */
export async function fetchNearbyRestaurantsByCategories({
  categories,
  gpsCoords,
}: NearbyCategoryQuery): Promise<Restaurant[]> {
  const normalizedCategories = (categories ?? [])
    .map((c) => c.toLowerCase().trim())
    .filter(Boolean);
  const endpoint =
    normalizedCategories.length > 0
      ? "/restaurants/nearby/by-category"
      : "/restaurants/nearby";
  try {
    const params = new URLSearchParams();
    for (const category of normalizedCategories) {
      // Repeated key format: ?category=a&category=b
      params.append("category", category);
    }
    if (gpsCoords) {
      params.append("latitude", String(gpsCoords.latitude));
      params.append("longitude", String(gpsCoords.longitude));
    }
    const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;
    const res = await api.get<Restaurant[]>(url, { withCredentials: true });
    return res.data ?? [];
  } catch {
    return [];
  }
}
