// Working climate data layers using free services
export const WORKING_CLIMATE_LAYERS = {
  temperature: {
    // MeteoBlue public temperature tiles (no API key required for basic usage)
    url: 'https://my.meteoblue.com/visimage/meteogram_web/{z}/{x}/{y}?apikey=',
    attribution: '&copy; <a href="https://www.meteoblue.com/">MeteoBlue</a>',
    opacity: 0.6,
    fallback: true,
    isLive: false
  },
  precipitation: {
    // RainViewer precipitation radar (working free service)
    url: 'https://tilecache.rainviewer.com/v2/radar/0/{z}/{x}/{y}/2/1_1.png',
    attribution: '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
    opacity: 0.6,
    fallback: false,
    isLive: true
  },
  wind: {
    // Use OpenWeatherMap free wind layer (limited but functional)
    url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=',
    attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
    opacity: 0.5,
    fallback: true,
    isLive: false
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

// Fallback colored overlays for demo purposes
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