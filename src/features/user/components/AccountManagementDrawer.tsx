import React, { useState, useEffect } from 'react';
import axios from "axios";
import api from "@/lib/axios";
import {
  Avatar,
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Alert,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Fade,
  Divider,
  SwipeableDrawer,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AddressManagementDrawer from '@/features/customer/componentes/AddAddressDrawer';
import { useMobile } from '@/lib/useMobile';
import MyOrdersDrawerView from '@/features/customer/components/MyOrdersDrawerView';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';

interface Address {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";

function SheetHandle() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5, flexShrink: 0 }}>
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          bgcolor: (t) => alpha(t.palette.text.secondary, 0.35),
        }}
      />
    </Box>
  );
}

export default function AccountManagementDrawer() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'add' | 'orders'>('list');
  const [isAddressSelected, setIsAddressSelected] = useState(false); // New state for step logic
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [errormessage, setErrorMessage] = useState("");

  const { user, logout } = useAuth();
  const theme = useTheme();

  const isMobile = useMobile();
  const anchor = isMobile ? "bottom" : "right";

  const sheetPadding = {
    px: { xs: 2, sm: 3 },
    pt: { xs: 0, sm: 3 },
    pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
  };

  const [form, setForm] = useState({
    label: "",
    street: "",
    streetNumber: "",
    city: "",
    country: "",
    postalCode: "",
  });

  // --- Helpers ---
  const resetForm = () => {
    setForm({ label: "", street: "", streetNumber: "", city: "", country: "", postalCode: "" });
    setIsAddressSelected(false);
    setResults([]);
    setErrorMessage("");
  };

  const getAddresses = async () => {
    try {
      const response = await api.get('/user-address/my-addresses', { withCredentials: true });
      setAddresses(response.data.sort((a: Address, b: Address) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))); // Default first
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    }
  };

  const setDefaultAddress = (id: string) => async () => {
    try {
      await api.post(`/user-address/set-default/${id}`, {}, { withCredentials: true });
      getAddresses();
      setOpen(false);
    } catch (error) {
      console.error('Failed to set default address', error);
    }
  };

  useEffect(() => {
    // if (open) getAddresses();
    getAddresses();
  }, []);
  useEffect(() => {
    if (open) getAddresses();
  }, [open]);



  function getDefaultAddress() {
  const addr = addresses.find((a) => a.isDefault);

  if (!addr) return "";

  return [addr.street, addr.streetNumber, addr.city]
    .filter(Boolean)
    .join(" ");
}

  const handleSearchAddress = async (query: string) => {
    if (!query) return setResults([]);
    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            autocomplete: true,
            limit: 5,
          },
        }
      );
      setResults(res.data.features);
    } catch (err) {
      console.error(err);
    }
  };

  const selectAddress = (place: any) => {
    const context = place.context || [];
    setForm({
      ...form,
      street: place.text || "",
      streetNumber: place.address || "",
      city: context.find((c: any) => c.id.includes("place"))?.text || "",
      country: context.find((c: any) => c.id.includes("country"))?.text || "",
      postalCode: context.find((c: any) => c.id.includes("postcode"))?.text || "",
    });
    setResults([]);
    setIsAddressSelected(true); // Reveal the rest of the form
  };

  const handleAddAddress = async () => {
    setErrorMessage("");
    try {
      await api.post('/user-address/add', form, { withCredentials: true });
      resetForm();
      setView('list');
      getAddresses();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to add address.');
    }
  };

  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "?";

  // --- Views ---
  const ListView = (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: isMobile ? "min(70dvh, 520px)" : "100%",
        maxHeight: isMobile ? "min(88dvh, 640px)" : "100vh",
        boxSizing: "border-box",
        ...sheetPadding,
      }}
    >
      {isMobile && <SheetHandle />}
      <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: isMobile ? 0.5 : 0 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              fontWeight: 800,
              bgcolor: alpha(theme.palette.primary.main, 0.35),
              color: "primary.light",
              border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" noWrap>
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Account"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Stack>

        {isMobile && (
          <Box>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: "0.08em", display: "block", mb: 1 }}
            >
              Delivery address
            </Typography>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              }}
            >
              <AddressManagementDrawer />
            </Box>
          </Box>
        )}

        <Divider />

        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => setView('orders')}
          sx={{ textTransform: 'none', fontWeight: 700, py: 1.25, borderRadius: 2 }}
        >
          Orders 
          <ReceiptLongRounded sx={{ fontSize: 20, ml: 1 }} />
        </Button>

        {user?.isRestaurantUser ? (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => {
              navigate("/restaurant/my");
              setOpen(false);
            }}
            sx={{ textTransform: "none", fontWeight: 600, py: 1.25, borderRadius: 2 }}
          >
            My restaurants
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            color="secondary"
            onClick={() => {
              navigate("/become-partner");
              setOpen(false);
            }}
            sx={{ textTransform: "none", fontWeight: 700, py: 1.25, borderRadius: 2 }}
          >
            Become a partner
          </Button>
        )}
      </Stack>

      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        onClick={logout}
        sx={{
          mt: 2,
          flexShrink: 0,
          textTransform: "none",
          fontWeight: 600,
          py: 1.25,
          borderRadius: 2,
          borderColor: alpha(theme.palette.error.main, 0.45),
          color: "error.light",
          "&:hover": {
            borderColor: "error.main",
            bgcolor: alpha(theme.palette.error.main, 0.08),
          },
        }}
      >
        Log out
      </Button>
    </Box>
  );

  const AddView = (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        maxWidth: "100%",
        maxHeight: isMobile ? "min(88dvh, 640px)" : "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxSizing: "border-box",
        ...sheetPadding,
      }}
    >
      {isMobile && <SheetHandle />}
      <Stack direction="row" alignItems="center" spacing={1} mb={2} sx={{ mt: isMobile ? 0.5 : 0 }}>
        <IconButton
          onClick={() => {
            setView("list");
            resetForm();
          }}
          aria-label="Back"
          sx={{ ml: -1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
          Add address
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={1.5}>
        Search your street, then pick a result to fill in the details.
      </Typography>

      <TextField
        fullWidth
        placeholder="Street, area, postcode…"
        value={form.street}
        margin="dense"
        autoFocus={!isMobile}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, flexShrink: 0 }} />,
        }}
        onChange={(e) => {
          setForm({ ...form, street: e.target.value });
          if (e.target.value.length > 2) handleSearchAddress(e.target.value);
        }}
      />

      {results.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 1,
            borderRadius: 2,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            maxHeight: isMobile ? 200 : 280,
            overflowY: "auto",
          }}
        >
          <List disablePadding>
            {results.map((place) => (
              <ListItemButton key={place.id} onClick={() => selectAddress(place)} divider>
                <ListItemText
                  primary={place.place_name}
                  primaryTypographyProps={{ variant: "body2", sx: { whiteSpace: "normal" } }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {isAddressSelected && (
        <Fade in={isAddressSelected}>
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }}>Details</Divider>

            <TextField
              fullWidth
              label="Label (e.g. Home)"
              value={form.label}
              margin="dense"
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                label="Number"
                value={form.streetNumber}
                margin="dense"
                onChange={(e) => setForm({ ...form, streetNumber: e.target.value })}
              />
              <TextField
                fullWidth
                label="City"
                value={form.city}
                margin="dense"
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Stack>

            <TextField
              fullWidth
              label="Postal code"
              value={form.postalCode}
              margin="dense"
              onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            />

            {errormessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errormessage}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
              onClick={handleAddAddress}
            >
              Save address
            </Button>

            <Button
              fullWidth
              variant="text"
              color="inherit"
              size="small"
              sx={{ mt: 1, textTransform: "none" }}
              onClick={() => setIsAddressSelected(false)}
            >
              Search again
            </Button>
          </Box>
        </Fade>
      )}
    </Box>
  );
  const defaultAddress = getDefaultAddress();
  function cleanAddress(address?: string) {
  if (!address) return "";

  // Check if string contains Greek letters
  const isGreek = /[Α-Ωα-ω]/.test(address);

  if (isGreek) {
    return address
      .normalize("NFD")                 // separate letters and accents
      .replace(/[\u0300-\u036f]/g, "")  // remove accents
      .replace(/[.,;:!?]/g, "");        // remove punctuation
  }

  return address;
}
const cleanedAddress = cleanAddress(defaultAddress);
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        aria-label="Account menu"
        sx={{
          color: "common.white",
          bgcolor: alpha("#fff", 0.1),
          border: `1px solid ${alpha("#fff", 0.18)}`,
          width: { xs: 34, sm: 40 },
          height: { xs: 34, sm: 40 },
          "&:hover": {
            bgcolor: alpha("#fff", 0.16),
            borderColor: alpha(theme.palette.primary.main, 0.45),
          },
        }}
      >
        <AccountCircleIcon sx={{ fontSize: { xs: 26, sm: 26 } }} />
      </IconButton>

      <SwipeableDrawer
        anchor={anchor}
        open={open}
        onClose={() => {
          setOpen(false);
          setView("list");
          resetForm();
        }}
        onOpen={() => setOpen(true)}
        disableBackdropTransition={!isMobile}
        swipeAreaWidth={isMobile ? 24 : 0}
        ModalProps={{ keepMounted: false }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 400,
            maxWidth: "100vw",
            borderTopLeftRadius: isMobile ? 20 : 0,
            borderTopRightRadius: isMobile ? 20 : 0,
            height: isMobile ? "auto" : "100%",
            maxHeight: isMobile ? "min(92dvh, 100%)" : "100%",
            minHeight: isMobile ? 280 : "100%",
            bgcolor: "background.paper",
            backgroundImage: "none",
          },
        }}
      >
        {view === "list" ? (
          ListView
        ) : view === "add" ? (
          AddView
        ) : (
          <MyOrdersDrawerView
            onBack={() => setView("list")}
            onCloseDrawer={() => {
              setOpen(false);
              setView("list");
            }}
          />
        )}
      </SwipeableDrawer>
    </>
  );
}