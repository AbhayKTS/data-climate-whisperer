import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapErrorBoundary from './MapErrorBoundary';
import ClimateMapCore from './ClimateMapCore';

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

const ClimateMap: React.FC<ClimateMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({
    temperature: false,
    precipitation: false,
    airQuality: false,
  });

  useEffect(() => {
    // Add a small delay to ensure proper initialization
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleLayerChange = useCallback((layerName: keyof typeof selectedLayers) => {
    setSelectedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  }, []);

  const handleLocationSelect = useCallback((coordinates: { lat: number; lng: number }) => {
    onLocationSelect?.(coordinates);
  }, [onLocationSelect]);

  // Memoize map container props to prevent unnecessary re-renders
  const mapProps = useMemo(() => ({
    center: [30, 20] as [number, number],
    zoom: 2,
    className: "absolute inset-0 rounded-lg overflow-hidden z-0",
    maxZoom: 18,
    minZoom: 2,
    worldCopyJump: true,
  }), []);

  return (
    <div className="relative w-full h-full">
      <MapErrorBoundary>
        {isMapLoaded && (
          <MapContainer {...mapProps}>
            <ClimateMapCore
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
              selectedLayers={selectedLayers}
            />
          </MapContainer>
        )}
      </MapErrorBoundary>

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