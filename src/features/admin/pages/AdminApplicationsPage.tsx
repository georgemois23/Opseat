import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  approveCourierApplication,
  approveRestaurantApplication,
  fetchAdminCourierApplications,
  fetchAdminPartnerApplications,
  rejectCourierApplication,
  rejectRestaurantApplication,
  type AdminCourierApplicationRow,
  type AdminPartnerApplicationRow,
} from "@/features/admin/services/admin.api";
import { useSnackbar } from "@/lib/SnackbarContext";
import { formatEuDateTime } from "@/features/admin/utils/formatEuDateTime";

export default function AdminApplicationsPage() {
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const toast = showSnackbar as (payload: { message: string; severity: string }) => void;

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<AdminPartnerApplicationRow[]>([]);
  const [courierApplications, setCourierApplications] = useState<AdminCourierApplicationRow[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [restaurantApps, courierApps] = await Promise.all([
        fetchAdminPartnerApplications(),
        fetchAdminCourierApplications(),
      ]);
      setApplications(restaurantApps);
      setCourierApplications(courierApps);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (id: string, action: () => Promise<boolean>, verb: "approved" | "rejected") => {
    setActionId(id);
    try {
      const ok = await action();
      toast({
        message: ok ? `Application ${verb}.` : `Could not ${verb === "approved" ? "approve" : "reject"} (check API route).`,
        severity: ok ? "success" : "error",
      });
      if (ok) await load();
    } finally {
      setActionId(null);
    }
  };

  const handleApproveRestaurant = (id: string) => runAction(id, () => approveRestaurantApplication(id), "approved");
  const handleRejectRestaurant = (id: string) => runAction(id, () => rejectRestaurantApplication(id), "rejected");
  const handleApproveCourier = (id: string) => runAction(id, () => approveCourierApplication(id), "approved");
  const handleRejectCourier = (id: string) => runAction(id, () => rejectCourierApplication(id), "rejected");

  document.title = "Admin • Applications • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
          Restaurant partner applications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Review requests from users who want to list and run a restaurant on OpsEat (not courier or other partner
          types).
        </Typography>
      </Box>
      <TableContainer
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>User / email</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">No restaurant applications loaded.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((a) => {
                const uid = a.user?.id;
                const created = a.createdAt ?? a.created_at;
                const busy = actionId === a.id;
                const s = String(a.applicationStatus ?? "").toLowerCase();
                const isFinal = s.includes("accepted") || s.includes("rejected") || s.includes("denied");
                return (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Chip
                        size="small"
                        label={a.applicationStatus ?? "pending"}
                        color={isFinal ? "default" : "warning"}
                      />
                    </TableCell>
                    <TableCell>{a.user?.email ?? uid ?? "—"}</TableCell>
                    <TableCell>{formatEuDateTime(created)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          disabled={busy || isFinal}
                          onClick={() => void handleApproveRestaurant(a.id)}
                          sx={{ textTransform: "none" }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={busy || isFinal}
                          onClick={() => void handleRejectRestaurant(a.id)}
                          sx={{ textTransform: "none" }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ pt: 1 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
          Courier partner applications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
          Courier applications are listed here for review.
        </Typography>
      </Box>
      <TableContainer
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>User / email</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courierApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No courier applications loaded.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              courierApplications.map((a) => {
                const created = a.createdAt ?? a.created_at;
                const address = [a.street, a.city, a.postalCode, a.country].filter(Boolean).join(", ");
                const s = String(a.applicationStatus ?? "").toLowerCase();
                const chipColor =
                  s.includes("accepted")
                    ? "success"
                    : s.includes("rejected") || s.includes("denied")
                      ? "error"
                      : "warning";
                return (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Chip size="small" label={a.applicationStatus ?? "pending"} color={chipColor} />
                    </TableCell>
                    <TableCell>{a.user?.email ?? a.user?.id ?? "—"}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{a.vehicleType ?? "—"}</TableCell>
                    <TableCell>{address || "—"}</TableCell>
                    <TableCell>{formatEuDateTime(created)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" color="success" variant="outlined" onClick={() => void handleApproveCourier(a.id)}>
                          Approve
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => void handleRejectCourier(a.id)}>
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="outlined" onClick={() => void load()} sx={{ alignSelf: "flex-start", borderRadius: 2 }}>
        Refresh
      </Button>
    </Stack>
  );
}
