import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useTurfAnalysis } from '../../hooks/useTurfAnalysis';
import BackupLayer from './BackupLayer';
import DataLayer from './DataLayer';
import MapControls from './MapControls';
import { MapLayer } from '../../types/map';
import { WindyService } from '../../services/windyService';
import { env } from '../../config/env';
import './MapContainer.css';

interface MapContainerProps {
  additionalLayers?: MapLayer[];
  dataUrl?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ 
  additionalLayers = [],
  dataUrl
}) => {
  // State for script loading and initialization
  const [scriptsLoaded, setScriptsLoaded] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const initAttemptedRef = useRef<boolean>(false);
  const windyContainerRef = useRef<HTMLDivElement>(null);
  
  // Map context
  const { 
    leafletMap,
    windyInstance,
    windyService,
    isMapLoading,
    mapError,
    currentZoom,
    handleMapClick, 
    setCurrentZoom,
    setLeafletMap,
    setWindyInstance,
    setWindyService,
    setIsMapLoading,
    setMapError
  } = useMap();

  const { calculateDistance } = useTurfAnalysis();
  const [showBackupLayer, setShowBackupLayer] = useState<boolean>(false);
  const [showDataLayer, setShowDataLayer] = useState<boolean>(!!dataUrl);
  const [markers, setMarkers] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Define available map layers
  const mapLayers: MapLayer[] = [
    {
      id: 'backup',
      name: 'Satellite Imagery',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      type: 'tile' as 'tile',
      visible: false,
      minZoom: 10,
      maxZoom: 19,
      opacity: 0.7
    },
    ...additionalLayers
  ];

  // Use the map layers hook to manage layers
  const { 
    activeLayers, 
    toggleLayer 
  } = useMapLayers(mapLayers);

  // Step 1: Load necessary scripts
  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Load Leaflet if not loaded
        if (!window.L) {
          setStatus('Loading Leaflet...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
            script.async = false;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
            
            // Add Leaflet CSS
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
            document.head.appendChild(css);
          });
        }
        
        // Load Windy API if not loaded
        if (typeof window.windyInit !== 'function') {
          setStatus('Loading Windy API...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
            script.async = false;
            script.onload = () => {
              if (typeof window.windyInit === 'function') {
                resolve();
              } else {
                reject(new Error('Windy API loaded but windyInit function not found'));
              }
            };
            script.onerror = () => reject(new Error('Failed to load Windy API'));
            document.head.appendChild(script);
          });
        }
        
        // Wait a bit to ensure scripts are fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setScriptsLoaded(true);
        setStatus('Scripts loaded successfully');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error loading scripts');
        setMapError(error);
        setStatus('Failed to load scripts');
      }
    };
    
    loadScripts();
  }, [setMapError]);

  // Step 2: Initialize Windy once scripts are loaded
  useEffect(() => {
    if (initAttemptedRef.current || !scriptsLoaded || !windyContainerRef.current) {
      return;
    }
    
    const initializeWindy = async () => {
      initAttemptedRef.current = true;
      
      try {
        setStatus('Initializing Windy...');
        
        // Make sure we have the windy container with id="windy"
        const windyContainer = windyContainerRef.current;
        
        if (typeof window.windyInit !== 'function') {
          throw new Error('windyInit function not available');
        }
        
        // Use the API key from env
        const options = {
          key: env.WINDY_API_KEY || '3HFvxAW5zvdalES1JlOw6kNyHybrp1j7', // Use env or fallback to demo key
          verbose: true,
          lat: env.MAP_CENTER_LAT,
          lon: env.MAP_CENTER_LNG,
          zoom: env.MAP_DEFAULT_ZOOM,
          overlay: 'wind',
          level: 'surface',
          timestamp: Math.floor(Date.now() / 1000),
          hourFormat: '24h',
          graticule: true,
          units: {
            temperature: 'C',
            wind: 'm/s',
            pressure: 'hPa',
            distance: 'km'
          }
        };
        
        // Initialize Windy
        window.windyInit(options, (windyAPI: any) => {
          setStatus('Windy initialized successfully');
          
          // Store instances in context
          setWindyInstance(windyAPI);
          setLeafletMap(windyAPI.map);
          
          // Create WindyService
          try {
            const service = new WindyService(windyAPI, {
              key: env.WINDY_API_KEY || '3HFvxAW5zvdalES1JlOw6kNyHybrp1j7',
              verbose: true,
              plugin: 'windy-plugin-api'
            });
            
            setWindyService(service);
            setIsMapLoading(false);
          } catch (err) {
            // Still continue even if service creation fails
            setIsMapLoading(false);
          }
        });
      } catch (err) {
        initAttemptedRef.current = false;
        const error = err instanceof Error ? err : new Error('Unknown error initializing Windy');
        setMapError(error);
        setStatus('Failed to initialize Windy');
      }
    };
    
    initializeWindy();
  }, [scriptsLoaded, setWindyInstance, setLeafletMap, setWindyService, setIsMapLoading, setMapError]);

  // Handle map click for distance measurement
  const onMapClick = useCallback((e: any) => {
    if (!leafletMap) return;
    
    // Use the handleMapClick from context
    handleMapClick(e);
    
    if (markers.length === 1) {
      const point1 = { lat: markers[0].getLatLng().lat, lng: markers[0].getLatLng().lng };
      const point2 = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      const dist = calculateDistance(point1, point2);
      setDistance(dist);
    }
  }, [leafletMap, markers.length, calculateDistance, handleMapClick]);

  // Check zoom level and toggle backup layer accordingly
  useEffect(() => {
    if (!windyInstance || !leafletMap) return;
    
    const checkZoom = () => {
      try {
        if (windyInstance.store) {
          const mapCoords = windyInstance.store.get('mapCoords');
          if (mapCoords && typeof mapCoords.zoom === 'number') {
            setCurrentZoom(mapCoords.zoom);
            
            // Toggle backup layer based on zoom level
            const shouldShowBackup = mapCoords.zoom > 11;
            if (shouldShowBackup !== showBackupLayer) {
              setShowBackupLayer(shouldShowBackup);
              
              // Toggle the layer visibility if needed
              if (shouldShowBackup && !activeLayers.includes('backup')) {
                toggleLayer('backup');
              } else if (!shouldShowBackup && activeLayers.includes('backup')) {
                toggleLayer('backup');
              }
            }
          }
        }
      } catch (err) {
        console.error('Error checking zoom level:', err);
      }
    };
    
    // Initial check
    checkZoom();
    
    // Set up event listeners for zoom changes
    if (windyInstance.broadcast) {
      windyInstance.broadcast.on('redrawFinished', checkZoom);
      windyInstance.broadcast.on('paramsChanged', checkZoom);
    }
    
    if (leafletMap) {
      leafletMap.on('zoomend', checkZoom);
      leafletMap.on('moveend', checkZoom);
    }
    
    return () => {
      // Clean up listeners
      if (leafletMap) {
        leafletMap.off('zoomend', checkZoom);
        leafletMap.off('moveend', checkZoom);
      }
    };
  }, [windyInstance, leafletMap, showBackupLayer, activeLayers, toggleLayer, setCurrentZoom]);

  // Show loading state
  if (isMapLoading) {
    return (
      <div className="map-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading map components...</p>
          <p>Status: {status}</p>
        </div>
        
        {/* Always render the Windy container div */}
        <div 
          id="windy" 
          ref={windyContainerRef} 
          className="windy-container" 
        />
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* Zoom level indicator */}
      {currentZoom && (
        <div className="zoom-indicator">
          Zoom: {currentZoom.toFixed(1)} 
          {showBackupLayer && ' (Detailed View)'}
        </div>
      )}
      
      {/* Main map container */}
      <div 
        id="windy" 
        ref={windyContainerRef} 
        className="windy-container" 
        style={{ width: '100%', height: '100%' }} 
      />
      
      {/* Layer components */}
      {showBackupLayer && leafletMap && <BackupLayer />}
      
      {/* Data layer */}
      {showDataLayer && dataUrl && leafletMap && (
        <DataLayer url={dataUrl} />
      )}
      
      {/* Distance measurement display */}
      {distance !== null && (
        <div className="distance-overlay">
          <p>Distance: {distance.toFixed(2)} km</p>
        </div>
      )}
      
      {/* Map controls - only show when windyService is available */}
      {windyService && <MapControls />}
    </div>
  );
};

export default MapContainer;