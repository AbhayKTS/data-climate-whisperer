import React, { useState } from 'react';
import ClimateMap from '@/components/ClimateMap';
import LocationSearch from '@/components/LocationSearch';
import DataPanel from '@/components/DataPanel';
import { Card } from '@/components/ui/card';
import { Globe, Thermometer, Droplets, Wind } from 'lucide-react';

interface LocationResult {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  type: string;
  country?: string;
}

const Index = () => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock climate data for demonstration
  const mockClimateData = selectedLocation ? {
    location: locationName || `${selectedLocation.lat.toFixed(2)}, ${selectedLocation.lng.toFixed(2)}`,
    coordinates: selectedLocation,
    temperature: {
      current: 22.5,
      trend: 0.8,
      data: [
        { date: '2020', value: 21.2 },
        { date: '2021', value: 21.8 },
        { date: '2022', value: 22.1 },
        { date: '2023', value: 22.5, anomaly: true },
        { date: '2024', value: 23.1, anomaly: true },
      ]
    },
    precipitation: {
      current: 850,
      trend: -2.3,
      data: [
        { date: '2020', value: 920 },
        { date: '2021', value: 880 },
        { date: '2022', value: 865 },
        { date: '2023', value: 850 },
        { date: '2024', value: 825 },
      ]
    },
    airQuality: {
      index: 65,
      level: 'moderate' as const,
      pollutants: [
        { name: 'PM2.5', value: 25, unit: 'μg/m³' },
        { name: 'PM10', value: 45, unit: 'μg/m³' },
        { name: 'O3', value: 85, unit: 'μg/m³' },
        { name: 'NO2', value: 35, unit: 'μg/m³' },
      ]
    },
    anomalies: [
      {
        type: 'temperature' as const,
        description: 'Record-breaking heat event lasting 7 days',
        severity: 'high' as const,
        date: '2024-07-15'
      },
      {
        type: 'precipitation' as const,
        description: 'Below-average rainfall for the season',
        severity: 'medium' as const,
        date: '2024-06-20'
      }
    ]
  } : null;

  const handleLocationSelect = (result: LocationResult) => {
    setIsLoading(true);
    setSelectedLocation(result.coordinates);
    setLocationName(result.name);
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  const handleMapClick = (coordinates: { lat: number; lng: number }) => {
    setIsLoading(true);
    setSelectedLocation(coordinates);
    setLocationName('');
    
    // Simulate data loading
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-ocean rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Climate Explorer</h1>
              <p className="text-sm text-muted-foreground">Visualizing Earth's climate data</p>
            </div>
          </div>
          
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-gradient-ocean/10 border-primary/20">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-temperature-warm" />
                <div>
                  <p className="text-xs text-muted-foreground">Global Avg</p>
                  <p className="text-sm font-semibold">+1.2°C</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-primary/10 border-primary/20">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Rainfall</p>
                  <p className="text-sm font-semibold">-3.2%</p>
                </div>
              </div>
            </Card>
            <Card className="p-3 bg-accent/10 border-accent/20">
              <div className="flex items-center space-x-2">
                <Wind className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Air Quality</p>
                  <p className="text-sm font-semibold">Moderate</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Data Panel */}
        <div className="flex-1 overflow-hidden">
          <DataPanel data={mockClimateData} isLoading={isLoading} />
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <ClimateMap 
          onLocationSelect={handleMapClick}
          selectedLocation={selectedLocation}
        />
        
        {/* Attribution */}
        <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2">
          <p className="text-xs text-muted-foreground">
            Climate data visualization • Powered by Earth observations
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
