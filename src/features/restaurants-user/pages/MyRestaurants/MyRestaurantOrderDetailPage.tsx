import {
  CustomerOrderItemsList,
  orderDeliveryTypeLabel,
} from "@/features/customer/components/CustomerOrderDetails";
import { OwnerOrderPipelineActions } from "@/features/restaurants-user/components/OwnerOrderPipelineActions";
import { useRestaurantOwnerOrders } from "@/features/restaurants-user/hooks/useRestaurantOwnerOrders";
import api from "@/lib/axios";
import type { Restaurant } from "@/features/restaurants/types/RestaurantData";
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  OWNER_ORDER_STATUS_OPTIONS,
  muiOrderStatusChipColor,
} from "@/features/restaurants/types/orderStatus";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

/**
 * Single-order view for partners.
 * Route: `/restaurant/my/:id/orders/:orderId`
 */
export default function MyRestaurantOrderDetailPage() {
  const { id: restaurantId, orderId } = useParams<{ id: string; orderId: string }>();
  const theme = useTheme();
  const { orders, loading, error, reload, updateStatus, updatingId } =
    useRestaurantOwnerOrders(restaurantId);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const order = useMemo(
    () => (orderId ? orders.find((o) => o.id === orderId) : undefined),
    [orders, orderId]
  );

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get(`/restaurants/my/${restaurantId}`);
        if (!cancelled) setRestaurant(res.data);
      } catch {
        if (!cancelled) setRestaurant(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const listHref =
    restaurantId != null
      ? `/restaurant/my/${encodeURIComponent(restaurantId)}/orders`
      : "/restaurant/my";

  const busy = orderId != null && updatingId === orderId;
  const total = order?.totalPrice != null ? parseFloat(String(order.totalPrice)) : null;

  const onSelectChange = (e: SelectChangeEvent<OrderStatus>) => {
    if (!orderId) return;
    void updateStatus(orderId, e.target.value as OrderStatus);
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - 72px)", py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="sm">
        <Button
          component={RouterLink}
          to={listHref}
          startIcon={<ArrowBackRounded />}
          variant="text"
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 700,
            color: "text.primary",
            "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.08) },
          }}
        >
          All orders
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : error && orders.length === 0 ? (
          <Typography color="error">{error}</Typography>
        ) : !order ? (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider" }}>
            <Typography fontWeight={800} sx={{ mb: 1 }}>
              Order not found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This order may have been removed or doesn&apos;t belong to this restaurant.
            </Typography>
            <Button component={RouterLink} to={listHref} variant="contained" color="secondary" sx={{ textTransform: "none", fontWeight: 700 }}>
              Back to orders
            </Button>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              bgcolor: "background.paper",
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <ReceiptLongRounded color="secondary" />
              <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
                Order details
              </Typography>
            </Stack>
            {restaurant?.name && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {restaurant.name}
              </Typography>
            )}
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                #{order.id.slice(0, 8)}…
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
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {new Date(order.createdAt).toLocaleString()}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Type: {orderDeliveryTypeLabel(order.deliveryType)}
            </Typography>
            {(order.deliveryAddress ||
              (typeof order.deliveryLat === "number" && typeof order.deliveryLng === "number")) && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 800, letterSpacing: "0.06em", display: "block", mb: 0.5 }}
                >
                  Delivery address
                </Typography>
                {order.deliveryAddress && (
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }} onClick={() => window.open(
                    `https://www.google.com/maps/search/?api=1&query=${order.deliveryLat},${order.deliveryLng}`,
                    '_blank'
                  )}>
                    {order.deliveryAddress}
                  </Typography>
                )}
                {/* {typeof order.deliveryLat === "number" && typeof order.deliveryLng === "number" && (
                  <Typography variant="caption" color="text.secondary">
                    Lat {order.deliveryLat.toFixed(6)} · Lng {order.deliveryLng.toFixed(6)}
                  </Typography>
                )} */}
              </Box>
            )}

            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 800, letterSpacing: "0.06em", display: "block", mb: 1 }}
            >
              Order items
            </Typography>
            <CustomerOrderItemsList items={order.items ?? []} />

            {total != null && Number.isFinite(total) && (
              <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 2 }}>
                Total €{total.toFixed(2)}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Full id · {order.id}
            </Typography>

            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Stack spacing={1.5} sx={{ mt: 3 }}>
              <OwnerOrderPipelineActions
                orderId={order.id}
                status={order.status}
                busy={busy}
                onStepTo={updateStatus}
              />
              <FormControl size="small" fullWidth disabled={busy}>
                <InputLabel id={`detail-status-${order.id}`}>Status</InputLabel>
                <Select<OrderStatus>
                  labelId={`detail-status-${order.id}`}
                  label="Status"
                  value={order.status}
                  onChange={onSelectChange}
                >
                  {OWNER_ORDER_STATUS_OPTIONS.map((st) => (
                    <MenuItem key={st} value={st}>
                      {ORDER_STATUS_LABELS[st]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={() => void reload()}
                disabled={busy}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Refresh
              </Button>
            </Stack>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
