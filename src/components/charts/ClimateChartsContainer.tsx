import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TemperatureChart from './TemperatureChart';
import PrecipitationChart from './PrecipitationChart';
import AirQualityChart from './AirQualityChart';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

interface ClimateData {
  location: string;
  coordinates?: { lat: number; lng: number };
  temperature: {
    current: number;
    trend: number;
    data: Array<{ date: string; temperature?: number; value?: number; min?: number; max?: number; anomaly?: boolean; historical?: number }>;
  };
  precipitation: {
    current: number;
    trend: number;
    data: Array<{ date: string; amount?: number; value?: number; intensity?: string; anomaly?: boolean; historical?: number; hours?: number }>;
  };
  airQuality: {
    index: number;
    level: 'good' | 'moderate' | 'poor' | 'unhealthy';
    pollutants: Array<{ name: string; value: number; unit: string }>;
  };
  anomalies: Array<{
    type: 'temperature' | 'precipitation' | 'air-quality';
    description: string;
    severity: 'low' | 'medium' | 'high';
    date: string;
  }>;
  aiSummary?: string;
  rawData?: any;
  dataSource?: string;
  dataFreshness?: string;
  dataAge?: string;
  timestamp?: string;
}

interface ClimateChartsContainerProps {
  data: ClimateData;
}

const ClimateChartsContainer: React.FC<ClimateChartsContainerProps> = ({ data }) => {
  // Generate mock air quality historical data only when needed
  const generateMockAQIData = (current: number) => {
    const days = 30;
    const mockData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 40;
      const aqi = Math.max(0, Math.min(500, current + variation));
      
      let level: 'good' | 'moderate' | 'poor' | 'unhealthy' | 'hazardous';
      if (aqi <= 50) level = 'good';
      else if (aqi <= 100) level = 'moderate';
      else if (aqi <= 150) level = 'poor';
      else if (aqi <= 200) level = 'unhealthy';
      else level = 'hazardous';
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        aqi: Math.round(aqi),
        level,
        pollutants: {
          pm25: Math.random() * 100,
          pm10: Math.random() * 150,
          no2: Math.random() * 80,
          o3: Math.random() * 120,
          co: Math.random() * 10
        }
      });
    }
    
    return mockData;
  };

  // Use real data from API - ensure data exists and has proper format
  const temperatureData = data.temperature?.data?.length > 0 
    ? data.temperature.data.map(item => ({
        date: item.date,
        temperature: item.temperature || item.value,
        min: item.min,
        max: item.max,
        historical: item.historical
      }))
    : [];

  const precipitationData = data.precipitation?.data?.length > 0
    ? data.precipitation.data.map(item => ({
        date: item.date,
        precipitation: Math.max(0, item.amount || item.value || 0), // Ensure non-negative and use expected field name
        intensity: item.intensity as 'light' | 'moderate' | 'heavy' | 'extreme' || 'light',
        anomaly: item.anomaly || false,
        historical: item.historical
      }))
    : [];

  const airQualityData = generateMockAQIData(data.airQuality.index);

  return (
    <div className="space-y-6">
      {/* Quick Analytics Summary */}
      <Card className="bg-gradient-aurora/10 backdrop-blur-sm border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-accent" />
            Climate Analytics Overview
          </CardTitle>
          <CardDescription>
            Advanced analysis of climate patterns and trends for {data.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-temperature-warm">
                {data.temperature.current}°C
              </div>
              <div className="text-sm text-muted-foreground">Temperature</div>
              <Badge variant="outline" className="mt-1">
                {data.temperature.trend > 0 ? '+' : ''}{data.temperature.trend.toFixed(1)}°C/decade
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">
                {data.precipitation.current}mm
              </div>
              <div className="text-sm text-muted-foreground">Precipitation</div>
              <Badge variant="outline" className="mt-1">
                {data.precipitation.trend > 0 ? '+' : ''}{data.precipitation.trend.toFixed(1)}%/decade
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-accent">
                {data.airQuality.index}
              </div>
              <div className="text-sm text-muted-foreground">Air Quality Index</div>
              <Badge variant="outline" className="mt-1">
                {data.airQuality.level.charAt(0).toUpperCase() + data.airQuality.level.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Charts */}
      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="temperature" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Temperature
          </TabsTrigger>
          <TabsTrigger value="precipitation" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Precipitation
          </TabsTrigger>
          <TabsTrigger value="air-quality" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Air Quality
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="temperature" className="mt-6">
          <TemperatureChart
            data={temperatureData}
            current={data.temperature.current}
            unit="°C"
            trend={data.temperature.trend}
            anomaly={data.rawData?.temperature?.anomaly || 0}
          />
        </TabsContent>
        
        <TabsContent value="precipitation" className="mt-6">
          <PrecipitationChart
            data={precipitationData}
            currentPrecip={data.precipitation.current}
            unit="mm"
            trend={data.precipitation.trend}
            historicalAverage={data.rawData?.precipitation?.historical_average}
            cumulative={data.rawData?.precipitation?.cumulative}
          />
        </TabsContent>
        
        <TabsContent value="air-quality" className="mt-6">
          <AirQualityChart
            data={airQualityData}
            current={data.airQuality}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClimateChartsContainer;