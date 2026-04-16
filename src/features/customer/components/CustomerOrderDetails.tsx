import type {
  CustomerOrder,
  OrderLineDisplay,
} from "@/features/restaurants/types/customerOrder.types";
import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  isActiveCustomerOrderStatus,
  muiOrderStatusChipColor,
} from "@/features/restaurants/types/orderStatus";
import { resolveDeliveryTarget } from "@/features/restaurants/lib/orderDeliveryTarget";
import { useDeliveryCountdown } from "@/lib/useDeliveryCountdown";
import { Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useMemo } from "react";

export function orderDeliveryTypeLabel(value?: string): string {
  return value === "pickup" ? "Pickup" : "Delivery";
}

export function CustomerOrderItemsList({ items }: { items: OrderLineDisplay[] }) {
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        No line items in this response.
      </Typography>
    );
  }

  return (
    <Stack component="ul" sx={{ m: 0, pl: 2.25, listStyleType: "none" }}>
      {items.map((line) => {
        const unit =
          line.priceAtOrder != null ? parseFloat(String(line.priceAtOrder)) : null;
        const lineTotal =
          unit != null && Number.isFinite(unit) ? unit * Math.max(1, line.quantity) : null;
        const label = line.menuItem?.name ?? "Item";

        return (
          <Box component="li" key={line.id} sx={{ mb: 1, pl: 0.25 }}>
            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.35 }}>
              {line.quantity}× {label}
            </Typography>
            {line.ingredientNames && line.ingredientNames.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                {line.ingredientNames.join(", ")}
              </Typography>
            )}
            {line.comment ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.25, fontStyle: "italic" }}
              >
                Note: {line.comment}
              </Typography>
            ) : null}
            {lineTotal != null && Number.isFinite(lineTotal) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                {unit != null && Number.isFinite(unit) && line.quantity > 1
                  ? `€${unit.toFixed(2)} each · €${lineTotal.toFixed(2)} line`
                  : `€${lineTotal.toFixed(2)}`}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

/** Full order summary: status, ETA, lines, total — for dedicated order page or large panels. */
export function CustomerOrderFullDetail({ order }: { order: CustomerOrder }) {
  const total =
    order.totalPrice != null ? parseFloat(String(order.totalPrice)) : null;
  const placed =
    order.createdAt != null && Number.isFinite(new Date(order.createdAt).getTime())
      ? new Date(order.createdAt).toLocaleString()
      : null;

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="space-between">
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
          {order.restaurant?.name ?? "Order"}
        </Typography>
        <Chip
          size="small"
          label={ORDER_STATUS_LABELS[order.status]}
          color={muiOrderStatusChipColor(order.status)}
          sx={{ fontWeight: 800 }}
        />
      </Stack>
      {placed && (
        <Typography variant="body2" color="text.secondary">
          Placed {placed}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary">
        Type: {orderDeliveryTypeLabel(order.deliveryType)}
      </Typography>
      <OrderDeliveryRow order={order} />
      {(order.deliveryAddress ||
        (typeof order.deliveryLat === "number" && typeof order.deliveryLng === "number")) && (
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 800, letterSpacing: "0.06em", display: "block", mb: 0.5 }}
          >
            Delivery address
          </Typography>
          {order.deliveryAddress && (
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
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
      <Divider sx={{ borderStyle: "dashed" }} />
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: "0.06em" }}>
        Your order
      </Typography>
      <CustomerOrderItemsList items={order.items ?? []} />
      {total != null && Number.isFinite(total) && (
        <Typography variant="subtitle1" fontWeight={800}>
          Total €{total.toFixed(2)}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        Order ref · {order.id}
      </Typography>
    </Stack>
  );
}

type DeliveryRowProps = {
  order: CustomerOrder;
  /** Tighter typography for home cards */
  compact?: boolean;
};

/**
 * Delivery countdown for in-flight orders, or delivered timestamp when available.
 */
export function OrderDeliveryRow({ order, compact }: DeliveryRowProps) {
  const theme = useTheme();

  const resolved = useMemo(
    () => resolveDeliveryTarget(order),
    [
      order.id,
      order.status,
      order.createdAt,
      order.estimatedDeliveryAt,
      order.estimatedDeliveryMinutes,
    ]
  );

  const active = isActiveCustomerOrderStatus(order.status);
  const countdown = useDeliveryCountdown(resolved?.at ?? null, active && !!resolved);

  if (order.status === OrderStatus.DELIVERED) {
    const d = order.deliveredAt ? new Date(order.deliveredAt) : null;
    const timeOk = d != null && Number.isFinite(d.getTime());
    return (
      <Typography
        variant={compact ? "caption" : "body2"}
        sx={{ color: alpha(theme.palette.success.main, 0.95), fontWeight: compact ? 600 : 700 }}
      >
        Delivered
        {timeOk ? ` · ${d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}` : ""}
      </Typography>
    );
  }

  if (order.status === OrderStatus.CANCELLED) {
    return (
      <Typography variant={compact ? "caption" : "body2"} color="error" sx={{ fontWeight: 600 }}>
        Order cancelled
      </Typography>
    );
  }

  if (active && !resolved) {
    if (order.status === OrderStatus.PENDING) {
      return (
        <Typography variant={compact ? "caption" : "body2"} color="text.secondary" sx={{ lineHeight: 1.45 }}>
          Waiting for the restaurant. You&apos;ll see a delivery countdown once they accept.
        </Typography>
      );
    }
    return null;
  }

  if (!active || !resolved || !countdown) return null;

  const timeLabel = resolved.at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <Stack spacing={0.35}>
      <Typography
        variant={compact ? "body2" : "subtitle2"}
        fontWeight={800}
        sx={{
          color: countdown.isOverdue
            ? alpha(theme.palette.warning.main, 0.95)
            : alpha(theme.palette.secondary.main, 0.98),
          letterSpacing: compact ? undefined : "-0.01em",
        }}
      >
        {countdown.primary}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
        Est. by {timeLabel}
        {resolved.isEstimate ? " · approximate (restaurant has not confirmed a time)" : ""}
      </Typography>
    </Stack>
  );
}
