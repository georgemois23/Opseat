import { useEffect } from "react";
import { useSocket } from "@/features/socket/hooks/useSocket";
import { useSnackbar } from "@/lib/SnackbarContext";

/**
 * Listens for `courier_assigned` socket events (surfaced via SocketProvider) and
 * shows the customer a toast with the courier and the recalculated ETA.
 * Rendered once, high in the tree, so it fires regardless of the current route.
 */
export default function CourierAssignmentNotifier() {
  const { courierAssignment, clearCourierAssignment } = useSocket();
  const { showSnackbar } = useSnackbar();
  const toast = showSnackbar as (payload: { message: string; severity: string }) => void;

  useEffect(() => {
    if (!courierAssignment) return;

    const name = [courierAssignment.courier?.firstName, courierAssignment.courier?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const eta = courierAssignment.estimatedDeliveryTime
      ? new Date(courierAssignment.estimatedDeliveryTime)
      : null;
    const etaText =
      eta && !Number.isNaN(eta.getTime())
        ? eta.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })
        : null;

    const who = name ? `${name} is` : "A courier is";
    const message = etaText
      ? `${who} on the way — arriving around ${etaText}.`
      : `${who} on the way with your order.`;

    toast({ message, severity: "success" });
    clearCourierAssignment();
  }, [courierAssignment, clearCourierAssignment, toast]);

  return null;
}
