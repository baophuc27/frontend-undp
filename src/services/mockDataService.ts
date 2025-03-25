// src/services/mockDataService.ts
import { DataPoint, WeatherStation, WeatherAlert } from '../types/map';

/**
 * MockDataService provides sample data for testing and development
 * when the backend API is not available
 */
export class MockDataService {
  /**
   * Get mock weather stations data
   */
  public static getWeatherStations(): WeatherStation[] {
    return [
      {
        id: "ws001",
        name: "Central Station",
        position: { lat: 10.835, lng: 106.769 },
        data: {
          temperature: 32.5,
          humidity: 78,
          windSpeed: 4.2,
          windDirection: 140,
          pressure: 1012,
          precipitation: 0,
          lastUpdated: new Date()
        }
      },
      {
        id: "ws002",
        name: "North Station",
        position: { lat: 10.855, lng: 106.789 },
        data: {
          temperature: 31.8,
          humidity: 75,
          windSpeed: 3.8,
          windDirection: 165,
          pressure: 1010,
          precipitation: 0,
          lastUpdated: new Date()
        }
      },
      {
        id: "ws003",
        name: "South Station",
        position: { lat: 10.815, lng: 106.749 },
        data: {
          temperature: 33.2,
          humidity: 73,
          windSpeed: 5.1,
          windDirection: 120,
          pressure: 1011,
          precipitation: 0,
          lastUpdated: new Date()
        }
      }
    ];
  }

  /**
   * Get mock weather alerts
   */
  public static getWeatherAlerts(): WeatherAlert[] {
    return [
      {
        id: "alert001",
        type: "warning",
        title: "Heavy Rain Warning",
        description: "Heavy rainfall expected in the next 6 hours",
        position: { lat: 10.845, lng: 106.759 },
        radius: 10,
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours later
      },
      {
        id: "alert002",
        type: "info",
        title: "Wind Advisory",
        description: "Strong winds expected in coastal areas",
        position: { lat: 10.825, lng: 106.779 },
        radius: 15,
        startTime: new Date(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours later
      }
    ];
  }

  /**
   * Get mock data points for any dataset
   */
  public static getDataPoints(dataset: string): DataPoint[] {
    // Generic data points based on the requested dataset
    switch (dataset) {
      case "weather-stations":
        return [
          {
            id: "station1",
            lat: 10.835,
            lng: 106.769,
            value: 75,
            name: "Station Alpha",
            description: "Weather monitoring station in central location"
          },
          {
            id: "station2",
            lat: 10.855,
            lng: 106.789,
            value: 42,
            name: "Station Beta",
            description: "Urban environment station"
          },
          {
            id: "station3",
            lat: 10.815,
            lng: 106.749,
            value: 88,
            name: "Station Gamma",
            description: "High precision weather station"
          }
        ];
      
      case "pollution-data":
        return [
          {
            id: "pollution1",
            lat: 10.835,
            lng: 106.769,
            value: 65,
            name: "Air Quality Station 1",
            description: "PM2.5 concentration"
          },
          {
            id: "pollution2",
            lat: 10.855,
            lng: 106.789,
            value: 35,
            name: "Air Quality Station 2",
            description: "PM2.5 concentration"
          },
          {
            id: "pollution3",
            lat: 10.815,
            lng: 106.749,
            value: 82,
            name: "Air Quality Station 3",
            description: "PM2.5 concentration"
          }
        ];
      
      default:
        // Return some sample data points if dataset is not recognized
        return [
          {
            id: "point1",
            lat: 10.835,
            lng: 106.769,
            value: 50,
            name: "Sample Point 1",
            description: "Generic data point"
          },
          {
            id: "point2",
            lat: 10.855,
            lng: 106.789,
            value: 50,
            name: "Sample Point 2",
            description: "Generic data point"
          }
        ];
    }
  }
}