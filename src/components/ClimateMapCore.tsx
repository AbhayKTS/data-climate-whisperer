import React, { useCallback, useMemo } from 'react';
import { TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MapClickHandler from './MapClickHandler';

interface ClimateMapCoreProps {
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  selectedLayers: {
    temperature: boolean;
    precipitation: boolean;
    airQuality: boolean;
  };
}

// Memoized climate marker icon creation
const createClimateIcon = () => {
  return L.divIcon({
    className: 'custom-climate-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, hsl(205, 80%, 35%), hsl(205, 90%, 55%));
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        box-shadow: 0 4px 15px hsl(205 80% 35% / 0.4);
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const ClimateMapCore: React.FC<ClimateMapCoreProps> = ({
  onLocationSelect,
  selectedLocation,
  selectedLayers,
}) => {
  const climateIcon = useMemo(() => createClimateIcon(), []);

  const handleLocationSelect = useCallback(
    (coordinates: { lat: number; lng: number }) => {
      onLocationSelect?.(coordinates);
    },
    [onLocationSelect]
  );

  return (
    <>
      {/* Base tile layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Climate overlay layers - conditionally rendered with keys for proper React reconciliation */}
      {selectedLayers.temperature && (
        <TileLayer
          key="temperature-layer"
          url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo"
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
          opacity={0.6}
        />
      )}
      
      {selectedLayers.precipitation && (
        <TileLayer
          key="precipitation-layer"
          url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo"
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
          opacity={0.6}
        />
      )}
      
      {selectedLayers.airQuality && (
        <TileLayer
          key="air-quality-layer"
          url="https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo"
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
          opacity={0.6}
        />
      )}

      {/* Map click handler */}
      <MapClickHandler onLocationSelect={handleLocationSelect} />

      {/* Selected location marker */}
      {selectedLocation && (
        <Marker 
          key={`marker-${selectedLocation.lat}-${selectedLocation.lng}`}
          position={[selectedLocation.lat, selectedLocation.lng]} 
          icon={climateIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong>Selected Location</strong><br />
              Lat: {selectedLocation.lat.toFixed(4)}<br />
              Lng: {selectedLocation.lng.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
};

export default ClimateMapCore;