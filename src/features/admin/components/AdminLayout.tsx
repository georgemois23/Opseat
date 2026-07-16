import React, { useCallback } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const NAV: { path: string; label: string; isActive: (pathname: string) => boolean }[] = [
  { path: "/admin", label: "Overview", isActive: (p) => p === "/admin" || p === "/admin/" },
  {
    path: "/admin/restaurants",
    label: "Restaurants",
    isActive: (p) => p === "/admin/restaurants" || /^\/admin\/restaurant\/[^/]+/.test(p),
  },
  {
    path: "/admin/users",
    label: "Users",
    isActive: (p) => p === "/admin/users" || /^\/admin\/user\/[^/]+/.test(p),
  },
  { path: "/admin/applications", label: "Applications", isActive: (p) => p === "/admin/applications" },
];

export default function AdminLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const normalized = pathname.replace(/\/$/, "") || "/";

  const navActive = useCallback(
    (item: (typeof NAV)[number]) => item.isActive(normalized),
    [normalized]
  );

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
        Admin
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 640 }}>
        Manage restaurants, users, and restaurant partner applications.
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
        sx={{
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        }}
      >
        {NAV.map((item) => {
          const active = navActive(item);
          return (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              variant={active ? "contained" : "outlined"}
              color={active ? "primary" : "inherit"}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                borderColor: active ? undefined : alpha(theme.palette.primary.main, 0.35),
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ width: "100%" }}>
        <Outlet />
      </Box>
    </Container>
  );
}
