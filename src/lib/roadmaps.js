import { ROADMAPS } from '@/data/roadmaps.js'

export const entryKey = (entry) => `${entry.type}-${entry.tmdbId}`

export function releaseOrder(items) {
  return [...items].sort((a, b) => {
    if (!a.releaseDate && !b.releaseDate) return 0
    if (!a.releaseDate) return 1
    if (!b.releaseDate) return -1
    return a.releaseDate.localeCompare(b.releaseDate)
  })
}

export const VERIFIED_ROADMAPS = ROADMAPS.filter((roadmap) =>
  roadmap.status === 'verified' &&
  roadmap.entries.length > 0 &&
  roadmap.entries.every((entry) => entry.tmdbId !== null))
