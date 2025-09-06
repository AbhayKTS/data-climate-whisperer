import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, startDate, endDate } = await req.json();
    
    console.log(`Fetching climate data for lat: ${latitude}, lng: ${longitude}`);

    // Current weather data from Open-Meteo
    const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m&timezone=auto`;
    
    // Historical data for anomaly detection
    const historicalUrl = `https://api.open-meteo.com/v1/climate?latitude=${latitude}&longitude=${longitude}&start_date=${startDate || '2020-01-01'}&end_date=${endDate || '2023-12-31'}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;

    const [currentResponse, historicalResponse] = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(historicalUrl)
    ]);

    if (!currentResponse.ok || !historicalResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const currentData = await currentResponse.json();
    const historicalData = await historicalResponse.json();

    // Calculate temperature anomaly
    const currentTemp = currentData.current.temperature_2m;
    const historicalTemps = historicalData.daily.temperature_2m_mean;
    const avgHistoricalTemp = historicalTemps.reduce((sum: number, temp: number) => sum + temp, 0) / historicalTemps.length;
    const tempAnomaly = currentTemp - avgHistoricalTemp;

    const result = {
      location: { latitude, longitude },
      temperature: {
        current: currentTemp,
        unit: currentData.current_units.temperature_2m,
        anomaly: Number(tempAnomaly.toFixed(1)),
        trend: tempAnomaly > 0 ? 'warming' : 'cooling'
      },
      precipitation: {
        current: currentData.current.precipitation,
        unit: currentData.current_units.precipitation,
        historical_average: historicalData.daily.precipitation_sum.reduce((sum: number, val: number) => sum + val, 0) / historicalData.daily.precipitation_sum.length
      },
      wind: {
        speed: currentData.current.wind_speed_10m,
        unit: currentData.current_units.wind_speed_10m
      },
      humidity: {
        current: currentData.current.relative_humidity_2m,
        unit: currentData.current_units.relative_humidity_2m
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-climate-data function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});