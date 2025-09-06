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
    const { climateData, airQualityData, locationName } = await req.json();
    
    console.log(`Generating AI summary for location: ${locationName}`);

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    const prompt = `Generate a concise climate analysis for ${locationName} based on the following data:

Climate Data:
- Current temperature: ${climateData.temperature.current}°C
- Temperature anomaly: ${climateData.temperature.anomaly}°C (${climateData.temperature.trend})
- Precipitation: ${climateData.precipitation.current}mm
- Wind speed: ${climateData.wind.speed} km/h
- Humidity: ${climateData.humidity.current}%

Air Quality Data:
- AQI: ${airQualityData.aqi.value} (${airQualityData.aqi.category})
- PM2.5: ${airQualityData.pollutants.pm25.value} μg/m³
- PM10: ${airQualityData.pollutants.pm10.value} μg/m³

Please provide:
1. A brief assessment of current conditions
2. Any notable climate anomalies or trends
3. Air quality implications for health
4. A 2-3 sentence overall summary

Keep the response under 200 words and focus on actionable insights.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.candidates[0].content.parts[0].text;

    const result = {
      summary,
      locationName,
      timestamp: new Date().toISOString(),
      dataUsed: {
        temperature: climateData.temperature.current,
        aqi: airQualityData.aqi.value,
        anomaly: climateData.temperature.anomaly
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});