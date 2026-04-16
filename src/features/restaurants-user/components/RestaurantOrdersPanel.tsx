import {
  CustomerOrderItemsList,
  orderDeliveryTypeLabel,
} from "@/features/customer/components/CustomerOrderDetails";
import { OwnerOrderPipelineActions } from "@/features/restaurants-user/components/OwnerOrderPipelineActions";
import { useRestaurantOwnerOrders } from "@/features/restaurants-user/hooks/useRestaurantOwnerOrders";
import {
  fetchRestaurantOrders,
} from "@/features/restaurants-user/services/ownerOrders.api";
import {
  normalizeOrdersResponse,
  type OwnerOrder,
} from "@/features/restaurants-user/types/ownerOrder.types";
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  OWNER_ORDER_STATUS_OPTIONS,
  isTerminalOrderStatus,
  muiOrderStatusChipColor,
} from "@/features/restaurants/types/orderStatus";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

export function RestaurantOrdersPanel({
  restaurantId,
  orderDetailBasePath,
}: {
  restaurantId: string;
  /** When set, list is compact and each row has “See order details” → `${path}/${orderId}`. */
  orderDetailBasePath?: string;
}) {
  const theme = useTheme();
  const hubMode = Boolean(orderDetailBasePath);
  const { orders, loading, error, reload, updateStatus, updatingId } =
    useRestaurantOwnerOrders(restaurantId);

  const onSelectChange = (orderId: string) => (e: SelectChangeEvent<OrderStatus>) => {
    void updateStatus(orderId, e.target.value as OrderStatus);
  };

  const border = alpha(theme.palette.primary.main, 0.12);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} sx={{ color: alpha(theme.palette.primary.main, 0.85) }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" gap={1}>
          <ReceiptLongRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            {hubMode ? "All orders" : "Live orders"}
          </Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshRounded />}
          onClick={() => void reload()}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            No orders to show yet. Submitted orders (after checkout) appear here — draft carts stay on the customer side only.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              border={border}
              theme={theme}
              hubMode={hubMode}
              detailHref={
                orderDetailBasePath
                  ? `${orderDetailBasePath.replace(/\/$/, "")}/${encodeURIComponent(order.id)}`
                  : undefined
              }
              busy={updatingId === order.id}
              onStatusChange={updateStatus}
              onSelectChange={onSelectChange}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function OrderCard({
  order,
  border,
  theme,
  hubMode,
  detailHref,
  busy,
  onStatusChange,
  onSelectChange,
}: {
  order: OwnerOrder;
  border: string;
  theme: Theme;
  hubMode: boolean;
  detailHref?: string;
  busy: boolean;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
  onSelectChange: (orderId: string) => (e: SelectChangeEvent<OrderStatus>) => void;
}) {
  const total = order.totalPrice != null ? parseFloat(String(order.totalPrice)) : null;
  const nItems = order.items?.length ?? 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: `1px solid ${border}`,
        bgcolor: alpha(theme.palette.background.paper, 0.55),
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Order #{order.id.slice(0, 8)}
            </Typography>
            <Chip
              size="small"
              label={ORDER_STATUS_LABELS[order.status]}
              color={muiOrderStatusChipColor(order.status)}
              variant={order.status === OrderStatus.PENDING ? "filled" : "outlined"}
              sx={{ fontWeight: 800 }}
            />
          </Stack>
          {order.createdAt && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {new Date(order.createdAt).toLocaleString()}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Type: {orderDeliveryTypeLabel(order.deliveryType)}
          </Typography>
          {hubMode ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {nItems} item{nItems === 1 ? "" : "s"}
              {total != null && Number.isFinite(total) ? ` · €${total.toFixed(2)}` : ""}
            </Typography>
          ) : (
            <>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ fontWeight: 800, letterSpacing: "0.06em", display: "block", mt: 1 }}
              >
                Order items
              </Typography>
              <Box sx={{ mt: 1 }}>
                <CustomerOrderItemsList items={order.items ?? []} />
              </Box>
            </>
          )}
          {total != null && Number.isFinite(total) && !hubMode && (
            <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5 }}>
              Total €{total.toFixed(2)}
            </Typography>
          )}
        </Box>

        <Stack spacing={1.5} sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          {detailHref && (
            <Button
              component={RouterLink}
              to={detailHref}
              variant="outlined"
              color="secondary"
              fullWidth
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 800 }}
            >
              See order details
            </Button>
          )}
          <OwnerOrderPipelineActions
            orderId={order.id}
            status={order.status}
            busy={busy}
            onStepTo={onStatusChange}
            compact
          />
          <FormControl size="small" fullWidth disabled={busy}>
            <InputLabel id={`status-${order.id}`}>Status</InputLabel>
            <Select<OrderStatus>
              labelId={`status-${order.id}`}
              label="Status"
              value={order.status}
              onChange={onSelectChange(order.id)}
            >
              {OWNER_ORDER_STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st}>
                  {ORDER_STATUS_LABELS[st]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Paper>
  );
}

/** Compact active-order count for venue cards (excludes delivered / cancelled). */
export function RestaurantActiveOrdersBadge({ restaurantId }: { restaurantId: string }) {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchRestaurantOrders(restaurantId);
        const list = normalizeOrdersResponse(data);
        const n = list.filter((o) => !isTerminalOrderStatus(o.status)).length;
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (count === null) {
    return (
      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
        Orders…
      </Typography>
    );
  }
  if (count === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        No active orders
      </Typography>
    );
  }
  return (
    <Chip
      size="small"
      label={`${count} active order${count === 1 ? "" : "s"}`}
      color="secondary"
      sx={{ mt: 0.75, fontWeight: 800, maxWidth: "100%" }}
    />
  );
}
