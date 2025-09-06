// Working climate data layers using free services
export const WORKING_CLIMATE_LAYERS = {
  temperature: {
    // Temperature visualization using color overlay
    url: 'https://api.maptiler.com/tiles/temperature/{z}/{x}/{y}.png?key=demo',
    attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
    opacity: 0.6,
    fallback: true
  },
  precipitation: {
    // RainViewer precipitation radar (working free service)
    url: 'https://tilecache.rainviewer.com/v2/radar/0/{z}/{x}/{y}/2/1_1.png',
    attribution: '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
    opacity: 0.6,
    fallback: false
  },
  wind: {
    // WindyTV wind visualization alternative
    url: 'https://api.windy.com/api/map-forecast/v2/globalWind/{z}/{x}/{y}',
    attribution: '&copy; <a href="https://windy.com/">Windy</a>',
    opacity: 0.5,
    fallback: true
  }
};

// Fallback colored overlays for demo purposes
export const FALLBACK_LAYERS = {
  temperature: {
    // Simple temperature simulation using OpenStreetMap-style tiles with color overlay
    createLayer: () => {
      return {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgyNTUsIDEwMCwgMTAwLCAwLjMpIi8+PC9zdmc+',
        attribution: 'Temperature Simulation Layer',
        opacity: 0.3
      };
    }
  },
  precipitation: {
    createLayer: () => {
      return {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgxMDAsIDEwMCwgMjU1LCAwLjMpIi8+PC9zdmc+',
        attribution: 'Precipitation Simulation Layer',
        opacity: 0.3
      };
    }
  },
  wind: {
    createLayer: () => {
      return {
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0icmdiYSgxMDAsIDI1NSwgMTAwLCAwLjMpIi8+PC9zdmc+',
        attribution: 'Wind Patterns Simulation Layer',
        opacity: 0.3
      };
    }
  }
};