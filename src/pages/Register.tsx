import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Paper, TextField, Button, Typography, Box, Alert, Stack, CircularProgress, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import opseatLogo from "@/assets/logos/opseat.svg";
import { formatAuthError } from "@/lib/formatAuthError";

export default function Register() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register, isAuthenticating } = useAuth();

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: alpha(theme.palette.common.white, 0.04),
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.primary.main, 0.35),
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstname.trim() || !lastname.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please fill in email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await register(email.trim(), password, firstname.trim(), lastname.trim());
      navigate("/home");
    } catch (err: unknown) {
      setError(formatAuthError(err, "Sign up failed. Please check your details and try again."));
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        bgcolor: "background.default",
        backgroundImage: `radial-gradient(ellipse 120% 80% at 50% -20%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 55%),
          radial-gradient(ellipse 80% 50% at 100% 100%, ${alpha(theme.palette.secondary.main, 0.08)}, transparent 50%)`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.88),
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.35)}`,
        }}
      >
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box
            component="img"
            src={opseatLogo}
            alt="OpsEat"
            sx={{ height: 48, width: 48, borderRadius: 2 }}
          />
          <Typography
            variant="overline"
            sx={{
              letterSpacing: "0.14em",
              fontWeight: 700,
              color: alpha(theme.palette.secondary.main, 0.95),
            }}
          >
            New here
          </Typography>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" align="center">
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 320 }}>
            Join OpsEat to save addresses and order faster.
          </Typography>
        </Stack>

        {error ? (
          <Alert
            severity="error"
            role="alert"
            sx={{
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.12),
              border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
              color: "text.primary",
              "& .MuiAlert-icon": { color: theme.palette.error.light },
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              label="First name"
              type="text"
              autoComplete="given-name"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              margin="dense"
              disabled={isAuthenticating}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              label="Last name"
              type="text"
              autoComplete="family-name"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
              margin="dense"
              disabled={isAuthenticating}
              sx={fieldSx}
            />
          </Stack>
          <TextField
            fullWidth
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={isAuthenticating}
            sx={fieldSx}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={isAuthenticating}
            helperText="At least 6 characters"
            sx={fieldSx}
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={
              isAuthenticating ||
              !email.trim() ||
              !password ||
              !firstname.trim() ||
              !lastname.trim()
            }
            sx={{
              mt: 3,
              py: 1.35,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            {isAuthenticating ? <CircularProgress size={22} color="inherit" /> : "Create account"}
          </Button>
        </Box>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Already have an account?{" "}
          <Button
            variant="text"
            onClick={() => navigate("/login")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: alpha(theme.palette.secondary.main, 0.95),
              "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
            }}
          >
            Log in
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
