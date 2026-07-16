import React, { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TextField, Button, Typography, Box, Alert, Stack, CircularProgress, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AuthLayout from "@/features/auth/components/AuthLayout";
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
    <AuthLayout>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Join OpsEat to order in minutes and track every delivery.
        </Typography>
      </Stack>

      {error ? (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
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
          sx={{ mt: 3, py: 1.35, borderRadius: 2, textTransform: "none", fontWeight: 800, boxShadow: "none" }}
        >
          {isAuthenticating ? <CircularProgress size={22} color="inherit" /> : "Create account"}
        </Button>
      </Box>

      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 3 }}>
        Already have an account?{" "}
        <Box
          component="span"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/login")}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate("/login");
          }}
          sx={{
            cursor: "pointer",
            fontWeight: 800,
            color: theme.palette.primary.light,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Log in
        </Box>
      </Typography>
    </AuthLayout>
  );
}
