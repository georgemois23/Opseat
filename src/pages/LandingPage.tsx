import { useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Link,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import RestaurantMenuRounded from "@mui/icons-material/RestaurantMenuRounded";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import opseatLogo from "@/assets/logos/opseat.svg";

const PREVIEW_CARDS = [
  { name: "Marina Taverna", cats: "Greek · Seafood", tone: ["#0D9488", "#14B8A6"] as const },
  { name: "Urban Slice", cats: "Pizza · Italian", tone: ["#C2410C", "#F97316"] as const },
  { name: "Green Bowl", cats: "Salads · Vegan", tone: ["#047857", "#34D399"] as const },
];

export default function LandingPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "OpsEat • Food delivery near you";
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        backgroundImage: `radial-gradient(ellipse 100% 70% at 50% -15%, ${alpha(theme.palette.primary.main, 0.28)}, transparent 50%),
          radial-gradient(ellipse 60% 45% at 100% 0%, ${alpha(theme.palette.secondary.main, 0.12)}, transparent 45%),
          radial-gradient(ellipse 50% 40% at 0% 100%, ${alpha(theme.palette.primary.main, 0.1)}, transparent 50%)`,
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          bgcolor: alpha(theme.palette.background.default, 0.85),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.5, gap: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
              <Box
                component="img"
                src={opseatLogo}
                alt="OpsEat"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  flexShrink: 0,
                  boxShadow: `0 1px 6px ${alpha(theme.palette.primary.main, 0.12)}`,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    fontSize: "1.2rem",
                    lineHeight: 1.05,
                    background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.light, 0.95)} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  OpsEat
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    lineHeight: 1.2,
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
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.06) },
                }}
              >
                Log in
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/signup")}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, boxShadow: "none" }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 4, md: 6 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ maxWidth: { md: 520 }, flex: { md: "0 1 520px" } }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: alpha(theme.palette.secondary.main, 0.95),
                display: "block",
                mb: 1,
              }}
            >
              Local food, one app
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "2.75rem" },
                background: `linear-gradient(135deg, ${theme.palette.common.white} 0%, ${alpha(theme.palette.primary.light, 0.95)} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              Discover restaurants near you and order in minutes.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65, maxWidth: 480 }}>
              Browse cuisines, see what&apos;s open for delivery, and save your spots — all before you sign in. Create a
              free account to order and manage addresses.
            </Typography>

            <Box
              sx={{
                mb: 3,
                pl: 2,
                borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.55)}`,
                maxWidth: 480,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1.5 }}>
                The name <strong>OpsEat</strong> comes from the ancient Greek word{" "}
                <Box component="span" sx={{ fontStyle: "italic" }}>
                  opson
                </Box>{" "}
                (ὄψον), which referred to food eaten with bread — relish or provisions — paired with{" "}
                <strong>eat</strong>: food you can enjoy.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                OpsEat was created by{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 700 }}>
                  George Moysiadis
                </Box>
                — a student in Greece and a full-stack developer.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate("/signup")}
                sx={{
                  py: 1.35,
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: "none",
                }}
              >
                Create free account
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  py: 1.35,
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.common.white, 0.22),
                  "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.5) },
                }}
              >
                I already have an account
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: 440 }, mx: "auto", width: "100%" }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: alpha(theme.palette.secondary.main, 0.85),
                display: "block",
                mb: 1.5,
                textAlign: { xs: "center", md: "left" },
              }}
            >
              Product preview
            </Typography>
            <Stack spacing={1.5}>
              {PREVIEW_CARDS.map((r) => (
                <Card
                  key={r.name}
                  elevation={0}
                  sx={{
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.55),
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Stack direction="row" alignItems="stretch">
                    <Box
                      sx={{
                        width: 100,
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${r.tone[0]} 0%, ${r.tone[1]} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RestaurantMenuRounded sx={{ fontSize: 36, color: alpha("#fff", 0.45) }} />
                    </Box>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 }, flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em">
                        {r.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                        {r.cats}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "inline-block",
                          mt: 1,
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.success.main, 0.2),
                          color: theme.palette.success.light,
                        }}
                      >
                        Sample listing
                      </Typography>
                    </CardContent>
                  </Stack>
                </Card>
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, textAlign: "center" }}>
              Sign in to see real venues near your address.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{
            mt: { xs: 6, md: 8 },
            pt: { xs: 4, md: 5 },
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          {[
            {
              icon: <ExploreRounded sx={{ fontSize: 32, color: alpha(theme.palette.secondary.main, 0.9) }} />,
              title: "Browse by cuisine",
              text: "Swipe categories like Souvlaki, pizza, and coffee — same experience you get after sign-in.",
            },
            {
              icon: <LocationOnRounded sx={{ fontSize: 32, color: alpha(theme.palette.primary.light, 0.95) }} />,
              title: "Truly nearby",
              text: "Once you add an address, we prioritize restaurants that deliver to your door.",
            },
            {
              icon: <RestaurantMenuRounded sx={{ fontSize: 32, color: alpha(theme.palette.secondary.main, 0.85) }} />,
              title: "Full menus",
              text: "Open any venue for dishes, options, and prices — ordering unlocks with your account.",
            },
          ].map((f) => (
            <Box
              key={f.title}
              sx={{
                flex: 1,
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.35),
              }}
            >
              {f.icon}
              <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1.5, mb: 0.75 }}>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                {f.text}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} OpsEat · Developed by <Link href="https://moysiadis.dev/" target="_blank" rel="noopener noreferrer" sx={{textDecoration:'none' }}>George Moysiadis</Link>
        </Typography>
      </Box>
    </Box>
  );
}
