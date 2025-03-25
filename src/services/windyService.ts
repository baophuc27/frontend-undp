// src/services/windyService.ts
import L from 'leaflet';
import { WindyOptions } from '../types/map';

// Define interface for the Windy API
export interface WindyAPI {
  picker: {
    on: (event: string, callback: (data: any) => void) => void;
    open: (options: { lat: number; lon: number }) => void;
    close: () => void;
    getParams: () => any;
  };
  broadcast: {
    on: (event: string, callback: (data: any) => void) => void;
    fire: (event: string, data?: any) => void;
  };
  overlays: {
    [key: string]: () => void;
  };
  map: L.Map;
  store: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    on: (key: string, callback: (value: any) => void) => void;
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
  [key: string]: any;
}

// Interface for Windy layers
export interface WindyLayer {
  id: string;
  name: string;
  overlayFunction: string;
}

// Weather data interface
export interface WeatherData {
  lat: number;
  lon: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

/**
 * WindyService - A service for interacting with the Windy API
 */
export class WindyService {
  private windyApi: WindyAPI;
  private options: WindyOptions;
  private markersLayer: L.LayerGroup | null = null;
  private overlayLayer: L.LayerGroup | null = null;
  private changeListeners: Array<(event: string, data: any) => void> = [];
  
  constructor(windyApi: WindyAPI, options: WindyOptions) {
    this.windyApi = windyApi;
    this.options = options;
    
    // Initialize layers if map is available
    if (this.windyApi.map) {
      this.markersLayer = L.layerGroup().addTo(this.windyApi.map);
      this.overlayLayer = L.layerGroup().addTo(this.windyApi.map);
      
      // Setup broadcast listeners
      this.setupBroadcastListeners();
    }
  }
  
  /**
   * Setup listeners for Windy broadcast events
   */
  private setupBroadcastListeners(): void {
    if (!this.windyApi.broadcast) return;
    
    // Listen for redraw events
    this.windyApi.broadcast.on('redrawFinished', () => {
      this.notifyListeners('redraw', {});
    });
    
    // Listen for parameter changes
    this.windyApi.broadcast.on('paramsChanged', (params) => {
      this.notifyListeners('params', params);
    });
    
    // Listen for store changes
    this.windyApi.store.on('overlay', (overlay) => {
      this.notifyListeners('overlay', { overlay });
    });
    
    this.windyApi.store.on('level', (level) => {
      this.notifyListeners('level', { level });
    });
  }

  private notifyListeners(event: string, data: any): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in Windy listener:', error);
      }
    });
  }
  

  public addChangeListener(callback: (event: string, data: any) => void): void {
    this.changeListeners.push(callback);
  }
  

  public removeChangeListener(callback: (event: string, data: any) => void): void {
    this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
  }
  

  public getAvailableLayers(): WindyLayer[] {
    return [
      {
        id: 'wind',
        name: 'Wind Layer',
        overlayFunction: 'wind'
      },
      {
        id: 'temp',
        name: 'Temperature',
        overlayFunction: 'temp'
      },
      {
        id: 'clouds',
        name: 'Clouds',
        overlayFunction: 'clouds'
      },
      {
        id: 'pressure',
        name: 'Pressure',
        overlayFunction: 'pressure'
      },
      {
        id: 'rainClouds',
        name: 'Rain & Clouds',
        overlayFunction: 'rainClouds'
      }
    ];
  }
  

  public setActiveLayer(layerId: string): void {
    try {
      this.windyApi.store.set('overlay', layerId);
      
      const layers = this.getAvailableLayers();
      const layer = layers.find(l => l.id === layerId);
      
      if (layer && this.windyApi.overlays[layer.overlayFunction]) {
        this.windyApi.overlays[layer.overlayFunction]();
      }
      
      this.notifyListeners('layerChange', { layerId });
    } catch (error) {
      console.error('Error setting active layer:', error);
    }
  }

  public addWeatherMarkers(weatherData: WeatherData[]): void {
    if (!this.windyApi.map || !this.markersLayer) {
      return;
    }
    
    this.markersLayer.clearLayers();
    
    weatherData.forEach(point => {
      const { lat, lon, temperature, humidity, windSpeed, pressure } = point;
      
      // Create marker with custom icon for better visibility
      const marker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'weather-marker',
          html: `<div class="marker-temp">${Math.round(temperature)}°</div>`,
          iconSize: [40, 40] as [number, number]
        })
      });
      
      const popupContent = `
        <div class="weather-popup">
          <h3>Weather Station</h3>
          <p><strong>Temperature:</strong> ${temperature}°C</p>
          <p><strong>Humidity:</strong> ${humidity}%</p>
          <p><strong>Wind Speed:</strong> ${windSpeed} m/s</p>
          <p><strong>Pressure:</strong> ${pressure} hPa</p>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      if (this.markersLayer) {
        marker.addTo(this.markersLayer);
      }
    });
  }
  

  public toggleOverlayVisibility(visible: boolean): void {
    if (!this.windyApi.map || !this.overlayLayer) return;
    
    if (visible) {
      if (!this.windyApi.map.hasLayer(this.overlayLayer)) {
        this.overlayLayer.addTo(this.windyApi.map);
      }
    } else {
      this.windyApi.map.removeLayer(this.overlayLayer);
    }
  }
  

  public setAltitudeLevel(level: string): void {
    if (!this.windyApi.store) return;
    
    this.windyApi.store.set('level', level);
    this.notifyListeners('levelChange', { level });
  }
  
  /**
   * Get the Leaflet map instance
   */
  public getMap(): L.Map {
    return this.windyApi.map;
  }

  public cleanup(): void {
    if (this.markersLayer) {
      this.markersLayer.clearLayers();
    }
    
    if (this.overlayLayer) {
      this.overlayLayer.clearLayers();
    }
    
    this.changeListeners = [];
  }
}