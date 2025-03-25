// src/components/Map/MapContainer.tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useMap } from '../../context/MapContext';
import { useTurfAnalysis } from '../../hooks/useTurfAnalysis';
import BackupLayer from './BackupLayer';
import DataLayer from './DataLayer';
import MapControls from './MapControls';
import { MapLayer } from '../../types/map';
import { WindyService } from '../../services/windyService';
import { env } from '../../config/env';
import '../../styles/Map/MapContainer.css';

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
  // Initialize backup layer visibility based on initial zoom level
  const [showBackupLayer, setShowBackupLayer] = useState<boolean>(currentZoom > 10);
  const [showDataLayer, setShowDataLayer] = useState<boolean>(!!dataUrl);
  const [markers, setMarkers] = useState<any[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

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
        
        // Use the API key from env and add overlay prevention options
        const options = {
          key: env.WINDY_API_KEY || '3HFvxAW5zvdalES1JlOw6kNyHybrp1j7',
          verbose: true,
          lat: env.MAP_CENTER_LAT,
          lon: env.MAP_CENTER_LNG,
          zoom: env.MAP_DEFAULT_ZOOM,
          timestamp: Math.floor(Date.now() / 1000),
          hourFormat: '24h',
          graticule: true,
          useDefaultInjectableCSS: false, // Prevent default CSS injection
          useOverlay: false, // Disable overlay iframe
          useApiFrame: false, // Disable API frame
          overlay: 'wind',
          level: 'surface',
          units: {
            temperature: 'C',
            wind: 'm/s',
            pressure: 'hPa',
            distance: 'km'
          }
        };
        
        // Initialize Windy
        window.windyInit(options, (windyAPI: any) => {
          const { store, broadcast } = windyAPI;
          setStatus('Windy initialized successfully');
          
          // Store instances in context
          setWindyInstance(windyAPI);
          setLeafletMap(windyAPI.map);
          
          broadcast.on('redrawFinished', () => {
            // Get current map coordinates and state
            const mapState = store.get('mapCoords');
            
            // Get the zoom level from the map state
            const { zoom } = mapState;
            
            // Update the current zoom level in context
            setCurrentZoom(zoom);
            
            // Toggle backup layer based on zoom level
            const shouldShowDetailedView = zoom > 10;
            setShowBackupLayer(shouldShowDetailedView);
            
            // Toggle Windy layer visibility - hide when showing detailed view
            if (windyAPI.map && shouldShowDetailedView) {
              // Hide Windy layers when showing detailed view
              document.getElementById('windy')?.classList.add('windy-hidden');
            } else {
              document.getElementById('windy')?.classList.remove('windy-hidden');
            }
            
            console.log("zoom level: ", zoom);
        });
          
          // Create WindyService
          try {
            const service = new WindyService(windyAPI, options);
            setWindyService(service);
            setIsMapLoading(false);
          } catch (err) {
            console.warn('WindyService initialization failed:', err);
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
    
    handleMapClick(e);
    
    if (markers.length === 1) {
      const point1 = { lat: markers[0].getLatLng().lat, lng: markers[0].getLatLng().lng };
      const point2 = { lat: e.latlng.lat, lng: e.latlng.lng };
      
      const dist = calculateDistance(point1, point2);
      setDistance(dist);
    }
  }, [leafletMap, markers.length, calculateDistance, handleMapClick]);

  // Cleanup function to remove overlay iframes
  const removeOverlayIframes = useCallback(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      if (iframe.style.zIndex === '2147483647') {
        iframe.remove();
      }
    });
  }, []);

  // Set up event listeners and cleanup
  useEffect(() => {
    if (!leafletMap) return;

    console.log("Setting up event listeners on leaflet map");
    
    // Add click handler
    leafletMap.on('click', onMapClick);
    
    // Add zoom handler for manual zoom changes
    const handleZoomEnd = () => {
      const newZoom = leafletMap.getZoom();
      console.log("Manual zoom changed to:", newZoom);
      
      setCurrentZoom(newZoom);
      const shouldShowDetailedView = newZoom > 10;
      setShowBackupLayer(shouldShowDetailedView);
      
      // Toggle Windy visibility - hide when showing detailed view
      if (shouldShowDetailedView) {
        console.log("Hiding Windy layer, showing detailed view");
        document.getElementById('windy')?.classList.add('windy-hidden');
        // Force map to recognize size changes
        setTimeout(() => {
          if (leafletMap) {
            leafletMap.invalidateSize();
          }
        }, 100);
      } else {
        console.log("Showing Windy layer, hiding detailed view");
        document.getElementById('windy')?.classList.remove('windy-hidden');
      }
    };
    
    leafletMap.on('zoomend', handleZoomEnd);
    
    // Initial cleanup of any existing overlay iframes
    removeOverlayIframes();

    // Cleanup function
    return () => {
      leafletMap.off('click', onMapClick);
      leafletMap.off('zoomend', handleZoomEnd);
      removeOverlayIframes();
    };
  }, [leafletMap, onMapClick, removeOverlayIframes, setCurrentZoom]);

  // Show loading state
  if (isMapLoading) {
    return (
      <div className="map-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading map components...</p>
          <p>Status: {status}</p>
        </div>
        
        <div 
          id="windy" 
          ref={windyContainerRef} 
          className="windy-container" 
        />
      </div>
    );
  }

  // Show error state
  if (mapError) {
    return (
      <div className="map-container">
        <div className="error-overlay">
          <h3>Error Loading Map</h3>
          <p>{mapError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container ${showBackupLayer ? 'detailed-view-mode' : ''}`}>
      {currentZoom && (
        <div className={`zoom-indicator ${showBackupLayer ? 'detailed-view-active' : ''}`}>
          Zoom: {currentZoom.toFixed(1)}
          {showBackupLayer && ' (Detailed View Active)'}
        </div>
      )}
      
      <div 
        id="windy" 
        ref={windyContainerRef} 
        className={`windy-container ${showBackupLayer ? 'windy-hidden' : ''}`}
      />
      
      {/* Always render BackupLayer but let it handle visibility internally */}
      {leafletMap && <BackupLayer 
        url={env.DETAILED_TILES_URL} 
        attribution="Map tiles © relevant provider"
      />}
      
      {showDataLayer && dataUrl && leafletMap && (
        <DataLayer url={dataUrl} />
      )}
      
      {distance !== null && (
        <div className="distance-overlay">
          Distance: {distance.toFixed(2)} km
        </div>
      )}
      
      {windyService && !showBackupLayer && <MapControls />}
    </div>
  );
};

export default MapContainer;