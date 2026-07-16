import React, { useCallback, useEffect, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import { useNavigate } from "react-router-dom";
import {
  fetchAdminPartnerApplications,
  fetchAdminRestaurants,
  fetchAdminUsers,
} from "@/features/admin/services/admin.api";

export default function AdminOverviewPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ restaurants: 0, users: 0, applications: 0 });
  const [pendingApplications, setPendingApplications] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [restaurants, users, applications] = await Promise.all([
        fetchAdminRestaurants(),
        fetchAdminUsers(),
        fetchAdminPartnerApplications(),
      ]);
      const pending = applications.filter((a) => {
        const s = String(a.applicationStatus ?? "").toLowerCase();
        return s.includes("pending") || s.includes("review") || !a.applicationStatus;
      }).length;
      setCounts({
        restaurants: restaurants.length,
        users: users.length,
        applications: applications.length,
      });
      setPendingApplications(pending);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  document.title = "Admin • Overview • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
        Quick counts and shortcuts. Open each section for full lists and actions.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Card
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 2.5,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin/restaurants")}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <StorefrontRounded color="primary" />
              <Typography fontWeight={800}>Restaurants</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={800}>
              {counts.restaurants}
            </Typography>
            <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => navigate("/admin/restaurants")}>
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
          onClick={() => navigate("/admin/users")}
        >
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PeopleRounded color="primary" />
              <Typography fontWeight={800}>Users</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={800}>
              {counts.users}
            </Typography>
            <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => navigate("/admin/users")}>
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
          onClick={() => navigate("/admin/applications")}
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
              {counts.applications}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Pending (estimate): {pendingApplications}
            </Typography>
            <Button size="small" sx={{ mt: 1, textTransform: "none" }} onClick={() => navigate("/admin/applications")}>
              Review
            </Button>
          </CardContent>
        </Card>
      </Stack>
      <Button variant="outlined" onClick={() => void load()} sx={{ alignSelf: "flex-start", borderRadius: 2 }}>
        Refresh data
      </Button>
    </Stack>
  );
}
