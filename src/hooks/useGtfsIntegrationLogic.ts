import { useState, useMemo } from 'react'
import { Route, VehicleBlock } from '../types'
import { generateGtfsStaticFiles, generateGtfsRealtimeJson } from '../utils/gtfsExporter'
import { useScheduleStore } from '../store/useScheduleStore'

export type GtfsSubTabKey = 'overview' | 'routes' | 'static' | 'realtime'
export type GtfsFilterType = 'all' | 'tram' | 'trolleybus'

export interface UseGtfsIntegrationLogicProps {
  routes: Route[]
  blocks: VehicleBlock[]
}

export interface UseGtfsIntegrationLogicReturn {
  isGtfsActive: boolean
  activeSubTab: GtfsSubTabKey
  setActiveSubTab: (tab: GtfsSubTabKey) => void
  copiedFile: string | null
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterType: GtfsFilterType
  setFilterType: (type: GtfsFilterType) => void
  filteredRoutes: Route[]
  gtfsStatic: Record<string, string>
  gtfsRealtime: unknown
  copyToClipboard: (text: string, label: string) => void
  handleLoadGtfsData: () => void
  handleReloadDemo: () => void
}

export const useGtfsIntegrationLogic = ({
  routes,
  blocks
}: UseGtfsIntegrationLogicProps): UseGtfsIntegrationLogicReturn => {
  const { isGtfsActive, loadGtfsData } = useScheduleStore()
  const [activeSubTab, setActiveSubTab] = useState<GtfsSubTabKey>('overview')
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterType, setFilterType] = useState<GtfsFilterType>('all')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFile(label)
    setTimeout(() => setCopiedFile(null), 2000)
  }

  const filteredRoutes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return routes.filter((r) => {
      const matchesSearch = !q || r.number.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
      const matchesType = filterType === 'all' || r.type === filterType
      return matchesSearch && matchesType
    })
  }, [routes, searchQuery, filterType])

  const gtfsStatic = useMemo(() => generateGtfsStaticFiles(routes, blocks), [routes, blocks])
  const gtfsRealtime = useMemo(() => generateGtfsRealtimeJson(blocks), [blocks])

  const handleReloadDemo = () => {
    window.location.reload()
  }

  return {
    isGtfsActive,
    activeSubTab,
    setActiveSubTab,
    copiedFile,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filteredRoutes,
    gtfsStatic,
    gtfsRealtime,
    copyToClipboard,
    handleLoadGtfsData: loadGtfsData,
    handleReloadDemo
  }
}
