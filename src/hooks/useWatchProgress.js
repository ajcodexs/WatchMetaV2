import { useEffect, useRef } from 'react'
import { useLibrary } from '@/context/LibraryContext.jsx'
import { isSameEpisode, readVidLinkProgress, toNumericId } from '@/lib/progress.js'

const SAVE_INTERVAL_MS = 15000
const VIDLINK_ORIGIN = 'https://vidlink.pro'
const VIDLINK_SERVER = 'Server 2'

export default function useWatchProgress({
  enabled,
  title,
  posterPath,
  type,
  id,
  season,
  episode,
  server,
  runtimeMinutes,
}) {
  const { upsertProgress, continueWatching } = useLibrary()

  const numericId = toNumericId(id)
  const seasonNumber = type === 'tv' ? Number(season) : undefined
  const episodeNumber = type === 'tv' ? Number(episode) : undefined
  const runtimeSeconds = Math.max(0, Math.round((Number(runtimeMinutes) || 0) * 60))

  const ready = Boolean(
    enabled &&
    title &&
    numericId !== null &&
    server &&
    (type === 'movie' || (Number.isInteger(seasonNumber) && Number.isInteger(episodeNumber)))
  )

  // Latest library snapshot, without re-running the save effect
  const libraryRef = useRef(continueWatching)
  useEffect(() => {
    libraryRef.current = continueWatching
  }, [continueWatching])

  const baseEntryRef = useRef(null)
  const lastSavedRef = useRef(0)

  // Save the "last opened" entry when the page opens, or when the episode or server changes.
  // Existing progress is kept only when it is the same movie or episode.
  useEffect(() => {
    if (!ready) return
    const existing = libraryRef.current.find((entry) => entry.id === numericId && entry.type === type)
    const sameEpisode = isSameEpisode(existing, type, seasonNumber, episodeNumber)

    const entry = {
      id: numericId,
      type,
      title,
      posterPath: posterPath || '',
      ...(type === 'tv' ? { season: seasonNumber, episode: episodeNumber } : {}),
      progressSeconds: sameEpisode ? existing.progressSeconds : 0,
      durationSeconds: sameEpisode && existing.durationSeconds > 0 ? existing.durationSeconds : runtimeSeconds,
      server,
    }

    baseEntryRef.current = entry
    upsertProgress(entry)
  }, [ready, numericId, type, seasonNumber, episodeNumber, server, title, posterPath, runtimeSeconds, upsertProgress])

  // Real progress from VidLink only (Server 2). Other servers do not report time.
  useEffect(() => {
    if (!ready || server !== VIDLINK_SERVER) return undefined

    function onMessage(event) {
      if (event.origin !== VIDLINK_ORIGIN) return
      const reading = readVidLinkProgress(event.data)
      if (!reading || !baseEntryRef.current) return

      const now = Date.now()
      if (now - lastSavedRef.current < SAVE_INTERVAL_MS) return
      lastSavedRef.current = now

      upsertProgress({
        ...baseEntryRef.current,
        progressSeconds: Math.max(0, Math.floor(reading.currentTime)),
        durationSeconds: Math.max(0, Math.floor(reading.duration)),
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [ready, server, upsertProgress])
}