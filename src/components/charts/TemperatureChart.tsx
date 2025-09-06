import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface TemperatureData {
  date: string;
  temperature: number;
  anomaly?: boolean;
  historical?: number;
  trend?: number;
}

interface TemperatureChartProps {
  data: TemperatureData[];
  current: number;
  unit: string;
  trend: number;
  anomaly?: number;
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ 
  data, 
  current, 
  unit, 
  trend, 
  anomaly = 0 
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Generate frequency distribution data
  const frequencyData = React.useMemo(() => {
    const ranges = [
      { range: '<0°C', min: -50, max: 0, count: 0 },
      { range: '0-10°C', min: 0, max: 10, count: 0 },
      { range: '10-20°C', min: 10, max: 20, count: 0 },
      { range: '20-30°C', min: 20, max: 30, count: 0 },
      { range: '30-40°C', min: 30, max: 40, count: 0 },
      { range: '>40°C', min: 40, max: 100, count: 0 },
    ];
    
    data.forEach(item => {
      const temp = item.temperature;
      const range = ranges.find(r => temp >= r.min && temp < r.max);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0);
  }, [data]);

  // Generate change velocity data
  const velocityData = React.useMemo(() => {
    return data.slice(1).map((item, index) => ({
      date: item.date,
      change: item.temperature - data[index].temperature,
      temperature: item.temperature
    }));
  }, [data]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'temperature') return [`${value}${unit}`, 'Temperature'];
    if (name === 'historical') return [`${value}${unit}`, 'Historical Avg'];
    if (name === 'change') return [`${value > 0 ? '+' : ''}${value}${unit}`, 'Daily Change'];
    return [value, name];
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5 text-temperature-warm" />
          Temperature Analysis
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>Current: {current}{unit} | Trend: {trend > 0 ? '+' : ''}{trend.toFixed(2)}°C/decade</span>
          {anomaly !== 0 && (
            <span className={`text-xs px-2 py-1 rounded ${anomaly > 0 ? 'bg-temperature-hot/20 text-temperature-hot' : 'bg-temperature-cool/20 text-temperature-cool'}`}>
              {anomaly > 0 ? '+' : ''}{anomaly.toFixed(1)}°C anomaly
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="frequency">Frequency</TabsTrigger>
            <TabsTrigger value="changes">Changes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4">
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
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={['dataMin - 5', 'dataMax + 5']}
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
                    dataKey="temperature" 
                    stroke="hsl(var(--temperature-warm))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--temperature-warm))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--temperature-warm))' }}
                  />
                  {data.some(d => d.historical) && (
                    <Line 
                      type="monotone" 
                      dataKey="historical" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="frequency" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value) => [value, 'Days']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--temperature-warm))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Distribution of daily temperatures over the selected period
            </p>
          </TabsContent>
          
          <TabsContent value="changes" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
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
                  <Bar 
                    dataKey="change" 
                    fill="hsl(var(--primary))"
                    radius={[2, 2, 2, 2]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground">
              Daily temperature changes showing warming and cooling patterns
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TemperatureChart;