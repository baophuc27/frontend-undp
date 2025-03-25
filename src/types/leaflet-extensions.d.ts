import L from 'leaflet';

declare module 'leaflet' {
  interface Map {
    markers?: L.Marker[];
    bufferLayer?: L.GeoJSON;
  }
}