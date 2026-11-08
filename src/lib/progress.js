// Helpers for watch progress. Keep this file free of React.

export function toNumericId(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

// True when a saved entry is the same movie, or the same TV episode.
export function isSameEpisode(entry, type, season, episode) {
  if (!entry || entry.type !== type) return false
  if (type === 'movie') return true
  return entry.season === season && entry.episode === episode
}

// TODO: Fill this in after you confirm the real VidLink event shape in the browser console.
// Must return { currentTime: number, duration: number } in seconds,
// or null when the message is not a progress event.
export function readVidLinkProgress(data) {
  return null
}