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
    const { latitude, longitude } = await req.json();
    
    console.log(`Fetching air quality data for lat: ${latitude}, lng: ${longitude}`);

    // Use Open-Meteo Air Quality API (free)
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;

    const response = await fetch(airQualityUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch air quality data');
    }

    const data = await response.json();

    // Calculate AQI based on PM2.5 levels (simplified US AQI calculation)
    const pm25 = data.current.pm2_5;
    let aqi = 0;
    let aqiCategory = 'Good';

    if (pm25 <= 12) {
      aqi = Math.round((50 / 12) * pm25);
      aqiCategory = 'Good';
    } else if (pm25 <= 35.4) {
      aqi = Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
      aqiCategory = 'Moderate';
    } else if (pm25 <= 55.4) {
      aqi = Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
      aqiCategory = 'Unhealthy for Sensitive Groups';
    } else if (pm25 <= 150.4) {
      aqi = Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
      aqiCategory = 'Unhealthy';
    } else {
      aqi = Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
      aqiCategory = 'Very Unhealthy';
    }

    const result = {
      location: { latitude, longitude },
      aqi: {
        value: aqi,
        category: aqiCategory,
        primaryPollutant: 'PM2.5'
      },
      pollutants: {
        pm25: {
          value: data.current.pm2_5,
          unit: data.current_units.pm2_5
        },
        pm10: {
          value: data.current.pm10,
          unit: data.current_units.pm10
        },
        no2: {
          value: data.current.nitrogen_dioxide,
          unit: data.current_units.nitrogen_dioxide
        },
        o3: {
          value: data.current.ozone,
          unit: data.current_units.ozone
        },
        co: {
          value: data.current.carbon_monoxide,
          unit: data.current_units.carbon_monoxide
        }
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-air-quality function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});