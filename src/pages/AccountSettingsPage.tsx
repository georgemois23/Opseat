import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { useAuth } from "@/features/auth/hooks/useAuth";

function errorText(err: unknown, fallback: string): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? fallback;
  return typeof msg === "string" ? msg : fallback;
}

export default function AccountSettingsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const isGoogleAccount = user?.provider === "Google";

  // --- Profile form ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.first_name, user?.last_name, user?.email]);

  const profileDirty = useMemo(
    () =>
      firstName !== (user?.first_name ?? "") ||
      lastName !== (user?.last_name ?? "") ||
      email !== (user?.email ?? ""),
    [firstName, lastName, email, user?.first_name, user?.last_name, user?.email]
  );

  const handleSaveProfile = async () => {
    if (savingProfile || !profileDirty) return;
    setProfileMsg(null);
    if (!email.trim()) {
      setProfileMsg({ type: "error", text: "Email cannot be empty." });
      return;
    }
    setSavingProfile(true);
    try {
      await api.patch("/auth/profile", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      await refreshUser();
      setProfileMsg({ type: "success", text: "Profile updated." });
    } catch (err) {
      setProfileMsg({ type: "error", text: errorText(err, "Could not update profile.") });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Password form ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // Keep the current-password field read-only until focused so browsers don't autofill the saved login.
  const [currentPwEditable, setCurrentPwEditable] = useState(false);

  const handleChangePassword = async () => {
    if (savingPassword) return;
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password updated." });
    } catch (err) {
      setPasswordMsg({ type: "error", text: errorText(err, "Could not change password.") });
    } finally {
      setSavingPassword(false);
    }
  };

  const cardSx = {
    borderRadius: 2.5,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
    bgcolor: alpha(theme.palette.background.paper, 0.6),
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate(-1)}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back
        </Button>
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 3 }}>
        Account settings
      </Typography>

      <Stack spacing={2.5}>
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
                <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                  Profile
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Stack>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {profileMsg && <Alert severity={profileMsg.type}>{profileMsg.text}</Alert>}

              <Box>
                <Button
                  variant="contained"
                  onClick={() => void handleSaveProfile()}
                  disabled={savingProfile || !profileDirty}
                  startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {isGoogleAccount ? (
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GoogleIcon sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
                  <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                    Sign-in
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  You signed in with Google, so there is no password to change here. Manage your
                  password through your Google account.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
        <Card elevation={0} sx={cardSx}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LockRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
                <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
                  Password
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Enter your current password, then choose a new one (at least 6 characters).
              </Typography>

              <TextField
                fullWidth
                type="password"
                label="Current password"
                name="opseat-current-password"
                value={currentPassword}
                onFocus={() => setCurrentPwEditable(true)}
                onChange={(e) => setCurrentPassword(e.target.value)}
                inputProps={{
                  autoComplete: "off",
                  readOnly: !currentPwEditable,
                  "data-lpignore": "true",
                  "data-1p-ignore": "true",
                }}
              />
              <Divider />
              <TextField
                fullWidth
                type="password"
                label="New password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {passwordMsg && <Alert severity={passwordMsg.type}>{passwordMsg.text}</Alert>}

              <Box>
                <Button
                  variant="contained"
                  onClick={() => void handleChangePassword()}
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  startIcon={savingPassword ? <CircularProgress size={16} color="inherit" /> : undefined}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {savingPassword ? "Updating..." : "Update password"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        )}
      </Stack>
    </Container>
  );
}
