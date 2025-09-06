import React, { useState } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertTriangle, Activity } from 'lucide-react';

interface AirQualityData {
  date: string;
  aqi: number;
  level: 'good' | 'moderate' | 'poor' | 'unhealthy' | 'hazardous';
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
  };
}

interface AirQualityChartProps {
  data: AirQualityData[];
  current: {
    index: number;
    level: string;
    pollutants: Array<{ name: string; value: number; unit: string }>;
  };
}

const AirQualityChart: React.FC<AirQualityChartProps> = ({ data, current }) => {
  const [selectedPollutant, setSelectedPollutant] = useState<string>('pm25');
  
  // AQI level distribution
  const levelDistribution = React.useMemo(() => {
    const distribution = {
      good: 0,
      moderate: 0,
      poor: 0,
      unhealthy: 0,
      hazardous: 0
    };
    
    data.forEach(item => {
      distribution[item.level as keyof typeof distribution]++;
    });
    
    return Object.entries(distribution).map(([level, count]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
      percentage: (count / data.length) * 100,
      fill: getAQIColor(level)
    }));
  }, [data]);

  // Pollutant trends
  const pollutantTrends = React.useMemo(() => {
    return data.map(item => ({
      date: item.date,
      pm25: item.pollutants.pm25,
      pm10: item.pollutants.pm10,
      no2: item.pollutants.no2,
      o3: item.pollutants.o3,
      co: item.pollutants.co,
      aqi: item.aqi
    }));
  }, [data]);

  // Current AQI radial data
  const radialData = [
    {
      name: 'AQI',
      value: current.index,
      fill: getAQIColorByValue(current.index)
    }
  ];

  function getAQIColor(level: string) {
    switch (level.toLowerCase()) {
      case 'good': return 'hsl(var(--air-quality-good))';
      case 'moderate': return 'hsl(var(--air-quality-moderate))';
      case 'poor':
      case 'unhealthy': 
      case 'hazardous': return 'hsl(var(--air-quality-poor))';
      default: return 'hsl(var(--muted))';
    }
  }

  function getAQIColorByValue(aqi: number) {
    if (aqi <= 50) return 'hsl(var(--air-quality-good))';
    if (aqi <= 100) return 'hsl(var(--air-quality-moderate))';
    return 'hsl(var(--air-quality-poor))';
  }

  const formatTooltip = (value: any, name: string) => {
    if (name === 'aqi') return [value, 'AQI'];
    if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Percentage'];
    return [`${value} μg/m³`, name.toUpperCase()];
  };

  const pollutantOptions = [
    { key: 'pm25', name: 'PM2.5', color: 'hsl(var(--destructive))' },
    { key: 'pm10', name: 'PM10', color: 'hsl(var(--warning))' },
    { key: 'no2', name: 'NO₂', color: 'hsl(var(--primary))' },
    { key: 'o3', name: 'O₃', color: 'hsl(var(--accent))' },
    { key: 'co', name: 'CO', color: 'hsl(var(--muted-foreground))' }
  ];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wind className="w-5 h-5 text-accent" />
          Air Quality Analysis
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Current AQI: {current.index}</span>
          <Badge className={`${getAQIColor(current.level)} text-white border-0`}>
            {current.level.toUpperCase()}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48">
                <h4 className="text-sm font-medium mb-2">Current AQI</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill={radialData[0].fill}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {current.index}
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Current Pollutants</h4>
                {current.pollutants.map((pollutant, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="text-sm font-medium">{pollutant.name}</span>
                    <span className="text-sm font-mono">
                      {pollutant.value} {pollutant.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pollutantTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aqi" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Air Quality Index trends over time
            </p>
          </TabsContent>
          
          <TabsContent value="pollutants" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {pollutantOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setSelectedPollutant(option.key)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedPollutant === option.key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pollutantTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={selectedPollutant} 
                    stroke={pollutantOptions.find(p => p.key === selectedPollutant)?.color || 'hsl(var(--primary))'} 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="level" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="percentage" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Distribution of air quality levels over the selected period
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AirQualityChart;