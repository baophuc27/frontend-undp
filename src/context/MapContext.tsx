import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import L from 'leaflet';
import { WindyService } from '../services/windyService';
import { MapLayer, GeoPoint } from '../types/map';

interface MapContextProps {
  leafletMap: L.Map | null;
  windyInstance: any;
  windyService: WindyService | null;
  isMapLoading: boolean;
  mapError: Error | null;
  selectedLayer: string;
  availableLayers: MapLayer[];
  visibleLayers: string[];
  currentZoom: number;
  handleMapClick: (e: L.LeafletMouseEvent) => void;
  setLeafletMap: (map: L.Map | null) => void;
  setWindyInstance: (instance: any) => void;
  setWindyService: (service: WindyService | null) => void;
  setSelectedLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setCurrentZoom: (zoom: number) => void;
  addMarker: (point: GeoPoint, options?: L.MarkerOptions) => L.Marker;
  clearMarkers: () => void;
  calculateDistance: (point1: GeoPoint, point2: GeoPoint) => number;
  // New methods for managing loading state
  setIsMapLoading: (loading: boolean) => void;
  setMapError: (error: Error | null) => void;
  resetMapState: () => void;
}

const MapContext = createContext<MapContextProps | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  initialLayers?: MapLayer[];
}

export const MapProvider: React.FC<MapProviderProps> = ({ 
  children, 
  initialLayers = [] 
}) => {
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null);
  const [windyInstance, setWindyInstance] = useState<any>(null);
  const [windyService, setWindyService] = useState<WindyService | null>(null);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<Error | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('wind');
  const [availableLayers, setAvailableLayers] = useState<MapLayer[]>(initialLayers);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(9);
  const [markers, setMarkers] = useState<L.Marker[]>([]);

  // Update available layers when windyService is initialized
  useEffect(() => {
    if (windyService) {
      try {
        // Create windyLayers array with explicit type assertion for each item
        const windyLayers = windyService.getAvailableLayers().map(layer => ({
          id: layer.id,
          name: layer.name,
          url: '',
          attribution: 'Windy.com',
          visible: layer.id === selectedLayer,
          type: 'windy' as 'windy' // Explicit type assertion
        }));
        
        // Use type assertion for the entire array to satisfy TypeScript
        setAvailableLayers([...windyLayers, ...initialLayers] as MapLayer[]);
      } catch (error) {
        console.error('Error getting available layers:', error);
      }
    }
  }, [windyService, initialLayers, selectedLayer]);

  // Reset map state (used for retrying initialization)
  const resetMapState = () => {
    setMapError(null);
    setIsMapLoading(true);
    // Don't clear existing instances as they may still be valid
  };

  // Handle map click
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!leafletMap) return;
    
    const newMarker = L.marker(e.latlng).addTo(leafletMap);
    setMarkers(prev => [...prev, newMarker]);
  };

  // Add a marker to the map
  const addMarker = (point: GeoPoint, options: L.MarkerOptions = {}) => {
    if (!leafletMap) throw new Error('Map not initialized');
    
    const marker = L.marker([point.lat, point.lng], options).addTo(leafletMap);
    setMarkers(prev => [...prev, marker]);
    return marker;
  };

  // Clear all markers from the map
  const clearMarkers = () => {
    if (!leafletMap) return;
    
    markers.forEach(marker => {
      leafletMap.removeLayer(marker);
    });
    
    setMarkers([]);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setVisibleLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId) 
        : [...prev, layerId]
    );
  };

  // Calculate distance between two points (placeholder - actual implementation in useTurfAnalysis)
  const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
    return 0; // This will be replaced by useTurfAnalysis
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletMap) {
        markers.forEach(marker => {
          leafletMap.removeLayer(marker);
        });
      }
      
      if (windyService) {
        windyService.cleanup();
      }
    };
  }, [leafletMap, markers, windyService]);

  const value = {
    leafletMap,
    windyInstance,
    windyService,
    isMapLoading,
    mapError,
    selectedLayer,
    availableLayers,
    visibleLayers,
    currentZoom,
    handleMapClick,
    setLeafletMap,
    setWindyInstance,
    setWindyService,
    setSelectedLayer,
    toggleLayerVisibility,
    setCurrentZoom,
    addMarker,
    clearMarkers,
    calculateDistance,
    setIsMapLoading,
    setMapError,
    resetMapState
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook to use the map context
export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};