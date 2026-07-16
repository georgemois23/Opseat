import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChipProps } from "@mui/material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
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
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchAdminUserById,
  fetchAdminUserOrders,
  normalizeAdminUserOrdersPayload,
  postDisableUser,
  postEnableUser,
  type AdminUserOrderRow,
  type AdminUserRow,
} from "@/features/admin/services/admin.api";
import { formatEuDateTime } from "@/features/admin/utils/formatEuDateTime";
import { useSnackbar } from "@/lib/SnackbarContext";

const eurFmt = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });

function formatMoney(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? eurFmt.format(n) : String(v);
}

function orderStatusChipProps(status: string): { color: ChipProps["color"] } {
  const s = status.toLowerCase();
  if (s.includes("delivered")) return { color: "success" };
  if (s.includes("cancel") || s.includes("reject")) return { color: "error" };
  if (s.includes("draft")) return { color: "default" };
  if (s.includes("pending")) return { color: "warning" };
  if (s.includes("prep") || s.includes("accept") || s.includes("ready") || s.includes("ship")) return { color: "info" };
  return { color: "primary" };
}

function mergeOrdersById(a: AdminUserOrderRow[], b: AdminUserOrderRow[]): AdminUserOrderRow[] {
  const map = new Map<string, AdminUserOrderRow>();
  for (const o of a) map.set(o.id, o);
  for (const o of b) map.set(o.id, o);
  return Array.from(map.values()).sort((x, y) => {
    const tx = x.createdAt ? new Date(x.createdAt).getTime() : 0;
    const ty = y.createdAt ? new Date(y.createdAt).getTime() : 0;
    return ty - tx;
  });
}

export default function AdminUserDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSnackbar } = useSnackbar();
  const toast = showSnackbar as (payload: { message: string; severity: string }) => void;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [orders, setOrders] = useState<AdminUserOrderRow[]>([]);
  const [disabling, setDisabling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const uid = decodeURIComponent(id);
    setLoading(true);
    try {
      const u = await fetchAdminUserById(uid);
      setUser(u);
      const embedded = u?.orders && Array.isArray(u.orders) ? normalizeAdminUserOrdersPayload(u.orders) : [];
      const remote = await fetchAdminUserOrders(uid);
      setOrders(mergeOrdersById(embedded, remote));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = useMemo(() => {
    if (!user) return "";
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length ? parts.join(" ") : user.email;
  }, [user]);

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => {
      const st = String(o.status ?? "").toLowerCase();
      if (st.includes("draft")) return sum;
      const n = parseFloat(String(o.totalPrice ?? "").replace(",", "."));
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [orders]);

  const isDisabled = Boolean(user?.disabled);

  const handleDisable = async () => {
    if (!user) return;
    if (
      !window.confirm(
        "Disable this user? They will not be able to sign in until an administrator reverses this."
      )
    ) {
      return;
    }
    setDisabling(true);
    try {
      await postDisableUser(user.id);
      toast({ message: "User disabled.", severity: "success" });
      await load();
    } catch {
      toast({ message: "Could not disable user.", severity: "error" });
    } finally {
      setDisabling(false);
    }
  };

  const handleEnable = async () => {
    if (!user) return;
    setEnabling(true);
    try {
      await postEnableUser(user.id);
      toast({ message: "User enabled.", severity: "success" });
      await load();
    } catch {
      toast({ message: "Could not enable user.", severity: "error" });
    } finally {
      setEnabling(false);
    }
  };

  document.title = user?.email ? `Admin • ${user.email} • OpsEat` : "Admin • User • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  if (!user) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/admin/users")}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          Back to users
        </Button>
        <Typography color="text.secondary">User not found or you do not have access.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/admin/users")}
        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
      >
        Back to users
      </Button>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
      >
        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            {displayName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            {user.role ? <Chip size="small" label={user.role} variant="outlined" /> : null}
            <Chip
              size="small"
              label={user.isRestaurantUser ? "Restaurant user" : "Customer"}
              color={user.isRestaurantUser ? "info" : "default"}
            />
            {isDisabled ? <Chip size="small" label="Disabled" color="error" /> : null}
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {user.id}
            </Typography>
          </Stack>
        </Stack>
        <Button
          variant="outlined"
          color={isDisabled ? "success" : "error"}
          disabled={disabling || enabling}
          onClick={() => isDisabled ? void handleEnable() : void handleDisable()}
          sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, textTransform: "none", fontWeight: 700, borderRadius: 2 }}
        >
          {disabling ? "Disabling…" : enabling ? "Enabling…" : isDisabled ? "Enable user" : "Disable user"}
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Orders
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {orders.length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Total spent
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {eurFmt.format(totalSpent)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Excludes draft orders
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
            Orders
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Restaurant</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary" variant="body2">
                        No orders loaded for this user.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => (
                    <TableRow key={o.id} hover>
                      <TableCell>{formatEuDateTime(o.createdAt)}</TableCell>
                      <TableCell>{o.restaurant?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={o.status ?? "—"}
                          {...orderStatusChipProps(String(o.status ?? ""))}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">{formatMoney(o.totalPrice)}</TableCell>
                      <TableCell align="right">
                        <Link
                          href={`/order/${encodeURIComponent(o.id)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          sx={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.25 }}
                        >
                          Open
                          <OpenInNewRounded sx={{ fontSize: 16 }} />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Box>
        <Button variant="outlined" onClick={() => void load()} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
          Refresh
        </Button>
      </Box>
    </Stack>
  );
}
