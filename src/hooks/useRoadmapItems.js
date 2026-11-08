import { useEffect, useState } from 'react'
import { normalizeMedia, tmdbRequest } from '@/api/tmdb.js'

export default function useRoadmapItems(roadmap, { firstOnly = false } = {}) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!roadmap) return undefined

    const controller = new AbortController()
    setItems(null)
    setError('')
    const resolved = roadmap.entries.filter((entry) => entry.tmdbId !== null)
    const entriesToLoad = firstOnly ? resolved.slice(0, 1) : resolved

    Promise.all(entriesToLoad.map((entry) =>
      tmdbRequest(`/${entry.type}/${entry.tmdbId}`, {}, { signal: controller.signal })
        .then((raw) => {
          const media = normalizeMedia(raw, entry.type)
          if (!media) throw new Error(`Could not load ${entry.title}.`)
          return { ...media, entry, note: entry.note ?? '' }
        })))
      .then((results) => {
        if (!controller.signal.aborted) setItems(results)
      })
      .catch((requestError) => {
        if (controller.signal.aborted || requestError.name === 'AbortError') return
        setError(requestError.message || 'Something went wrong. Try again.')
      })

    return () => controller.abort()
  }, [attempt, firstOnly, roadmap])

  return { items, error, retry: () => setAttempt((value) => value + 1) }
}
