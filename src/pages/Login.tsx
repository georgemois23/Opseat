import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/features/auth/components/AuthLayout";
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
    <AuthLayout>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Log in to order from restaurants near you.
        </Typography>
      </Stack>

      {error ? (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
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
          sx={{ mt: 3, py: 1.35, borderRadius: 2, textTransform: "none", fontWeight: 800, boxShadow: "none" }}
        >
          {isAuthenticating ? <CircularProgress size={22} color="inherit" /> : "Log in"}
        </Button>
      </Box>

      <Divider sx={{ my: 2.5, color: "text.secondary", fontSize: "0.8rem" }}>or</Divider>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={() => loginWithGoogle()}
        disabled={isAuthenticating}
        sx={{
          py: 1.15,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 700,
          color: "text.primary",
          borderColor: alpha(theme.palette.common.white, 0.2),
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
        <Box
          component="span"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/signup")}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/signup");
          }}
          sx={{
            cursor: "pointer",
            fontWeight: 800,
            color: theme.palette.primary.light,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Sign up
        </Box>
      </Typography>
    </AuthLayout>
  );
}
