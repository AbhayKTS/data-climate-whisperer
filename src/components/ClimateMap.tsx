import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ClimateMapProps {
  onLocationSelect?: (coordinates: { lat: number; lng: number }, address?: string) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

// Custom climate marker icon
const createClimateIcon = () => {
  return L.divIcon({
    className: 'custom-climate-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        border: 3px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
        animation: pulse 2s infinite;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map click handler component
const MapClickHandler: React.FC<{ onLocationSelect?: (coordinates: { lat: number; lng: number }) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect?.({ lat, lng });
    },
  });
  return null;
};

const ClimateMap: React.FC<ClimateMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({
    temperature: false,
    precipitation: false,
    airQuality: false,
  });

  useEffect(() => {
    // Map is loaded when component mounts
    setIsMapLoaded(true);
  }, []);

  const handleLayerChange = (layerName: keyof typeof selectedLayers) => {
    setSelectedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[30, 20]}
        zoom={2}
        className="absolute inset-0 rounded-lg overflow-hidden z-0"
        maxZoom={18}
        minZoom={2}
        worldCopyJump={true}
      >
        <LayersControl position="topright">
          {/* Base layers */}
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> contributors'
              maxZoom={17}
            />
          </LayersControl.BaseLayer>

          {/* Climate overlay layers */}
          <LayersControl.Overlay name="Temperature Data">
            <TileLayer
              url="https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo"
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
              opacity={0.6}
            />
          </LayersControl.Overlay>
          
          <LayersControl.Overlay name="Precipitation">
            <TileLayer
              url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo"
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
              opacity={0.6}
            />
          </LayersControl.Overlay>
          
          <LayersControl.Overlay name="Wind Speed">
            <TileLayer
              url="https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo"
              attribution='&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
              opacity={0.6}
            />
          </LayersControl.Overlay>
        </LayersControl>

        {/* Custom map click handler */}
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]} 
            icon={createClimateIcon()}
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
      </MapContainer>

      {/* Climate data overlay controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Climate Layers</h3>
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs">
              <input 
                type="checkbox" 
                className="rounded border-border" 
                checked={selectedLayers.temperature}
                onChange={() => handleLayerChange('temperature')}
              />
              <span>Temperature</span>
            </label>
            <label className="flex items-center space-x-2 text-xs">
              <input 
                type="checkbox" 
                className="rounded border-border"
                checked={selectedLayers.precipitation}
                onChange={() => handleLayerChange('precipitation')}
              />
              <span>Precipitation</span>
            </label>
            <label className="flex items-center space-x-2 text-xs">
              <input 
                type="checkbox" 
                className="rounded border-border"
                checked={selectedLayers.airQuality}
                onChange={() => handleLayerChange('airQuality')}
              />
              <span>Air Quality</span>
            </label>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Loading Earth's climate data...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .custom-climate-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-layers {
          background: hsl(var(--card)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.5rem !important;
          color: hsl(var(--foreground)) !important;
        }
        .leaflet-control-layers-toggle {
          background-image: none !important;
          background-color: hsl(var(--primary)) !important;
        }
        .leaflet-control-layers label {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
    </div>
  );
};

export default ClimateMap;