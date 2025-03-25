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
  opacity = 1.0, // Full opacity for better visibility
  minZoom = 10,
  maxZoom = 19
}) => {
  const { leafletMap } = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!leafletMap) return;
    
    console.log("BackupLayer mounting with leafletMap:", leafletMap);

    // Create the tile layer if it doesn't exist
    if (!layerRef.current) {
      console.log("Creating new tile layer");
      
      // Make sure any existing panes are ready
      if (!leafletMap.getPane('detailedView')) {
        leafletMap.createPane('detailedView');
        leafletMap.getPane('detailedView')!.style.zIndex = '650';
      }
      
      const tileLayer = L.tileLayer(url, {
        attribution,
        opacity,
        minZoom,
        maxZoom,
        zIndex: 1000, // High z-index
        className: 'detailed-view-tiles', // Custom class for styling
        pane: 'detailedView' // Use custom pane
      });

      // Log to verify creation
      console.log("Tile layer created:", tileLayer);
      
      layerRef.current = tileLayer;
      tileLayer.addTo(leafletMap);
      
      // Force a redraw after adding the layer
      window.setTimeout(() => {
        leafletMap.invalidateSize();
        tileLayer.redraw();
        console.log("Forced redraw of tile layer");
      }, 100);

      // Add zoom handler to adjust opacity based on zoom level
      const handleZoom = () => {
        const currentZoom = leafletMap.getZoom();
        console.log("Zoom changed to:", currentZoom);
        
        if (currentZoom > 10) {
          // Show at full opacity when over zoom level 10
          console.log("Setting tile layer to full opacity");
          tileLayer.setOpacity(opacity);
          // Make detailed view pane visible and on top
          if (leafletMap.getPane('detailedView')) {
            leafletMap.getPane('detailedView')!.style.zIndex = '650';
          }
        } else {
          console.log("Setting tile layer to zero opacity");
          tileLayer.setOpacity(0);
        }
      };

      // Listen for zoomend events on the map
      leafletMap.on('zoomend', handleZoom);
      
      // Set initial opacity based on current zoom
      handleZoom();
      
      // Sometimes the tiles need a moment to load properly
      setTimeout(() => {
        tileLayer.redraw();
      }, 500);

      return () => {
        console.log("BackupLayer cleanup");
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