import React, { useState, useEffect } from 'react';
import axios from "axios";
import api from "@/lib/axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  useTheme,
  useMediaQuery,
  Alert,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Fade,
  Divider,
  SwipeableDrawer,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import { IoSwapVertical } from "react-icons/io5";
import { useRestaurants } from '@/features/restaurants/services/RestaurantContext';
import { useLocationContext } from "@/features/location/services/LocationContext";

interface Address {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
  longitude?: number;
  latitude?: number;
}

type AddressPrefillDetail = {
  label?: string;
  street?: string;
  streetNumber?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

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

const sheetSidePadding = {
  px: { xs: 2, sm: 3 },
  pt: { xs: 0, sm: 3 },
};

type AddressManagementDrawerProps = {
  /** Slim single-line control for the fixed app header on small screens */
  headerCompact?: boolean;
  /** Center the address + icons as a group (mobile header) */
  headerAddressCentered?: boolean;
};

export default function AddressManagementDrawer({
  headerCompact = false,
  headerAddressCentered = false,
}: AddressManagementDrawerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [isAddressSelected, setIsAddressSelected] = useState(false); // New state for step logic
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [errormessage, setErrorMessage] = useState("");
  const [isLocationSynced, setIsLocationSynced] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [actionAddress, setActionAddress] = useState<Address | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null);

  const { refetchRestaurants } = useRestaurants();
  const {
    disableGpsForSession,
    locationSource,
    locationNote,
    locationLabel,
    isGpsLocationActive,
  } = useLocationContext();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const anchor = isMobile ? 'bottom' : 'right';

  const [form, setForm] = useState({
    label: "",
    street: "",
    streetNumber: "",
    city: "",
    country: "",
    postalCode: "",
    longitude: 0,
    latitude: 0,
  });

  // --- Helpers ---
  const resetForm = () => {
    setForm({ label: "", street: "", streetNumber: "", city: "", country: "", postalCode: "", longitude: 0, latitude: 0 });
    setIsAddressSelected(false);
    setResults([]);
    setErrorMessage("");
    setEditingAddressId(null);
  };

  const getAddresses = async () => {
    try {
      const response = await api.get('/user-address/my-addresses', { withCredentials: true });
      setAddresses(response.data.sort((a: Address, b: Address) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))); // Default first
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    }
  };

  const removeAddress = async (id: string) => {
    const attempts: Array<() => Promise<unknown>> = [
      () => api.patch(`/user-address/delete/${id}`, { withCredentials: true }),
      () => api.delete(`/user-address/remove/${id}`, { withCredentials: true }),
      () => api.delete(`/user-address/${id}`, { withCredentials: true }),
    ];
    let removed = false;
    for (const attempt of attempts) {
      try {
        await attempt();
        removed = true;
        break;
      } catch {
        // try next route shape
      }
    }
    if (!removed) throw new Error("delete_failed");
  };

  const setDefaultAddress = (id: string) => async () => {
    try {
      // Manual default selection should override GPS mode for this session.
      disableGpsForSession();
      await api.post(`/user-address/set-default/${id}`, {}, { withCredentials: true });
      await getAddresses();
      refetchRestaurants(); // Update nearby restaurants based on new default address
      window.dispatchEvent(new CustomEvent("opseat:location-refresh"));
      setOpen(false);
    } catch (error) {
      console.error('Failed to set default address', error);
    }
  };

  const startEditAddress = (addr: Address) => {
    setActionAddress(null);
    setActionsAnchorEl(null);
    setView("add");
    setEditingAddressId(addr.id);
    setErrorMessage("");
    setResults([]);
    setIsAddressSelected(true);
    setIsLocationSynced(
      typeof addr.latitude === "number" && typeof addr.longitude === "number"
    );
    setForm({
      label: addr.label || "",
      street: addr.street || "",
      streetNumber: addr.streetNumber || "",
      city: addr.city || "",
      country: addr.country || "",
      postalCode: addr.postalCode || "",
      latitude: typeof addr.latitude === "number" ? addr.latitude : 0,
      longitude: typeof addr.longitude === "number" ? addr.longitude : 0,
    });
  };

  useEffect(() => {
    // if (open) getAddresses();
    getAddresses();
  }, []);
  useEffect(() => {
    if (open) getAddresses();
  }, [open]);

  useEffect(() => {
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent<AddressPrefillDetail>).detail ?? {};
      setOpen(true);
      setView("add");
      setResults([]);
      setErrorMessage("");
      setIsAddressSelected(true);
      setIsLocationSynced(
        typeof detail.latitude === "number" && typeof detail.longitude === "number"
      );
      setForm((prev) => ({
        ...prev,
        label: detail.label ?? prev.label ?? "Current location",
        street: detail.street ?? "",
        streetNumber: detail.streetNumber ?? "",
        city: detail.city ?? "",
        country: detail.country ?? "",
        postalCode: detail.postalCode ?? "",
        latitude: typeof detail.latitude === "number" ? detail.latitude : 0,
        longitude: typeof detail.longitude === "number" ? detail.longitude : 0,
      }));
    };

    window.addEventListener("opseat:address-prefill", handler as EventListener);
    const openHandler = () => {
      setOpen(true);
      setView("list");
    };
    window.addEventListener("opseat:address-open", openHandler as EventListener);
    return () => {
      window.removeEventListener("opseat:address-prefill", handler as EventListener);
      window.removeEventListener("opseat:address-open", openHandler as EventListener);
    };
  }, []);



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
  const [lng, lat] = place.center; // Mapbox returns [lng, lat]

  setForm({
    ...form,
    street: place.text || "",
    streetNumber: place.address || "",
    city: context.find((c: any) => c.id.includes("place"))?.text || "",
    country: context.find((c: any) => c.id.includes("country"))?.text || "",
    postalCode: context.find((c: any) => c.id.includes("postcode"))?.text || "",
    latitude: lat,
    longitude: lng,
  });
  setIsLocationSynced(true);
  setResults([]);
  setIsAddressSelected(true);
};

  const handleSaveAddress = async () => {
  setErrorMessage("");
  
  let finalLat = form.latitude;
  let finalLng = form.longitude;

  // RECALCULATE ONLY IF NOT SYNCED
  if (!isLocationSynced) {
    const query = [form.street, form.streetNumber, form.city, form.postalCode]
      .filter(Boolean)
      .join(" ");

    try {
      const res = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: MAPBOX_TOKEN,
            limit: 1, 
          },
        }
      );

      if (res.data.features && res.data.features.length > 0) {
        const [lng, lat] = res.data.features[0].center;
        finalLat = lat;
        finalLng = lng;
      } else {
        setErrorMessage("We couldn't locate this address. Please refine the street or city.");
        return;
      }
    } catch (err) {
      setErrorMessage("Location verification failed. Please try again.");
      return;
    }
  }

  // FINAL SAVE (create or update)
  try {
    const payload = { ...form, latitude: finalLat, longitude: finalLng };
    if (editingAddressId) {
      let updated = false;
      const attempts: Array<() => Promise<unknown>> = [
        () => api.patch(`/user-address/update/${editingAddressId}`, payload, { withCredentials: true }),
        () => api.put(`/user-address/update/${editingAddressId}`, payload, { withCredentials: true }),
        () => api.patch(`/user-address/edit/${editingAddressId}`, payload, { withCredentials: true }),
        () => api.put(`/user-address/edit/${editingAddressId}`, payload, { withCredentials: true }),
      ];
      for (const attempt of attempts) {
        try {
          await attempt();
          updated = true;
          break;
        } catch {
          // try next known backend route shape
        }
      }
      if (!updated) {
        setErrorMessage("Failed to update address.");
        return;
      }
    } else {
      await api.post('/user-address/add', payload, { withCredentials: true });
    }
    
    resetForm();
    setView('list');
    await getAddresses();
    refetchRestaurants(); // Update nearby restaurants based on new address
    window.dispatchEvent(new CustomEvent("opseat:location-refresh"));
  } catch (error: any) {
    setErrorMessage(
      error.response?.data?.message ||
        (editingAddressId ? "Failed to update address." : "Failed to add address.")
    );
  }
};

  const handleDeleteAddress = async () => {
    if (!actionAddress) return;
    try {
      setDeleteLoading(true);
      await removeAddress(actionAddress.id);
      await getAddresses();
      refetchRestaurants();
      window.dispatchEvent(new CustomEvent("opseat:location-refresh"));
      setActionAddress(null);
      setActionsAnchorEl(null);
      if (editingAddressId === actionAddress.id) {
        resetForm();
        setView("list");
      }
    } catch {
      setErrorMessage("Failed to remove address.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const sheetPadding = {
    px: { xs: 2, sm: 3 },
    pt: { xs: 0, sm: 3 },
    pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
  };

  const fieldSurfaceSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: alpha(theme.palette.common.white, 0.04),
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.primary.main, 0.35),
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
  };

  // --- Views ---
  const ListView = (
    <Box
    sx={{
      width: isMobile ? "100%" : 415,
      display: "flex",
      flexDirection: "column",
      // Force the container to take up the full height of the Drawer
      height: "100%", 
      // This prevents the padding from expanding the box beyond the screen
      boxSizing: "border-box", 
      overflow: "hidden",
      ...sheetSidePadding,
    }}
  >
      {isMobile && <SheetHandle />}
      <Box sx={{ flexShrink: 0, mb: 2, pt: isMobile ? 0.5 : 0 }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: alpha(theme.palette.secondary.main, 0.95),
            mb: 0.5,
          }}
        >
          Delivery
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={{ xs: 1.5, sm: 2 }}
        >
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            My addresses
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            color="primary"
            size="medium"
            fullWidth={isMobile}
            onClick={() => setView("add")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: { xs: 1.1, sm: 1 },
              boxShadow: "none",
              flexShrink: 0,
            }}
          >
            Add address
          </Button>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          {isGpsLocationActive && (
            <Chip
              size="small"
              color={locationSource === "gps" ? "success" : "secondary"}
              label={locationSource === "gps" ? "Using current location" : "Location checked"}
              sx={{ fontWeight: 700, height: 24 }}
            />
          )}
          {/*
          // ) : (
            <Chip
              size="small"
              variant="outlined"
              color="warning"
              label="Using selected address"
              sx={{ fontWeight: 700, height: 24 }}
            />
           )}
           {locationNote ? (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
              {locationNote}
            </Typography>
          ) : null} */}
        </Stack>
      </Box>

      <Stack
        spacing={2}
        sx={{
          flexGrow: 1,       // Take up all remaining space
          overflowY: "auto", // Allow scrolling
          minHeight: 0,      // IMPORTANT: Prevents flex collapse
          pb: 10,            // Extra space at bottom so last card is visible
          '&::-webkit-scrollbar': {
      width: '6px', // Thin and elegant
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent', // Keeps it clean
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(theme.palette.text.secondary, 0.2), // Subtle color
      borderRadius: '10px',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.4), // Pops on hover
      },
    },
    // Firefox support
    scrollbarWidth: 'thin',
    scrollbarColor: `${alpha(theme.palette.text.secondary, 0.2)} transparent`,
  }}
      >
        {addresses.length === 0 ? (
          <Box
            sx={{
              py: 5,
              px: 2.5,
              textAlign: "center",
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.35),
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 2,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <LocationOnOutlined sx={{ fontSize: 28, color: alpha(theme.palette.primary.light, 0.95) }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
              No saved addresses yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: "auto", lineHeight: 1.55 }}>
              Add where you want food delivered so we can show restaurants near you.
            </Typography>
          </Box>
        ) : (
          addresses.map((addr: Address) => (
            <Card
              key={addr.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                flexShrink: 0,
                overflow: "hidden",
                borderColor: alpha(theme.palette.primary.main, addr.isDefault ? 0.4 : 0.14),
                bgcolor: addr.isDefault ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.background.paper, 0.65),
                backdropFilter: "blur(8px)",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  borderColor: alpha(theme.palette.primary.main, addr.isDefault ? 0.55 : 0.28),
                },
              }}
            >
              <CardContent
                sx={{
                  pt: { xs: 2, sm: 2 },
                  px: { xs: 2, sm: 2 },
                  pb: { xs: 3, sm: 3.25 },
                  "&:last-child": { pb: { xs: 3, sm: 3.25 } },
                }}
              >
                <Stack direction="row" alignItems="flex-start" gap={1.5} width="100%">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                    }}
                  >
                    <LocationOnOutlined sx={{ fontSize: 22, color: alpha(theme.palette.primary.light, 0.95) }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={0.5}
                      width="100%"
                    >
                      <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ wordBreak: "break-word" }}>
                        {addr.label}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexShrink={0}>
                        {addr.isDefault ? (
                          <Chip
                            label={locationSource === "gps" ? "Use this default" : "Default"}
                            size="small"
                            onClick={
                              locationSource === "gps"
                                ? () => {
                                    disableGpsForSession();
                                    void getAddresses();
                                    void refetchRestaurants();
                                  }
                                : undefined
                            }
                            clickable={locationSource === "gps"}
                            sx={{
                              flexShrink: 0,
                              height: 26,
                              fontWeight: 800,
                              fontSize: "0.65rem",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: alpha(theme.palette.primary.light, 1),
                              bgcolor: alpha(theme.palette.primary.main, 0.22),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                              "& .MuiChip-label": { px: 1 },
                              ...(locationSource === "gps"
                                ? {
                                    cursor: "pointer",
                                    "&:hover": {
                                      bgcolor: alpha(theme.palette.secondary.main, 0.22),
                                      borderColor: alpha(theme.palette.secondary.main, 0.45),
                                    },
                                  }
                                : {}),
                            }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={setDefaultAddress(addr.id)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              minWidth: 0,
                              px: 1.25,
                              py: 0.5,
                              borderRadius: 2,
                              borderColor: alpha(theme.palette.primary.main, 0.35),
                              "&:hover": {
                                borderColor: alpha(theme.palette.primary.main, 0.55),
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            Set default
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setActionAddress(addr);
                            setActionsAnchorEl(e.currentTarget);
                          }}
                          aria-label={`Open actions for ${addr.label || "address"}`}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                            borderRadius: "50%",
                          }}
                        >
                          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.45 }}>
                      {addr.street} {addr.streetNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                      {[addr.city, addr.postalCode].filter(Boolean).join(", ")}
                      {addr.country ? ` · ${addr.country}` : ""}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );

  const AddView = (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxSizing: "border-box",
        ...sheetPadding,
      }}
    >
      {isMobile && <SheetHandle />}
      <Stack direction="row" alignItems="center" spacing={1.25} mb={2.5} sx={{ mt: isMobile ? 0.5 : 0 }}>
        <IconButton
          onClick={() => {
            setView("list");
            resetForm();
          }}
          aria-label="Back"
          sx={{
            ml: -1,
            color: "text.primary",
            bgcolor: alpha(theme.palette.background.paper, 0.55),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            "&:hover": {
              bgcolor: alpha(theme.palette.background.paper, 0.85),
              borderColor: alpha(theme.palette.primary.main, 0.35),
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              display: "block",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: alpha(theme.palette.secondary.main, 0.95),
              lineHeight: 1.2,
            }}
          >
            {editingAddressId ? "Update delivery spot" : "New delivery spot"}
          </Typography>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            {editingAddressId ? "Edit address" : "Add address"}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
        {editingAddressId
          ? "Update address details below. Search again if you want to change the mapped location."
          : "Search for your street or area, choose a match, then confirm the details below."}
      </Typography>

      <TextField
        fullWidth
        placeholder="Street, area, postcode…"
        value={form.street}
        margin="dense"
        autoFocus={!isMobile}
        sx={fieldSurfaceSx}
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ color: alpha(theme.palette.secondary.main, 0.75), mr: 1, flexShrink: 0 }} />
          ),
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
            mt: 1.5,
            borderRadius: 2,
            overflow: "hidden",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.45),
            maxHeight: isMobile ? 200 : 280,
            overflowY: "auto",
          }}
        >
          <List disablePadding>
            {results.map((place, index) => (
              <ListItemButton
                key={place.id}
                onClick={() => selectAddress(place)}
                divider={index < results.length - 1}
                sx={{
                  py: 1.25,
                  alignItems: "flex-start",
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                }}
              >
                <LocationOnOutlined
                  sx={{
                    fontSize: 20,
                    mt: 0.15,
                    mr: 1.25,
                    flexShrink: 0,
                    color: alpha(theme.palette.primary.light, 0.85),
                  }}
                />
                <ListItemText
                  primary={place.place_name}
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: { whiteSpace: "normal", fontWeight: 500, lineHeight: 1.45 },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {isAddressSelected && (
        <Fade in={isAddressSelected}>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  color: alpha(theme.palette.secondary.main, 0.85),
                }}
              >
                Confirm details
              </Typography>
              <Divider sx={{ mt: 1, borderColor: alpha(theme.palette.primary.main, 0.15) }} />
            </Box>

            <TextField
              fullWidth
              label="Label (e.g. Home)"
              value={form.label}
              margin="dense"
              sx={fieldSurfaceSx}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                label="Number"
                value={form.streetNumber}
                margin="dense"
                sx={fieldSurfaceSx}
                onChange={(e) => {
                  setForm({ ...form, streetNumber: e.target.value });
                  setIsLocationSynced(false);
                }}
              />
              <TextField
                fullWidth
                label="City"
                value={form.city}
                margin="dense"
                sx={fieldSurfaceSx}
                onChange={(e) => {
                  setForm({ ...form, city: e.target.value });
                  setIsLocationSynced(false);
                }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Postal code"
              value={form.postalCode}
              margin="dense"
              sx={fieldSurfaceSx}
              onChange={(e) => {
                setForm({ ...form, postalCode: e.target.value });
                setIsLocationSynced(false);
              }}
            />

            {errormessage && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.35)}`,
                  "& .MuiAlert-icon": { color: theme.palette.error.light },
                }}
              >
                {errormessage}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "none",
              }}
              onClick={handleSaveAddress}
            >
              {editingAddressId ? "Save changes" : "Save address"}
            </Button>

            <Button
              fullWidth
              variant="text"
              color="inherit"
              size="medium"
              sx={{
                mt: 1,
                textTransform: "none",
                fontWeight: 600,
                color: alpha(theme.palette.text.secondary, 0.95),
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
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
const isUsingGpsContext = locationSource === "gps" && (isGpsLocationActive || Boolean(locationNote));
const displayLocationLabel = locationLabel?.trim() || "";
const locationValueText = isUsingGpsContext
  ? displayLocationLabel
    ? `Location: ${displayLocationLabel}`
    : "Using current location"
  : cleanedAddress;
const locationButtonLabel =
  locationValueText || "Select address";
  const ChangeIcon = IoSwapVertical  as React.ElementType;
  return (
    <Box sx={{ backgroundColor: "transparent", maxWidth: "100%", minWidth: 0 }}>
      {isMobile ? (
        headerCompact ? (
          <Button
            onClick={() => setOpen(true)}
            variant="text"
            fullWidth
            aria-label={
              cleanedAddress
                ? `Delivery address: ${cleanedAddress}. Tap to change.`
                : "Choose delivery address"
            }
            startIcon={
              <LocationOnOutlined
                sx={{
                  color: alpha(theme.palette.secondary.main, 0.7),
                  fontSize: 15,
                  flexShrink: 0,
                  ml: headerAddressCentered ? 0 : -0.5,
                  mr: headerAddressCentered ? 0 : 0.25,
                }}
              />
            }
            endIcon={
              <KeyboardArrowDownIcon
                sx={{
                  fontSize: 16,
                  opacity: 0.4,
                  flexShrink: 0,
                  mr: headerAddressCentered ? 0 : -0.5,
                  color: alpha(theme.palette.common.white, 0.65),
                }}
              />
            }
            sx={{
              color: alpha(theme.palette.common.white, 0.85),
              textTransform: "none",
              py: 0,
              px: headerAddressCentered ? 1 : 0.25,
              minWidth: 0,
              minHeight: 44,
              maxWidth: "100%",
              justifyContent: headerAddressCentered ? "center" : "flex-start",
              borderRadius: 1.5,
              gap: 0.5,
              WebkitTapHighlightColor: `${alpha(theme.palette.common.white, 0.12)}`,
              "& .MuiButton-startIcon": {
                marginRight: headerAddressCentered ? 0.25 : 0.5,
                marginLeft: 0,
              },
              "& .MuiButton-endIcon": {
                marginLeft: headerAddressCentered ? 0.25 : 0.25,
                marginRight: 0,
              },
              "&:hover": {
                bgcolor: alpha("#fff", 0.04),
                color: theme.palette.common.white,
              },
            }}
          >
            <Typography
              component="span"
              variant="body2"
              sx={{
                flex: headerAddressCentered ? "0 1 auto" : 1,
                minWidth: 0,
                maxWidth: headerAddressCentered
                  ? "min(240px, calc(100vw - 140px))"
                  : "none",
                textAlign: headerAddressCentered ? "center" : "left",
                fontWeight: 500,
                fontSize: "0.72rem",
                letterSpacing: "0.02em",
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isUsingGpsContext
                ? displayLocationLabel
                  ? `Using location: ${displayLocationLabel}`
                  : "Using current location"
                : cleanedAddress || "Set delivery address"}
            </Typography>
          </Button>
        ) : (
          <Button
            onClick={() => setOpen(true)}
            variant="text"
            fullWidth
            startIcon={
              <LocationOnOutlined
                sx={{ color: "secondary.main", fontSize: 22, flexShrink: 0 }}
              />
            }
            endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 22, opacity: 0.85, flexShrink: 0 }} />}
            sx={{
              color: "common.white",
              textTransform: "none",
              py: 1,
              px: 1.5,
              minWidth: 0,
              maxWidth: "100%",
              justifyContent: "flex-start",
              borderRadius: 3,
              bgcolor: alpha("#fff", 0.08),
              border: `1px solid ${alpha("#fff", 0.14)}`,
              "&:hover": {
                bgcolor: alpha("#fff", 0.12),
                borderColor: alpha(theme.palette.primary.main, 0.35),
              },
            }}
          >
            <Box sx={{ textAlign: "left", minWidth: 0, flex: 1, overflow: "hidden" }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: alpha("#fff", 0.72),
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  lineHeight: 1.2,
                }}
              >
                {isUsingGpsContext ? "Using location" : "Deliver to"}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.35,
                }}
              >
              {locationValueText || "Add delivery address"}
              </Typography>
            </Box>
          </Button>
        )
      ) : (
        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          endIcon={<ChangeIcon size={16} color={alpha(theme.palette.secondary.main, 0.95)} />}
          sx={{
            color: "text.primary",
            backgroundColor: "background.paper",
            borderRadius: 2,
            textTransform: "none",
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            px: 2,
            py: 1,
            "&:hover": {
              borderColor: alpha(theme.palette.primary.main, 0.5),
              bgcolor: alpha(theme.palette.primary.main, 0.06),
            },
          }}
        >
          <Stack spacing={0} alignItems="flex-start" sx={{ textAlign: "left" }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {isUsingGpsContext ? "Using location" : "Deliver to"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontWeight: 600,
              }}
            >
              {locationButtonLabel}
            </Typography>
          </Stack>
        </Button>
      )}

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
            // maxHeight: isMobile ? "min(94dvh, 100dvh)" : "100%",
            // minHeight: isMobile ? 280 : "100%",
            height: isMobile ? "92dvh" : "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
            backgroundImage: "none",
            border: isMobile ? "none" : `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            borderLeft: isMobile ? "none" : undefined,
            boxShadow: isMobile
              ? `0 -12px 40px ${alpha(theme.palette.common.black, 0.45)}`
              : `-8px 0 32px ${alpha(theme.palette.common.black, 0.35)}`,
          },
        }}
      >
        {view === "list" ? ListView : AddView}
      </SwipeableDrawer>
      <Menu
        open={Boolean(actionsAnchorEl && actionAddress)}
        anchorEl={actionsAnchorEl}
        onClose={() => {
          if (deleteLoading) return;
          setActionsAnchorEl(null);
          setActionAddress(null);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 100,
              px: 0.5,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.98),
              backgroundImage: "none",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (!actionAddress) return;
            startEditAddress(actionAddress);
          }}
          sx={{ fontWeight: 400 }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          disabled={deleteLoading }
          onClick={() => void handleDeleteAddress()}
          sx={{ fontWeight: 700, color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          {deleteLoading
            ? "Deleting…"
            // : actionAddress?.isDefault
              // ? "Default can’t be deleted"
              : "Delete"}
        </MenuItem>
      </Menu>
    </Box>
  );
}