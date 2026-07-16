import React, { useCallback, useEffect, useState } from "react";
import {
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
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { useNavigate } from "react-router-dom";
import { fetchAdminRestaurants, type AdminRestaurantRow } from "@/features/admin/services/admin.api";

export default function AdminRestaurantsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<AdminRestaurantRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRestaurants(await fetchAdminRestaurants());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  document.title = "Admin • Restaurants • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={800}>
        All restaurants
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Open a row for admin details, or the public menu in a new tab.
      </Typography>
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
              <TableCell align="right">Actions</TableCell>
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
                <TableRow
                  key={r.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/admin/restaurant/${encodeURIComponent(r.id)}`)}
                >
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
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                      <Button
                        size="small"
                        endIcon={<ChevronRightRounded sx={{ fontSize: 18 }} />}
                        onClick={() => navigate(`/admin/restaurant/${encodeURIComponent(r.id)}`)}
                        sx={{ textTransform: "none" }}
                      >
                        Admin
                      </Button>
                      {r.slug ? (
                        <Button
                          size="small"
                          endIcon={<OpenInNewRounded sx={{ fontSize: 16 }} />}
                          onClick={() => window.open(`/restaurant/${encodeURIComponent(r.slug!)}`, "_blank")}
                          sx={{ textTransform: "none" }}
                        >
                          Menu
                        </Button>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
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
