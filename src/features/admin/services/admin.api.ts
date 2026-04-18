import { User } from "@/features/auth/types/auth.types";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";
import api from "@/lib/axios";

export type AdminRestaurantRow = {
  id: string;
  name: string;
  slug?: string;
  isDelivering?: boolean;
  city?: string;
  [key: string]: unknown;
};

export type AdminUserRow = {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  isRestaurantUser?: boolean;
  [key: string]: unknown;
};

export type AdminPartnerApplicationRow = {
  id: string;
  applicationStatus?: string;
  createdAt?: string | number;
  created_at?: string | number;
  user: User;
  restaurant: Restaurant;
  [key: string]: unknown;
};

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

/** Tries common backend paths; returns first successful list. */
export async function fetchAdminRestaurants(): Promise<AdminRestaurantRow[]> {
  const paths = ["/restaurants/all",];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const list = asArray<AdminRestaurantRow>(res.data);
      if (list.length > 0 || res.data != null) return list;
    } catch {
      /* next */
    }
  }
  return [];
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const paths = ["/users/admin"];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const list = asArray<AdminUserRow>(res.data);
      if (list.length > 0 || res.data != null) return list;
    } catch {
      /* next */
    }
  }
  return [];
}

export async function fetchAdminPartnerApplications(): Promise<AdminPartnerApplicationRow[]> {
  const paths = [
    "restaurant-user/admin/applications",
  ];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const list = asArray<AdminPartnerApplicationRow>(res.data);
      if (list.length > 0 || res.data != null) return list;
    } catch {
      /* next */
    }
  }
  return [];
}

export async function approvePartnerApplication(id: string): Promise<boolean> {
  const paths = [
    () => api.post(`/restaurant-user/admin/applications/${id}/approve`, {}, { withCredentials: true }),
  ];
  for (const run of paths) {
    try {
      await run();
      return true;
    } catch {
      /* next */
    }
  }
  return false;
}

export async function rejectPartnerApplication(id: string): Promise<boolean> {
  const paths = [
    () => api.post(`/restaurant-user/admin/applications/${id}/reject`, {}, { withCredentials: true }),
  ];
  for (const run of paths) {
    try {
      await run();
      return true;
    } catch {
      /* next */
    }
  }
  return false;
}
