import React from "react";
import { Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import TwoWheelerRounded from "@mui/icons-material/TwoWheelerRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";

type PartnerOption = {
  id: "restaurant" | "courier" | "customer";
  title: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  onClick: () => void;
};

export default function BecomePartnerPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const options: PartnerOption[] = [
    {
      id: "restaurant",
      title: "Restaurant owner",
      description: "Apply for restaurant owner access and track your application progress in one place.",
      cta: "Open application",
      icon: <StorefrontRounded sx={{ fontSize: 32 }} />,
      onClick: () => navigate("/partner/application"),
    },
    {
      id: "courier",
      title: "Courier",
      description: "Join as a courier to deliver nearby orders and manage your availability.",
      cta: "Courier onboarding (soon)",
      icon: <TwoWheelerRounded sx={{ fontSize: 32 }} />,
      onClick: () => undefined,
    },
    {
      id: "customer",
      title: "Customer",
      description: "Keep ordering as a customer and discover nearby restaurants by location.",
      cta: "Back to home",
      icon: <PersonRounded sx={{ fontSize: 32 }} />,
      onClick: () => navigate("/home"),
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/home")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em", mb: 1 }}>
          Become a partner
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
          Choose how you want to use OpsEat. You can continue as a customer, create a restaurant, or apply as a courier.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {options.map((option) => (
          <Card
            key={option.id}
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.55),
            }}
          >
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box sx={{ color: "primary.light" }}>{option.icon}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.55 }}>
                    {option.description}
                  </Typography>
                </Box>
                <Button
                  variant={option.id === "restaurant" ? "contained" : "outlined"}
                  color={option.id === "courier" ? "inherit" : "primary"}
                  onClick={option.onClick}
                  disabled={option.id === "courier"}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap" }}
                >
                  {option.cta}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
