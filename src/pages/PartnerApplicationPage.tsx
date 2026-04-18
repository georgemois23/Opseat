import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import HourglassTopRounded from "@mui/icons-material/HourglassTopRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSnackbar } from "@/lib/SnackbarContext";

type PartnerApplicationStatus = "not_applied" | "pending" | "accepted" | "rejected";

function normalizePartnerStatus(raw: any): PartnerApplicationStatus {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("accept") || value.includes("approved")) return "accepted";
  if (value.includes("reject") || value.includes("deny")) return "rejected";
  if (value.includes("pending") || value.includes("review") || value.includes("process")) return "pending";
  return "not_applied";
}

export default function PartnerApplicationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [status, setStatus] = useState<PartnerApplicationStatus>("not_applied");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const readStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const candidates = [
        () => api.get("/restaurant-user/partnership-status", { withCredentials: true }),
        () => api.get("/partner/request/me", { withCredentials: true }),
        () => api.get("/auth/me", { withCredentials: true }),
      ];

      for (const call of candidates) {
        try {
          const res = await call();
          const payload = res?.data ?? {};
          if (typeof payload?.isRestaurantUser === "boolean" && payload.isRestaurantUser) {
            setStatus("accepted");
            return;
          }
          const rawStatus =
            payload?.status ??
            payload?.applicationStatus ??
            payload?.partnerStatus ??
            payload?.restaurantPartnerStatus ??
            null;
          if (rawStatus != null) {
            setStatus(normalizePartnerStatus(rawStatus));
            return;
          }
        } catch {
          // Try next endpoint variant.
        }
      }
      setStatus(user?.isRestaurantUser ? "accepted" : "not_applied");
    } finally {
      setLoadingStatus(false);
    }
  }, [user?.isRestaurantUser]);

  useEffect(() => {
    void readStatus();
  }, [readStatus]);

  const requestAccess = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const requests = [
        () => api.post("/restaurant-user/request-partnership", { withCredentials: true }),
      ];

      let ok = false;
      for (const call of requests) {
        try {
          await call();
          ok = true;
          break;
        } catch {
          // Try next endpoint variant.
        }
      }

      if (!ok) {
        (showSnackbar as (payload: { message: string; severity: string }) => void)({
          message: "Could not submit partner request.",
          severity: "error",
        });
        return;
      }

      (showSnackbar as (payload: { message: string; severity: string }) => void)({
        message: "Partner request submitted.",
        severity: "success",
      });
      await readStatus();
      if (status === "not_applied") setStatus("pending");
    } finally {
      setRequesting(false);
    }
  }, [readStatus, requesting, showSnackbar, status]);

  const statusMeta = useMemo(() => {
    if (status === "accepted") {
      return {
        label: "Accepted",
        color: "success" as const,
        icon: <CheckCircleRounded color="success" />,
        message: "Your application is approved. You can now create your first restaurant.",
      };
    }
    if (status === "pending") {
      return {
        label: "In review",
        color: "warning" as const,
        icon: <HourglassTopRounded color="warning" />,
        message: "Your request is being reviewed. We will unlock restaurant creation once approved.",
      };
    }
    if (status === "rejected") {
      return {
        label: "Needs update",
        color: "error" as const,
        icon: <ErrorOutlineRounded color="error" />,
        message: "Your previous request was not approved. You can submit a new application.",
      };
    }
    return {
      label: "Not applied",
      color: "default" as const,
      icon: <HourglassTopRounded color="disabled" />,
      message: "Submit your request to become a restaurant owner partner.",
    };
  }, [status]);

  const canRequest = status === "not_applied" || status === "rejected";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/become-partner")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back
        </Button>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
              Restaurant owner application
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Apply once and track your status here. Restaurant creation becomes available after approval.
            </Typography>

            {loadingStatus ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Checking application status...
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                {statusMeta.icon}
                <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
              </Stack>
            )}

            {!loadingStatus && <Alert severity={status === "accepted" ? "success" : status === "rejected" ? "error" : "info"}>{statusMeta.message}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              {canRequest && (
                <Button
                  variant="contained"
                  onClick={() => void requestAccess()}
                  disabled={requesting}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {requesting ? "Submitting request..." : "Request to be a restaurant owner"}
                </Button>
              )}
              {status === "accepted" && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate("/restaurant/create")}
                  sx={{ textTransform: "none", fontWeight: 800, borderRadius: 2 }}
                >
                  Create your first restaurant
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => void readStatus()}
                disabled={loadingStatus}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Refresh status
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
