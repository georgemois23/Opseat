import { isBackendHealthy } from "@/lib/backendHealth";
import opseat from "@/assets/logos/opseat.svg";
import {
  alpha,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import React, { useEffect, useRef, useState } from "react";

const RECHECK_SECONDS = 6;

export default function BackendWakeDialog() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [showWakeModal, setShowWakeModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RECHECK_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const clearTimer = () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (elapsedRef.current != null) {
        window.clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };

    const startCountdown = () => {
      clearTimer();
      setSecondsLeft(RECHECK_SECONDS);
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) return RECHECK_SECONDS;
          return prev - 1;
        });
      }, 1000);
      elapsedRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    };

    const probe = async () => {
      const ok = await isBackendHealthy();
      if (cancelled) return;
      if (ok) {
        setReady(true);
        setShowWakeModal(false);
        setDismissed(false);
        clearTimer();
        return;
      }
      setShowWakeModal(true);
      if (timerRef.current == null) startCountdown();
    };

    void probe();
    const healthPoll = window.setInterval(() => {
      void probe();
    }, RECHECK_SECONDS * 1000);

    return () => {
      cancelled = true;
      clearTimer();
      window.clearInterval(healthPoll);
    };
  }, []);

  const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <Dialog
      open={!ready && showWakeModal && !dismissed}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(2, 6, 23, 0.82)",
          backdropFilter: "blur(2px)",
          boxShadow: "none",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: alpha(theme.palette.background.default, 0.98),
          border: "1px solid rgba(59, 130, 246, 0.34)",
          // boxShadow: "0 20px 56px rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
        },
      }}
    >
      <DialogContent sx={{
    backgroundColor: alpha(theme.palette.background.default, 0.98),
    position: "relative",
  }}>
        <IconButton
          size="small"
          aria-label="Close backend wake dialog"
          onClick={() => setDismissed(true)}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "text.secondary",
          }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
        <Stack spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <Box
            component="img"
            src={opseat}
            alt="OpsEat"
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              // boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
            }}
          />
          <CircularProgress size={34} color="secondary" />
          <Typography variant="h6" fontWeight={800} textAlign="center">
            Waking backend server
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            This is a project showcase hosted on a free tier, so the backend may sleep.
            We are waking it now.
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Rechecking in {secondsLeft}s...
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mt: 0.25, fontSize: "0.7rem" }}
            >
              {mm}:{ss}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

