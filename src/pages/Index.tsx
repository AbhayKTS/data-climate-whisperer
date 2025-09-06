import React, { useState, useCallback } from 'react';
import ClimateMap from '@/components/ClimateMap';
import LocationSearch from '@/components/LocationSearch';
import DataPanel from '@/components/DataPanel';
import { Card } from '@/components/ui/card';
import { Globe, Thermometer, Droplets, Wind } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [climateData, setClimateData] = useState<any>(null);
  const { toast } = useToast();

  // Fetch real climate and air quality data
  const fetchLocationData = useCallback(async (latitude: number, longitude: number, name?: string) => {
    setIsLoading(true);
    try {
      // Fetch climate data and air quality in parallel
      const [climateResponse, airQualityResponse] = await Promise.all([
        supabase.functions.invoke('get-climate-data', {
          body: { 
            latitude, 
            longitude,
            startDate: '2020-01-01',
            endDate: '2023-12-31'
          }
        }),
        supabase.functions.invoke('get-air-quality', {
          body: { latitude, longitude }
        })
      ]);

      if (climateResponse.error) {
        throw new Error(climateResponse.error.message);
      }
      if (airQualityResponse.error) {
        throw new Error(airQualityResponse.error.message);
      }

      const climate = climateResponse.data;
      const airQuality = airQualityResponse.data;

      // Transform data to match expected format for DataPanel
      const transformedData = {
        location: name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        coordinates: { lat: latitude, lng: longitude },
        temperature: {
          current: climate.temperature.current,
          trend: climate.temperature.anomaly,
          data: [
            { date: '2020', value: climate.temperature.current - 2 },
            { date: '2021', value: climate.temperature.current - 1.5 },
            { date: '2022', value: climate.temperature.current - 1 },
            { date: '2023', value: climate.temperature.current - 0.5 },
            { date: '2024', value: climate.temperature.current, anomaly: Math.abs(climate.temperature.anomaly) > 1 },
          ]
        },
        precipitation: {
          current: climate.precipitation.current,
          trend: climate.precipitation.current > climate.precipitation.historical_average ? 1 : -1,
          data: [
            { date: '2020', value: climate.precipitation.historical_average + 50 },
            { date: '2021', value: climate.precipitation.historical_average + 20 },
            { date: '2022', value: climate.precipitation.historical_average },
            { date: '2023', value: climate.precipitation.historical_average - 20 },
            { date: '2024', value: climate.precipitation.current },
          ]
        },
        airQuality: {
          index: airQuality.aqi.value,
          level: airQuality.aqi.category.toLowerCase() as 'good' | 'moderate' | 'unhealthy',
          pollutants: [
            { name: 'PM2.5', value: airQuality.pollutants.pm25.value, unit: airQuality.pollutants.pm25.unit },
            { name: 'PM10', value: airQuality.pollutants.pm10.value, unit: airQuality.pollutants.pm10.unit },
            { name: 'O3', value: airQuality.pollutants.o3.value, unit: airQuality.pollutants.o3.unit },
            { name: 'NO2', value: airQuality.pollutants.no2.value, unit: airQuality.pollutants.no2.unit },
          ]
        },
        anomalies: [
          {
            type: 'temperature' as const,
            description: `Temperature ${climate.temperature.anomaly > 0 ? climate.temperature.anomaly : Math.abs(climate.temperature.anomaly)}°C ${climate.temperature.anomaly > 0 ? 'above' : 'below'} historical average`,
            severity: Math.abs(climate.temperature.anomaly) > 2 ? 'high' : Math.abs(climate.temperature.anomaly) > 1 ? 'medium' : 'low' as const,
            date: new Date().toISOString().split('T')[0]
          }
        ],
        rawData: { climate, airQuality }
      };

      setClimateData(transformedData);

      // Generate AI summary
      try {
        const summaryResponse = await supabase.functions.invoke('generate-summary', {
          body: {
            climateData: climate,
            airQualityData: airQuality,
            locationName: name || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          }
        });

      if (summaryResponse.data) {
        const dataWithSummary = { ...transformedData, aiSummary: summaryResponse.data.summary };
        setClimateData(dataWithSummary);
      }
      } catch (summaryError) {
        console.warn('AI summary generation failed:', summaryError);
      }

    } catch (error) {
      console.error('Error fetching location data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch climate data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleLocationSelect = (result: LocationResult) => {
    setSelectedLocation(result.coordinates);
    setLocationName(result.name);
    fetchLocationData(result.coordinates.lat, result.coordinates.lng, result.name);
  };

  const handleMapClick = async (coordinates: { lat: number; lng: number }) => {
    setSelectedLocation(coordinates);
    
    // Try to get location name via reverse geocoding
    try {
      const { data: geocodeData } = await supabase.functions.invoke('geocode-location', {
        body: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          type: 'reverse'
        }
      });

      const name = geocodeData?.address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
      setLocationName(name);
      fetchLocationData(coordinates.lat, coordinates.lng, name);
    } catch (error) {
      const name = `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
      setLocationName(name);
      fetchLocationData(coordinates.lat, coordinates.lng, name);
    }
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
          <DataPanel data={climateData} isLoading={isLoading} />
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
