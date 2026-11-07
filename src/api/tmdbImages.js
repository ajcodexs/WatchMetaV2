const IMAGE_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p'

const imageSizes = {
  poster: new Set(['w185', 'w342', 'w500', 'original']),
  backdrop: new Set(['w780', 'w1280', 'original']),
  profile: new Set(['w185', 'h632', 'original']),
  still: new Set(['w300', 'original']),
  logo: new Set(['w45', 'w92', 'w154', 'w300', 'original']),
}

function imageUrl(path, size, allowedSizes, placeholder) {
  if (!path) return placeholder
  const safeSize = allowedSizes.has(size) ? size : [...allowedSizes][1]
  return `${IMAGE_BASE}/${safeSize}${path}`
}

export function posterUrl(path, size = 'w342') {
  return imageUrl(path, size, imageSizes.poster, '/placeholder-poster.png')
}

export function backdropUrl(path, size = 'w1280') {
  return imageUrl(path, size, imageSizes.backdrop, '/placeholder-backdrop.png')
}

export function profileUrl(path, size = 'w185') {
  return imageUrl(path, size, imageSizes.profile, '/placeholder-poster.png')
}

export function stillUrl(path, size = 'w300') {
  return imageUrl(path, size, imageSizes.still, '/placeholder-backdrop.png')
}

export function logoUrl(path, size = 'w92') {
  return imageUrl(path, size, imageSizes.logo, '/placeholder-poster.png')
}

export function backdropSrcSet(path) {
  if (!path) return `${backdropUrl(null)} 1280w`
  return `${backdropUrl(path, 'w780')} 780w, ${backdropUrl(path, 'w1280')} 1280w, ${backdropUrl(path, 'original')} 1920w`
}
