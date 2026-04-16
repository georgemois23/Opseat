import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import opseatLogo from "@/assets/logos/opseat.svg";
import { formatAuthError } from "@/lib/formatAuthError";

export default function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticating } = useAuth();

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

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await login(email.trim(), password);
      navigate("/home");
    } catch (err: unknown) {
      setError(formatAuthError(err, "Login failed. Please check your credentials."));
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
            Welcome back
          </Typography>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" align="center">
            Log in
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 320 }}>
            Sign in to order from restaurants near you.
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={isAuthenticating}
            sx={fieldSx}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            disabled={isAuthenticating || !email.trim() || !password}
            sx={{
              mt: 3,
              py: 1.35,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
            }}
          >
            {isAuthenticating ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
          </Button>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={() => loginWithGoogle()}
          disabled={isAuthenticating}
          sx={{
            mt: 2,
            py: 1.15,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            borderColor: alpha(theme.palette.common.white, 0.2),
            color: alpha(theme.palette.text.primary, 0.9),
            bgcolor: alpha(theme.palette.common.white, 0.04),
            "&:hover": {
              borderColor: alpha(theme.palette.primary.main, 0.45),
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          Continue with Google
        </Button>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Don&apos;t have an account?{" "}
          <Button
            variant="text"
            onClick={() => navigate("/signup")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: alpha(theme.palette.secondary.main, 0.95),
              "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
            }}
          >
            Sign up
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
