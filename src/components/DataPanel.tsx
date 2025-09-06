import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ClimateChartsContainer from "./charts/ClimateChartsContainer";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Interface definitions
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
    cumulative?: {
      last24h: number;
      last7days: number;
      last30days: number;
    };
    data: Array<{ date: string; amount?: number; value?: number; intensity?: string; anomaly?: boolean; historical?: number; hours?: number }>;
  };
  airQuality: {
    index: number;
    aqi?: number;
    level: 'good' | 'moderate' | 'poor' | 'unhealthy';
    pollutants: Array<{ name: string; value: number; unit: string }> | {
      pm25: number;
      pm10: number;
      o3: number;
      no2: number;
    };
  };
  anomalies: Array<{
    type: 'temperature' | 'precipitation' | 'air-quality' | string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    date?: string;
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

export const DataPanel: React.FC<DataPanelProps> = ({ data, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState('en');
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const { toast } = useToast();
  
  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    const userQuestion = question;
    setQuestion('');
    
    // Add user question to chat
    setChatHistory(prev => [...prev, { type: 'user', message: userQuestion }]);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: { 
          message: userQuestion, 
          language, 
          climateData: data 
        }
      });
      
      if (error) throw error;
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { type: 'ai', message: response.answer }]);
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Helper functions
  const getAirQualityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'good': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'moderate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'unhealthy': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const formatTrend = (trend: number) => {
    return trend > 0 ? `+${trend.toFixed(1)}°C` : `${trend.toFixed(1)}°C`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg">Select a location to view climate data</p>
          <p className="text-sm text-muted-foreground">Advanced Climate Analytics Platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-foreground mb-1">{data.location}</h2>
        {data.coordinates && (
          <p className="text-sm text-muted-foreground">
            {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
          </p>
        )}
        {/* Data Source Information */}
        {data.dataSource && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              • Updated: {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-y-auto space-y-4 mt-4">
            {/* Temperature */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{data.temperature.current.toFixed(1)}°C</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    data.temperature.trend > 0 ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {formatTrend(data.temperature.trend)}
                  </span>
                </div>
            </CardContent>
          </Card>

          {/* Precipitation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Precipitation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Rate</span>
                  <span className="text-lg font-semibold">{data.precipitation.current.toFixed(1)} mm/h</span>
                </div>
                
                {data.precipitation.cumulative && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Cumulative Totals</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-muted/30 rounded text-center">
                        <div className="text-xs text-muted-foreground">24h</div>
                        <div className="text-sm font-bold">{(data.precipitation.cumulative?.last24h || 0).toFixed(1)}mm</div>
                      </div>
                      <div className="p-2 bg-muted/30 rounded text-center">
                        <div className="text-xs text-muted-foreground">7d</div>
                        <div className="text-sm font-bold">{(data.precipitation.cumulative?.last7days || 0).toFixed(1)}mm</div>
                      </div>
                      <div className="p-2 bg-muted/30 rounded text-center">
                        <div className="text-xs text-muted-foreground">30d</div>
                        <div className="text-sm font-bold">{(data.precipitation.cumulative?.last30days || 0).toFixed(1)}mm</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Air Quality */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Air Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold">{(data.airQuality.aqi || data.airQuality.index).toFixed(0)}</span>
                <Badge variant="outline" className={getAirQualityColor(data.airQuality.level)}>
                  {data.airQuality.level}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Array.isArray(data.airQuality.pollutants) ? (
                  data.airQuality.pollutants.map((pollutant, index) => (
                    <div key={index}>{pollutant.name}: {pollutant.value} {pollutant.unit}</div>
                  ))
                ) : (
                  <>
                    <div>PM2.5: {data.airQuality.pollutants.pm25} μg/m³</div>
                    <div>PM10: {data.airQuality.pollutants.pm10} μg/m³</div>
                    <div>O₃: {data.airQuality.pollutants.o3} μg/m³</div>
                    <div>NO₂: {data.airQuality.pollutants.no2} μg/m³</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Climate Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              {data.anomalies.length > 0 ? (
                <div className="space-y-2">
                  {data.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className={getAnomalyColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{anomaly.type}</div>
                        <div className="text-xs text-muted-foreground">{anomaly.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant anomalies detected</p>
              )}
            </CardContent>
          </Card>

          {/* Climate Intelligence Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Climate Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md text-sm leading-relaxed">
                {data.aiSummary || "Select a location to get detailed climate insights and forecasts generated by advanced climate models."}
              </div>
              
              {/* Interactive Q&A Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Ask Climate Questions</span>
                </div>
                
                {/* Language Selection */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Language:</span>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Chat History */}
                {chatHistory.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-2 mb-3 p-2 bg-muted/30 rounded">
                    {chatHistory.map((item, index) => (
                      <div key={index} className={`text-xs p-2 rounded ${
                        item.type === 'user' 
                          ? 'bg-primary/10 text-primary ml-4' 
                          : 'bg-secondary/50 mr-4'
                      }`}>
                        <div className="font-medium mb-1">
                          {item.type === 'user' ? 'You' : 'Climate AI'}
                        </div>
                        <div>{item.message}</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Question Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about climate patterns, forecasts, or environmental data..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-sm"
                    disabled={isAsking}
                  />
                  <Button 
                    onClick={handleAskQuestion} 
                    disabled={!question.trim() || isAsking}
                    size="sm"
                    className="px-3"
                  >
                    {isAsking ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="flex-1 overflow-y-auto mt-4">
          <ClimateChartsContainer data={data} />
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
};