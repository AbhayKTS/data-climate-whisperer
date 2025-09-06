import { getLatestRadarTimestamp, generateTemperatureTile, generateWindTile } from '../services/weatherServices';

// Working climate data layers using live services
export const WORKING_CLIMATE_LAYERS = {
  temperature: {
    // Custom temperature visualization using live data
    url: '', // Will be generated dynamically
    attribution: 'Live Temperature Data from Open-Meteo',
    opacity: 0.6,
    fallback: false,
    isLive: true,
    isDynamic: true
  },
  precipitation: {
    // RainViewer precipitation radar with live timestamps
    url: async () => {
      const timestamp = await getLatestRadarTimestamp();
      return `https://tilecache.rainviewer.com/v2/radar/${timestamp}/{z}/{x}/{y}/2/1_1.png`;
    },
    attribution: '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
    opacity: 0.6,
    fallback: false,
    isLive: true,
    isDynamic: true
  },
  wind: {
    // Custom wind pattern visualization using live data
    url: '', // Will be generated dynamically
    attribution: 'Live Wind Data from Open-Meteo',
    opacity: 0.5,
    fallback: false,
    isLive: true,
    isDynamic: true
  }
};

// Custom temperature visualization using actual climate data
export const createTemperatureOverlay = (temperature: number, lat: number, lng: number) => {
  // Generate color based on temperature (-30°C to 50°C range)
  const getTemperatureColor = (temp: number) => {
    const normalizedTemp = Math.max(-30, Math.min(50, temp));
    const ratio = (normalizedTemp + 30) / 80; // 0 to 1
    
    if (ratio < 0.25) return `hsl(240, 100%, ${50 + ratio * 40}%)`; // Blue to light blue
    if (ratio < 0.5) return `hsl(180, 100%, ${50 + (ratio - 0.25) * 40}%)`; // Cyan
    if (ratio < 0.75) return `hsl(60, 100%, ${50 + (ratio - 0.5) * 40}%)`; // Yellow
    return `hsl(0, 100%, ${50 + (ratio - 0.75) * 40}%)`; // Red
  };

  const color = getTemperatureColor(temperature);
  const svgContent = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tempGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.7"/>
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.1"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#tempGradient)"/>
      <text x="128" y="128" text-anchor="middle" fill="white" font-size="24" font-weight="bold">
        ${temperature.toFixed(1)}°C
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Live weather layer generators using real climate data
export const LIVE_CLIMATE_LAYERS = {
  temperature: {
    createTileFunction: (temperature: number, lat: number, lng: number) => {
      return (x: number, y: number, z: number) => {
        return generateTemperatureTile(temperature, lat, lng, x, y, z);
      };
    },
    attribution: 'Live Temperature Data from Open-Meteo API',
    opacity: 0.6
  },
  precipitation: {
    createUrl: async () => {
      const timestamp = await getLatestRadarTimestamp();
      return `https://tilecache.rainviewer.com/v2/radar/${timestamp}/{z}/{x}/{y}/2/1_1.png`;
    },
    attribution: 'Live Precipitation Radar from RainViewer',
    opacity: 0.6
  },
  wind: {
    createTileFunction: (windSpeed: number, windDirection: number, lat: number, lng: number) => {
      return (x: number, y: number, z: number) => {
        return generateWindTile(windSpeed, windDirection, x, y, z);
      };
    },
    attribution: 'Live Wind Data from Open-Meteo API',
    opacity: 0.5
  }
};

// Fallback layers for when live data is unavailable
export const FALLBACK_LAYERS = {
  temperature: {
    createLayer: (temperature?: number, lat?: number, lng?: number) => {
      const url = temperature !== undefined 
        ? createTemperatureOverlay(temperature, lat || 0, lng || 0)
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgyNTUsIDEwMCwgMTAwLCAwLjMpIi8+PC9zdmc+';
      
      return {
        url,
        attribution: temperature !== undefined 
          ? `Live Temperature Data (${temperature.toFixed(1)}°C)` 
          : 'Temperature Simulation Layer',
        opacity: 0.5,
        isLive: temperature !== undefined
      };
    }
  },
  precipitation: {
    createLayer: () => {
      return {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgxMDAsIDEwMCwgMjU1LCAwLjMpIi8+PC9zdmc+',
        attribution: 'Precipitation Simulation Layer',
        opacity: 0.3,
        isLive: false
      };
    }
  },
  wind: {
    createLayer: () => {
      return {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgxMDAsIDI1NSwgMTAwLCAwLjMpIi8+PC9zdmc+',
        attribution: 'Wind Patterns Simulation Layer',
        opacity: 0.3,
        isLive: false
      };
    }
  }
};