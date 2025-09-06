// Weather data services for live climate layers

export interface RainViewerRadarFrame {
  path: string;
  time: number;
}

export interface RainViewerResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerRadarFrame[];
    nowcast: RainViewerRadarFrame[];
  };
  satellite: {
    infrared: RainViewerRadarFrame[];
  };
}

// Get latest RainViewer radar timestamp
export const getLatestRadarTimestamp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data: RainViewerResponse = await response.json();
    
    // Get the latest radar frame
    const latestFrame = data.radar.past[data.radar.past.length - 1] || data.radar.past[0];
    
    if (latestFrame) {
      return latestFrame.time.toString();
    }
    
    // Fallback to current timestamp minus 10 minutes
    return Math.floor((Date.now() - 600000) / 1000).toString();
  } catch (error) {
    console.error('Error fetching RainViewer data:', error);
    // Fallback to current timestamp minus 10 minutes
    return Math.floor((Date.now() - 600000) / 1000).toString();
  }
};

// Generate temperature tile overlay using real data
export const generateTemperatureTile = (
  temperature: number,
  lat: number,
  lng: number,
  x: number,
  y: number,
  z: number
): string => {
  const getTemperatureColor = (temp: number) => {
    const normalizedTemp = Math.max(-40, Math.min(60, temp));
    const ratio = (normalizedTemp + 40) / 100; // 0 to 1
    
    if (ratio < 0.2) return { r: 0, g: 0, b: 255, a: 0.6 }; // Deep blue (cold)
    if (ratio < 0.4) return { r: 0, g: 255, b: 255, a: 0.6 }; // Cyan (cool)
    if (ratio < 0.6) return { r: 0, g: 255, b: 0, a: 0.6 }; // Green (mild)
    if (ratio < 0.8) return { r: 255, g: 255, b: 0, a: 0.6 }; // Yellow (warm)
    return { r: 255, g: 0, b: 0, a: 0.6 }; // Red (hot)
  };

  const color = getTemperatureColor(temperature);
  
  const svgContent = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tempGradient${x}${y}${z}" cx="50%" cy="50%" r="70%">
          <stop offset="0%" style="stop-color:rgba(${color.r},${color.g},${color.b},${color.a})"/>
          <stop offset="70%" style="stop-color:rgba(${color.r},${color.g},${color.b},${color.a * 0.3})"/>
          <stop offset="100%" style="stop-color:rgba(${color.r},${color.g},${color.b},0)"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#tempGradient${x}${y}${z})"/>
      ${z > 3 ? `<text x="128" y="128" text-anchor="middle" fill="white" font-size="${Math.max(12, 24 - z)}" font-weight="bold" text-shadow="1px 1px 2px rgba(0,0,0,0.7)">
        ${temperature.toFixed(1)}°C
      </text>` : ''}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Wind pattern visualization
export const generateWindTile = (
  windSpeed: number,
  windDirection: number,
  x: number,
  y: number,
  z: number
): string => {
  const getWindColor = (speed: number) => {
    const normalizedSpeed = Math.max(0, Math.min(50, speed));
    const ratio = normalizedSpeed / 50;
    
    if (ratio < 0.2) return { r: 100, g: 255, b: 100, a: 0.4 }; // Light green (calm)
    if (ratio < 0.4) return { r: 255, g: 255, b: 0, a: 0.5 }; // Yellow (light breeze)
    if (ratio < 0.6) return { r: 255, g: 165, b: 0, a: 0.6 }; // Orange (moderate)
    if (ratio < 0.8) return { r: 255, g: 0, b: 0, a: 0.7 }; // Red (strong)
    return { r: 139, g: 0, b: 139, a: 0.8 }; // Purple (very strong)
  };

  const color = getWindColor(windSpeed);
  const arrowSize = Math.max(20, Math.min(60, windSpeed * 1.2));
  
  // Convert wind direction to arrow rotation
  const rotation = windDirection;
  
  const svgContent = `
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="windPattern${x}${y}${z}" patternUnits="userSpaceOnUse" width="64" height="64">
          <circle cx="32" cy="32" r="2" fill="rgba(${color.r},${color.g},${color.b},${color.a * 0.3})"/>
          ${windSpeed > 5 ? `
            <g transform="translate(32,32) rotate(${rotation})">
              <path d="M 0,-${arrowSize/4} L ${arrowSize/8},-${arrowSize/8} L 0,${arrowSize/4} L -${arrowSize/8},-${arrowSize/8} Z" 
                    fill="rgba(${color.r},${color.g},${color.b},${color.a})" 
                    stroke="white" 
                    stroke-width="0.5"/>
            </g>
          ` : ''}
        </pattern>
      </defs>
      <rect width="256" height="256" fill="url(#windPattern${x}${y}${z})"/>
      ${z > 4 ? `<text x="128" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold" text-shadow="1px 1px 2px rgba(0,0,0,0.7)">
        ${windSpeed.toFixed(1)} m/s
      </text>` : ''}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

// Create custom tile layer with dynamic content
export const createCustomTileLayer = (
  layerType: 'temperature' | 'wind',
  data: { temperature?: number; windSpeed?: number; windDirection?: number },
  lat: number,
  lng: number
) => {
  return (x: number, y: number, z: number) => {
    switch (layerType) {
      case 'temperature':
        return data.temperature !== undefined 
          ? generateTemperatureTile(data.temperature, lat, lng, x, y, z)
          : null;
      case 'wind':
        return data.windSpeed !== undefined && data.windDirection !== undefined
          ? generateWindTile(data.windSpeed, data.windDirection, x, y, z)
          : null;
      default:
        return null;
    }
  };
};