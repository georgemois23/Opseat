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
      <LocationProvider>
        <RestaurantProvider>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </RestaurantProvider>
      </LocationProvider>
      </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);