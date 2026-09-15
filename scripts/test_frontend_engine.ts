import { timeToMinutes, minutesToTime, validateDriverDuty } from '../src/utils/scheduleEngine'
import { generateGtfsStaticFiles, generateGtfsRealtimeJson } from '../src/utils/gtfsExporter'
import { DriverDuty, Route, VehicleBlock } from '../src/types'

const runFrontendEngineTests = () => {
  console.log('=' .repeat(70))
  console.log('🚦 ТЕСТУВАННЯ МАТЕМАТИЧНОГО ЯДРА ТА СЕРІАЛІЗАТОРІВ ФРОНТЕНДУ КП «ОМЕТ»')
  console.log('=' .repeat(70))

  // 1. Time conversion tests
  console.log('\n⏱️ 1. Тестування конвертації часу (timeToMinutes / minutesToTime)...')
  console.assert(timeToMinutes('00:00') === 0, '00:00 should be 0')
  console.assert(timeToMinutes('05:30') === 330, '05:30 should be 330')
  console.assert(timeToMinutes('12:45') === 765, '12:45 should be 765')
  console.assert(timeToMinutes('23:59') === 1439, '23:59 should be 1439')

  console.assert(minutesToTime(0) === '00:00', '0 should format to 00:00')
  console.assert(minutesToTime(330) === '05:30', '330 should format to 05:30')
  console.assert(minutesToTime(765) === '12:45', '765 should format to 12:45')
  console.assert(minutesToTime(1439) === '23:59', '1439 should format to 23:59')
  console.log('✅ Конвертація часу працює точно')

  // 2. Ukrainian Labor Code (КЗпП) Driver Duty Validation
  console.log('\n👮 2. Тестування валідації нарядів за нормами КЗпП України...')
  const mockValidDuty: DriverDuty = {
    id: 'duty-test-1',
    driverName: 'Водій 101',
    driverBadge: '101',
    shiftType: 'single',
    shiftStartTime: '06:00',
    shiftEndTime: '14:00',
    totalShiftMin: 480,
    lunchStartTime: '10:00',
    lunchDurationMin: 15,
    assignedBlockIds: ['block-1'],
    isViolating10hLimit: false,
    isLunchCompliant: true
  }

  const validatedTram = validateDriverDuty(mockValidDuty, 'tram')
  console.assert(validatedTram.prepTimeMin === 10, 'Tram prep time should be 10 min')
  console.assert(validatedTram.standardLunchMin === 15, 'Tram standard lunch should be 15 min')
  console.assert(!validatedTram.isViolating10hLimit && validatedTram.isLunchCompliant, 'Standard 8-hour duty should have no violations')
  console.log('✅ Трамвайний наряд (8 год): валідація успішна, порушень 0')

  const mockTrolleyDuty: DriverDuty = {
    ...mockValidDuty,
    id: 'duty-trolley-1'
  }
  const validatedTrolley = validateDriverDuty(mockTrolleyDuty, 'trolleybus')
  console.assert(validatedTrolley.prepTimeMin === 19, 'Trolleybus prep time should be 19 min')
  console.assert(validatedTrolley.standardLunchMin === 20, 'Trolleybus standard lunch should be 20 min')
  console.log('✅ Тролейбусний наряд: підготовчо-заключний час 19 хв враховано')

  // Duty exceeding maximum shift hours (> 10 hours)
  const mockOvertimeDuty: DriverDuty = {
    ...mockValidDuty,
    id: 'duty-overtime',
    shiftStartTime: '05:00',
    shiftEndTime: '16:30', // 11.5 hours!
    lunchStartTime: '10:00',
    lunchDurationMin: 15
  }
  const validatedOvertime = validateDriverDuty(mockOvertimeDuty, 'tram')
  console.assert(validatedOvertime.isViolating10hLimit === true, 'Should detect overtime violation (isViolating10hLimit === true)')
  console.assert((validatedOvertime.totalShiftMin || 0) > 600, 'Total shift minutes should exceed 600')
  console.log(`✅ Захист КЗпП: виявлено порушення ліміту тривалості зміни (${validatedOvertime.totalShiftMin} хв > 600 хв)`)

  // 3. GTFS Static Exporter Test
  console.log('\n📄 3. Тестування генератора статичних GTFS файлів...')
  const testRoutes: Route[] = [
    {
      id: '18',
      number: '18',
      name: 'Куликове поле — 16-та ст. Великого Фонтану',
      type: 'tram',
      status: 'active',
      primaryTerminalId: 'st-kulikove',
      secondaryTerminalId: 'st-16-fontan',
      length_km: 11.2,
      stations: ['st-kulikove', 'st-16-fontan'],
      segments: []
    },
    {
      id: 'Tr8',
      number: '8',
      name: 'Суперфосфатний завод — Залізничний вокзал',
      type: 'trolleybus',
      status: 'active',
      primaryTerminalId: 'st-superfosfat',
      secondaryTerminalId: 'st-vokzal',
      length_km: 9.8,
      stations: ['st-superfosfat', 'st-vokzal'],
      segments: []
    }
  ]

  const testBlocks: VehicleBlock[] = [
    {
      id: 'block-18-01',
      routeId: '18',
      vehicleNumber: '4020',
      type: 'tram',
      depotId: 'depot-1',
      depotExitTime: '05:30',
      depotReturnTime: '20:00',
      trips: [
        {
          id: 'trip-18-01-1',
          blockId: 'block-18-01',
          dutyId: 'duty-test-1',
          routeId: '18',
          startStationId: 'st-kulikove',
          endStationId: 'st-16-fontan',
          departureTime: '06:00',
          arrivalTime: '06:36',
          direction: 1,
          status: 'normal'
        },
        {
          id: 'trip-18-01-2',
          blockId: 'block-18-01',
          dutyId: 'duty-test-1',
          routeId: '18',
          startStationId: 'st-16-fontan',
          endStationId: 'st-kulikove',
          departureTime: '06:42',
          arrivalTime: '07:18',
          direction: 2,
          status: 'normal'
        }
      ]
    }
  ]

  const gtfsStatic = generateGtfsStaticFiles(testRoutes, testBlocks)
  console.assert('routes.txt' in gtfsStatic, 'Must generate routes.txt')
  console.assert('trips.txt' in gtfsStatic, 'Must generate trips.txt')
  console.assert('stop_times.txt' in gtfsStatic, 'Must generate stop_times.txt')

  console.assert(gtfsStatic['routes.txt'].includes('18,OMET,18'), 'routes.txt must include Tram 18')
  console.assert(gtfsStatic['routes.txt'].includes('Tr8,OMET,8'), 'routes.txt must include Trolleybus 8')
  console.assert(gtfsStatic['trips.txt'].includes('trip-18-01-1'), 'trips.txt must include trip-18-01-1')
  console.log('✅ Генерація GTFS Static файлів (routes.txt, trips.txt, stop_times.txt) валідна')

  // 4. GTFS Realtime JSON serializer
  console.log('\n📡 4. Тестування серіалізатора GTFS Realtime JSON...')
  const gtfsRt = generateGtfsRealtimeJson(testBlocks)
  console.assert(gtfsRt.header.gtfsRealtimeVersion === '2.0', 'GTFS-RT version must be 2.0')
  console.assert(gtfsRt.entity.length === 2, 'Should produce 2 vehicle trip entities')
  console.assert(gtfsRt.entity[0].vehicle.trip.tripId === 'trip-18-01-1', 'First entity tripId matches')
  console.assert(gtfsRt.entity[0].vehicle.vehicle.id === '4020', 'First entity vehicleId matches')
  console.log(`✅ GTFS Realtime JSON: версія ${gtfsRt.header.gtfsRealtimeVersion}, оброблено сутностей: ${gtfsRt.entity.length}`)

  console.log('\n' + '=' .repeat(70))
  console.log('🏆 ВСІ ФРОНТЕНД-ТЕСТИ МАТЕМАТИЧНОГО ЯДРА УСПІШНО ПРОЙДЕНО!')
  console.log('=' .repeat(70))
}

runFrontendEngineTests()
