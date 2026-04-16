import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export function HomeHero() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 3,
        pt: { xs: 0, sm: 0.5 },
        textAlign: "center",
        maxWidth: 640,
        mx: "auto",
        px: { xs: 1, sm: 0 },
      }}
    >
      <Typography
        variant="overline"
        sx={{
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: alpha(theme.palette.secondary.main, 0.95),
          display: "block",
          mb: 0.75,
        }}
      >
        OpsEat
      </Typography>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.15,
          fontSize: { xs: "1.65rem", sm: "2rem" },
          background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        What are you craving?
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: 420, mx: "auto", lineHeight: 1.55 }}
      >
        Discover local kitchens, filter by cuisine, and order in a few taps.
      </Typography>
    </Box>
  );
}
