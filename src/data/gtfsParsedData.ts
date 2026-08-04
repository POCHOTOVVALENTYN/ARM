// Auto-generated from GTFS Data
import { Route, VehicleBlock, DriverDuty } from '../types';
import { MOCK_VEHICLE_BLOCKS, MOCK_DRIVER_DUTIES } from './mockData';

export const GTFS_ROUTES: Route[] = [
  {
    "id": "T1",
    "number": "1",
    "name": "вул. Чорноморського козацтва - завод Центроліт",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "703558",
    "secondaryTerminalId": "703588",
    "lengthDir1Km": 16.59,
    "lengthDir2Km": 16.57,
    "stations": [
      "703558",
      "703559",
      "703560",
      "703561",
      "703562",
      "703563",
      "703564",
      "703565",
      "703566",
      "703567",
      "703568",
      "703569",
      "703570",
      "703571",
      "703572",
      "703573",
      "801859",
      "703574",
      "703575",
      "703576",
      "703577",
      "703578",
      "703579",
      "703580",
      "703581",
      "703582",
      "801862",
      "892661",
      "703583",
      "703584",
      "703585",
      "703586",
      "703587",
      "703588"
    ],
    "segments": [
      {
        "fromStationId": "703558",
        "toStationId": "703559",
        "distanceKm": 0.77,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703559",
        "toStationId": "703560",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703560",
        "toStationId": "703561",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703561",
        "toStationId": "703562",
        "distanceKm": 0.77,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703562",
        "toStationId": "703563",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703563",
        "toStationId": "703564",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703564",
        "toStationId": "703565",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703565",
        "toStationId": "703566",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703566",
        "toStationId": "703567",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703567",
        "toStationId": "703568",
        "distanceKm": 0.62,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703568",
        "toStationId": "703569",
        "distanceKm": 0.62,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703569",
        "toStationId": "703570",
        "distanceKm": 0.7,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703570",
        "toStationId": "703571",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703571",
        "toStationId": "703572",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703572",
        "toStationId": "703573",
        "distanceKm": 0.89,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703573",
        "toStationId": "801859",
        "distanceKm": 0.57,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801859",
        "toStationId": "703574",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703574",
        "toStationId": "703575",
        "distanceKm": 0.66,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703575",
        "toStationId": "703576",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703576",
        "toStationId": "703577",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703577",
        "toStationId": "703578",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703578",
        "toStationId": "703579",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703579",
        "toStationId": "703580",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703580",
        "toStationId": "703581",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703581",
        "toStationId": "703582",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703582",
        "toStationId": "801862",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801862",
        "toStationId": "892661",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "892661",
        "toStationId": "703583",
        "distanceKm": 0.54,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703583",
        "toStationId": "703584",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703584",
        "toStationId": "703585",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703585",
        "toStationId": "703586",
        "distanceKm": 0.63,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703586",
        "toStationId": "703587",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703587",
        "toStationId": "703588",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 1"
  },
  {
    "id": "Tr2",
    "number": "2",
    "name": "Парк ім. Тараса Шевченка — вул. Новосельського",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "687087",
    "secondaryTerminalId": "702197",
    "lengthDir1Km": 5.04,
    "lengthDir2Km": 4.77,
    "stations": [
      "687087",
      "702185",
      "702186",
      "702187",
      "702188",
      "702189",
      "702190",
      "702191",
      "702192",
      "702193",
      "702194",
      "702195",
      "702196",
      "702197"
    ],
    "segments": [
      {
        "fromStationId": "687087",
        "toStationId": "702185",
        "distanceKm": 0.18,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702185",
        "toStationId": "702186",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702186",
        "toStationId": "702187",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702187",
        "toStationId": "702188",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702188",
        "toStationId": "702189",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702189",
        "toStationId": "702190",
        "distanceKm": 0.29,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702190",
        "toStationId": "702191",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702191",
        "toStationId": "702192",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702192",
        "toStationId": "702193",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702193",
        "toStationId": "702194",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702194",
        "toStationId": "702195",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702195",
        "toStationId": "702196",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702196",
        "toStationId": "702197",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 2"
  },
  {
    "id": "Tr3",
    "number": "3",
    "name": "станція Застава I — Парк ім. Тараса Шевченка",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "687088",
    "secondaryTerminalId": "687087",
    "lengthDir1Km": 7.6,
    "lengthDir2Km": 7.68,
    "stations": [
      "687088",
      "687084",
      "687081",
      "687060",
      "687073",
      "687085",
      "687089",
      "687071",
      "687056",
      "687058",
      "687079",
      "687062",
      "687069",
      "687072",
      "687075",
      "687078",
      "687064",
      "687067",
      "687087"
    ],
    "segments": [
      {
        "fromStationId": "687088",
        "toStationId": "687084",
        "distanceKm": 0.14,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687084",
        "toStationId": "687081",
        "distanceKm": 0.23,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687081",
        "toStationId": "687060",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687060",
        "toStationId": "687073",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687073",
        "toStationId": "687085",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687085",
        "toStationId": "687089",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687089",
        "toStationId": "687071",
        "distanceKm": 0.23,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687071",
        "toStationId": "687056",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687056",
        "toStationId": "687058",
        "distanceKm": 0.6,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687058",
        "toStationId": "687079",
        "distanceKm": 0.67,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687079",
        "toStationId": "687062",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687062",
        "toStationId": "687069",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687069",
        "toStationId": "687072",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687072",
        "toStationId": "687075",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687075",
        "toStationId": "687078",
        "distanceKm": 0.7,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687078",
        "toStationId": "687064",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687064",
        "toStationId": "687067",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687067",
        "toStationId": "687087",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 3"
  },
  {
    "id": "T5",
    "number": "5",
    "name": "Автовокзал — Аркадія",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798899",
    "secondaryTerminalId": "798878",
    "lengthDir1Km": 8.21,
    "lengthDir2Km": 8.18,
    "stations": [
      "798899",
      "801868",
      "798762",
      "798763",
      "798698",
      "798747",
      "798782",
      "798806",
      "798718",
      "798890",
      "798745",
      "798849",
      "798712",
      "798903",
      "798831",
      "798873",
      "798867",
      "798822",
      "798844",
      "798878"
    ],
    "segments": [
      {
        "fromStationId": "798899",
        "toStationId": "801868",
        "distanceKm": 0.16,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801868",
        "toStationId": "798762",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798762",
        "toStationId": "798763",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798763",
        "toStationId": "798698",
        "distanceKm": 0.39,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798698",
        "toStationId": "798747",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798747",
        "toStationId": "798782",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798782",
        "toStationId": "798806",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798806",
        "toStationId": "798718",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798718",
        "toStationId": "798890",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798890",
        "toStationId": "798745",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798745",
        "toStationId": "798849",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798849",
        "toStationId": "798712",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798712",
        "toStationId": "798903",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798903",
        "toStationId": "798831",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798831",
        "toStationId": "798873",
        "distanceKm": 0.58,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798873",
        "toStationId": "798867",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798867",
        "toStationId": "798822",
        "distanceKm": 0.29,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798822",
        "toStationId": "798844",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798844",
        "toStationId": "798878",
        "distanceKm": 0.95,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 5"
  },
  {
    "id": "T6",
    "number": "6",
    "name": "вул.Чорноморського козацтва – Лузанівка",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "703558",
    "secondaryTerminalId": "703572",
    "lengthDir1Km": 7.24,
    "lengthDir2Km": 7.3,
    "stations": [
      "703558",
      "703559",
      "703560",
      "703561",
      "703562",
      "703563",
      "703564",
      "703565",
      "703566",
      "703567",
      "703568",
      "703569",
      "703570",
      "703571",
      "703572"
    ],
    "segments": [
      {
        "fromStationId": "703558",
        "toStationId": "703559",
        "distanceKm": 0.77,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703559",
        "toStationId": "703560",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703560",
        "toStationId": "703561",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703561",
        "toStationId": "703562",
        "distanceKm": 0.77,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703562",
        "toStationId": "703563",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703563",
        "toStationId": "703564",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703564",
        "toStationId": "703565",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703565",
        "toStationId": "703566",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703566",
        "toStationId": "703567",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703567",
        "toStationId": "703568",
        "distanceKm": 0.62,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703568",
        "toStationId": "703569",
        "distanceKm": 0.62,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703569",
        "toStationId": "703570",
        "distanceKm": 0.7,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703570",
        "toStationId": "703571",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703571",
        "toStationId": "703572",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 6"
  },
  {
    "id": "Tr7",
    "number": "7",
    "name": "вул. Архітекторська — вул. Новосельського",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "702349",
    "secondaryTerminalId": "702197",
    "lengthDir1Km": 17.57,
    "lengthDir2Km": 15.19,
    "stations": [
      "702349",
      "702350",
      "702351",
      "702399",
      "702400",
      "702401",
      "702402",
      "702403",
      "702404",
      "702361",
      "702362",
      "702363",
      "702406",
      "702405",
      "702407",
      "702408",
      "702409",
      "702410",
      "702411",
      "702412",
      "702413",
      "702414",
      "702415",
      "702416",
      "702417",
      "702418",
      "702419",
      "702420",
      "702421",
      "702422",
      "702423",
      "702424",
      "702425",
      "702426",
      "702427",
      "702428",
      "803588",
      "702429",
      "702430",
      "702431",
      "702432",
      "702200",
      "702196",
      "702197"
    ],
    "segments": [
      {
        "fromStationId": "702349",
        "toStationId": "702350",
        "distanceKm": 0.75,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702350",
        "toStationId": "702351",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702351",
        "toStationId": "702399",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702399",
        "toStationId": "702400",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702400",
        "toStationId": "702401",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702401",
        "toStationId": "702402",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702402",
        "toStationId": "702403",
        "distanceKm": 0.25,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702403",
        "toStationId": "702404",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702404",
        "toStationId": "702361",
        "distanceKm": 0.47,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702361",
        "toStationId": "702362",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702362",
        "toStationId": "702363",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702363",
        "toStationId": "702406",
        "distanceKm": 0.8,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702406",
        "toStationId": "702405",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702405",
        "toStationId": "702407",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702407",
        "toStationId": "702408",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702408",
        "toStationId": "702409",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702409",
        "toStationId": "702410",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702410",
        "toStationId": "702411",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702411",
        "toStationId": "702412",
        "distanceKm": 0.57,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702412",
        "toStationId": "702413",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702413",
        "toStationId": "702414",
        "distanceKm": 0.63,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702414",
        "toStationId": "702415",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702415",
        "toStationId": "702416",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702416",
        "toStationId": "702417",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702417",
        "toStationId": "702418",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702418",
        "toStationId": "702419",
        "distanceKm": 0.24,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702419",
        "toStationId": "702420",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702420",
        "toStationId": "702421",
        "distanceKm": 0.29,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702421",
        "toStationId": "702422",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702422",
        "toStationId": "702423",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702423",
        "toStationId": "702424",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702424",
        "toStationId": "702425",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702425",
        "toStationId": "702426",
        "distanceKm": 0.29,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702426",
        "toStationId": "702427",
        "distanceKm": 0.16,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702427",
        "toStationId": "702428",
        "distanceKm": 0.23,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702428",
        "toStationId": "803588",
        "distanceKm": 0.21,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "803588",
        "toStationId": "702429",
        "distanceKm": 0.61,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702429",
        "toStationId": "702430",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702430",
        "toStationId": "702431",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702431",
        "toStationId": "702432",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702432",
        "toStationId": "702200",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702200",
        "toStationId": "702196",
        "distanceKm": 0.25,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702196",
        "toStationId": "702197",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 7"
  },
  {
    "id": "Tr8",
    "number": "8",
    "name": "Суперфосфатний завод — Залізничний вокзал",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "702460",
    "secondaryTerminalId": "702422",
    "lengthDir1Km": 7.27,
    "lengthDir2Km": 8.92,
    "stations": [
      "702460",
      "702461",
      "702462",
      "702463",
      "702464",
      "702465",
      "702466",
      "702467",
      "702468",
      "702469",
      "702470",
      "687077",
      "687075",
      "702437",
      "702422"
    ],
    "segments": [
      {
        "fromStationId": "702460",
        "toStationId": "702461",
        "distanceKm": 0.64,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702461",
        "toStationId": "702462",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702462",
        "toStationId": "702463",
        "distanceKm": 0.68,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702463",
        "toStationId": "702464",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702464",
        "toStationId": "702465",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702465",
        "toStationId": "702466",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702466",
        "toStationId": "702467",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702467",
        "toStationId": "702468",
        "distanceKm": 0.91,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702468",
        "toStationId": "702469",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702469",
        "toStationId": "702470",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702470",
        "toStationId": "687077",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687077",
        "toStationId": "687075",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "687075",
        "toStationId": "702437",
        "distanceKm": 0.66,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702437",
        "toStationId": "702422",
        "distanceKm": 0.26,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 8"
  },
  {
    "id": "Tr9",
    "number": "9",
    "name": "вул. Інглезі – вул. Рішельєвська",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "702487",
    "secondaryTerminalId": "702426",
    "lengthDir1Km": 9.97,
    "lengthDir2Km": 10.9,
    "stations": [
      "702487",
      "702488",
      "702489",
      "702490",
      "702491",
      "702407",
      "702408",
      "702409",
      "702410",
      "702411",
      "702412",
      "702413",
      "702414",
      "702415",
      "702416",
      "702417",
      "702418",
      "702419",
      "702420",
      "702492",
      "702493",
      "702494",
      "702495",
      "702496",
      "702426"
    ],
    "segments": [
      {
        "fromStationId": "702487",
        "toStationId": "702488",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702488",
        "toStationId": "702489",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702489",
        "toStationId": "702490",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702490",
        "toStationId": "702491",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702491",
        "toStationId": "702407",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702407",
        "toStationId": "702408",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702408",
        "toStationId": "702409",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702409",
        "toStationId": "702410",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702410",
        "toStationId": "702411",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702411",
        "toStationId": "702412",
        "distanceKm": 0.57,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702412",
        "toStationId": "702413",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702413",
        "toStationId": "702414",
        "distanceKm": 0.63,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702414",
        "toStationId": "702415",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702415",
        "toStationId": "702416",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702416",
        "toStationId": "702417",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702417",
        "toStationId": "702418",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702418",
        "toStationId": "702419",
        "distanceKm": 0.24,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702419",
        "toStationId": "702420",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702420",
        "toStationId": "702492",
        "distanceKm": 0.24,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702492",
        "toStationId": "702493",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702493",
        "toStationId": "702494",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702494",
        "toStationId": "702495",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702495",
        "toStationId": "702496",
        "distanceKm": 0.26,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702496",
        "toStationId": "702426",
        "distanceKm": 0.54,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 9"
  },
  {
    "id": "Tr10",
    "number": "10",
    "name": "вул. Інглезі – вул. Приморська",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "702487",
    "secondaryTerminalId": "702520",
    "lengthDir1Km": 14.95,
    "lengthDir2Km": 11.48,
    "stations": [
      "702487",
      "702488",
      "702489",
      "702491",
      "702407",
      "702408",
      "702409",
      "702490",
      "702410",
      "702510",
      "702509",
      "702511",
      "702512",
      "702513",
      "702417",
      "702418",
      "702419",
      "702420",
      "702421",
      "702422",
      "702423",
      "702424",
      "702514",
      "702515",
      "702516",
      "702517",
      "702518",
      "702519",
      "702520"
    ],
    "segments": [
      {
        "fromStationId": "702487",
        "toStationId": "702488",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702488",
        "toStationId": "702489",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702489",
        "toStationId": "702491",
        "distanceKm": 0.88,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702491",
        "toStationId": "702407",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702407",
        "toStationId": "702408",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702408",
        "toStationId": "702409",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702409",
        "toStationId": "702490",
        "distanceKm": 1.56,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702490",
        "toStationId": "702410",
        "distanceKm": 1.91,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702410",
        "toStationId": "702510",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702510",
        "toStationId": "702509",
        "distanceKm": 0.54,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702509",
        "toStationId": "702511",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702511",
        "toStationId": "702512",
        "distanceKm": 0.23,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702512",
        "toStationId": "702513",
        "distanceKm": 0.5,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702513",
        "toStationId": "702417",
        "distanceKm": 0.65,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702417",
        "toStationId": "702418",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702418",
        "toStationId": "702419",
        "distanceKm": 0.24,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702419",
        "toStationId": "702420",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702420",
        "toStationId": "702421",
        "distanceKm": 0.29,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702421",
        "toStationId": "702422",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702422",
        "toStationId": "702423",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702423",
        "toStationId": "702424",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702424",
        "toStationId": "702514",
        "distanceKm": 0.6,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702514",
        "toStationId": "702515",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702515",
        "toStationId": "702516",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702516",
        "toStationId": "702517",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702517",
        "toStationId": "702518",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702518",
        "toStationId": "702519",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702519",
        "toStationId": "702520",
        "distanceKm": 0.21,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 10"
  },
  {
    "id": "T11",
    "number": "11",
    "name": "Залізничний вокзал - пл. Олексіївська",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798883",
    "secondaryTerminalId": "708889",
    "lengthDir1Km": 2.37,
    "lengthDir2Km": 2.38,
    "stations": [
      "798883",
      "798834",
      "798679",
      "798853",
      "798737",
      "798750",
      "708888",
      "708889"
    ],
    "segments": [
      {
        "fromStationId": "798883",
        "toStationId": "798834",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798834",
        "toStationId": "798679",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798679",
        "toStationId": "798853",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798853",
        "toStationId": "798737",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798737",
        "toStationId": "798750",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798750",
        "toStationId": "708888",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708888",
        "toStationId": "708889",
        "distanceKm": 0.21,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 11"
  },
  {
    "id": "Tr12",
    "number": "12",
    "name": "вул. Архітекторська – вул. Центральний Аеропорт",
    "type": "trolleybus",
    "status": "active",
    "primaryTerminalId": "702349",
    "secondaryTerminalId": "702373",
    "lengthDir1Km": 10.68,
    "lengthDir2Km": 10.66,
    "stations": [
      "702349",
      "702350",
      "702351",
      "702352",
      "702353",
      "702354",
      "702355",
      "702356",
      "702357",
      "702358",
      "702359",
      "702360",
      "702361",
      "702362",
      "702363",
      "702364",
      "702365",
      "702366",
      "702367",
      "702368",
      "702369",
      "803614",
      "702371",
      "702372",
      "702373"
    ],
    "segments": [
      {
        "fromStationId": "702349",
        "toStationId": "702350",
        "distanceKm": 0.75,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702350",
        "toStationId": "702351",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702351",
        "toStationId": "702352",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702352",
        "toStationId": "702353",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702353",
        "toStationId": "702354",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702354",
        "toStationId": "702355",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702355",
        "toStationId": "702356",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702356",
        "toStationId": "702357",
        "distanceKm": 0.56,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702357",
        "toStationId": "702358",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702358",
        "toStationId": "702359",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702359",
        "toStationId": "702360",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702360",
        "toStationId": "702361",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702361",
        "toStationId": "702362",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702362",
        "toStationId": "702363",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702363",
        "toStationId": "702364",
        "distanceKm": 0.72,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702364",
        "toStationId": "702365",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702365",
        "toStationId": "702366",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702366",
        "toStationId": "702367",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702367",
        "toStationId": "702368",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702368",
        "toStationId": "702369",
        "distanceKm": 0.62,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702369",
        "toStationId": "803614",
        "distanceKm": 0.83,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "803614",
        "toStationId": "702371",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702371",
        "toStationId": "702372",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702372",
        "toStationId": "702373",
        "distanceKm": 0.28,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 12"
  },
  {
    "id": "T13",
    "number": "13",
    "name": "пл. Старосінна — ж/м Шкільний",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "708889",
    "secondaryTerminalId": "798800",
    "lengthDir1Km": 7.72,
    "lengthDir2Km": 7.69,
    "stations": [
      "708889",
      "708890",
      "708891",
      "708892",
      "708893",
      "798825",
      "708894",
      "708895",
      "798861",
      "708896",
      "708897",
      "708898",
      "798829",
      "708900",
      "804196",
      "798722",
      "798851",
      "798800"
    ],
    "segments": [
      {
        "fromStationId": "708889",
        "toStationId": "708890",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708890",
        "toStationId": "708891",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708891",
        "toStationId": "708892",
        "distanceKm": 0.82,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708892",
        "toStationId": "708893",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708893",
        "toStationId": "798825",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798825",
        "toStationId": "708894",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708894",
        "toStationId": "708895",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708895",
        "toStationId": "798861",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798861",
        "toStationId": "708896",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708896",
        "toStationId": "708897",
        "distanceKm": 0.68,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708897",
        "toStationId": "708898",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708898",
        "toStationId": "798829",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798829",
        "toStationId": "708900",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708900",
        "toStationId": "804196",
        "distanceKm": 0.07,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "804196",
        "toStationId": "798722",
        "distanceKm": 0.65,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798722",
        "toStationId": "798851",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798851",
        "toStationId": "798800",
        "distanceKm": 0.39,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 13"
  },
  {
    "id": "T15",
    "number": "15",
    "name": "пл. Олексіївська – Слобідський ринок",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798883",
    "secondaryTerminalId": "702546",
    "lengthDir1Km": 7.47,
    "lengthDir2Km": 6.7,
    "stations": [
      "798883",
      "798834",
      "798679",
      "798853",
      "798737",
      "798750",
      "798741",
      "798700",
      "798773",
      "798897",
      "702531",
      "702532",
      "702533",
      "702534",
      "702536",
      "702537",
      "702538",
      "702539",
      "702540",
      "702542",
      "702543",
      "702544",
      "702545",
      "702546"
    ],
    "segments": [
      {
        "fromStationId": "798883",
        "toStationId": "798834",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798834",
        "toStationId": "798679",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798679",
        "toStationId": "798853",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798853",
        "toStationId": "798737",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798737",
        "toStationId": "798750",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798750",
        "toStationId": "798741",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798741",
        "toStationId": "798700",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798700",
        "toStationId": "798773",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798773",
        "toStationId": "798897",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798897",
        "toStationId": "702531",
        "distanceKm": 0.13,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702531",
        "toStationId": "702532",
        "distanceKm": 0.28,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702532",
        "toStationId": "702533",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702533",
        "toStationId": "702534",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702534",
        "toStationId": "702536",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702536",
        "toStationId": "702537",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702537",
        "toStationId": "702538",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702538",
        "toStationId": "702539",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702539",
        "toStationId": "702540",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702540",
        "toStationId": "702542",
        "distanceKm": 0.25,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702542",
        "toStationId": "702543",
        "distanceKm": 0.16,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702543",
        "toStationId": "702544",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702544",
        "toStationId": "702545",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "702545",
        "toStationId": "702546",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 15"
  },
  {
    "id": "T17",
    "number": "17",
    "name": "11-а станція Великого Фонтану — Куликове поле",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "802153",
    "secondaryTerminalId": "702501",
    "lengthDir1Km": 6.69,
    "lengthDir2Km": 6.22,
    "stations": [
      "802153",
      "802154",
      "798658",
      "798651",
      "798644",
      "798789",
      "798636",
      "798635",
      "798630",
      "798684",
      "798628",
      "798756",
      "798621",
      "798618",
      "702501"
    ],
    "segments": [
      {
        "fromStationId": "802153",
        "toStationId": "802154",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "802154",
        "toStationId": "798658",
        "distanceKm": 0.82,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798658",
        "toStationId": "798651",
        "distanceKm": 0.25,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798651",
        "toStationId": "798644",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798644",
        "toStationId": "798789",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798789",
        "toStationId": "798636",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798636",
        "toStationId": "798635",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798635",
        "toStationId": "798630",
        "distanceKm": 0.7,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798630",
        "toStationId": "798684",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798684",
        "toStationId": "798628",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798628",
        "toStationId": "798756",
        "distanceKm": 0.26,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798756",
        "toStationId": "798621",
        "distanceKm": 0.65,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798621",
        "toStationId": "798618",
        "distanceKm": 0.61,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798618",
        "toStationId": "702501",
        "distanceKm": 0.68,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 17"
  },
  {
    "id": "T18",
    "number": "18",
    "name": "Куликове поле — Меморіал 411-ї батареї",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798880",
    "secondaryTerminalId": "798820",
    "lengthDir1Km": 12.13,
    "lengthDir2Km": 12.01,
    "stations": [
      "798880",
      "798619",
      "798622",
      "798757",
      "798627",
      "798685",
      "798629",
      "798634",
      "798637",
      "798788",
      "798643",
      "798651",
      "798657",
      "798662",
      "802165",
      "798669",
      "798709",
      "798728",
      "798854",
      "798670",
      "798673",
      "798676",
      "798711",
      "798871",
      "798779",
      "798755",
      "798865",
      "798793",
      "798868",
      "798681",
      "798820"
    ],
    "segments": [
      {
        "fromStationId": "798880",
        "toStationId": "798619",
        "distanceKm": 0.61,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798619",
        "toStationId": "798622",
        "distanceKm": 0.81,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798622",
        "toStationId": "798757",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798757",
        "toStationId": "798627",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798627",
        "toStationId": "798685",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798685",
        "toStationId": "798629",
        "distanceKm": 0.39,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798629",
        "toStationId": "798634",
        "distanceKm": 0.64,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798634",
        "toStationId": "798637",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798637",
        "toStationId": "798788",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798788",
        "toStationId": "798643",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798643",
        "toStationId": "798651",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798651",
        "toStationId": "798657",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798657",
        "toStationId": "798662",
        "distanceKm": 0.64,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798662",
        "toStationId": "802165",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "802165",
        "toStationId": "798669",
        "distanceKm": 0.65,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798669",
        "toStationId": "798709",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798709",
        "toStationId": "798728",
        "distanceKm": 0.22,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798728",
        "toStationId": "798854",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798854",
        "toStationId": "798670",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798670",
        "toStationId": "798673",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798673",
        "toStationId": "798676",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798676",
        "toStationId": "798711",
        "distanceKm": 0.63,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798711",
        "toStationId": "798871",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798871",
        "toStationId": "798779",
        "distanceKm": 0.26,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798779",
        "toStationId": "798755",
        "distanceKm": 0.23,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798755",
        "toStationId": "798865",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798865",
        "toStationId": "798793",
        "distanceKm": 0.24,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798793",
        "toStationId": "798868",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798868",
        "toStationId": "798681",
        "distanceKm": 0.22,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798681",
        "toStationId": "798820",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 18"
  },
  {
    "id": "T20",
    "number": "20",
    "name": "Херсонський сквер — Хаджибейський лиман",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "703520",
    "secondaryTerminalId": "703534",
    "lengthDir1Km": 6.61,
    "lengthDir2Km": 6.63,
    "stations": [
      "703520",
      "703521",
      "703522",
      "703523",
      "703524",
      "703525",
      "703526",
      "703527",
      "703528",
      "703529",
      "703530",
      "703531",
      "703532",
      "703533",
      "703534"
    ],
    "segments": [
      {
        "fromStationId": "703520",
        "toStationId": "703521",
        "distanceKm": 0.21,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703521",
        "toStationId": "703522",
        "distanceKm": 0.43,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703522",
        "toStationId": "703523",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703523",
        "toStationId": "703524",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703524",
        "toStationId": "703525",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703525",
        "toStationId": "703526",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703526",
        "toStationId": "703527",
        "distanceKm": 0.5,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703527",
        "toStationId": "703528",
        "distanceKm": 0.67,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703528",
        "toStationId": "703529",
        "distanceKm": 0.83,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703529",
        "toStationId": "703530",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703530",
        "toStationId": "703531",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703531",
        "toStationId": "703532",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703532",
        "toStationId": "703533",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "703533",
        "toStationId": "703534",
        "distanceKm": 0.59,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 20"
  },
  {
    "id": "T21",
    "number": "21",
    "name": "пл. Тираспільська — станція Застава ІІ",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798894",
    "secondaryTerminalId": "798808",
    "lengthDir1Km": 4.71,
    "lengthDir2Km": 4.27,
    "stations": [
      "798894",
      "798758",
      "798716",
      "798889",
      "798731",
      "798858",
      "798760",
      "798689",
      "798720",
      "798695",
      "798808"
    ],
    "segments": [
      {
        "fromStationId": "798894",
        "toStationId": "798758",
        "distanceKm": 0.67,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798758",
        "toStationId": "798716",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798716",
        "toStationId": "798889",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798889",
        "toStationId": "798731",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798731",
        "toStationId": "798858",
        "distanceKm": 0.39,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798858",
        "toStationId": "798760",
        "distanceKm": 0.58,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798760",
        "toStationId": "798689",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798689",
        "toStationId": "798720",
        "distanceKm": 0.61,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798720",
        "toStationId": "798695",
        "distanceKm": 0.3,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798695",
        "toStationId": "798808",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 21"
  },
  {
    "id": "T26",
    "number": "26",
    "name": "пл. Старосінна — 11-а станція Люстдорфської дороги",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "708889",
    "secondaryTerminalId": "708912",
    "lengthDir1Km": 10.82,
    "lengthDir2Km": 10.79,
    "stations": [
      "708889",
      "708890",
      "708891",
      "708892",
      "708893",
      "803616",
      "708894",
      "708895",
      "798861",
      "708896",
      "708897",
      "708898",
      "798829",
      "708900",
      "798796",
      "798727",
      "708903",
      "708904",
      "708905",
      "798826",
      "708906",
      "708907",
      "798656",
      "798659",
      "708910",
      "708911",
      "708912"
    ],
    "segments": [
      {
        "fromStationId": "708889",
        "toStationId": "708890",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708890",
        "toStationId": "708891",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708891",
        "toStationId": "708892",
        "distanceKm": 0.82,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708892",
        "toStationId": "708893",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708893",
        "toStationId": "803616",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "803616",
        "toStationId": "708894",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708894",
        "toStationId": "708895",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708895",
        "toStationId": "798861",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798861",
        "toStationId": "708896",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708896",
        "toStationId": "708897",
        "distanceKm": 0.68,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708897",
        "toStationId": "708898",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708898",
        "toStationId": "798829",
        "distanceKm": 0.44,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798829",
        "toStationId": "708900",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708900",
        "toStationId": "798796",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798796",
        "toStationId": "798727",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798727",
        "toStationId": "708903",
        "distanceKm": 0.22,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708903",
        "toStationId": "708904",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708904",
        "toStationId": "708905",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708905",
        "toStationId": "798826",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798826",
        "toStationId": "708906",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708906",
        "toStationId": "708907",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708907",
        "toStationId": "798656",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798656",
        "toStationId": "798659",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798659",
        "toStationId": "708910",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708910",
        "toStationId": "708911",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708911",
        "toStationId": "708912",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 26"
  },
  {
    "id": "T27",
    "number": "27",
    "name": "16 ст. Люстдорфської дороги – Переправа",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "708889",
    "secondaryTerminalId": "801878",
    "lengthDir1Km": 18.15,
    "lengthDir2Km": 18.21,
    "stations": [
      "708889",
      "708890",
      "708891",
      "708892",
      "708893",
      "803616",
      "708894",
      "708895",
      "798861",
      "708896",
      "708897",
      "798829",
      "708900",
      "798796",
      "798727",
      "708903",
      "708904",
      "708905",
      "798826",
      "708906",
      "708907",
      "798656",
      "798659",
      "708910",
      "708911",
      "708912",
      "708913",
      "708914",
      "708915",
      "708917",
      "818653",
      "708919",
      "708920",
      "708921",
      "798875",
      "798877",
      "801872",
      "801874",
      "801876",
      "801878"
    ],
    "segments": [
      {
        "fromStationId": "708889",
        "toStationId": "708890",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708890",
        "toStationId": "708891",
        "distanceKm": 0.53,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708891",
        "toStationId": "708892",
        "distanceKm": 0.82,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708892",
        "toStationId": "708893",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708893",
        "toStationId": "803616",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "803616",
        "toStationId": "708894",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708894",
        "toStationId": "708895",
        "distanceKm": 0.51,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708895",
        "toStationId": "798861",
        "distanceKm": 0.49,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798861",
        "toStationId": "708896",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708896",
        "toStationId": "708897",
        "distanceKm": 0.68,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708897",
        "toStationId": "798829",
        "distanceKm": 0.84,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798829",
        "toStationId": "708900",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708900",
        "toStationId": "798796",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798796",
        "toStationId": "798727",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798727",
        "toStationId": "708903",
        "distanceKm": 0.22,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708903",
        "toStationId": "708904",
        "distanceKm": 0.38,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708904",
        "toStationId": "708905",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708905",
        "toStationId": "798826",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798826",
        "toStationId": "708906",
        "distanceKm": 0.27,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708906",
        "toStationId": "708907",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708907",
        "toStationId": "798656",
        "distanceKm": 0.52,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798656",
        "toStationId": "798659",
        "distanceKm": 0.33,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798659",
        "toStationId": "708910",
        "distanceKm": 0.48,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708910",
        "toStationId": "708911",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708911",
        "toStationId": "708912",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708912",
        "toStationId": "708913",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708913",
        "toStationId": "708914",
        "distanceKm": 0.75,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708914",
        "toStationId": "708915",
        "distanceKm": 0.4,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708915",
        "toStationId": "708917",
        "distanceKm": 0.7,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708917",
        "toStationId": "818653",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "818653",
        "toStationId": "708919",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708919",
        "toStationId": "708920",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708920",
        "toStationId": "708921",
        "distanceKm": 0.34,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "708921",
        "toStationId": "798875",
        "distanceKm": 0.36,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798875",
        "toStationId": "798877",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798877",
        "toStationId": "801872",
        "distanceKm": 1.04,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801872",
        "toStationId": "801874",
        "distanceKm": 0.64,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801874",
        "toStationId": "801876",
        "distanceKm": 0.19,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801876",
        "toStationId": "801878",
        "distanceKm": 0.83,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 27"
  },
  {
    "id": "T28",
    "number": "28",
    "name": "вул. Пастера — Парк ім. Тараса Шевченка",
    "type": "tram",
    "status": "active",
    "primaryTerminalId": "798744",
    "secondaryTerminalId": "801885",
    "lengthDir1Km": 5.21,
    "lengthDir2Km": 5.35,
    "stations": [
      "798744",
      "798719",
      "798739",
      "798768",
      "798706",
      "801883",
      "798766",
      "798698",
      "798747",
      "798782",
      "798806",
      "798718",
      "798893",
      "801885"
    ],
    "segments": [
      {
        "fromStationId": "798744",
        "toStationId": "798719",
        "distanceKm": 0.17,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798719",
        "toStationId": "798739",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798739",
        "toStationId": "798768",
        "distanceKm": 0.55,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798768",
        "toStationId": "798706",
        "distanceKm": 0.35,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798706",
        "toStationId": "801883",
        "distanceKm": 0.31,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "801883",
        "toStationId": "798766",
        "distanceKm": 0.32,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798766",
        "toStationId": "798698",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798698",
        "toStationId": "798747",
        "distanceKm": 0.42,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798747",
        "toStationId": "798782",
        "distanceKm": 0.46,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798782",
        "toStationId": "798806",
        "distanceKm": 0.41,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798806",
        "toStationId": "798718",
        "distanceKm": 0.37,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798718",
        "toStationId": "798893",
        "distanceKm": 0.45,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      },
      {
        "fromStationId": "798893",
        "toStationId": "801885",
        "distanceKm": 0.56,
        "baseTravelTimes": {
          "morning_exit": 2,
          "morning_peak": 3,
          "off_peak": 2,
          "evening_peak": 3,
          "evening_decline": 2
        },
        "trafficLightCount": 1,
        "avgTrafficLightDelayMin": 0.5,
        "isSharedSegment": false,
        "sharedWithRoutes": []
      }
    ],
    "description": "Реальний маршрут GTFS 28"
  }
];

export const GTFS_VEHICLE_BLOCKS: VehicleBlock[] = MOCK_VEHICLE_BLOCKS;
export const GTFS_DRIVER_DUTIES: DriverDuty[] = MOCK_DRIVER_DUTIES;

export const GTFS_METADATA = {
  agencyName: 'КП «Одесміськелектротранс»',
  timezone: 'Europe/Kyiv',
  agencyUrl: 'https://oget.odessa.ua',
  totalUniqueRouteNumbers: 20,
  totalRoutes: 48,
  totalStops: 638,
  totalTrips: 3489,
  totalStopTimes: 89233
};
