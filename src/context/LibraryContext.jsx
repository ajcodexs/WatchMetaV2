import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { readStorage, writeStorage } from '@/lib/storage.js'

const LibraryContext = createContext(null)

const WATCHLIST_KEY = 'wm_watchlist'
const PROGRESS_KEY = 'wm_continue_watching'
const WATCHED_KEY = 'wm_watched_episodes'
const isId = (value) => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
const isMediaType = (value) => value === 'movie' || value === 'tv'
const isWatchlist = (value) => Array.isArray(value) && value.every((item) =>
  item && isId(item.id) && isMediaType(item.type) && typeof item.title === 'string' &&
  (typeof item.posterPath === 'string' || typeof item.poster === 'string'))
const isProgressList = (value) => Array.isArray(value) && value.every((item) =>
  item && isId(item.id) && isMediaType(item.type) && typeof item.title === 'string' &&
  (typeof item.posterPath === 'string' || typeof item.poster === 'string') && Number.isFinite(item.progressSeconds) &&
  Number.isFinite(item.durationSeconds) && typeof item.server === 'string' &&
  typeof item.updatedAt === 'string' &&
  (item.type !== 'tv' || (Number.isFinite(item.season) && Number.isFinite(item.episode))))
const isWatchedEpisodes = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.values(value).every((episodes) => episodes && typeof episodes === 'object' &&
    !Array.isArray(episodes) && Object.entries(episodes).every(([key, watched]) =>
      /^S\d+E\d+$/.test(key) && watched === true))

export function LibraryProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => readStorage(WATCHLIST_KEY, [], isWatchlist).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    posterPath: item.posterPath ?? item.poster,
  })))
  const [continueWatching, setContinueWatching] = useState(() => readStorage(PROGRESS_KEY, [], isProgressList).map((item) => ({
    ...item,
    posterPath: item.posterPath ?? item.poster,
    poster: undefined,
  })))
  const [watchedEpisodes, setWatchedEpisodes] = useState(() => readStorage(WATCHED_KEY, {}, isWatchedEpisodes))
  const syncingStorageRef = useRef(new Set())

  useEffect(() => {
    const syncStorage = (event) => {
      if (event.key === null || event.key === WATCHLIST_KEY) {
        syncingStorageRef.current.add(WATCHLIST_KEY)
        setWatchlist(readStorage(WATCHLIST_KEY, [], isWatchlist).map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          posterPath: item.posterPath ?? item.poster,
        })))
      }
      if (event.key === null || event.key === PROGRESS_KEY) {
        syncingStorageRef.current.add(PROGRESS_KEY)
        setContinueWatching(readStorage(PROGRESS_KEY, [], isProgressList).map((item) => ({
          ...item,
          posterPath: item.posterPath ?? item.poster,
          poster: undefined,
        })))
      }
      if (event.key === null || event.key === WATCHED_KEY) {
        syncingStorageRef.current.add(WATCHED_KEY)
        setWatchedEpisodes(readStorage(WATCHED_KEY, {}, isWatchedEpisodes))
      }
    }
    window.addEventListener('storage', syncStorage)
    return () => window.removeEventListener('storage', syncStorage)
  }, [])

  useEffect(() => {
    if (syncingStorageRef.current.delete(WATCHLIST_KEY)) return
    writeStorage(WATCHLIST_KEY, watchlist)
  }, [watchlist])
  useEffect(() => {
    if (syncingStorageRef.current.delete(PROGRESS_KEY)) return
    writeStorage(PROGRESS_KEY, continueWatching)
  }, [continueWatching])
  useEffect(() => {
    if (syncingStorageRef.current.delete(WATCHED_KEY)) return
    writeStorage(WATCHED_KEY, watchedEpisodes)
  }, [watchedEpisodes])

  const addToWatchlist = useCallback((item) => {
    setWatchlist((current) => {
      const withoutItem = current.filter((entry) => !(entry.id === item.id && entry.type === item.type))
      return [{
        id: item.id,
        type: item.type,
        title: item.title ?? item.name,
        posterPath: item.posterPath ?? item.poster,
      }, ...withoutItem]
    })
  }, [])

  const removeFromWatchlist = useCallback((id, type) => {
    setWatchlist((current) => current.filter((item) => !(item.id === id && item.type === type)))
  }, [])

  const clearWatchlist = useCallback(() => setWatchlist([]), [])

  const upsertProgress = useCallback((item) => {
    const id = Number(item.id)
    setContinueWatching((current) => [
      {
        id,
        type: item.type,
        title: item.title,
        posterPath: item.posterPath || '',
        ...(item.type === 'tv' ? { season: Number(item.season), episode: Number(item.episode) } : {}),
        progressSeconds: Math.max(0, Number(item.progressSeconds) || 0),
        durationSeconds: Math.max(0, Number(item.durationSeconds) || 0),
        server: String(item.server ?? ''),
        updatedAt: new Date().toISOString(),
      },
      ...current.filter((entry) => !(entry.id === id && entry.type === item.type)),
    ])
  }, [])

  const removeProgress = useCallback((id, type) => {
    setContinueWatching((current) => current.filter((item) => !(item.id === id && item.type === type)))
  }, [])

  const clearContinueWatching = useCallback(() => setContinueWatching([]), [])

  const toggleEpisodeWatched = useCallback((tvId, season, episode) => {
    const episodeKey = `S${season}E${episode}`
    setWatchedEpisodes((current) => {
      const tvEpisodes = { ...(current[tvId] ?? {}) }
      if (tvEpisodes[episodeKey]) {
        delete tvEpisodes[episodeKey]
      } else {
        tvEpisodes[episodeKey] = true
      }
      return { ...current, [tvId]: tvEpisodes }
    })
  }, [])

  const value = useMemo(() => ({
    watchlist,
    continueWatching,
    watchedEpisodes,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    upsertProgress,
    removeProgress,
    clearContinueWatching,
    toggleEpisodeWatched,
  }), [
    watchlist,
    continueWatching,
    watchedEpisodes,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    upsertProgress,
    removeProgress,
    clearContinueWatching,
    toggleEpisodeWatched,
  ])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary() {
  const context = useContext(LibraryContext)
  if (!context) throw new Error('useLibrary must be used within a LibraryProvider')
  return context
}
