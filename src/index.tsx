import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import { AuthProvider } from "./features/auth/providers/AuthProvider";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { RestaurantProvider } from "./features/restaurants/services/RestaurantContext";
import { LocationProvider } from "./features/location/services/LocationContext";
import { SnackbarProvider } from "./lib/SnackbarContext";
import { SocketProvider } from "./features/socket/providers/SocketProvider";
import CourierAssignmentNotifier from "./features/socket/components/CourierAssignmentNotifier";

// const theme = createTheme({
//   palette: {
//     primary: {
//       // main: '#7b2d26',
//       // main: '#042F2E',
//       // main: '#384669',
//       // main: '#2F3A55',
//       main: '#001f3f',
//     },
//     secondary: {
//       main: '#a46f68',
//     },
//     background: {
//       // default: '#faf9f8',
//       default: '#001f3f',
//     },
//   },
// });

// Severity accents tuned to the dark-navy / teal vibe (MUI defaults are too bright/flat here).
const feedbackColors = {
  error: { main: "#F87171", bg: "rgba(248, 113, 113, 0.14)", border: "rgba(248, 113, 113, 0.42)" },
  warning: { main: "#FBBF24", bg: "rgba(251, 191, 36, 0.14)", border: "rgba(251, 191, 36, 0.42)" },
  success: { main: "#34D399", bg: "rgba(52, 211, 153, 0.14)", border: "rgba(52, 211, 153, 0.42)" },
  info: { main: "#38BDF8", bg: "rgba(56, 189, 248, 0.14)", border: "rgba(56, 189, 248, 0.42)" },
} as const;

const theme = createTheme({
  palette: {
    mode: "dark", // dark mode
    primary: {
      main: "#14B8A6", // teal-blue green
      contrastText: "#F8FAFC", // almost white text
    },
    secondary: {
      main: "#F97316", // warm orange for CTA / food accents
      contrastText: "#fff",
    },
    error: { main: feedbackColors.error.main, contrastText: "#1a0606" },
    warning: { main: feedbackColors.warning.main, contrastText: "#1a1204" },
    success: { main: feedbackColors.success.main, contrastText: "#04140d" },
    info: { main: feedbackColors.info.main, contrastText: "#04141a" },
    background: {
      default: "#001F3F", // dark navy
      paper: "#0A2C5A",   // cards, modals
    },
    text: {
      primary: "#F8FAFC", // main text
      secondary: "#94A3B8", // muted / grayish text
    },
    action: {
      hover: "#0D9488", // button hover / active highlight
      selected: "#2DD4BF", // badges / selected items
    },
  },
  components: {
    MuiAlert: {
      defaultProps: {
        variant: "standard",
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid transparent",
          color: "#F8FAFC",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          alignItems: "center",
          backdropFilter: "blur(10px)",
          backgroundImage: "none",
          boxShadow: "0 10px 30px rgba(0, 8, 20, 0.45)",
          "& .MuiAlert-message": {
            paddingTop: 6,
            paddingBottom: 6,
          },
        },
        // Soft tinted "glass" look per severity — background + matching accent border & icon.
        standardError: {
          backgroundColor: feedbackColors.error.bg,
          borderColor: feedbackColors.error.border,
          "& .MuiAlert-icon": { color: feedbackColors.error.main },
        },
        standardWarning: {
          backgroundColor: feedbackColors.warning.bg,
          borderColor: feedbackColors.warning.border,
          "& .MuiAlert-icon": { color: feedbackColors.warning.main },
        },
        standardSuccess: {
          backgroundColor: feedbackColors.success.bg,
          borderColor: feedbackColors.success.border,
          "& .MuiAlert-icon": { color: feedbackColors.success.main },
        },
        standardInfo: {
          backgroundColor: feedbackColors.info.bg,
          borderColor: feedbackColors.info.border,
          "& .MuiAlert-icon": { color: feedbackColors.info.main },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #14B8A6, #0D9488)",
          color: "#F8FAFC",
          "&:hover": {
            background: "linear-gradient(135deg, #0D9488, #14B8A6)",
          },
        },
        containedSecondary: {
          background: "#F97316",
          color: "#fff",
          "&:hover": {
            background: "#FB923C",
          },
        },
      },
    },
  },
});


const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
  <AuthProvider>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <SocketProvider>
          <LocationProvider>
            <RestaurantProvider>
              <SnackbarProvider>
                <CourierAssignmentNotifier />
                <App />
              </SnackbarProvider>
            </RestaurantProvider>
          </LocationProvider>
        </SocketProvider>
      </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);