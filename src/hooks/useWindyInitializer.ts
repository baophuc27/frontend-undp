// src/hooks/useWindyInitializer.ts
import { useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import { WindyOptions } from '../types/map';
import { env } from '../config/env';

// Define the complete Windy API interface
interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
    close: () => void;
    getParams: () => any;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
    fire: (event: string, data?: any) => void;
    // Note: Windy broadcast doesn't have an 'off' method
  };
  overlays: {
    [key: string]: () => void;
  };
  map: L.Map;
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    on: (key: string, callback: (value: any) => void) => void;
    // Note: Windy store doesn't have an 'off' method for removing listeners
  };
  products: {
    availableLevels: string[];
    availableOverlays: string[];
    availableTimestamps: number[];
  };
  utils: {
    wind2obj: (uv: [number, number]) => { wind: number; dir: number };
    dateFormat: (timestamp: number) => string;
  };
  [key: string]: any; // Allow for additional properties
}
interface UseWindyInitializerReturn {
  initializeWindy: (mapContainer: HTMLElement, initialOptions?: Partial<WindyOptions>) => Promise<void>;
  windyInstance: WindyAPI | null;
  isLoading: boolean;
  error: Error | null;
  leafletMap: L.Map | null;
}

declare global {
  interface Window {
    L: typeof L;
    windyInit?: (options: any, callback: (api: WindyAPI) => void) => void;
    W: any;
  }
}

export const useWindyInitializer = (): UseWindyInitializerReturn => {
  const [windyInstance, setWindyInstance] = useState<WindyAPI | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const initializationAttemptedRef = useRef<boolean>(false);
  
  // Default Windy options
  const defaultOptions: WindyOptions = {
    key: env.WINDY_API_KEY || "3HFvxAW5zvdalES1JlOw6kNyHybrp1j7",
    verbose: true,
    plugin: 'windy-plugin-api',
    lat: 10.8415958,
    lon: 106.751815,
    zoom: 13,
    overlay: 'wind',
    level: 'surface',
    hourFormat: '24h',
    graticule: true,
    // Default units
    units: {
      temperature: 'C',
      wind: 'm/s',
      pressure: 'hPa',
      distance: 'km'
    }
  };

  // Initialize Windy with a DOM container
  const initializeWindy = useCallback(async (
    mapContainer: HTMLElement, 
    initialOptions: Partial<WindyOptions> = {}
  ): Promise<void> => {
    // Ensure container has id="windy" which is required by Windy API
    if (mapContainer.id !== 'windy') {
      console.warn('Container element should have id="windy" for Windy API to work properly');
      mapContainer.id = 'windy';
    }
    
    // Prevent multiple initialization attempts
    if (initializationAttemptedRef.current || windyInstance) {
      console.log('Initialization already attempted or Windy instance exists');
      return;
    }

    // Check if Leaflet and Windy are available
    if (!window.L || typeof window.windyInit !== 'function') {
      console.error('Leaflet or Windy scripts not loaded yet.');
      console.log('Leaflet available:', !!window.L);
      console.log('windyInit available:', typeof window.windyInit === 'function');
      setError(new Error('Required scripts not loaded yet'));
      return Promise.reject(new Error('Required scripts not loaded yet'));
    }

    // At this point we're sure windyInit exists, but TypeScript doesn't know that
    // Type assertion to tell TypeScript that windyInit is definitely a function
    const windyInitFn = window.windyInit as (options: any, callback: (api: WindyAPI) => void) => void;

    initializationAttemptedRef.current = true;
    setIsLoading(true);
    console.log('Starting Windy initialization...');

    try {
      // Combine default options with any provided initialOptions
      const options = {
        ...defaultOptions,
        ...initialOptions,
      };

      console.log('Initializing Windy with options:', options);

      return new Promise<void>((resolve, reject) => {
        try {
          // Use the type-asserted function
          windyInitFn(options, (windyAPI: WindyAPI) => {
            console.log('Windy initialized successfully with API');
            
            // Configure Windy display options
            if (options.units) {
              const { units } = options;
              if (units.temperature) windyAPI.store.set('tempUnit', units.temperature);
              if (units.wind) windyAPI.store.set('windUnit', units.wind);
              if (units.pressure) windyAPI.store.set('pressureUnit', units.pressure);
              if (units.distance) windyAPI.store.set('distanceUnit', units.distance);
            }
            
            // Set graticule option if specified
            if (options.graticule !== undefined) {
              windyAPI.store.set('graticule', options.graticule);
            }
            
            // Set hour format if specified
            if (options.hourFormat) {
              windyAPI.store.set('hourFormat', options.hourFormat);
            }
            
            // Register listener for overlay changes
            windyAPI.store.on('overlay', (overlay: string) => {
              console.log('Overlay changed to:', overlay);
            });
            
            // Register listener for level changes
            windyAPI.store.on('level', (level: string) => {
              console.log('Level changed to:', level);
            });
            
            console.log('Storing windy instance and map references');
            setWindyInstance(windyAPI);
            if (windyAPI.map) {
              setLeafletMap(windyAPI.map);
            } else {
              console.error('Windy API initialized but map is not available');
            }
            
            initializationAttemptedRef.current = false;
            setIsLoading(false);
            resolve();
          });
        } catch (err) {
          const errorObj = err instanceof Error ? err : new Error('Failed to initialize Windy');
          console.error('Error in windyInit call:', errorObj);
          reject(errorObj);
        }
      });
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to initialize Windy');
      setError(errorObj);
      initializationAttemptedRef.current = false;
      setIsLoading(false);
      console.error('Error initializing Windy:', errorObj);
      return Promise.reject(errorObj);
    }
  }, [defaultOptions, windyInstance]);

  return { initializeWindy, windyInstance, isLoading, error, leafletMap };
};