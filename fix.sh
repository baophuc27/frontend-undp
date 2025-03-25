#!/bin/bash

# Check the installed versions
echo "Checking installed versions of leaflet and react-leaflet..."
npm list leaflet react-leaflet @types/leaflet

# Create a correct MapContainer.tsx file using react-leaflet v2 syntax
cat > src/components/Map/MapContainer.tsx << 'EOL'
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Map as LeafletMap, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { env } from '../../config/env';
import { useWindyInitializer } from '../../hooks/useWindyInitializer';
import { MapLayer } from '../../types/map';
import WindyControls from './WindyControls';
import { WindyService } from '../../services/windy.service';
import { useTurfAnalysis } from '../../hooks/useTurfAnalysis';

// Import Leaflet default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon in CRA
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
  additionalLayers?: MapLayer[];
}

const MapContainer: React.FC<MapContainerProps> = ({ additionalLayers = [] }) => {
  const mapRef = useRef<any>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const bufferLayerRef = useRef<L.GeoJSON | null>(null);
  const { initializeWindy, windyInstance } = useWindyInitializer();
  const [windyService, setWindyService] = useState<WindyService | null>(null);
  const { calculateDistance, createBuffer } = useTurfAnalysis();

  // Default map config from environment variables
  const mapConfig = {
    center: [env.MAP_CENTER_LAT, env.MAP_CENTER_LNG] as [number, number],
    zoom: env.MAP_DEFAULT_ZOOM,
    minZoom: 3,
    maxZoom: 18
  };

  // Handle map click
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!map) return;
    
    // Create a marker
    const marker = L.marker(e.latlng).addTo(map);
    
    // Add marker to array
    markersRef.current.push(marker);
    
    // If two markers exist, calculate distance
    if (markersRef.current.length === 2) {
      const point1 = { 
        lat: markersRef.current[0].getLatLng().lat, 
        lng: markersRef.current[0].getLatLng().lng 
      };
      const point2 = { 
        lat: markersRef.current[1].getLatLng().lat, 
        lng: markersRef.current[1].getLatLng().lng 
      };
      
      const distance = calculateDistance(point1, point2);
      console.log(`Distance: ${distance.toFixed(2)} km`);
      
      // Create buffer around first point
      const buffer = createBuffer(point1, 1); // 1km buffer
      
      if (bufferLayerRef.current) {
        map.removeLayer(bufferLayerRef.current);
      }
      
      bufferLayerRef.current = L.geoJSON(buffer).addTo(map);
    }
  };

  // Initialize map reference
  const handleMapReady = () => {
    if (mapRef.current && !map) {
      const leafletMap = mapRef.current.leafletElement;
      setMap(leafletMap);
      
      // Add click event handler directly to the Leaflet map
      leafletMap.on('click', handleMapClick);
    }
  };

  // Initialize Windy with the Leaflet map instance
  useEffect(() => {
    if (map) {
      // Initialize Windy with this map instance
      initializeWindy(map);
    }
  }, [map, initializeWindy]);

  // Initialize Windy service when windyInstance is available
  useEffect(() => {
    if (windyInstance && !windyService) {
      const service = new WindyService(windyInstance, {
        key: env.WINDY_API_KEY,
        verbose: false,
        plugin: 'windy-plugin-api'
      });
      setWindyService(service);
    }
  }, [windyInstance, windyService]);

  // Handle additional layers
  useEffect(() => {
    if (!map || !additionalLayers.length) return;

    const layerControls: Record<string, L.Layer> = {};
    
    additionalLayers.forEach(layer => {
      if (layer.visible) {
        const tileLayer = L.tileLayer(layer.url, {
          attribution: layer.attribution
        });
        
        tileLayer.addTo(map);
        layerControls[layer.name] = tileLayer;
      }
    });
    
    if (Object.keys(layerControls).length > 0) {
      L.control.layers({}, layerControls).addTo(map);
    }
    
    return () => {
      additionalLayers.forEach(layer => {
        map.eachLayer(mapLayer => {
          if ((mapLayer as L.TileLayer).options?.attribution === layer.attribution) {
            map.removeLayer(mapLayer);
          }
        });
      });
    };
  }, [map, additionalLayers]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (map) {
        map.off('click', handleMapClick);
      }
    };
  }, [map]);

  return (
    <div className="map-container" style={{ width: '100%', height: '100vh' }}>
      <LeafletMap
        ref={mapRef}
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        style={{ width: '100%', height: '100%' }}
        whenReady={handleMapReady}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </LeafletMap>
      {windyService && <WindyControls windyService={windyService} />}
    </div>
  );
};

export default MapContainer;
EOL

# Create a utility script to check version compatibility
cat > check-leaflet-compatibility.js << 'EOL'
const fs = require('fs');
const path = require('path');

try {
  // Check package.json
  const packageJsonPath = path.resolve('./package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('Checking Leaflet version compatibility for Windy API');
    console.log('-----------------------------------------------------');
    
    // Get installed versions
    const leafletVersion = packageJson.dependencies?.leaflet || 'not installed';
    const reactLeafletVersion = packageJson.dependencies?.['react-leaflet'] || 'not installed';
    
    console.log(`Leaflet: ${leafletVersion}`);
    console.log(`React-Leaflet: ${reactLeafletVersion}`);
    
    // Check compatibility
    if (leafletVersion.startsWith('1.4.')) {
      console.log('✅ Leaflet version is compatible with Windy API (1.4.x)');
    } else {
      console.log('❌ Leaflet version is NOT compatible with Windy API (1.4.x required)');
    }
    
    if (reactLeafletVersion.startsWith('2.')) {
      console.log('✅ React-Leaflet version is compatible with Leaflet 1.4.x');
    } else {
      console.log('❌ React-Leaflet version might not be compatible with Leaflet 1.4.x (v2.x recommended)');
    }
    
    console.log('\nRecommended versions:');
    console.log('- leaflet: 1.4.0');
    console.log('- react-leaflet: 2.7.0');
    console.log('- @types/leaflet: 1.5.19');
  } else {
    console.log('Package.json not found');
  }
} catch (error) {
  console.error('Error checking compatibility:', error);
}
EOL

echo "Updated MapContainer.tsx to correctly use react-leaflet v2 syntax."
echo "Created a compatibility checker script. Run it with: node check-leaflet-compatibility.js"
echo ""
echo "If you continue to have errors, please ensure you have the correct versions installed:"
echo "npm uninstall leaflet react-leaflet @types/leaflet"
echo "npm install leaflet@1.4.0 react-leaflet@2.7.0 @types/leaflet@1.5.19"