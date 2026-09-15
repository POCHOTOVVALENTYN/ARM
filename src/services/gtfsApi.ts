export interface GtfsValidationCounts {
  routes: number
  stops: number
  trips: number
  stop_times: number
  has_live_schedules: boolean
}

export interface GtfsValidationResponse {
  status: 'VALID' | 'WARNING' | 'ERROR'
  agency_name: string
  agency_id: string
  counts: GtfsValidationCounts
  coverage: {
    feed_start_date: string
    feed_end_date: string
    city: string
    timezone: string
  }
  archive_size_bytes: number
  filename: string
}

export const downloadGtfsZip = async (): Promise<void> => {
  const response = await fetch('/api/v1/schedules/export-gtfs.zip')
  if (!response.ok) {
    throw new Error('Помилка сервера при формуванні GTFS архіву')
  }
  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = 'omet_odesa_gtfs.zip'
  document.body.appendChild(anchor)
  anchor.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(anchor)
}

export const fetchGtfsValidation = async (): Promise<GtfsValidationResponse> => {
  const response = await fetch('/api/v1/schedules/validate-gtfs')
  if (!response.ok) {
    throw new Error('Помилка запиту валідації GTFS')
  }
  return response.json()
}
