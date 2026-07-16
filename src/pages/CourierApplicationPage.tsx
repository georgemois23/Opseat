import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
type VehicleType = "bike" | "car" | "scooter" | "other";

function normalizePartnerStatus(raw: any): PartnerApplicationStatus {
  const value = String(raw ?? "").toLowerCase();
  if (value.includes("accept") || value.includes("approved")) return "accepted";
  if (value.includes("reject") || value.includes("deny")) return "rejected";
  if (value.includes("pending") || value.includes("review") || value.includes("process")) return "pending";
  return "not_applied";
}

export default function CourierApplicationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [status, setStatus] = useState<PartnerApplicationStatus>("not_applied");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("bike");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  const readStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const candidates = [
        () => api.get("/couriers/partnership-status", { withCredentials: true }),
        () => api.get("/partner/courier/request/me", { withCredentials: true }),
        () => api.get("/auth/me", { withCredentials: true }),
      ];

      for (const call of candidates) {
        try {
          const res = await call();
          const payload = res?.data ?? {};
          if (typeof payload?.isCourrierUser === "boolean" && payload.isCourrierUser) {
            setStatus("accepted");
            return;
          }
          const rawStatus =
            payload?.status ??
            payload?.applicationStatus ??
            payload?.partnerStatus ??
            payload?.courierPartnerStatus ??
            null;
          if (rawStatus != null) {
            setStatus(normalizePartnerStatus(rawStatus));
            return;
          }
        } catch {
          // Try next endpoint variant.
        }
      }
      setStatus(user?.isCourrierUser ? "accepted" : "not_applied");
    } finally {
      setLoadingStatus(false);
    }
  }, [user?.isCourrierUser]);

  useEffect(() => {
    void readStatus();
  }, [readStatus]);

  const requestAccess = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const requests = [
        () =>
          api.post(
            "/couriers/request-partnership",
            {
              vehicleType,
              street: street.trim(),
              city: city.trim(),
              postalCode: postalCode.trim(),
              country: country.trim(),
            },
            { withCredentials: true }
          ),
        
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
          message: "Could not submit courier request.",
          severity: "error",
        });
        return;
      }

      (showSnackbar as (payload: { message: string; severity: string }) => void)({
        message: "Courier request submitted.",
        severity: "success",
      });
      await readStatus();
      if (status === "not_applied") setStatus("pending");
    } finally {
      setRequesting(false);
    }
  }, [city, country, postalCode, readStatus, requesting, showSnackbar, status, street, vehicleType]);

  const statusMeta = useMemo(() => {
    if (status === "accepted") {
      return {
        label: "Accepted",
        color: "success" as const,
        icon: <CheckCircleRounded color="success" />,
        message: "Your courier application is approved.",
      };
    }
    if (status === "pending") {
      return {
        label: "In review",
        color: "warning" as const,
        icon: <HourglassTopRounded color="warning" />,
        message: "Your courier request is being reviewed.",
      };
    }
    if (status === "rejected") {
      return {
        label: "Needs update",
        color: "error" as const,
        icon: <ErrorOutlineRounded color="error" />,
        message: "Your previous courier request was not approved. You can submit a new application.",
      };
    }
    return {
      label: "Not applied",
      color: "default" as const,
      icon: <HourglassTopRounded color="disabled" />,
      message: "Submit your request to become a courier partner.",
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
              Courier application
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Apply once and track your courier partnership status here.
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

            {canRequest && (
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Application details
                </Typography>
                <TextField
                  select
                  label="Vehicle type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  size="small"
                >
                  <MenuItem value="bike">Bike</MenuItem>
                  <MenuItem value="car">Car</MenuItem>
                  <MenuItem value="scooter">Scooter</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                <TextField
                  label="Street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  size="small"
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <TextField
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <TextField
                    label="Postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  size="small"
                />
              </Stack>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              {canRequest && (
                <Button
                  variant="contained"
                  onClick={() => void requestAccess()}
                  disabled={requesting}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {requesting ? "Submitting request..." : "Request to be a courier"}
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
