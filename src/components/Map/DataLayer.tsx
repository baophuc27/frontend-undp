import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useMap } from '../../context/MapContext';
import { useDataFetching } from '../../hooks/useDataFetching';

interface DataPoint {
  id: string;
  lat: number;
  lng: number;
  value: number;
  type?: string;
  name?: string;
  description?: string;
  [key: string]: any;
}

interface DataLayerProps {
  url: string;
  refreshInterval?: number; // in milliseconds
  pointColorFunction?: (value: number) => string;
  pointRadiusFunction?: (value: number) => number;
  tooltipFunction?: (point: DataPoint) => string;
}

const DataLayer: React.FC<DataLayerProps> = ({
  url,
  refreshInterval = 60000, // default: refresh every minute
  pointColorFunction,
  pointRadiusFunction,
  tooltipFunction
}) => {
  const { leafletMap } = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const pointLayersRef = useRef<Record<string, L.CircleMarker>>({});
  
  // TEMPORARY: Use mock data instead of fetching from API
  const mockData: DataPoint[] = [
    {
      id: "station1",
      lat: 10.835,
      lng: 106.769,
      value: 75,
      name: "Station Alpha",
      description: "Weather monitoring station in central location"
    },
    {
      id: "station2",
      lat: 10.855,
      lng: 106.789,
      value: 42,
      name: "Station Beta",
      description: "Urban environment station"
    },
    {
      id: "station3",
      lat: 10.815,
      lng: 106.749,
      value: 88,
      name: "Station Gamma",
      description: "High precision weather station"
    }
  ];
  
  // Comment out the API fetching temporarily
  /*
  // Use the data fetching hook
  const { 
    data: fetchedData,
    loading,
    error,
    refetch
  } = useDataFetching<DataPoint[]>({
    endpoint: url,
    autoFetch: true
  });
  
  // Update local data state when fetched data changes
  useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
    }
  }, [fetchedData]);
  
  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    const intervalId = setInterval(() => {
      refetch();
    }, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, refetch]);
  */
  
  // TEMPORARY: Use mock data
  useEffect(() => {
    setData(mockData);
  }, []);
  
  // Default color function: value from blue to red
  const defaultColorFunction = useMemo(() => {
    return (value: number) => {
      // Normalize value between 0 and 1 (assuming values between 0 and 100)
      const normalizedValue = Math.min(Math.max(value / 100, 0), 1);
      
      // Blue (low) to Red (high)
      const r = Math.floor(normalizedValue * 255);
      const b = Math.floor((1 - normalizedValue) * 255);
      const g = Math.floor(100 - Math.abs(normalizedValue - 0.5) * 100);
      
      return `rgb(${r}, ${g}, ${b})`;
    };
  }, []);

  // Default radius function
  const defaultRadiusFunction = useMemo(() => {
    return (value: number) => {
      // Values between 5 and 15 pixels
      return 5 + Math.min(value / 10, 10);
    };
  }, []);

  // Default tooltip function
  const defaultTooltipFunction = useMemo(() => {
    return (point: DataPoint) => {
      return `
        <div class="data-point-tooltip">
          <h3>${point.name || `Point ${point.id}`}</h3>
          <p><strong>Value:</strong> ${point.value}</p>
          ${point.description ? `<p>${point.description}</p>` : ''}
        </div>
      `;
    };
  }, []);

  // Get the appropriate functions to use
  const getColor = pointColorFunction || defaultColorFunction;
  const getRadius = pointRadiusFunction || defaultRadiusFunction;
  const getTooltip = tooltipFunction || defaultTooltipFunction;

  // Initialize layer group
  useEffect(() => {
    if (!leafletMap) return;
    
    // Create layer group if it doesn't exist
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(leafletMap);
    }
    
    return () => {
      if (layerRef.current && leafletMap) {
        leafletMap.removeLayer(layerRef.current);
        layerRef.current = null;
        pointLayersRef.current = {};
      }
    };
  }, [leafletMap]);

  // Update markers when data changes
  useEffect(() => {
    if (!leafletMap || !layerRef.current) return;
    
    const layerGroup = layerRef.current;
    const existingPoints = { ...pointLayersRef.current };
    const updatedPoints: Record<string, L.CircleMarker> = {};
    
    // Process each data point
    data.forEach(point => {
      const { id, lat, lng, value } = point;
      
      // Get color and radius for this point
      const color = getColor(value);
      const radius = getRadius(value);
      
      // Check if point already exists
      if (existingPoints[id]) {
        // Update existing point
        const marker = existingPoints[id];
        marker.setLatLng([lat, lng]);
        marker.setStyle({
          fillColor: color,
          color: color,
          radius: radius
        });
        
        // Update tooltip content
        const tooltip = marker.getTooltip();
        if (tooltip) {
          tooltip.setContent(getTooltip(point));
        }
        
        // Keep track of updated points
        updatedPoints[id] = marker;
        delete existingPoints[id];
      } else {
        // Create new point
        const marker = L.circleMarker([lat, lng], {
          radius: radius,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7
        });
        
        // Add tooltip
        marker.bindTooltip(getTooltip(point));
        
        // Add to layer group
        marker.addTo(layerGroup);
        
        // Keep track of new point
        updatedPoints[id] = marker;
      }
    });
    
    // Remove points that no longer exist in the data
    Object.values(existingPoints).forEach(marker => {
      layerGroup.removeLayer(marker);
    });
    
    // Update reference to current points
    pointLayersRef.current = updatedPoints;
  }, [data, leafletMap, getColor, getRadius, getTooltip]);

  // TEMPORARY: Since we're using mock data, we don't have loading or error states
  // Just return null to render nothing but the markers
  return null;

  /*
  // Show loading or error state
  if (loading) {
    return (
      <div className="data-layer-loading">
        Loading data...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="data-layer-error">
        Error loading data: {error.message}
      </div>
    );
  }

  // Most of the work is done in effects, nothing to render
  return null;
  */
};

export default DataLayer;