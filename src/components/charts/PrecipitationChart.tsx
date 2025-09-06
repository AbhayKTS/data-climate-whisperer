import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Droplets, Cloud, Zap } from 'lucide-react';

interface PrecipitationData {
  date: string;
  precipitation: number;
  intensity?: 'light' | 'moderate' | 'heavy' | 'extreme' | 'none';
  anomaly?: boolean;
  historical?: number;
  isLive?: boolean;
  time?: string;
}

interface PrecipitationChartProps {
  data: PrecipitationData[];
  currentPrecip: number;
  unit: string;
  trend: number;
  historicalAverage?: number;
  cumulative?: {
    last24h: number;
    last7days: number;
    last30days: number;
  };
}

const PrecipitationChart: React.FC<PrecipitationChartProps> = ({ 
  data, 
  currentPrecip, 
  unit, 
  trend,
  historicalAverage = 0,
  cumulative
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Calculate precipitation patterns
  const patterns = React.useMemo(() => {
    const dryDays = data.filter(d => d.precipitation === 0).length;
    const wetDays = data.filter(d => d.precipitation > 0).length;
    const extremeDays = data.filter(d => d.precipitation > 50).length;
    
    return [
      { category: 'Dry Days', count: dryDays, percentage: (dryDays / data.length) * 100 },
      { category: 'Light Rain', count: data.filter(d => d.precipitation > 0 && d.precipitation <= 5).length, percentage: 0 },
      { category: 'Moderate Rain', count: data.filter(d => d.precipitation > 5 && d.precipitation <= 25).length, percentage: 0 },
      { category: 'Heavy Rain', count: data.filter(d => d.precipitation > 25 && d.precipitation <= 50).length, percentage: 0 },
      { category: 'Extreme Rain', count: extremeDays, percentage: (extremeDays / data.length) * 100 },
    ].map(item => ({
      ...item,
      percentage: (item.count / data.length) * 100
    }));
  }, [data]);

  // Monthly accumulation data
  const monthlyData = React.useMemo(() => {
    const monthlyMap = new Map();
    
    data.forEach(item => {
      const month = item.date.substring(0, 7); // YYYY-MM
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { month, total: 0, days: 0, average: 0 });
      }
      const entry = monthlyMap.get(month);
      entry.total += item.precipitation;
      entry.days += 1;
      entry.average = entry.total / entry.days;
    });
    
    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // Intensity analysis
  const intensityData = React.useMemo(() => {
    return data.map(item => ({
      date: item.date,
      precipitation: item.precipitation,
      intensity: item.precipitation === 0 ? 0 : 
                 item.precipitation <= 5 ? 1 :
                 item.precipitation <= 25 ? 2 :
                 item.precipitation <= 50 ? 3 : 4,
      anomaly: item.anomaly
    }));
  }, [data]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'precipitation' || name === 'total') return [`${value}${unit}`, 'Precipitation'];
    if (name === 'historical') return [`${value}${unit}`, 'Historical Avg'];
    if (name === 'intensity') {
      const levels = ['None', 'Light', 'Moderate', 'Heavy', 'Extreme'];
      return [levels[value] || 'Unknown', 'Intensity'];
    }
    return [value, name];
  };

  const getIntensityColor = (intensity: number) => {
    const colors = [
      'hsl(var(--muted))',          // No rain
      'hsl(var(--primary) / 0.3)',  // Light
      'hsl(var(--primary) / 0.6)',  // Moderate  
      'hsl(var(--primary) / 0.9)',  // Heavy
      'hsl(var(--destructive))'     // Extreme
    ];
    return colors[intensity] || colors[0];
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="w-5 h-5 text-primary" />
          Live Precipitation Data
          {data.some(d => d.isLive) && (
            <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded">LIVE</span>
          )}
        </CardTitle>
        <CardDescription className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Current: {currentPrecip}{unit}/h | {data.some(d => d.isLive) ? 'Real-time hourly data' : 'Historical daily data'}</span>
            {historicalAverage > 0 && (
              <span className="text-xs text-muted-foreground">
                Historical avg: {historicalAverage.toFixed(1)}{unit}
              </span>
            )}
          </div>
          {cumulative && (
            <div className="flex gap-4 text-xs font-medium">
              <span className={cumulative.last24h > 25 ? 'text-red-500' : cumulative.last24h > 10 ? 'text-yellow-500' : 'text-foreground'}>
                24h: {cumulative.last24h.toFixed(1)}{unit}
              </span>
              <span className={cumulative.last7days > 100 ? 'text-red-500' : cumulative.last7days > 50 ? 'text-yellow-500' : 'text-foreground'}>
                7d: {cumulative.last7days.toFixed(1)}{unit}
              </span>
              <span className={cumulative.last30days > 200 ? 'text-red-500' : cumulative.last30days > 100 ? 'text-yellow-500' : 'text-foreground'}>
                30d: {cumulative.last30days.toFixed(1)}{unit}
              </span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live">Live Data</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="intensity">Intensity</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
          </TabsList>
          
          <TabsContent value="live" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    interval="preserveStartEnd"
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
                  <Area
                    type="monotone"
                    dataKey="precipitation"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.3)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.some(d => d.isLive) ? 'Real-time precipitation measurements from the last 48 hours' : 'Recent precipitation data'}
            </p>
          </TabsContent>
          
          <TabsContent value="patterns" className="space-y-4">
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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
                  <Area
                    type="monotone"
                    dataKey="precipitation"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.3)"
                    strokeWidth={2}
                  />
                  {data.some(d => d.historical) && (
                    <Area
                      type="monotone"
                      dataKey="historical"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground) / 0.1)"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="intensity" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={intensityData}>
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
                  <Scatter 
                    dataKey="precipitation" 
                    fill="hsl(var(--primary))"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {['None', 'Light', 'Moderate', 'Heavy', 'Extreme'].map((level, index) => (
                <div key={level} className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: getIntensityColor(index) }}
                  />
                  <span>{level}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
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
                    dataKey="total" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly precipitation totals showing seasonal patterns
            </p>
          </TabsContent>
          
          <TabsContent value="frequency" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? `${value} days` : `${typeof value === 'number' ? value.toFixed(1) : value}%`,
                      name === 'count' ? 'Days' : 'Percentage'
                    ]}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Frequency distribution of different precipitation intensities
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PrecipitationChart;