import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import { Box } from '@mui/material';

// --- TS Interfaces ---
interface RestaurantProps {
  lat: number;
  lng: number;
  name: string;
  size?: number; 
  address?: string;
}

const RestaurantMap: React.FC<RestaurantProps> = ({ lat, lng, address, name, size=300 }) => {
  const position: [number, number] = [lat, lng];
    const sizePx = size + 'px';
  // --- CSS Injection Hook ---
  // This replaces the need for an external .css import
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link); // Cleanup on unmount
    };
  }, []);

  // --- Fix for Leaflet Default Icon Assets ---
  const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <Box sx={{display:'flex', justifyContent:'flex-end', p:2}}>
    <div style={{ 
      height: sizePx, 
      width: sizePx, 
      borderRadius: '12px', 
      overflow: 'hidden',
      border: '1px solid #ddd' ,
    }}>
      <MapContainer 
        center={position} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <AttributionControl prefix={false} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup>
            <div style={{ fontFamily: 'sans-serif' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{name}</h3>
              <p style={{ margin: 0 }}>📍 Address: {address}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
    </Box>
  );
};

export default RestaurantMap;