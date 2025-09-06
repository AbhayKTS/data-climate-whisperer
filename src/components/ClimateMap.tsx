import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface ClimateMapProps {
  onLocationSelect?: (coordinates: { lat: number; lng: number }, address?: string) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const ClimateMap: React.FC<ClimateMapProps> = ({ onLocationSelect, selectedLocation }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with Mapbox
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2xpbWF0ZS1leHBsb3JlciIsImEiOiJjbHNoOXgzY3cwMjNuMnBwNzFkZGdvdWl4In0.temporary'; // This will be replaced with user's token
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      projection: 'globe' as any,
      zoom: 1.5,
      center: [20, 30],
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Disable scroll zoom for smoother experience
    map.current.scrollZoom.disable();
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      setIsMapLoaded(true);
      map.current?.setFog({
        color: 'rgb(10, 25, 40)',
        'high-color': 'rgb(30, 60, 100)',
        'horizon-blend': 0.1,
        'space-color': 'rgb(5, 10, 20)',
        'star-intensity': 0.3,
      });
    });

    // Add click event listener
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      onLocationSelect?.({ lat, lng });
    });

    // Auto-rotate globe
    let userInteracting = false;
    const spinEnabled = true;
    const secondsPerRevolution = 240;
    
    function spinGlobe() {
      if (!map.current || !spinEnabled || userInteracting) return;
      
      const zoom = map.current.getZoom();
      if (zoom < 3) {
        const center = map.current.getCenter();
        center.lng -= 360 / secondsPerRevolution;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    // Event listeners for interaction
    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('dragstart', () => { userInteracting = true; });
    map.current.on('mouseup', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 2000);
    });
    map.current.on('touchend', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 2000);
    });
    map.current.on('moveend', spinGlobe);

    // Start spinning
    setTimeout(spinGlobe, 2000);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [onLocationSelect]);

  // Update marker when location changes
  useEffect(() => {
    if (!map.current || !selectedLocation) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Create new marker with climate-themed styling
    const el = document.createElement('div');
    el.className = 'climate-marker';
    el.style.cssText = `
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      border: 3px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
      cursor: pointer;
      animation: pulse 2s infinite;
    `;

    marker.current = new mapboxgl.Marker(el)
      .setLngLat([selectedLocation.lng, selectedLocation.lat])
      .addTo(map.current);

    // Fly to location
    map.current.flyTo({
      center: [selectedLocation.lng, selectedLocation.lat],
      zoom: 8,
      duration: 2000,
    });
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Climate data overlay controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Climate Layers</h3>
          <div className="space-y-1">
            <label className="flex items-center space-x-2 text-xs">
              <input type="checkbox" className="rounded border-border" />
              <span>Temperature</span>
            </label>
            <label className="flex items-center space-x-2 text-xs">
              <input type="checkbox" className="rounded border-border" />
              <span>Precipitation</span>
            </label>
            <label className="flex items-center space-x-2 text-xs">
              <input type="checkbox" className="rounded border-border" />
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
      `}</style>
    </div>
  );
};

export default ClimateMap;