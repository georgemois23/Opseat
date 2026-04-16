import { useAuth } from "@/features/auth/hooks/useAuth";
import api from "@/lib/axios";
import { readCachedGpsContext } from "@/features/location/services/locationRequestParams";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type LocationSource = "default" | "gps";

type Coords = {
  latitude: number;
  longitude: number;
};

interface SavedAddressGeo {
  id: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  label?: string;
  street?: string;
  streetNumber?: string;
}

interface LocationContextType {
  locationSource: LocationSource;
  locationNote: string | null;
  locationLabel: string | null;
  isGpsLocationActive: boolean;
  effectiveCoords: Coords | null;
  disableGpsForSession: () => void;
}

const GPS_SYNC_SESSION_KEY = "opseat:gps-address-sync:v1";
const GPS_COORDS_SESSION_KEY = "opseat:gps-coords:v1";
const GPS_CITY_SESSION_KEY = "opseat:gps-city:v1";
const GPS_MANUAL_OVERRIDE_KEY = "opseat:use-default-address:v1";
const NEAR_SAVED_ADDRESS_KM = 1.0;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";

const LocationContext = createContext<LocationContextType | null>(null);

function toRadians(v: number): number {
  return (v * Math.PI) / 180;
}

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa = s1 * s1 + Math.cos(toRadians(aLat)) * Math.cos(toRadians(bLat)) * s2 * s2;
  return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function hasGeo(addr: SavedAddressGeo): addr is SavedAddressGeo & { latitude: number; longitude: number } {
  return typeof addr.latitude === "number" && typeof addr.longitude === "number";
}

async function reverseGeocodeCityFromCoords(latitude: number, longitude: number): Promise<string | null> {
  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${encodeURIComponent(
        MAPBOX_TOKEN
      )}&types=place&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as {
          features?: Array<{
            text?: string;
            place_name?: string;
            context?: Array<{ id?: string; text?: string }>;
          }>;
        };
        const f = data.features?.[0];
        const cityFromContext =
          f?.context?.find((c) => typeof c.id === "string" && c.id.includes("place"))?.text;
        const candidate =
          (typeof cityFromContext === "string" && cityFromContext.trim()) ||
          (typeof f?.text === "string" && f.text.trim()) ||
          (typeof f?.place_name === "string" && f.place_name.split(",")[0]?.trim()) ||
          "";
        if (candidate) return candidate;
      }
    } catch {
      // fallback below
    }
  }

  

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(latitude)
    )}&lon=${encodeURIComponent(String(longitude))}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
      };
    };
    const a = data.address;
    const candidate =
      a?.city?.trim() ||
      a?.town?.trim() ||
      a?.village?.trim() ||
      a?.municipality?.trim() ||
      a?.county?.trim() ||
      a?.state?.trim() ||
      "";
    return candidate || null;
  } catch {
    return null;
  }
  
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [locationSource, setLocationSource] = useState<LocationSource>("default");
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [isGpsLocationActive, setIsGpsLocationActive] = useState(false);
  const [effectiveCoords, setEffectiveCoords] = useState<Coords | null>(null);
  const [gpsManualOverride, setGpsManualOverride] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(GPS_MANUAL_OVERRIDE_KEY) === "1";
  });
  const gpsCoordsRef = useRef<Coords | null>(null);
  

  const applyGpsResolution = useCallback(
    async (gpsCoords: Coords, gpsCityFromLookup?: string | null) => {
      const gpsCity =
        (typeof gpsCityFromLookup === "string" ? gpsCityFromLookup : null) ??
        (await reverseGeocodeCityFromCoords(gpsCoords.latitude, gpsCoords.longitude));
      if (gpsCity) {
        setLocationLabel(gpsCity);
        sessionStorage.setItem(GPS_CITY_SESSION_KEY, gpsCity);
      } else {
        sessionStorage.removeItem(GPS_CITY_SESSION_KEY);
      }

      try {
        const res = await api.get("/user-address/my-addresses", { withCredentials: true });
        const addressesRaw = Array.isArray(res.data) ? (res.data as SavedAddressGeo[]) : [];
        const addresses = addressesRaw
  .map(a => ({
     ...a,
     latitude: Number(a.latitude),
     longitude: Number(a.longitude)
  }))
  .filter(hasGeo);
        if (!addresses.length) {
          setLocationSource("gps");
          setIsGpsLocationActive(true);
          setLocationLabel(gpsCity);
          setLocationNote(
            gpsCity
              ? `Using GPS location near ${gpsCity}. Add a saved address to auto-switch.`
              : "Using your current GPS location. Add a saved address to auto-switch."
          );
          setEffectiveCoords(gpsCoords);
          return;
        }

        const currentDefault = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (!currentDefault) {
          setEffectiveCoords(null);
          return;
        }

        let nearest = currentDefault;
        let nearestDistance = distanceKm(
          gpsCoords.latitude,
          gpsCoords.longitude,
          currentDefault.latitude,
          currentDefault.longitude
        );
        for (const addr of addresses) {
          const d = distanceKm(gpsCoords.latitude, gpsCoords.longitude, addr.latitude, addr.longitude);
           console.log(`Distance to ${addr.label}: ${d.toFixed(2)} km`);
          if (d < nearestDistance) {
            nearest = addr;
            nearestDistance = d;
          }
        }

        const nearestLabel =
          nearest.city?.trim() ||
          nearest.label?.trim() ||
          [nearest.streetNumber, nearest.street].filter(Boolean).join(" ").trim() ||
          null;
        const resolvedNearestLabel = nearestLabel || gpsCity;
        const isNearAnySaved = nearestDistance <= NEAR_SAVED_ADDRESS_KM;

        if (isNearAnySaved) {
          if (nearest.id !== currentDefault.id) {
            await api.post(`/user-address/set-default/${nearest.id}`, {}, { withCredentials: true });
          }
          setLocationSource("default");
          setIsGpsLocationActive(false);
          setLocationLabel(resolvedNearestLabel);
          setLocationNote(
            resolvedNearestLabel
              ? `Auto-switched to nearest saved address near ${resolvedNearestLabel}.`
              : "Using nearest saved address based on your current location."
          );
          setEffectiveCoords({ latitude: nearest.latitude, longitude: nearest.longitude });
          return;
        }

        setLocationSource("gps");
        setIsGpsLocationActive(true);
        setLocationLabel(gpsCity || nearestLabel);
        setLocationNote(
          gpsCity
            ? `No nearby saved address found. Using GPS near ${gpsCity}.`
            : "No nearby saved address found. Using your current GPS location."
        );
        setEffectiveCoords(gpsCoords);
      } catch (error) {
        console.error("GPS address sync failed:", error);
        setLocationSource("default");
        setLocationLabel(null);
        setIsGpsLocationActive(false);
        setLocationNote("Could not verify your location. Using selected delivery address.");
        setEffectiveCoords(null);
      }
    },
    []
  );

  const refreshFromCachedGps = useCallback(() => {
    if (gpsManualOverride) return;
    const cached = gpsCoordsRef.current ?? readCachedGpsContext();
    if (!cached) return;
    const cachedCity = typeof window !== "undefined" ? sessionStorage.getItem(GPS_CITY_SESSION_KEY) : null;
    void applyGpsResolution(cached, cachedCity);
  }, [applyGpsResolution, gpsManualOverride]);

  useEffect(() => {
    if (gpsManualOverride) return;
    try {
      const raw = sessionStorage.getItem(GPS_COORDS_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { latitude?: number; longitude?: number };
      if (typeof parsed?.latitude === "number" && typeof parsed?.longitude === "number") {
        gpsCoordsRef.current = { latitude: parsed.latitude, longitude: parsed.longitude };
      }
    } catch {
      // ignore cache parse errors
    }
    try {
      const rawCity = sessionStorage.getItem(GPS_CITY_SESSION_KEY);
      if (rawCity && rawCity.trim()) setLocationLabel(rawCity.trim());
    } catch {
      // ignore cache parse errors
    }
  }, [gpsManualOverride]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocationSource("default");
      setLocationNote(null);
      setLocationLabel(null);
      setIsGpsLocationActive(false);
      setEffectiveCoords(null);
      setGpsManualOverride(false);
      gpsCoordsRef.current = null;
      sessionStorage.removeItem(GPS_MANUAL_OVERRIDE_KEY);
      return;
    }
    if (gpsManualOverride) {
      setEffectiveCoords(null);
      return;
    }
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    const cachedCoords = gpsCoordsRef.current;
    const cachedCity = sessionStorage.getItem(GPS_CITY_SESSION_KEY);
    const alreadyTriedThisSession = sessionStorage.getItem(GPS_SYNC_SESSION_KEY) === "1";
    if (alreadyTriedThisSession && cachedCoords) {
      void applyGpsResolution(cachedCoords, cachedCity);
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        gpsCoordsRef.current = coords;
        sessionStorage.setItem(GPS_COORDS_SESSION_KEY, JSON.stringify(coords));
        sessionStorage.setItem(GPS_SYNC_SESSION_KEY, "1");
        void applyGpsResolution(coords);
      },
      () => {
        sessionStorage.setItem(GPS_SYNC_SESSION_KEY, "1");
        if (!cancelled) {
          setLocationSource("default");
          setLocationLabel(null);
          setIsGpsLocationActive(false);
          setLocationNote("Location permission is off. Enable GPS to auto-pick the nearest address.");
          setEffectiveCoords(null);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, gpsManualOverride, applyGpsResolution]);

  useEffect(() => {
    const onRefresh = () => {
      refreshFromCachedGps();
    };
    window.addEventListener("opseat:location-refresh", onRefresh);
    return () => {
      window.removeEventListener("opseat:location-refresh", onRefresh);
    };
  }, [refreshFromCachedGps]);

  const disableGpsForSession = useCallback(() => {
    setGpsManualOverride(true);
    sessionStorage.setItem(GPS_MANUAL_OVERRIDE_KEY, "1");
    sessionStorage.removeItem(GPS_COORDS_SESSION_KEY);
    sessionStorage.removeItem(GPS_CITY_SESSION_KEY);
    gpsCoordsRef.current = null;
    setLocationSource("default");
    setLocationLabel(null);
    setIsGpsLocationActive(false);
    setLocationNote("Using selected default delivery address.");
    setEffectiveCoords(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      locationSource,
      locationNote,
      locationLabel,
      isGpsLocationActive,
      effectiveCoords,
      disableGpsForSession,
    }),
    [
      locationSource,
      locationNote,
      locationLabel,
      isGpsLocationActive,
      effectiveCoords,
      disableGpsForSession,
    ]
  );

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
}

