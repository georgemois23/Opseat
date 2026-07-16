import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import opseatLogo from "@/assets/logos/opseat.svg";

const TILES = [
  { emoji: "🥙", color: "#F59E0B" },
  { emoji: "🍕", color: "#F97316" },
  { emoji: "🥗", color: "#10B981" },
  { emoji: "🍣", color: "#F43F5E" },
];

const PERKS = ["Order from local restaurants", "Track your courier live", "Free — no hidden fees"];

// Emojis scattered diagonally as a faded backdrop on mobile.
const BG_EMOJIS = ["🍕", "🍔", "🥙", "🍣", "🥗", "🌮", "🍜", "☕", "🍰", "🥞", "🍟", "🍩", "🌯", "🥐", "🍦", "🧋"];

/** Decorative faded, diagonally-tiled food icons — mobile only, behind the card. */
function FoodBackdrop() {
  return (
    <Box
      aria-hidden
      sx={{
        display: { xs: "block", md: "none" },
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: "-25%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 5,
          transform: "rotate(-20deg)",
          opacity: 0.08,
          fontSize: "2.2rem",
          textAlign: "center",
          filter: "grayscale(0.25)",
        }}
      >
        {Array.from({ length: 64 }).map((_, i) => (
          <Box key={i} component="span">
            {BG_EMOJIS[i % BG_EMOJIS.length]}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * A single unified auth card: a branded column and the form column live inside one
 * rounded container so they read as one connected object (not two floating halves).
 * On mobile the brand column collapses into a compact branded header strip.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const line = alpha(theme.palette.common.white, 0.1);
  const brandFill = alpha(theme.palette.primary.main, 0.1);

  const wordmark = {
    fontWeight: 800,
    letterSpacing: "-0.03em",
    background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.light, 0.95)} 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as const;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        bgcolor: "background.default",
      }}
    >
      <FoodBackdrop />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: { xs: 440, md: 940 },
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
          boxShadow: {
            xs: `0 20px 50px ${alpha(theme.palette.common.black, 0.5)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.14)}`,
            md: `0 24px 60px ${alpha(theme.palette.common.black, 0.45)}`,
          },
          bgcolor: { xs: alpha(theme.palette.background.paper, 0.72), md: "background.paper" },
          backdropFilter: { xs: "blur(16px) saturate(150%)", md: "none" },
          WebkitBackdropFilter: { xs: "blur(16px) saturate(150%)", md: "none" },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* ---------- Brand column (desktop) ---------- */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            width: "44%",
            flexShrink: 0,
            flexDirection: "column",
            justifyContent: "space-between",
            p: 4,
            bgcolor: brandFill,
            borderRight: `1px solid ${line}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            onClick={() => navigate("/")}
            sx={{ cursor: "pointer", color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <ArrowBackRounded sx={{ fontSize: 18 }} />
            <Typography variant="caption" fontWeight={700}>
              Back to OpsEat home 
            </Typography>
          </Stack>

          <Box sx={{ py: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
              <Box component="img" src={opseatLogo} alt="OpsEat" sx={{ width: 38, height: 38, borderRadius: 1.5 }} />
              <Typography sx={{ ...wordmark, fontSize: "1.3rem" }}>OpsEat</Typography>
            </Stack>
            <Typography sx={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, fontSize: "1.7rem", mb: 3 }}>
              Good food is just a{" "}
              <Box component="span" sx={{ color: theme.palette.primary.light }}>
                tap away
              </Box>
              .
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, maxWidth: 220 }}>
              {TILES.map((t) => (
                <Box
                  key={t.emoji}
                  sx={{
                    aspectRatio: "1 / 1",
                    borderRadius: 2.5,
                    bgcolor: alpha(t.color, 0.16),
                    border: `1px solid ${alpha(t.color, 0.3)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                  }}
                >
                  {t.emoji}
                </Box>
              ))}
            </Box>
          </Box>

          <Stack spacing={1}>
            {PERKS.map((p) => (
              <Stack key={p} direction="row" alignItems="center" spacing={1}>
                <StarRounded sx={{ fontSize: 16, color: "#FBBF24" }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {p}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* ---------- Mobile brand strip ---------- */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          onClick={() => navigate("/")}
          sx={{
            display: { xs: "flex", md: "none" },
            p: 2.25,
            bgcolor: brandFill,
            borderBottom: `1px solid ${line}`,
            cursor: "pointer",
          }}
        >
          <Box component="img" src={opseatLogo} alt="OpsEat" sx={{ width: 36, height: 36, borderRadius: 1.5 }} />
          <Box>
            <Typography sx={{ ...wordmark, fontSize: "1.1rem", lineHeight: 1.1 }}>OpsEat</Typography>
            <Typography variant="caption" sx={{ color: alpha(theme.palette.secondary.main, 0.95), fontWeight: 600 }}>
              Good food is just a tap away
            </Typography>
          </Box>
        </Stack>

        {/* ---------- Form column ---------- */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 3, sm: 4 },
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 380, mx: "auto" }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
