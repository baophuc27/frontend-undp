import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from '../../context/MapContext';

interface BackupLayerProps {
  url?: string;
  attribution?: string;
  opacity?: number;
  minZoom?: number;
  maxZoom?: number;
}

const BackupLayer: React.FC<BackupLayerProps> = ({
  url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  opacity = 0.7,
  minZoom = 11,
  maxZoom = 19
}) => {
  const { leafletMap } = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  // Add/remove the backup layer when the component mounts/unmounts
  useEffect(() => {
    if (!leafletMap) return;
    
    // Create the tile layer
    const tileLayer = L.tileLayer(url, {
      attribution,
      opacity,
      minZoom,
      maxZoom
    });
    
    // Add the layer to the map
    tileLayer.addTo(leafletMap);
    layerRef.current = tileLayer;
    
    // Clean up on unmount
    return () => {
      if (layerRef.current && leafletMap) {
        leafletMap.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [leafletMap, url, attribution, opacity, minZoom, maxZoom]);

  // Nothing to render - this component just adds a layer to the map
  return null;
};

export default BackupLayer;