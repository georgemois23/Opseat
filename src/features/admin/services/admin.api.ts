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

/** Full admin payload for a single restaurant (includes staff, schedules, orders, aggregates). */
export type AdminRestaurantDetail = AdminRestaurantRow & {
  publicId?: string;
  street?: string;
  postalCode?: string;
  country?: string;
  latitude?: string | number;
  longitude?: string | number;
  deliveryRadius?: number;
  imageUrl?: string;
  minimumOrderAmount?: string | number;
  categories?: string[];
  staff?: unknown[];
  schedules?: unknown[];
  /** API may return orders under `order` or `orders` */
  order?: unknown[];
  orders?: unknown[];
  menus?: unknown[];
  totalOrders?: number;
  totalRevenue?: number;
};

export type AdminUserRow = {
  id: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  isRestaurantUser?: boolean;
  disabled?: boolean;
  orders?: unknown[];
  [key: string]: unknown;
};

export type AdminUserOrderRow = {
  id: string;
  status?: string;
  totalPrice?: string | number;
  createdAt?: string;
  restaurant?: { name?: string; slug?: string };
};

export type AdminPartnerApplicationRow = {
  id: string;
  applicationStatus?: string;
  createdAt?: string | number;
  created_at?: string | number;
  user?: User;
  restaurant?: Restaurant;
  [key: string]: unknown;
};

export type AdminCourierApplicationRow = {
  id: string;
  applicationStatus?: string;
  createdAt?: string | number;
  created_at?: string | number;
  vehicleType?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  user?: User;
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
  const paths = ["/restaurants/all", "/admin/restaurants"];
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

/** Single restaurant for admin detail view. */
export async function fetchAdminRestaurantById(id: string): Promise<AdminRestaurantDetail | null> {
  const paths = [`/restaurants/admin/${id}`, `/admin/restaurants/${id}`, `/restaurants/${id}`];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const data = res.data;
      if (data && typeof data === "object") return data as AdminRestaurantDetail;
    } catch {
      /* next */
    }
  }
  return null;
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

export async function fetchAdminUserById(id: string): Promise<AdminUserRow | null> {
  const paths = [`/users/admin/${id}`, `/admin/users/${id}`, `/users/${id}`];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const data = res.data;
      if (data && typeof data === "object") return data as AdminUserRow;
    } catch {
      /* next */
    }
  }
  return null;
}

export function normalizeAdminUserOrdersPayload(raw: unknown): AdminUserOrderRow[] {
  if (!Array.isArray(raw)) return [];
  const out: AdminUserOrderRow[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const oid = typeof r.id === "string" ? r.id : r.id != null ? String(r.id) : null;
    if (!oid) continue;
    const rest = r.restaurant;
    const restaurant =
      typeof rest === "object" && rest !== null
        ? {
            name: typeof (rest as { name?: unknown }).name === "string" ? (rest as { name: string }).name : undefined,
            slug: typeof (rest as { slug?: unknown }).slug === "string" ? (rest as { slug: string }).slug : undefined,
          }
        : undefined;
    const tpRaw = r.totalPrice ?? r.total_price;
    const totalPrice =
      typeof tpRaw === "number" || typeof tpRaw === "string" ? tpRaw : undefined;
    out.push({
      id: oid,
      status: typeof r.status === "string" ? r.status : undefined,
      totalPrice,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : typeof r.created_at === "string" ? r.created_at : undefined,
      restaurant,
    });
  }
  return out;
}

export async function fetchAdminUserOrders(userId: string): Promise<AdminUserOrderRow[]> {
  const paths = [
    `/admin/users/${userId}/orders`,
    `/order/admin/${userId}`,
    // `/users/admin/${userId}`,
  ];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const d = res.data;
      let raw: unknown = d;
      if (d && typeof d === "object" && !Array.isArray(d)) {
        const o = d as { orders?: unknown; data?: unknown };
        if (Array.isArray(o.orders)) raw = o.orders;
        else if (Array.isArray(o.data)) raw = o.data;
      }
      return normalizeAdminUserOrdersPayload(Array.isArray(raw) ? raw : asArray<unknown>(raw));
    } catch {
      /* next */
    }
  }
  return [];
}

/** POST only — no body. */
export async function postDisableUser(userId: string): Promise<void> {
  await api.post(`/auth/disable-user/${encodeURIComponent(userId)}`, undefined, { withCredentials: true });
}

export async function postEnableUser(userId: string): Promise<void> {
  await api.post(`/auth/enable-user/${encodeURIComponent(userId)}`, undefined, { withCredentials: true });
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

export async function fetchAdminCourierApplications(): Promise<AdminCourierApplicationRow[]> {
  const paths = [
    "couriers/admin/applications",
    "/admin/courier/applications",
  ];
  for (const url of paths) {
    try {
      const res = await api.get(url, { withCredentials: true });
      const list = asArray<AdminCourierApplicationRow>(res.data);
      if (list.length > 0 || res.data != null) return list;
    } catch {
      /* next */
    }
  }
  return [];
}

/** Approve a restaurant partner application (restaurant-user endpoint). */
export async function approveRestaurantApplication(id: string): Promise<boolean> {
  try {
    await api.post(`/restaurant-user/admin/applications/${id}/approve`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

/** Reject a restaurant partner application (restaurant-user endpoint). */
export async function rejectRestaurantApplication(id: string): Promise<boolean> {
  try {
    await api.post(`/restaurant-user/admin/applications/${id}/reject`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

/** Approve a courier partner application (couriers endpoint). */
export async function approveCourierApplication(id: string): Promise<boolean> {
  try {
    await api.post(`/couriers/admin/applications/${id}/approve`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}

/** Reject a courier partner application (couriers endpoint). */
export async function rejectCourierApplication(id: string): Promise<boolean> {
  try {
    await api.post(`/couriers/admin/applications/${id}/reject`, {}, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
}
