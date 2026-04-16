import type { OrderStatus } from "@/features/restaurants/types/orderStatus";
import { useCallback, useEffect, useState } from "react";
import {
  fetchRestaurantOrders,
  patchOrderStatus,
} from "@/features/restaurants-user/services/ownerOrders.api";
import type { OwnerOrder } from "@/features/restaurants-user/types/ownerOrder.types";
import { normalizeOrdersResponse } from "@/features/restaurants-user/types/ownerOrder.types";

export function useRestaurantOwnerOrders(restaurantId: string | undefined) {
  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await fetchRestaurantOrders(restaurantId);
      setOrders(normalizeOrdersResponse(data));
    } catch {
      setError("Could not load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!restaurantId) return;
      setUpdatingId(orderId);
      try {
        await patchOrderStatus(orderId, status);
        await load();
      } catch {
        setError("Could not update order status.");
      } finally {
        setUpdatingId(null);
      }
    },
    [restaurantId, load]
  );

  return { orders, loading, error, reload: load, updateStatus, updatingId };
}
