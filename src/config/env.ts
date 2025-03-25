// Environment configuration for CRA
interface AppEnv {
  API_URL: string;
  WINDY_API_KEY: string;
  MAP_CENTER_LAT: number;
  MAP_CENTER_LNG: number;
  MAP_DEFAULT_ZOOM: number;
  DETAILED_TILES_URL: string;
}

// Runtime environment variables (for Docker deployment)
declare global {
  interface Window {
    _env_?: {
      [key: string]: string;
    };
  }
}

// Helper to get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Check if window._env_ exists (runtime env variables)
  if (window._env_ && window._env_[`REACT_APP_${key}`]) {
    return window._env_[`REACT_APP_${key}`];
  }
  
  // Check process.env (build-time env variables)
  const envVar = process.env[`REACT_APP_${key}`];
  if (envVar !== undefined) {
    return envVar;
  }
  
  // Return fallback value
  return fallback;
};

// Parse numeric values
const parseNumber = (value: string, fallback: number): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

// Environment configuration
export const env: AppEnv = {
  API_URL: getEnvVar('API_URL', 'http://localhost:3001/api'),
  WINDY_API_KEY: getEnvVar('WINDY_API_KEY', ''),
  MAP_CENTER_LAT: parseNumber(getEnvVar('MAP_CENTER_LAT', '10.835'), 10.835),
  MAP_CENTER_LNG: parseNumber(getEnvVar('MAP_CENTER_LNG', '106.769'), 106.769),
  MAP_DEFAULT_ZOOM: parseNumber(getEnvVar('MAP_DEFAULT_ZOOM', '9'), 9),
  DETAILED_TILES_URL: getEnvVar('DETAILED_TILES_URL', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
};