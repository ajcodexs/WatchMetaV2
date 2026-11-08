import { useCallback, useEffect, useState } from 'react'
import { readStorage, writeStorage } from '@/lib/storage.js'

const KEY = 'wm_roadmap_watched'
const isValid = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.values(value).every((roadmap) => roadmap && typeof roadmap === 'object' && !Array.isArray(roadmap) &&
    Object.values(roadmap).every((flag) => flag === true))

export default function useRoadmapWatched(slug) {
  const [all, setAll] = useState(() => readStorage(KEY, {}, isValid))

  useEffect(() => {
    writeStorage(KEY, all)
  }, [all])

  useEffect(() => {
    const sync = (event) => {
      if (event.key === null || event.key === KEY) setAll(readStorage(KEY, {}, isValid))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const watched = all[slug] ?? {}

  const toggle = useCallback((key) => {
    setAll((current) => {
      const roadmap = { ...(current[slug] ?? {}) }
      if (roadmap[key]) delete roadmap[key]
      else roadmap[key] = true
      return { ...current, [slug]: roadmap }
    })
  }, [slug])

  const reset = useCallback(() => {
    setAll((current) => ({ ...current, [slug]: {} }))
  }, [slug])

  return { watched, toggle, reset }
}
