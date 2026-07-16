import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  InputBase,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import PedalBikeRounded from "@mui/icons-material/PedalBikeRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import opseatLogo from "@/assets/logos/opseat.svg";

const CUISINES = [
  { label: "Pizza", emoji: "🍕" },
  { label: "Burgers", emoji: "🍔" },
  { label: "Souvlaki", emoji: "🥙" },
  { label: "Sushi", emoji: "🍣" },
  { label: "Salads", emoji: "🥗" },
  { label: "Tacos", emoji: "🌮" },
  { label: "Noodles", emoji: "🍜" },
  { label: "Coffee", emoji: "☕" },
  { label: "Desserts", emoji: "🍰" },
  { label: "Breakfast", emoji: "🥞" },
];

const RESTAURANTS = [
  { name: "Marina Taverna", cuisine: "Greek · Seafood", emoji: "🦐", rating: 4.8, time: "20–30 min", fee: "€1.99", color: "#14B8A6" },
  { name: "Urban Slice", cuisine: "Pizza · Italian", emoji: "🍕", rating: 4.6, time: "25–35 min", fee: "Free", color: "#F97316" },
  { name: "Green Bowl", cuisine: "Salads · Vegan", emoji: "🥗", rating: 4.7, time: "15–25 min", fee: "€0.99", color: "#10B981" },
  { name: "Souvlaki Bros", cuisine: "Greek · Grill", emoji: "🥙", rating: 4.9, time: "20–30 min", fee: "€1.49", color: "#F59E0B" },
  { name: "Sakura Sushi", cuisine: "Japanese · Sushi", emoji: "🍣", rating: 4.5, time: "30–40 min", fee: "€2.49", color: "#F43F5E" },
  { name: "Bean Scene", cuisine: "Coffee · Bakery", emoji: "☕", rating: 4.8, time: "10–20 min", fee: "Free", color: "#B4794A" },
];

const STEPS = [
  { n: "1", title: "Set your address", text: "Tell us where you are and we surface the restaurants that deliver to your door." },
  { n: "2", title: "Pick your food", text: "Browse full menus, customise dishes, and build your order in a couple of taps." },
  { n: "3", title: "Track to your door", text: "Watch your courier on a live map, from the kitchen to your doorstep." },
];

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");

  useEffect(() => {
    document.title = "OpsEat • Food delivery near you";
  }, []);

  const goSignup = () => navigate("/signup");

  const line = alpha(theme.palette.common.white, 0.1);
  const wordmark = {
    fontWeight: 800,
    letterSpacing: "-0.03em",
    fontSize: "1.2rem",
    lineHeight: 1.1,
    background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.light, 0.95)} 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as const;

  const sectionHeading = {
    fontWeight: 800,
    letterSpacing: "-0.02em",
    fontSize: { xs: "1.25rem", md: "1.4rem" },
  } as const;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "text.primary" }}>
      {/* ---------- Header (matches app navbar) ---------- */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.default, 0.86),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 64, gap: 2 }}>
            <Box
              onClick={() => navigate("/")}
              sx={{ display: "flex", alignItems: "center", gap: 1.25, cursor: "pointer", userSelect: "none" }}
            >
              <Box
                component="img"
                src={opseatLogo}
                alt="OpsEat — home"
                sx={{ height: 44, width: 44, borderRadius: 2, boxShadow: `0 1px 6px ${alpha(theme.palette.primary.main, 0.12)}` }}
              />
              <Box sx={{ display: { xs: "none", sm: "flex" }, flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                <Typography variant="h6" sx={wordmark}>
                  OpsEat
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha(theme.palette.secondary.main, 0.95),
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    fontSize: "0.65rem",
                  }}
                >
                  Food delivery
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button onClick={() => navigate("/login")} sx={{ textTransform: "none", fontWeight: 700, color: "text.primary", borderRadius: 2, px: 1.75 }}>
                Log in
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={goSignup}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 2.25, boxShadow: "none" }}
              >
                Sign up
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ---------- Hero ---------- */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 4, md: 5 }} alignItems="center">
          {/* Left: copy + address search */}
          <Box sx={{ flex: { md: "0 1 540px" }, width: "100%" }}>
            <Chip
              label="Now delivering across Greece"
              size="small"
              sx={{
                mb: 2,
                fontWeight: 700,
                bgcolor: alpha(theme.palette.secondary.main, 0.12),
                color: theme.palette.secondary.light,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.28)}`,
              }}
            />
            <Typography
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.1,
                fontSize: { xs: "1.9rem", sm: "2.3rem", md: "2.6rem" },
                mb: 1.5,
              }}
            >
              Your favourite food,{" "}
              <Box component="span" sx={{ color: theme.palette.primary.light }}>
                delivered fast
              </Box>
              .
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", lineHeight: 1.55, mb: 3, maxWidth: 460 }}>
              Order from the best local restaurants near you and follow every step — from the kitchen to your door.
            </Typography>

            {/* Address search bar */}
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                goSignup();
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 0.6,
                pl: 1.75,
                borderRadius: 2.5,
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                maxWidth: 480,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, width: "100%", py: { xs: 0.75, sm: 0 } }}>
                <LocationOnRounded sx={{ color: theme.palette.primary.light, fontSize: 22 }} />
                <InputBase
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  sx={{ flex: 1, fontSize: "0.95rem", color: "text.primary", "& input::placeholder": { opacity: 0.7 } }}
                  inputProps={{ "aria-label": "Delivery address" }}
                />
              </Stack>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SearchRounded />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  width: { xs: "100%", sm: "auto" },
                  flexShrink: 0,
                  boxShadow: "none",
                }}
              >
                Find food
              </Button>
            </Box>

            <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
              {["Free to join", "Live order tracking", "No hidden fees"].map((t) => (
                <Stack key={t} direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: theme.palette.success.main }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {t}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right: flat food tiles */}
          <Box sx={{ flex: 1, width: "100%", display: { xs: "none", md: "block" } }}>
            <Box sx={{ position: "relative", maxWidth: 360, ml: "auto" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                {[RESTAURANTS[3], RESTAURANTS[1], RESTAURANTS[2], RESTAURANTS[4]].map((r) => (
                  <Box
                    key={r.name}
                    sx={{
                      aspectRatio: "1 / 1",
                      borderRadius: 3,
                      bgcolor: alpha(r.color, 0.16),
                      border: `1px solid ${alpha(r.color, 0.3)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.75rem",
                    }}
                  >
                    {r.emoji}
                  </Box>
                ))}
              </Box>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  position: "absolute",
                  bottom: -14,
                  right: -18,
                  px: 1.5,
                  py: 0.85,
                  borderRadius: 2.5,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${line}`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.35)}`,
                }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                  }}
                >
                  <PedalBikeRounded sx={{ color: theme.palette.primary.light, fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={800} display="block" lineHeight={1.2}>
                    On the way
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Arrives in 12 min
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>

      {/* ---------- Cuisine strip ---------- */}
      <Container maxWidth="lg" sx={{ pb: { xs: 3, md: 4 } }}>
        <Typography sx={{ ...sectionHeading, mb: 1.75 }}>What are you craving?</Typography>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pb: 1,
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-thumb": { bgcolor: line, borderRadius: 3 },
          }}
        >
          {CUISINES.map((c) => (
            <Stack
              key={c.label}
              onClick={goSignup}
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                minWidth: 82,
                py: 1.5,
                borderRadius: 2,
                cursor: "pointer",
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${line}`,
                transition: "border-color .15s ease",
                "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.45) },
              }}
            >
              <Box sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{c.emoji}</Box>
              <Typography variant="caption" fontWeight={700}>
                {c.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>

      {/* ---------- Popular restaurants ---------- */}
      <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 6 } }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography sx={sectionHeading}>Popular near you</Typography>
          <Button
            onClick={goSignup}
            endIcon={<ArrowForwardRounded />}
            size="small"
            sx={{ textTransform: "none", fontWeight: 700, color: theme.palette.primary.light }}
          >
            See all
          </Button>
        </Stack>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" } }}>
          {RESTAURANTS.map((r) => (
            <Box
              key={r.name}
              onClick={goSignup}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${line}`,
                transition: "transform .15s ease, border-color .15s ease",
                "&:hover": { transform: "translateY(-3px)", borderColor: alpha(theme.palette.primary.main, 0.4) },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: 120,
                  bgcolor: alpha(r.color, 0.16),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.6rem",
                }}
              >
                {r.emoji}
                <Chip
                  size="small"
                  label={r.fee === "Free" ? "Free delivery" : `${r.fee} delivery`}
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    height: 22,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    bgcolor: alpha(theme.palette.background.default, 0.88),
                    color: "text.primary",
                  }}
                />
              </Box>
              <Box sx={{ p: 1.75 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="subtitle2" fontWeight={800} noWrap>
                    {r.name}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.25} sx={{ flexShrink: 0 }}>
                    <StarRounded sx={{ fontSize: 16, color: "#FBBF24" }} />
                    <Typography variant="body2" fontWeight={800}>
                      {r.rating}
                    </Typography>
                  </Stack>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {r.cuisine}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, color: "text.secondary" }}>
                  <AccessTimeRounded sx={{ fontSize: 15 }} />
                  <Typography variant="caption" fontWeight={600}>
                    {r.time}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.75 }}>
          A preview of the OpsEat experience — sign in to see real venues delivering to your address.
        </Typography>
      </Container>

      {/* ---------- How it works ---------- */}
      <Box sx={{ borderTop: `1px solid ${line}`, borderBottom: `1px solid ${line}`, bgcolor: alpha(theme.palette.background.paper, 0.3) }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Typography sx={{ ...sectionHeading, mb: { xs: 2.5, md: 3.5 } }}>How OpsEat works</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 4 }}>
            {STEPS.map((s) => (
              <Box key={s.n} sx={{ flex: 1 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: theme.palette.primary.light,
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    mb: 1.5,
                  }}
                >
                  {s.n}
                </Box>
                <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em" sx={{ mb: 0.5 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, maxWidth: 320 }}>
                  {s.text}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ---------- Partner CTAs ---------- */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {[
            {
              icon: <StorefrontRounded sx={{ fontSize: 26 }} />,
              accent: theme.palette.secondary.main,
              title: "Grow your restaurant",
              text: "Reach hungry customers nearby and manage orders from one simple dashboard.",
              cta: "Add your restaurant",
            },
            {
              icon: <PedalBikeRounded sx={{ fontSize: 26 }} />,
              accent: theme.palette.primary.main,
              title: "Deliver & earn",
              text: "Ride on your own schedule and get paid for every delivery you complete.",
              cta: "Become a courier",
            },
          ].map((p) => (
            <Box
              key={p.title}
              sx={{
                flex: 1,
                p: { xs: 2.5, md: 3 },
                borderRadius: 3,
                border: `1px solid ${line}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.accent,
                  bgcolor: alpha(p.accent, 0.14),
                  border: `1px solid ${alpha(p.accent, 0.3)}`,
                  mb: 1.75,
                }}
              >
                {p.icon}
              </Box>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em" sx={{ mb: 0.5 }}>
                {p.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mb: 2, maxWidth: 360 }}>
                {p.text}
              </Typography>
              <Button
                variant="outlined"
                onClick={goSignup}
                endIcon={<ArrowForwardRounded />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.common.white, 0.22),
                  color: "text.primary",
                  "&:hover": { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08) },
                }}
              >
                {p.cta}
              </Button>
            </Box>
          ))}
        </Stack>
      </Container>

      {/* ---------- Final CTA ---------- */}
      <Box sx={{ borderTop: `1px solid ${line}` }}>
        <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 }, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 800, letterSpacing: "-0.03em", fontSize: { xs: "1.6rem", md: "2rem" }, mb: 1 }}>
            Hungry yet?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 460, mx: "auto" }}>
            Create a free account and get your first order on its way in minutes.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              color="secondary"
              onClick={goSignup}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3.5, py: 1.15, boxShadow: "none" }}
            >
              Get started — it's free
            </Button>
            <Button
              onClick={() => navigate("/login")}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3.5, py: 1.15, color: "text.primary" }}
            >
              Log in
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ---------- Footer ---------- */}
      <Box component="footer" sx={{ borderTop: `1px solid ${line}`, py: 3 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box component="img" src={opseatLogo} alt="OpsEat" sx={{ width: 30, height: 30, borderRadius: 1 }} />
              <Box>
                <Typography fontWeight={800} letterSpacing="-0.02em" fontSize="0.95rem">
                  OpsEat
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  From the Greek <em>opson</em> (ὄψον) — food to savour.
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} OpsEat · Built by{" "}
              <Link href="https://moysiadis.dev/" target="_blank" rel="noopener noreferrer" sx={{ textDecoration: "none", color: theme.palette.primary.light, fontWeight: 700 }}>
                George Moysiadis
              </Link>
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
