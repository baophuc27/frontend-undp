import React, { useState, useEffect, memo } from 'react';
import { useMap } from '../../context/MapContext';
import './MapControls.css';

const MapControls: React.FC = () => {
  const { windyService, selectedLayer, setSelectedLayer } = useMap();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [availableLayers, setAvailableLayers] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('surface');
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  const [weatherMarkersVisible, setWeatherMarkersVisible] = useState<boolean>(false);
  
  // Available altitude levels
  const altitudeLevels = [
    { id: 'surface', name: 'Surface' },
    { id: '850h', name: '850 hPa' },
    { id: '700h', name: '700 hPa' },
    { id: '500h', name: '500 hPa' },
    { id: '300h', name: '300 hPa' }
  ];

  // Initialize control data
  useEffect(() => {
    if (!windyService) return;
    
    // Get available layers from Windy service
    const layers = windyService.getAvailableLayers();
    setAvailableLayers(layers);
    
    // Add listeners for Windy changes
    windyService.addChangeListener((event, data) => {
      if (event === 'overlay' && data.overlay) {
        setSelectedLayer(data.overlay);
      }
      
      if (event === 'level' && data.level) {
        setSelectedLevel(data.level);
      }
    });
  }, [windyService, setSelectedLayer]);

  // Toggle expansion of controls panel
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  // Change the active Windy layer
  const handleLayerChange = (layerId: string) => {
    if (!windyService) return;
    
    windyService.setActiveLayer(layerId);
    setSelectedLayer(layerId);
  };
  
  // Change the altitude level
  const handleLevelChange = (level: string) => {
    if (!windyService) return;
    
    windyService.setAltitudeLevel(level);
    setSelectedLevel(level);
  };
  
  // Toggle overlay visibility
  const toggleOverlay = () => {
    if (!windyService) return;
    
    const newVisibility = !overlayVisible;
    setOverlayVisible(newVisibility);
    windyService.toggleOverlayVisibility(newVisibility);
  };
  
  // Toggle weather markers visibility
  const toggleWeatherMarkers = () => {
    if (!windyService) return;
    
    const newVisibility = !weatherMarkersVisible;
    setWeatherMarkersVisible(newVisibility);
    
    // Sample weather data for testing
    const sampleWeatherData = newVisibility ? [
      { 
        lat: 10.835, 
        lon: 106.769, 
        temperature: 32.5, 
        humidity: 80, 
        windSpeed: 4.2, 
        pressure: 1012 
      },
      { 
        lat: 10.855, 
        lon: 106.789, 
        temperature: 31.8, 
        humidity: 75, 
        windSpeed: 3.8,
        pressure: 1010 
      },
      { 
        lat: 10.815, 
        lon: 106.749, 
        temperature: 33.2, 
        humidity: 73, 
        windSpeed: 5.1, 
        pressure: 1011 
      }
    ] : [];
    
    windyService.addWeatherMarkers(sampleWeatherData);
  };

  if (!windyService) {
    return null;
  }

  return (
    <div className="map-controls">
      <div className="map-controls__header" onClick={toggleExpanded}>
        <h3>Weather Controls {isExpanded ? '▼' : '►'}</h3>
      </div>
      
      {isExpanded && (
        <div className="map-controls__content">
          <div className="map-controls__section">
            <h4>Weather Layers</h4>
            <div className="map-controls__buttons">
              {availableLayers.map(layer => (
                <button
                  key={layer.id}
                  className={`map-controls__layer-btn ${selectedLayer === layer.id ? 'active' : ''}`}
                  onClick={() => handleLayerChange(layer.id)}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="map-controls__section">
            <h4>Altitude Level</h4>
            <div className="map-controls__buttons">
              {altitudeLevels.map(level => (
                <button
                  key={level.id}
                  className={`map-controls__level-btn ${selectedLevel === level.id ? 'active' : ''}`}
                  onClick={() => handleLevelChange(level.id)}
                >
                  {level.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="map-controls__section">
            <h4>Data Overlays</h4>
            <div className="map-controls__buttons">
              <button
                className={`map-controls__toggle-btn ${overlayVisible ? 'active' : ''}`}
                onClick={toggleOverlay}
              >
                Alert Markers {overlayVisible ? 'ON' : 'OFF'}
              </button>
              
              <button
                className={`map-controls__toggle-btn ${weatherMarkersVisible ? 'active' : ''}`}
                onClick={toggleWeatherMarkers}
              >
                Weather Stations {weatherMarkersVisible ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MapControls);