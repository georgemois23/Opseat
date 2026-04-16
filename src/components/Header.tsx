import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddressManagementDrawer from "@/features/customer/componentes/AddAddressDrawer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import opseat from "../assets/logos/opseat.svg";
import AccountManagementDrawer from "@/features/user/components/AccountManagementDrawer";
import { useMobile } from "@/lib/useMobile";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalHeaderSearch from "@/features/search/components/GlobalHeaderSearch";

function Header() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const theme = useTheme();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const barFill = scrolled
    ? alpha(theme.palette.background.paper, 0.94)
    : alpha(theme.palette.background.default, 0.86);

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "transparent",
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            bgcolor: barFill,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: `1px solid ${alpha(
              theme.palette.primary.main,
              scrolled ? 0.18 : 0.12
            )}`,
            boxShadow: scrolled ? `0 4px 24px ${alpha("#000", 0.2)}` : "none",
            transition: theme.transitions.create(
              ["background-color", "box-shadow", "border-color"],
              { duration: theme.transitions.duration.short }
            ),
          }}
        >
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 0.25, md: 1.25 },
            pb: { xs: 0, md: 1 },
            minHeight: { xs: 48, md: 72 },
            gap: { xs: 0.5, md: 2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "transparent",
            boxShadow: "none",
          }}
        >
          <Box
            onClick={() => navigate("/home")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0, md: 1.25 },
              userSelect: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={opseat}
              alt="OpsEat — home"
              sx={{
                height: { xs: 32, md: 44 },
                width: { xs: 32, md: 44 },
                borderRadius: { xs: 1.5, md: 2 },
                boxShadow: {
                  xs: "none",
                  md: `0 1px 6px ${alpha(theme.palette.primary.main, 0.12)}`,
                },
              }}
            />
            {!isMobile && (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                    fontSize: "1.2rem",
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
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              maxWidth: { md: 520 },
              mx: { xs: 0, md: "auto" },
              minWidth: 0,
            }}
          >
            <GlobalHeaderSearch isMobile={isMobile} />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.25, md: 0.5 },
              flexShrink: 0,
            }}
          >
            {!isMobile && <AddressManagementDrawer />}
            <AccountManagementDrawer />
          </Box>
        </Toolbar>

        {isMobile && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              px: { xs: 1, sm: 2 },
              pt: 0,
              pb: 0,
              mt: -0.5,
            }}
          >
            <AddressManagementDrawer headerCompact headerAddressCentered />
          </Box>
        )}
        </Box>
      </AppBar>

      {/* Spacer: primary toolbar + optional mobile address row */}
      <Toolbar
        sx={{
          minHeight: { xs: 48, md: 72 },
          mb: 0,
        }}
      />
      {isMobile ? <Box sx={{ height: 40 }} /> : null}
    </>
  );
}

export default Header;
