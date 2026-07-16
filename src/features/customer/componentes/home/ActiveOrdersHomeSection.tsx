import { fetchMyOrders } from "@/features/restaurants/services/customerOrders.api";
import {
  CustomerOrder,
  normalizeCustomerOrdersResponse,
} from "@/features/restaurants/types/customerOrder.types";
import {
  ORDER_STATUS_LABELS,
  isActiveCustomerOrderStatus,
  muiOrderStatusChipColor,
} from "@/features/restaurants/types/orderStatus";
import { OrderDeliveryRow } from "@/features/customer/components/CustomerOrderDetails";
import { orderDeliveryTypeLabel } from "@/features/customer/components/CustomerOrderDetails";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/features/socket/hooks/useSocket";

/**
 * Home preview: in-flight orders only (not draft, not delivered, not cancelled).
 */
export function ActiveOrdersHomeSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { subscribe } = useSocket();
  const [active, setActive] = useState<CustomerOrder[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchMyOrders();
      const all = normalizeCustomerOrdersResponse(data);
      setActive(all.filter((o) => isActiveCustomerOrderStatus(o.status)));
    } catch {
      setActive([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live: refresh the active-orders list whenever the server pushes a status change.
  useEffect(() => {
    const unsub = subscribe("order_status_changed", () => void load());
    return unsub;
  }, [subscribe, load]);

  if (!loaded || active.length === 0) return null;

  const border = alpha(theme.palette.primary.main, 0.14);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${border}`,
        bgcolor: alpha(theme.palette.background.paper, 0.55),
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <LocalShippingRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
        <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em">
          Active orders
        </Typography>
        <Chip label={active.length} size="small" color="secondary" sx={{ fontWeight: 800, height: 22 }} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
        Track orders that are being prepared or are on the way. Open your account menu for full history.
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        {active.slice(0, 4).map((o) => {
          const total =
            o.totalPrice != null ? parseFloat(String(o.totalPrice)) : null;
          return (
            <Paper
              key={o.id}
              elevation={0}
              sx={{
                flex: { xs: "1 1 100%", sm: "1 1 200px" },
                minWidth: { sm: 200 },
                maxWidth: { sm: 280 },
                p: 1.75,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              }}
            >
              <Typography fontWeight={800} noWrap sx={{ mb: 0.5 }}>
                {o.restaurant?.name ?? "Order"}
              </Typography>
              <Chip
                size="small"
                label={ORDER_STATUS_LABELS[o.status]}
                color={muiOrderStatusChipColor(o.status)}
                sx={{ fontWeight: 800, mb: 1, maxWidth: "100%" }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Type: {orderDeliveryTypeLabel(o.deliveryType)}
              </Typography>
              <Box sx={{ mb: 1 }}>
                <OrderDeliveryRow order={o} compact />
              </Box>
              {o.items && o.items.length > 0 && (
                <Stack spacing={0.35} sx={{ mb: 1 }}>
                  {o.items.slice(0, 4).map((line) => (
                    <Typography
                      key={line.id}
                      variant="caption"
                      color="text.secondary"
                      sx={{ lineHeight: 1.4, display: "block" }}
                    >
                      {line.quantity}× {line.menuItem?.name ?? "Item"}
                      {line.ingredientNames && line.ingredientNames.length > 0
                        ? ` · ${line.ingredientNames.slice(0, 2).join(", ")}${
                            line.ingredientNames.length > 2 ? "…" : ""
                          }`
                        : ""}
                    </Typography>
                  ))}
                  {o.items.length > 4 && (
                    <Typography variant="caption" color="text.secondary">
                      +{o.items.length - 4} more in account
                    </Typography>
                  )}
                </Stack>
              )}
              {total != null && Number.isFinite(total) && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  €{total.toFixed(2)}
                </Typography>
              )}
              <Button
                size="small"
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => navigate(`/order/${encodeURIComponent(o.id)}`)}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                View order
              </Button>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}
