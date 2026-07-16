import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChipProps } from "@mui/material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
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
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { fetchAdminRestaurantById, type AdminRestaurantDetail } from "@/features/admin/services/admin.api";
import { formatEuDateTime } from "@/features/admin/utils/formatEuDateTime";
import { CustomerOrderItemsList } from "@/features/customer/components/CustomerOrderDetails";
import { parseOrderLineItemsForDisplay } from "@/features/restaurants/types/customerOrder.types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}

function str(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  return "—";
}

const eurFmt = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });

function formatMoney(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? eurFmt.format(n) : String(v);
}

/** Normalise `/menu/:id` or `restaurant.menus` into an array of menu roots for name lookup. */
function normalizeMenusForLookup(data: unknown): unknown[] {
  if (Array.isArray(data) && data.length > 0) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.menus) && d.menus.length > 0) return d.menus;
    if (Array.isArray(d.categories) && d.categories.length > 0) {
      return [{ id: "single", name: "", categories: d.categories, active: true }];
    }
  }
  return [];
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

export default function AdminRestaurantDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<AdminRestaurantDetail | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchAdminRestaurantById(decodeURIComponent(id));
      if (!data) {
        setRestaurant(null);
        return;
      }
      let menus = normalizeMenusForLookup(data.menus);
      if (menus.length === 0 && data.id) {
        try {
          const mn = await api.get(`/menu/${data.id}`, { withCredentials: true });
          menus = normalizeMenusForLookup(mn.data);
        } catch {
          /* ignore */
        }
      }
      if (menus.length === 0 && data.slug) {
        try {
          const det = await api.get(`/restaurants/details/${encodeURIComponent(data.slug)}`, {
            withCredentials: true,
          });
          const payload = det.data as Record<string, unknown> | undefined;
          menus = normalizeMenusForLookup(payload?.menus ?? payload);
        } catch {
          /* ignore */
        }
      }
      setRestaurant({
        ...data,
        menus: menus.length > 0 ? (menus as AdminRestaurantDetail["menus"]) : data.menus,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const r = restaurant;
  const slug = r?.slug;

  const staffRows = useMemo(() => {
    if (!r?.staff || !Array.isArray(r.staff)) return [];
    return r.staff.map((row, i) => {
      const s = asRecord(row);
      const u = asRecord(s?.user);
      return {
        key: str(s?.id) || `staff-${i}`,
        email: str(u?.email),
        name: [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—",
        role: str(s?.role),
        applicationStatus: str(s?.applicationStatus),
        createdAt: s?.createdAt,
      };
    });
  }, [r?.staff]);

  const scheduleRows = useMemo(() => {
    if (!r?.schedules || !Array.isArray(r.schedules)) return [];
    return [...r.schedules]
      .map((row, i) => {
        const s = asRecord(row);
        const dow = typeof s?.dayOfWeek === "number" ? s.dayOfWeek : parseInt(String(s?.dayOfWeek ?? i), 10);
        const label = WEEKDAYS[dow] ?? `Day ${str(s?.dayOfWeek)}`;
        return {
          key: str(s?.id) || `sch-${i}`,
          label,
          dow: Number.isFinite(dow) ? dow : 99,
          open: str(s?.openTime),
          close: str(s?.closeTime),
          closed: Boolean(s?.isClosed),
        };
      })
      .sort((a, b) => a.dow - b.dow);
  }, [r?.schedules]);

  const orderRows = useMemo(() => {
    const raw = r?.order ?? r?.orders;
    if (!Array.isArray(raw)) return [];
    const rows = raw
      .map((row) => asRecord(row))
      .filter(Boolean) as Record<string, unknown>[];
    return rows
      .map((o) => {
        const cust = asRecord(o.customer);
        const itemsRaw = o.items;
        const displayItems = parseOrderLineItemsForDisplay(itemsRaw, r?.menus);
        const created = o.createdAt;
        const t = typeof created === "string" || typeof created === "number" ? new Date(created).getTime() : 0;
        return {
          id: str(o.id),
          status: str(o.status),
          customerEmail: str(cust?.email),
          total: o.totalPrice,
          deliveryType: str(o.deliveryType),
          itemCount: displayItems.length,
          displayItems,
          itemsRaw,
          createdAt: o.createdAt,
          placedAt: o.placedAt,
          estimatedDeliveryTime: o.estimatedDeliveryTime,
          sort: t,
        };
      })
      .sort((a, b) => b.sort - a.sort);
  }, [r?.order, r?.orders, r?.menus]);

  const categories = useMemo(() => {
    if (!r?.categories || !Array.isArray(r.categories)) return [];
    return r.categories.map((c) => String(c));
  }, [r?.categories]);

  document.title = r?.name ? `Admin • ${r.name} • OpsEat` : "Admin • Restaurant • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  if (!r) {
    return (
      <Stack spacing={2}>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/admin/restaurants")}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          Back to restaurants
        </Button>
        <Typography color="text.secondary">Restaurant not found or you do not have access.</Typography>
      </Stack>
    );
  }

  const addressLine = [r.street, [r.postalCode, r.city].filter(Boolean).join(" "), r.country].filter(Boolean).join(" · ");

  return (
    <Stack spacing={2.5}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/admin/restaurants")}
        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
      >
        Back to restaurants
      </Button>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-start" }}>
        {r.imageUrl ? (
          <Box
            component="img"
            src={r.imageUrl}
            alt=""
            sx={{
              width: { xs: "100%", md: 280 },
              maxHeight: 200,
              objectFit: "cover",
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            }}
          />
        ) : null}
        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            {r.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {addressLine || "—"}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            <Chip size="small" label={r.isDelivering ? "Delivering" : "Paused"} color={r.isDelivering ? "success" : "default"} />
            {r.publicId != null ? (
              <Chip size="small" variant="outlined" label={`Public ID ${r.publicId}`} />
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {r.id}
            </Typography>
          </Stack>
          {slug ? (
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
              onClick={() => window.open(`/restaurant/${encodeURIComponent(slug)}`, "_blank")}
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
            >
              Public menu
            </Button>
          ) : null}
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Total orders
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {r.totalOrders ?? orderRows.length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Total revenue
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatMoney(r.totalRevenue)}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Minimum order
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatMoney(r.minimumOrderAmount)}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: "1 1 140px", borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}` }}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Delivery radius
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {r.deliveryRadius != null ? `${r.deliveryRadius} km` : "—"}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
            Location
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Address:</strong> {addressLine || "—"}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
              <strong>Coordinates:</strong> {r.latitude ?? "—"}, {r.longitude ?? "—"}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {categories.length > 0 ? (
        <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
              Categories
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {categories.map((c) => (
                <Chip key={c} size="small" label={c.replace(/_/g, " ")} sx={{ textTransform: "capitalize" }} />
              ))}
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
            Staff
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Application</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary" variant="body2">
                        No staff.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  staffRows.map((s) => (
                    <TableRow key={s.key}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{s.role}</TableCell>
                      <TableCell>{s.applicationStatus}</TableCell>
                      <TableCell>{formatEuDateTime(s.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
            Opening hours
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Day</TableCell>
                  <TableCell>Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography color="text.secondary" variant="body2">
                        No schedule.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  scheduleRows.map((s) => (
                    <TableRow key={s.key}>
                      <TableCell>{s.label}</TableCell>
                      <TableCell>
                        {s.closed ? (
                          <Chip size="small" label="Closed" />
                        ) : (
                          `${s.open} – ${s.close}`
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.9)}` }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
            Orders ({orderRows.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Click a row to expand line items.
          </Typography>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={48} />
                  <TableCell>Status</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Items</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Placed</TableCell>
                  <TableCell>ETA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="text.secondary" variant="body2">
                        No orders.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orderRows.map((o) => {
                    const open = expandedOrderId === o.id;
                    const chip = orderStatusChipProps(o.status);
                    return (
                      <React.Fragment key={o.id}>
                        <TableRow
                          hover
                          selected={open}
                          onClick={() => setExpandedOrderId((prev) => (prev === o.id ? null : o.id))}
                          sx={{ cursor: "pointer", "& > *": { borderBottom: open ? "none" : undefined } }}
                        >
                          <TableCell sx={{ fontSize: "1rem", color: "text.secondary", userSelect: "none" }}>
                            {open ? "▼" : "▶"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={o.status}
                              color={chip.color}
                              variant={chip.color === "default" ? "outlined" : "filled"}
                              sx={{ textTransform: "capitalize", fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 160 }}>{o.customerEmail}</TableCell>
                          <TableCell align="right">{formatMoney(o.total)}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>{o.deliveryType}</TableCell>
                          <TableCell align="right">{o.itemCount}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>{formatEuDateTime(o.createdAt)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>{formatEuDateTime(o.placedAt)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>{formatEuDateTime(o.estimatedDeliveryTime)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={9} sx={{ py: 0, borderBottom: open ? undefined : "none" }}>
                            <Collapse in={open} timeout="auto" unmountOnExit>
                              <Box
                                sx={{
                                  py: 1.5,
                                  px: 1,
                                  mb: 1,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                                  border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                                }}
                              >
                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                  Order items
                                </Typography>
                                {o.displayItems.length === 0 ? (
                                  <Typography variant="body2" color="text.secondary">
                                    No line items.
                                  </Typography>
                                ) : (
                                  <CustomerOrderItemsList items={o.displayItems} />
                                )}
                                {Array.isArray(o.itemsRaw) && o.itemsRaw.length > 0 ? (
                                  <Accordion
                                    disableGutters
                                    elevation={0}
                                    sx={{
                                      mt: 1.5,
                                      bgcolor: "transparent",
                                      "&:before": { display: "none" },
                                    }}
                                  >
                                    <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ minHeight: 40, px: 0 }}>
                                      <Typography variant="caption" fontWeight={800} color="text.secondary">
                                        Exact API payload (items)
                                      </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ px: 0, pt: 0 }}>
                                      <Box
                                        component="pre"
                                        sx={{
                                          m: 0,
                                          p: 1.25,
                                          borderRadius: 1,
                                          bgcolor: alpha(theme.palette.common.black, 0.22),
                                          fontSize: "0.7rem",
                                          overflow: "auto",
                                          maxHeight: 280,
                                        }}
                                      >
                                        {JSON.stringify(o.itemsRaw, null, 2)}
                                      </Box>
                                    </AccordionDetails>
                                  </Accordion>
                                ) : null}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* {r.menus != null && Array.isArray(r.menus) && r.menus.length > 0 ? (
        <Accordion
          elevation={0}
          sx={{
            borderRadius: "8px !important",
            border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreRounded />}>
            <Typography fontWeight={800}>Menus (full JSON)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.common.black, 0.2),
                fontSize: "0.75rem",
                overflow: "auto",
                maxHeight: 360,
              }}
            >
              {JSON.stringify(r.menus, null, 2)}
            </Box>
          </AccordionDetails>
        </Accordion>
      ) : null} */}
    </Stack>
  );
}
