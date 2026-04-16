import {
  ORDER_STATUS_LABELS,
  OrderStatus,
  nextOwnerPipelineStatus,
  previousOwnerPipelineStatus,
} from "@/features/restaurants/types/orderStatus";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { Button, Stack } from "@mui/material";
import React from "react";

type Props = {
  orderId: string;
  status: OrderStatus;
  busy: boolean;
  onStepTo: (orderId: string, nextStatus: OrderStatus) => void | Promise<void>;
  /** Narrow column (e.g. drawer card): stack vertically */
  compact?: boolean;
};

/**
 * One-tap previous / next along the kitchen pipeline (pending → … → delivered).
 * Cancelled orders are off-pipeline — no shortcuts.
 */
export function OwnerOrderPipelineActions({ orderId, status, busy, onStepTo, compact }: Props) {
  const prev = previousOwnerPipelineStatus(status);
  const next = nextOwnerPipelineStatus(status);

  if (!prev && !next) return null;

  const dir = compact ? "column" : "row";

  return (
    <Stack direction={dir} spacing={1} sx={{ width: compact ? "100%" : "auto" }}>
      {prev && (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          disabled={busy}
          fullWidth={compact}
          startIcon={<ChevronLeftRounded />}
          onClick={() => void onStepTo(orderId, prev)}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
        >
          {ORDER_STATUS_LABELS[prev]}
        </Button>
      )}
      {next && (
        <Button
          variant="contained"
          color={next === OrderStatus.ACCEPTED ? "success" : "primary"}
          size="small"
          disabled={busy}
          fullWidth={compact}
          endIcon={<ChevronRightRounded />}
          onClick={() => void onStepTo(orderId, next)}
          sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
        >
          {ORDER_STATUS_LABELS[next]}
        </Button>
      )}
    </Stack>
  );
}
