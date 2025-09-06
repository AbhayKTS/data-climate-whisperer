import React, { useCallback } from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect }) => {
  const handleClick = useCallback((e: any) => {
    try {
      const { lat, lng } = e.latlng;
      onLocationSelect?.({ lat, lng });
    } catch (error) {
      console.error('Error handling map click:', error);
    }
  }, [onLocationSelect]);

  useMapEvents({
    click: handleClick,
  });

  return null;
};

export default MapClickHandler;