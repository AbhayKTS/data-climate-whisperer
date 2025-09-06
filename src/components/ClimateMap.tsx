import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapErrorBoundary from './MapErrorBoundary';
import { WORKING_CLIMATE_LAYERS, FALLBACK_LAYERS } from './WorkingClimateLayers';

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

const ClimateMap: React.FC<ClimateMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({
    temperature: false,
    precipitation: false,
    wind: false,
  });
  const [climateLayers, setClimateLayers] = useState<{
    temperature?: L.TileLayer;
    precipitation?: L.TileLayer;
    wind?: L.TileLayer;
  }>({});
  const [layerLoadingState, setLayerLoadingState] = useState({
    temperature: false,
    precipitation: false,
    wind: false,
  });
  const [marker, setMarker] = useState<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    // Add a delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer || map) return;

      try {
        const leafletMap = L.map('map-container', {
          center: [30, 20],
          zoom: 2,
          maxZoom: 18,
          minZoom: 2,
          worldCopyJump: true,
        });

        // Add English base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        // Add click handler
        leafletMap.on('click', (e) => {
          const { lat, lng } = e.latlng;
          onLocationSelect?.({ lat, lng });
        });

        setMap(leafletMap);
        setIsMapLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setIsMapLoaded(true); // Set to true even on error to show fallback
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (map) {
        try {
          map.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
      }
    };
  }, []);

  // Create layer helper function
  const createLayer = useCallback((layerType: 'temperature' | 'precipitation' | 'wind') => {
    const config = WORKING_CLIMATE_LAYERS[layerType];
    let layer: L.TileLayer;

    try {
      // First try the main service
      layer = L.tileLayer(config.url, {
        attribution: config.attribution,
        opacity: config.opacity,
        maxZoom: 18,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=' // transparent pixel
      });

      // If fallback is available, create fallback layer
      if (config.fallback && FALLBACK_LAYERS[layerType]) {
        const fallbackConfig = FALLBACK_LAYERS[layerType].createLayer();
        const fallbackLayer = L.tileLayer(fallbackConfig.url, {
          attribution: fallbackConfig.attribution,
          opacity: fallbackConfig.opacity,
          maxZoom: 18
        });

        // Add error handling to switch to fallback
        layer.on('tileerror', () => {
          console.log(`Main ${layerType} layer failed, switching to fallback`);
          if (map && map.hasLayer(layer)) {
            map.removeLayer(layer);
            fallbackLayer.addTo(map);
          }
        });
      }

      return layer;
    } catch (error) {
      console.error(`Error creating ${layerType} layer:`, error);
      // Return fallback layer if available
      if (FALLBACK_LAYERS[layerType]) {
        const fallbackConfig = FALLBACK_LAYERS[layerType].createLayer();
        return L.tileLayer(fallbackConfig.url, {
          attribution: fallbackConfig.attribution,
          opacity: fallbackConfig.opacity,
          maxZoom: 18
        });
      }
      return null;
    }
  }, [map]);

  // Handle layer changes with improved reliability
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    const updateLayers = () => {
      // Handle temperature layer
      if (selectedLayers.temperature !== !!climateLayers.temperature) {
        if (selectedLayers.temperature) {
          setLayerLoadingState(prev => ({ ...prev, temperature: true }));
          const tempLayer = createLayer('temperature');
          if (tempLayer) {
            tempLayer.addTo(map);
            setClimateLayers(prev => ({ ...prev, temperature: tempLayer }));
            console.log('Temperature layer added');
          }
          setLayerLoadingState(prev => ({ ...prev, temperature: false }));
        } else if (climateLayers.temperature) {
          map.removeLayer(climateLayers.temperature);
          setClimateLayers(prev => ({ ...prev, temperature: undefined }));
          console.log('Temperature layer removed');
        }
      }

      // Handle precipitation layer  
      if (selectedLayers.precipitation !== !!climateLayers.precipitation) {
        if (selectedLayers.precipitation) {
          setLayerLoadingState(prev => ({ ...prev, precipitation: true }));
          const precipLayer = createLayer('precipitation');
          if (precipLayer) {
            precipLayer.addTo(map);
            setClimateLayers(prev => ({ ...prev, precipitation: precipLayer }));
            console.log('Precipitation layer added');
          }
          setLayerLoadingState(prev => ({ ...prev, precipitation: false }));
        } else if (climateLayers.precipitation) {
          map.removeLayer(climateLayers.precipitation);
          setClimateLayers(prev => ({ ...prev, precipitation: undefined }));
          console.log('Precipitation layer removed');
        }
      }

      // Handle wind layer
      if (selectedLayers.wind !== !!climateLayers.wind) {
        if (selectedLayers.wind) {
          setLayerLoadingState(prev => ({ ...prev, wind: true }));
          const windLayer = createLayer('wind');
          if (windLayer) {
            windLayer.addTo(map);
            setClimateLayers(prev => ({ ...prev, wind: windLayer }));
            console.log('Wind layer added');
          }
          setLayerLoadingState(prev => ({ ...prev, wind: false }));
        } else if (climateLayers.wind) {
          map.removeLayer(climateLayers.wind);
          setClimateLayers(prev => ({ ...prev, wind: undefined }));
          console.log('Wind layer removed');
        }
      }
    };

    updateLayers();
  }, [map, selectedLayers, isMapLoaded, createLayer]);

  // Handle selected location marker
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    try {
      // Remove existing marker
      if (marker) {
        map.removeLayer(marker);
        setMarker(null);
      }

      // Add new marker if location selected
      if (selectedLocation) {
        // Ensure map container exists before adding marker
        const mapContainer = map.getContainer();
        if (!mapContainer) return;

        const newMarker = L.marker([selectedLocation.lat, selectedLocation.lng], {
          icon: createClimateIcon()
        });

        // Add marker directly without whenReady to avoid timing issues
        try {
          newMarker.addTo(map);
          newMarker.bindPopup(`
            <div style="font-size: 12px;">
              <strong>Selected Location</strong><br />
              Lat: ${selectedLocation.lat.toFixed(4)}<br />
              Lng: ${selectedLocation.lng.toFixed(4)}
            </div>
          `);
          setMarker(newMarker);
        } catch (error) {
          console.error('Error adding marker:', error);
        }
      }
    } catch (error) {
      console.error('Error handling marker:', error);
    }
  }, [map, selectedLocation, isMapLoaded]);

  const handleLayerChange = useCallback((layerName: keyof typeof selectedLayers) => {
    setSelectedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  }, []);

  return (
    <div className="relative w-full h-full">
      <MapErrorBoundary>
        <div
          id="map-container"
          className="absolute inset-0 rounded-lg overflow-hidden z-0"
        />
      </MapErrorBoundary>

      {/* Climate data overlay controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Climate Layers</h3>
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border cursor-pointer" 
                checked={selectedLayers.temperature}
                onChange={() => handleLayerChange('temperature')}
              />
              <span className="flex items-center gap-1">
                Temperature
                {layerLoadingState.temperature && (
                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                )}
              </span>
            </label>
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border cursor-pointer"
                checked={selectedLayers.precipitation}
                onChange={() => handleLayerChange('precipitation')}
              />
              <span className="flex items-center gap-1">
                Precipitation
                {layerLoadingState.precipitation && (
                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                )}
              </span>
            </label>
            <label className="flex items-center space-x-2 text-xs cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border cursor-pointer"
                checked={selectedLayers.wind}
                onChange={() => handleLayerChange('wind')}
              />
              <span className="flex items-center gap-1">
                Wind Patterns
                {layerLoadingState.wind && (
                  <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin"></div>
                )}
              </span>
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