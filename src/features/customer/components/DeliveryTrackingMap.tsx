import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, AttributionControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Box, Stack, Typography } from "@mui/material";
import { useSocket } from "@/features/socket/hooks/useSocket";

type LatLng = { lat: number; lng: number };

interface DeliveryTrackingMapProps {
  /** The order being tracked — used to filter incoming `courier_location` events. */
  orderId: string;
  /** Customer's delivery address (destination marker). */
  destination: LatLng;
  destinationAddress?: string;
  height?: number;
}

// Home / destination pin — the default Leaflet marker (same asset the rest of the app uses).
const homeIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Courier marker — a distinct orange badge so it stands out from the destination pin.
const courierIcon = L.divIcon({
  className: "",
  html:
    '<div style="' +
    "width:34px;height:34px;border-radius:50%;" +
    "background:#F97316;border:3px solid #F8FAFC;" +
    "box-shadow:0 4px 12px rgba(0,0,0,0.45);" +
    "display:flex;align-items:center;justify-content:center;" +
    'font-size:18px;line-height:1;">🛵</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

/** Fits the map to show both markers the first time the courier position arrives. */
function FitToRoute({ destination, courier }: { destination: LatLng; courier: LatLng | null }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (courier && !fitted.current) {
      map.fitBounds(
        [
          [destination.lat, destination.lng],
          [courier.lat, courier.lng],
        ],
        { padding: [50, 50], maxZoom: 16 }
      );
      fitted.current = true;
    }
  }, [map, destination, courier]);
  return null;
}

/** Keeps the courier marker in view as it moves, without fighting the user's manual panning. */
function FollowCourier({ courier }: { courier: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (courier && !map.getBounds().contains([courier.lat, courier.lng])) {
      map.panTo([courier.lat, courier.lng]);
    }
  }, [map, courier]);
  return null;
}

export default function DeliveryTrackingMap({
  orderId,
  destination,
  destinationAddress,
  height = 280,
}: DeliveryTrackingMapProps) {
  const { subscribe } = useSocket();
  const [courier, setCourier] = useState<LatLng | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  // Inject the Leaflet stylesheet on mount (same approach as RestaurantMap).
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Listen for the courier's live position relayed by the backend for this order.
  useEffect(() => {
    const unsub = subscribe("courier_location", (payload: unknown) => {
      const p = payload as { orderId?: string; lat?: unknown; lng?: unknown } | null;
      if (!p || p.orderId !== orderId) return;
      const lat = Number(p.lat);
      const lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setCourier({ lat, lng });
      setUpdatedAt(Date.now());
    });
    return unsub;
  }, [subscribe, orderId]);

  const updatedText =
    updatedAt != null
      ? new Date(updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : null;

  return (
    <Box>
      <Box
        sx={{
          height,
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <MapContainer
          center={[destination.lat, destination.lng]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          attributionControl={false}
        >
          <AttributionControl prefix={false} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[destination.lat, destination.lng]} icon={homeIcon}>
            <Popup>
              <strong>Delivery address</strong>
              {destinationAddress ? (
                <>
                  <br />
                  {destinationAddress}
                </>
              ) : null}
            </Popup>
          </Marker>
          {courier ? (
            <Marker position={[courier.lat, courier.lng]} icon={courierIcon}>
              <Popup>Your courier</Popup>
            </Marker>
          ) : null}
          <FitToRoute destination={destination} courier={courier} />
          <FollowCourier courier={courier} />
        </MapContainer>
      </Box>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: courier ? "success.main" : "text.disabled",
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {courier
            ? `Courier location — live${updatedText ? ` · updated ${updatedText}` : ""}`
            : "Waiting for the courier to share their location…"}
        </Typography>
      </Stack>
    </Box>
  );
}
