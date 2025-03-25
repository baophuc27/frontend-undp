// src/components/Map/BackupLayer.tsx
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
  minZoom = 10,
  maxZoom = 19
}) => {
  const { leafletMap } = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!leafletMap) return;

    // Create the tile layer if it doesn't exist
    if (!layerRef.current) {
      const tileLayer = L.tileLayer(url, {
        attribution,
        opacity,
        minZoom,
        maxZoom
      });

      layerRef.current = tileLayer;
      tileLayer.addTo(leafletMap);

      // Add zoom handler to adjust opacity
      const handleZoom = () => {
        const currentZoom = leafletMap.getZoom();
        if (currentZoom > 10) {
          const zoomFactor = Math.min((currentZoom - 10) / 8, 1); // Gradually increase opacity from zoom 10 to 18
          tileLayer.setOpacity(opacity * zoomFactor);
        } else {
          tileLayer.setOpacity(0);
        }
      };

      leafletMap.on('zoomend', handleZoom);
      handleZoom(); // Initial opacity setting

      return () => {
        leafletMap.off('zoomend', handleZoom);
        if (layerRef.current) {
          leafletMap.removeLayer(layerRef.current);
          layerRef.current = null;
        }
      };
    }
  }, [leafletMap, url, attribution, opacity, minZoom, maxZoom]);

  return null;
};

export default BackupLayer;