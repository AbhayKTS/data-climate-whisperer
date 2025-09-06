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
    const { query, latitude, longitude, type } = await req.json();
    
    let result;

    if (type === 'reverse' && latitude && longitude) {
      // Reverse geocoding
      console.log(`Reverse geocoding for lat: ${latitude}, lng: ${longitude}`);
      
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ClimateExplorer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      
      result = {
        address: data.display_name,
        location: {
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon)
        },
        details: {
          country: data.address?.country,
          state: data.address?.state,
          city: data.address?.city || data.address?.town || data.address?.village,
          postcode: data.address?.postcode
        }
      };
    } else if (query) {
      // Forward geocoding
      console.log(`Geocoding query: ${query}`);
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ClimateExplorer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      result = data.map((item: any) => ({
        id: item.place_id,
        name: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        },
        type: item.class,
        country: item.address?.country,
        boundingBox: item.boundingbox
      }));
    } else {
      throw new Error('Invalid request parameters');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in geocode-location function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});