import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { useNavigate } from "react-router-dom";
import {
  approvePartnerApplication,
  fetchAdminPartnerApplications,
  fetchAdminRestaurants,
  fetchAdminUsers,
  rejectPartnerApplication,
  type AdminPartnerApplicationRow,
  type AdminRestaurantRow,
  type AdminUserRow,
} from "@/features/admin/services/admin.api";
import { useSnackbar } from "@/lib/SnackbarContext";

type TabKey = "overview" | "restaurants" | "users" | "partners";

/** EU-style date/time: dd/mm/yyyy, 24h-style local time (en-GB). Handles ISO strings and Unix s/ms. */
function formatEuDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  let d: Date | null = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    d = value;
  } else if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value < 1e12 ? value * 1000 : value;
    d = new Date(ms);
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      const ms = trimmed.length <= 10 ? n * 1000 : n;
      d = new Date(ms);
    } else {
      const parsed = Date.parse(trimmed);
      if (!Number.isNaN(parsed)) d = new Date(parsed);
    }
  }
  if (!d || Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export default function AdminDashboardPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<AdminRestaurantRow[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [applications, setApplications] = useState<AdminPartnerApplicationRow[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, u, p] = await Promise.all([
        fetchAdminRestaurants(),
        fetchAdminUsers(),
        fetchAdminPartnerApplications(),
      ]);
      setRestaurants(r);
      setUsers(u);
      setApplications(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const toast = showSnackbar as (payload: { message: string; severity: string }) => void;

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      const ok = await approvePartnerApplication(id);
      toast({
        message: ok ? "Application approved." : "Could not approve (check API route).",
        severity: ok ? "success" : "error",
      });
      if (ok) await loadAll();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try {
      const ok = await rejectPartnerApplication(id);
      toast({
        message: ok ? "Application rejected." : "Could not reject (check API route).",
        severity: ok ? "success" : "error",
      });
      if (ok) await loadAll();
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = applications.filter((a) => {
    const s = String(a.status ?? "").toLowerCase();
    return s.includes("pending") || s.includes("review") || !a.status;
  }).length;

  document.title = "Admin • OpsEat";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/home")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back to home
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 0.5 }}>
        Admin dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 640 }}>
        Manage restaurants, users, and restaurant-owner applications. Endpoints are resolved automatically when your
        backend exposes them under common paths.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
          }}
        >
          <Tab label="Overview" value="overview" />
          <Tab label={`Restaurants (${restaurants.length})`} value="restaurants" />
          <Tab label={`Users (${users.length})`} value="users" />
          <Tab label={`Restaurant applications (${applications.length})`} value="partners" />
        </Tabs>
      </Box>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress size={36} />
        </Stack>
      ) : (
        <>
          {tab === "overview" && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Card
                  elevation={0}
                  sx={{
                    flex: 1,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                    cursor: "pointer",
                  }}
                  onClick={() => setTab("restaurants")}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <StorefrontRounded color="primary" />
                      <Typography fontWeight={800}>Restaurants</Typography>
                    </Stack>
                    <Typography variant="h3" fontWeight={800}>
                      {restaurants.length}
                    </Typography>
                    <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => setTab("restaurants")}>
                      View list
                    </Button>
                  </CardContent>
                </Card>
                <Card
                  elevation={0}
                  sx={{
                    flex: 1,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                    cursor: "pointer",
                  }}
                  onClick={() => setTab("users")}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <PeopleRounded color="primary" />
                      <Typography fontWeight={800}>Users</Typography>
                    </Stack>
                    <Typography variant="h3" fontWeight={800}>
                      {users.length}
                    </Typography>
                    <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => setTab("users")}>
                      View list
                    </Button>
                  </CardContent>
                </Card>
                <Card
                  elevation={0}
                  sx={{
                    flex: 1,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                    cursor: "pointer",
                  }}
                  onClick={() => setTab("partners")}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <AssignmentRounded color="primary" />
                      <Box>
                        <Typography fontWeight={800}>Restaurant applications</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Become a restaurant partner
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="h3" fontWeight={800}>
                      {applications.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Pending (estimate): {pendingCount}
                    </Typography>
                    <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => setTab("partners")}>
                      Review
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
              <Button variant="outlined" onClick={() => void loadAll()} sx={{ alignSelf: "flex-start", borderRadius: 2 }}>
                Refresh data
              </Button>
            </Stack>
          )}

          {tab === "restaurants" && (
            <TableContainer
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {restaurants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography color="text.secondary">No restaurants loaded.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    restaurants.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.slug ?? "—"}</TableCell>
                        <TableCell>{r.city ?? "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.isDelivering ? "Delivering" : "Paused"}
                            color={r.isDelivering ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {r.slug ? (
                            <Button
                              size="small"
                              endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
                              onClick={() => window.open(`/restaurant/${encodeURIComponent(r.slug!)}`, "_blank")}
                              sx={{ textTransform: "none" }}
                            >
                              Menu
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === "users" && (
            <TableContainer
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Restaurant user</TableCell>
                    <TableCell>ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No users loaded.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id} hover>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role ?? "—"}</TableCell>
                        <TableCell>{u.isRestaurantUser ? "Yes" : "No"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{u.id}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tab === "partners" && (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                  Restaurant partner applications
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
                  Review requests from users who want to list and run a restaurant on OpsEat (not courier or other
                  partner types).
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
                            <Chip size="small" label={a.applicationStatus ?? "pending"} color={isFinal ? "default" : "warning"} />
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
                                onClick={() => void handleApprove(a.id)}
                                sx={{ textTransform: "none" }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                disabled={busy || isFinal}
                                onClick={() => void handleReject(a.id)}
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
            </Stack>
          )}
        </>
      )}
    </Container>
  );
}
