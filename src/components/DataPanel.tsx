import React from 'react';
import { TrendingUp, Thermometer, Droplets, Wind, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClimateChartsContainer from './charts/ClimateChartsContainer';

interface ClimateData {
  location: string;
  coordinates?: { lat: number; lng: number };
  temperature: {
    current: number;
    trend: number;
    data: Array<{ date: string; value: number; anomaly?: boolean }>;
  };
  precipitation: {
    current: number;
    trend: number;
    data: Array<{ date: string; value: number; anomaly?: boolean }>;
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

interface DataPanelProps {
  data: ClimateData | null;
  isLoading?: boolean;
}

const DataPanel: React.FC<DataPanelProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded-md w-3/4"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-gradient-ocean rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
          <Thermometer className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Select a Location
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Click anywhere on the map or search for a location to explore climate data and trends.
        </p>
      </div>
    );
  }

  const getAirQualityColor = (level: string) => {
    switch (level) {
      case 'good': return 'bg-air-quality-good';
      case 'moderate': return 'bg-air-quality-moderate';
      case 'poor': return 'bg-air-quality-poor';
      default: return 'bg-muted';
    }
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-warning/30 text-warning border-warning/50';
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted';
    }
  };

  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(2)}°C/decade`;
  };

  return (
    <div className="space-y-4 p-4 h-full overflow-y-auto">
      {/* Location Header */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">{data.location}</h2>
        {data.coordinates && (
          <p className="text-sm text-muted-foreground font-mono">
            {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
          </p>
        )}
        {/* Data Source Information */}
        {data.dataSource && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Badge variant="outline" className={`
              ${data.dataFreshness === 'fresh' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
              ${data.dataFreshness === 'delayed' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : ''}
              ${data.dataFreshness === 'forecast' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : ''}
            `}>
              {data.dataSource === 'weather_station' ? '🌡️ Live Station' : 
               data.dataSource === 'forecast_model' ? '🔮 Forecast Model' : '📡 Satellite'}
            </Badge>
            <span className="text-muted-foreground">
              • Updated: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-4">

      {/* Temperature Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Thermometer className="w-5 h-5 text-temperature-warm" />
            Temperature
          </CardTitle>
          <CardDescription>
            Current: {data.temperature.current}°C | Trend: {formatTrend(data.temperature.trend)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Current Temperature Display */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-temperature-warm"></div>
                <span className="text-sm">Current</span>
              </div>
              <span className="text-lg font-bold">{data.temperature.current}°C</span>
            </div>
            
            {/* Temperature Trend */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {data.temperature.data.slice(-3).map((item, index) => (
                <div key={index} className="p-2 bg-card rounded border">
                  <div className="text-xs text-muted-foreground mb-1">{item.date}</div>
                  <div className="text-sm font-mono">{item.value}°C</div>
                  {item.anomaly && (
                    <div className="w-2 h-2 bg-destructive rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precipitation Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="w-5 h-5 text-primary" />
            Precipitation
          </CardTitle>
          <CardDescription>
            Current: {data.precipitation.current}mm | Trend: {data.precipitation.trend > 0 ? '+' : ''}{data.precipitation.trend}%/decade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-end space-x-1">
            {data.precipitation.data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div 
                  className={`w-full bg-primary/30 rounded-t transition-all duration-300 ${
                    item.anomaly ? 'bg-destructive/30' : ''
                  }`}
                  style={{ 
                    height: `${(item.value / 1000) * 100}%`,
                    minHeight: '4px'
                  }}
                />
                <div className="text-xs text-muted-foreground">{item.date}</div>
                <div className="text-xs font-mono">{item.value}mm</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Air Quality Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="w-5 h-5 text-accent" />
            Air Quality
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            AQI: {data.airQuality.index}
            <Badge className={`${getAirQualityColor(data.airQuality.level)} text-white border-0`}>
              {data.airQuality.level.toUpperCase()}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.airQuality.pollutants.map((pollutant, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{pollutant.name}</span>
                <span className="font-mono">
                  {pollutant.value} {pollutant.unit}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Recent Anomalies
            </CardTitle>
            <CardDescription>
              Significant climate events detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.anomalies.map((anomaly, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getAnomalyColor(anomaly.severity)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{anomaly.description}</p>
                      <p className="text-xs mt-1 opacity-80">{anomaly.date}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {anomaly.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Climate Summary */}
      <Card className="bg-gradient-aurora/10 backdrop-blur-sm border-accent/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-accent" />
            AI Climate Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.aiSummary ? (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {data.aiSummary}
              <p className="text-xs mt-3 text-accent/80">
                🤖 Generated by AI using current climate and air quality data
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground leading-relaxed">
              <div className="animate-shimmer bg-muted/50 h-4 rounded mb-2"></div>
              <div className="animate-shimmer bg-muted/50 h-4 rounded mb-2 w-4/5"></div>
              <div className="animate-shimmer bg-muted/50 h-4 rounded w-3/5"></div>
              <p className="text-xs mt-3 text-accent/80">
                Loading AI-generated climate insights...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          <ClimateChartsContainer data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataPanel;