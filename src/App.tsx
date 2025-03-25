import React, { useMemo } from 'react';
import { MapProvider } from './context/MapContext';
import MapContainer from './components/Map/MapContainer';
import { MapLayer } from './types/map';
import './App.css';

const App: React.FC = () => {
  // Define additional map layers - memoize to prevent recreation on each render
  const additionalLayers: MapLayer[] = useMemo(() => [
    {
      id: 'osm',
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      visible: true,
      type: 'base' as 'base'
    },
    {
      id: 'cycling',
      name: 'Cycling Map',
      url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a>',
      visible: false,
      type: 'tile' as 'tile'
    },
    {
      id: 'topo',
      name: 'Topographic',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      visible: false,
      type: 'tile' as 'tile'
    }
  ], []);

  return (
    <div className="App">
      <MapProvider initialLayers={additionalLayers}>
        <MapContainer additionalLayers={additionalLayers} />
      </MapProvider>
    </div>
  );
};

export default App;