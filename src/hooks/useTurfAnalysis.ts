import { useCallback } from 'react';
import * as turf from '@turf/turf';
import { GeoPoint } from '../types/map';

export const useTurfAnalysis = () => {
  // Calculate distance between two points in kilometers
  const calculateDistance = useCallback((point1: GeoPoint, point2: GeoPoint): number => {
    const from = turf.point([point1.lng, point1.lat]);
    const to = turf.point([point2.lng, point2.lat]);
    
    // Calculate distance in kilometers
    return turf.distance(from, to);
  }, []);
  
  // Create a buffer around a point (in kilometers)
  const createBuffer = useCallback((point: GeoPoint, radius: number) => {
    const pt = turf.point([point.lng, point.lat]);
    return turf.buffer(pt, radius, { units: 'kilometers' });
  }, []);
  
  // Check if a point is inside a polygon
  const isPointInPolygon = useCallback((point: GeoPoint, polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean => {
    const pt = turf.point([point.lng, point.lat]);
    return turf.booleanPointInPolygon(pt, polygon);
  }, []);
  
  // Find the nearest point in a collection to a reference point
  const findNearestPoint = useCallback((point: GeoPoint, points: GeoPoint[]): GeoPoint | null => {
    if (points.length === 0) return null;
    
    const pt = turf.point([point.lng, point.lat]);
    const features = points.map(p => turf.point([p.lng, p.lat]));
    const featureCollection = turf.featureCollection(features);
    
    const nearest = turf.nearestPoint(pt, featureCollection);
    
    if (nearest && nearest.geometry) {
      return {
        lng: nearest.geometry.coordinates[0],
        lat: nearest.geometry.coordinates[1]
      };
    }
    
    return null;
  }, []);
  
  // Calculate area of a polygon in square kilometers
  const calculateArea = useCallback((polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): number => {
    return turf.area(polygon) / 1000000; // Convert from square meters to square kilometers
  }, []);
  
  return {
    calculateDistance,
    createBuffer,
    isPointInPolygon,
    findNearestPoint,
    calculateArea
  };
};