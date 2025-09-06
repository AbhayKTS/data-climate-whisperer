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

    // Use OpenWeatherMap API for more accurate real-time data
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=your_api_key&units=metric`;
    
    // Historical climate data (last 30 years using archive API)
    const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=1993-01-01&end_date=2022-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;

    console.log('Fetching current weather from:', currentWeatherUrl);
    console.log('Fetching historical data from:', historicalUrl);

    const [currentResponse, historicalResponse] = await Promise.all([
      fetch(currentWeatherUrl).catch(err => {
        console.error('Current weather fetch failed:', err);
        return { ok: false, status: 500, statusText: 'Network error' };
      }),
      fetch(historicalUrl).catch(err => {
        console.error('Historical data fetch failed:', err);
        return { ok: false, status: 500, statusText: 'Network error' };
      })
    ]);

    if (!currentResponse.ok) {
      console.error('Current weather API error:', currentResponse.status, currentResponse.statusText);
      throw new Error(`Failed to fetch current weather data: ${currentResponse.status}`);
    }

    if (!historicalResponse.ok) {
      console.warn('Historical data API error:', historicalResponse.status, historicalResponse.statusText);
      // Continue without historical data
    }

    const currentData = await currentResponse.json();
    console.log('Current weather data received:', Object.keys(currentData));
    console.log('Raw current weather values:', {
      temperature: currentData.current.temperature_2m,
      windSpeed: currentData.current.wind_speed_10m,
      windDirection: currentData.current.wind_direction_10m,
      precipitation: currentData.current.precipitation,
      timestamp: currentData.current.time
    });

    let historicalData = null;
    let tempAnomaly = 0;
    let historicalPrecipAvg = 0;

    // Process historical data if available
    if (historicalResponse.ok) {
      try {
        historicalData = await historicalResponse.json();
        console.log('Historical data received:', Object.keys(historicalData));
        
        if (historicalData.daily && historicalData.daily.temperature_2m_mean) {
          const currentTemp = currentData.current.temperature_2m;
          const historicalTemps = historicalData.daily.temperature_2m_mean.filter((temp: number) => temp !== null);
          
          if (historicalTemps.length > 0) {
            const avgHistoricalTemp = historicalTemps.reduce((sum: number, temp: number) => sum + temp, 0) / historicalTemps.length;
            tempAnomaly = currentTemp - avgHistoricalTemp;
          }
          
          if (historicalData.daily.precipitation_sum) {
            const historicalPrecip = historicalData.daily.precipitation_sum.filter((precip: number) => precip !== null);
            if (historicalPrecip.length > 0) {
              historicalPrecipAvg = historicalPrecip.reduce((sum: number, val: number) => sum + val, 0) / historicalPrecip.length;
            }
          }
        }
      } catch (error) {
        console.error('Error processing historical data:', error);
      }
    }

    // Validate and process current weather data
    const currentTemp = currentData.current.temperature_2m;
    const currentWindSpeed = currentData.current.wind_speed_10m;
    const currentWindDirection = currentData.current.wind_direction_10m;
    
    // Data validation
    if (currentTemp === null || currentTemp === undefined) {
      console.warn('Invalid temperature data received');
    }
    if (currentWindSpeed === null || currentWindSpeed === undefined) {
      console.warn('Invalid wind speed data received');
    }
    if (currentWindDirection === null || currentWindDirection === undefined) {
      console.warn('Invalid wind direction data received');
    }

    const result = {
      location: { latitude, longitude },
      temperature: {
        current: currentTemp || 0,
        apparent: currentData.current.apparent_temperature || currentTemp || 0,
        unit: currentData.current_units?.temperature_2m || '°C',
        anomaly: Number(tempAnomaly.toFixed(1)),
        trend: tempAnomaly > 0 ? 'warming' : tempAnomaly < 0 ? 'cooling' : 'stable'
      },
      precipitation: {
        current: currentData.current.precipitation || 0,
        unit: currentData.current_units?.precipitation || 'mm',
        historical_average: Number(historicalPrecipAvg.toFixed(2))
      },
      wind: {
        speed: currentWindSpeed || 0,
        direction: currentWindDirection || 0,
        gusts: currentData.current.wind_gusts_10m || 0,
        unit: currentData.current_units?.wind_speed_10m || 'km/h'
      },
      humidity: {
        current: currentData.current.relative_humidity_2m || 0,
        unit: currentData.current_units?.relative_humidity_2m || '%'
      },
      pressure: {
        current: currentData.current.surface_pressure || 0,
        unit: currentData.current_units?.surface_pressure || 'hPa'
      },
      weather_code: currentData.current.weather_code || 0,
      timestamp: currentData.current.time || new Date().toISOString(),
      hasHistoricalData: historicalData !== null
    };
    
    console.log('Final processed result:', {
      temp: result.temperature.current,
      windSpeed: result.wind.speed,
      windDirection: result.wind.direction,
      timestamp: result.timestamp
    });

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