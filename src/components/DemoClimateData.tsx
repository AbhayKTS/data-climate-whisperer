// Demo climate data overlay tiles since OpenWeatherMap requires API key
// These are just for demonstration and won't show real climate data

export const DEMO_CLIMATE_LAYERS = {
  temperature: {
    // Using a demo temperature overlay from OpenWeatherMap
    url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=demo',
    attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
    opacity: 0.6
  },
  precipitation: {
    // Using a demo precipitation overlay
    url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=demo', 
    attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
    opacity: 0.6
  },
  wind: {
    // Using wind data as air quality proxy
    url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=demo',
    attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
    opacity: 0.5
  }
};

// Alternative working climate layers for demonstration
export const WORKING_DEMO_LAYERS = {
  temperature: {
    // Using a simple colored overlay for temperature demonstration
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    attribution: 'Demo Temperature Layer',
    opacity: 0.3
  },
  precipitation: {
    url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    attribution: 'Demo Precipitation Layer', 
    opacity: 0.3
  }
};