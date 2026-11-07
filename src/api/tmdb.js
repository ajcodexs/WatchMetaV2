import { backdropUrl, posterUrl, profileUrl, stillUrl } from '@/api/tmdbImages.js'

const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
export const DEFAULT_REGION = import.meta.env.VITE_DEFAULT_REGION || 'PH'
const CACHE_TTL = 10 * 60 * 1000
const responseCache = new Map()

export const GENRES = {
  movie: [
    { value: '28', label: 'Action' }, { value: '12', label: 'Adventure' }, { value: '35', label: 'Comedy' },
    { value: '80', label: 'Crime' }, { value: '99', label: 'Documentary' }, { value: '18', label: 'Drama' },
    { value: '10751', label: 'Family' }, { value: '14', label: 'Fantasy' }, { value: '9648', label: 'Mystery' },
    { value: '10749', label: 'Romance' }, { value: '878', label: 'Sci-Fi' }, { value: '53', label: 'Thriller' },
  ],
  tv: [
    { value: '10759', label: 'Action & Adventure' }, { value: '35', label: 'Comedy' },
    { value: '80', label: 'Crime' }, { value: '99', label: 'Documentary' }, { value: '18', label: 'Drama' },
    { value: '10751', label: 'Family' }, { value: '10765', label: 'Sci-Fi' }, { value: '9648', label: 'Mystery' },
  ],
}

export const LANGUAGES = [
  { value: 'en', label: 'English' }, { value: 'tl', label: 'Filipino' }, { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' },
]

export const COUNTRIES = [
  { value: 'US', label: 'United States' }, { value: 'PH', label: 'Philippines' }, { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' }, { value: 'ES', label: 'Spain' }, { value: 'FR', label: 'France' },
]

export const STREAMING_SERVICE_MATCHES = [
  { name: 'Netflix', aliases: ['netflix'], color: 'bg-rose-600' },
  { name: 'Apple TV', aliases: ['apple tv', 'apple tv plus'], color: 'bg-slate-700' },
  { name: 'Disney+', aliases: ['disney+', 'disney plus'], color: 'bg-blue-700' },
  { name: 'Amazon Prime Video', aliases: ['amazon prime video', 'prime video'], color: 'bg-sky-600' },
  { name: 'Hulu', aliases: ['hulu'], color: 'bg-emerald-600' },
  { name: 'HBO Max', aliases: ['hbo max', 'max'], color: 'bg-violet-700' },
  { name: 'Paramount+', aliases: ['paramount+', 'paramount plus'], color: 'bg-blue-600' },
  { name: 'Peacock', aliases: ['peacock'], color: 'bg-amber-500' },
]

const ERROR_MESSAGES = {
  401: 'The TMDB key is invalid. Check your .env.local file.',
  404: 'Not found.',
  429: 'Too many requests. Try again in a moment.',
}

export class TMDBError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'TMDBError'
    this.status = status
  }
}

export async function tmdbRequest(path, params = {}, { signal, includeAdult = null } = {}) {
  if (!API_KEY) {
    throw new TMDBError('TMDB API key is missing. Add VITE_TMDB_API_KEY to .env.local.')
  }
  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    ...params,
  })
  if (includeAdult !== null) searchParams.set('include_adult', String(includeAdult))
  const url = `${BASE_URL}${path}?${searchParams}`
  const cached = responseCache.get(url)
  if (cached && cached.expires > Date.now()) return cached.data
  if (cached) responseCache.delete(url)

  let response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new TMDBError('Cannot reach TMDB. Check your connection.')
  }

  if (!response.ok) {
    throw new TMDBError(ERROR_MESSAGES[response.status] ?? 'Something went wrong. Try again.', response.status)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new TMDBError('Something went wrong. Try again.', response.status)
  }
  responseCache.set(url, { data, expires: Date.now() + CACHE_TTL })
  return data
}

export async function fetchMediaList(path, signal, params = {}, type = null) {
  const data = await tmdbRequest(path, params, {
    signal,
    includeAdult: path.startsWith('/discover/') || path.startsWith('/search/') ? false : null,
  })
  return {
    items: (data.results ?? [])
      .map((item) => normalizeMedia(item, type))
      .filter(Boolean),
    page: data.page ?? 1,
    totalPages: Math.min(data.total_pages ?? 1, 500),
  }
}

export async function fetchStreamingServices(signal) {
  const [movieProviders, tvProviders] = await Promise.all([
    tmdbRequest('/watch/providers/movie', { watch_region: DEFAULT_REGION }, { signal }),
    tmdbRequest('/watch/providers/tv', { watch_region: DEFAULT_REGION }, { signal }),
  ])
  return STREAMING_SERVICE_MATCHES.map((service) => {
    const matches = (providers) => (providers.results ?? []).find((provider) =>
      service.aliases.includes(provider.provider_name.trim().toLowerCase()))
    const movie = matches(movieProviders)
    const tv = matches(tvProviders)
    return movie || tv
      ? {
          ...service,
          providerId: movie?.provider_id ?? tv.provider_id,
          movieProviderId: movie?.provider_id,
          tvProviderId: tv?.provider_id,
          logoPath: movie?.logo_path ?? tv?.logo_path,
        }
      : null
  }).filter(Boolean)
}

export function normalizeMedia(item, type = item.media_type) {
  if (!item || (type !== 'movie' && type !== 'tv')) return null
  const releaseDate = type === 'movie' ? item.release_date : item.first_air_date
  return {
    id: item.id,
    type,
    title: type === 'movie' ? item.title ?? item.original_title ?? '' : item.name ?? item.original_name ?? '',
    name: type === 'tv' ? item.name ?? item.original_name ?? '' : undefined,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    overview: item.overview ?? '',
    rating: Number(item.vote_average ?? 0),
    voteCount: Number(item.vote_count ?? 0),
    posterPath: posterUrl(item.poster_path),
    posterSrcSet: item.poster_path
      ? `${posterUrl(item.poster_path, 'w185')} 185w, ${posterUrl(item.poster_path, 'w342')} 342w, ${posterUrl(item.poster_path, 'w500')} 500w`
      : undefined,
    backdropPath: backdropUrl(item.backdrop_path),
    backdropSrcSet: item.backdrop_path
      ? `${backdropUrl(item.backdrop_path, 'w780')} 780w, ${backdropUrl(item.backdrop_path, 'w1280')} 1280w, ${backdropUrl(item.backdrop_path, 'original')} 1920w`
      : undefined,
    genres: item.genres?.map((genre) => genre.name) ?? [],
    genreIds: item.genre_ids ?? item.genres?.map((genre) => genre.id) ?? [],
    runtime: type === 'movie'
      ? item.runtime ?? null
      : item.episode_run_time?.[0] ?? null,
    releaseDate: releaseDate ?? '',
    originalLanguage: item.original_language ?? '',
    originCountry: item.origin_country ?? [],
    popularity: Number(item.popularity ?? 0),
    seasons: type === 'tv' ? item.number_of_seasons ?? null : undefined,
    ageRating: '',
    providers: [],
    keywords: '',
  }
}

export function normalizePerson(person) {
  return {
    id: person.id,
    name: person.name ?? '',
    profilePath: profileUrl(person.profile_path),
    profileSrcSet: person.profile_path
      ? `${profileUrl(person.profile_path, 'w185')} 185w, ${profileUrl(person.profile_path, 'h632')} 632w`
      : undefined,
    department: person.known_for_department ?? '',
    birthday: person.birthday ?? '',
    placeOfBirth: person.place_of_birth ?? '',
    alsoKnownAs: person.also_known_as ?? [],
    biography: person.biography ?? '',
    knownFor: [],
  }
}

export function normalizeCredits(credits = {}, aggregateCredits = null) {
  const castSource = aggregateCredits?.cast ?? credits.cast ?? []
  const cast = [...castSource]
    .sort((left, right) => (left.order ?? 999) - (right.order ?? 999))
    .slice(0, 24)
    .map((person) => ({
      id: person.id,
      name: person.name,
      character: person.roles?.[0]?.character ?? person.character ?? 'Role unknown',
      profilePath: profileUrl(person.profile_path),
    }))
  const crew = credits.crew ?? []
  const director = crew.find((person) => person.job === 'Director')
  const writer = crew.find((person) => ['Writer', 'Screenplay'].includes(person.job))

  return {
    cast,
    director: director ? { id: director.id, name: director.name } : { id: 0, name: 'Unknown' },
    writer: writer ? { id: writer.id, name: writer.name } : { id: 0, name: 'Unknown' },
  }
}

export function normalizeEpisode(episode) {
  return {
    id: episode.id,
    number: episode.episode_number,
    title: episode.name ?? `Episode ${episode.episode_number}`,
    airDate: episode.air_date ?? '',
    runtime: episode.runtime ?? 0,
    overview: episode.overview ?? '',
    stillPath: stillUrl(episode.still_path),
  }
}

export function normalizeDetails(raw, type) {
  const item = normalizeMedia(raw, type)
  const credits = normalizeCredits(raw.credits, raw.aggregate_credits)
  const regionalProviders = raw['watch/providers']?.results?.[DEFAULT_REGION]
  const providers = regionalProviders
    ? {
        link: regionalProviders.link ?? '',
        Stream: regionalProviders.flatrate ?? [],
        Rent: regionalProviders.rent ?? [],
        Buy: regionalProviders.buy ?? [],
      }
    : { link: '', Stream: [], Rent: [], Buy: [] }

  return {
    ...item,
    ...credits,
    tagline: raw.tagline ?? '',
    originalTitle: raw.original_title ?? raw.original_name ?? item.title,
    status: raw.status ?? '',
    originalLanguage: raw.original_language ?? '',
    productionCompanies: (raw.production_companies ?? []).map((company) => company.name),
    countries: (raw.production_countries ?? []).map((country) => country.name),
    seasonCount: raw.number_of_seasons ?? 0,
    episodeCount: raw.number_of_episodes ?? 0,
    networks: (raw.networks ?? []).map((network) => network.name),
    creators: (raw.created_by ?? []).map((creator) => creator.name),
    budget: raw.budget ?? 0,
    revenue: raw.revenue ?? 0,
    trailerKey: selectTrailer(raw.videos?.results ?? []),
    providers,
    similarTitles: (raw.similar?.results ?? []).map((entry) => normalizeMedia(entry, type)),
    recommendations: (raw.recommendations?.results ?? []).map((entry) => normalizeMedia(entry, type)),
    releaseDates: raw.release_dates?.results ?? [],
    contentRatings: raw.content_ratings?.results ?? [],
    seasons: (raw.seasons ?? []).map((season) => ({
      number: season.season_number,
      episodeCount: season.episode_count,
      airDates: season.air_date ?? '',
      episodes: [],
    })),
  }
}

export function selectTrailer(videos) {
  return [...videos]
    .filter((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.key)
    .sort((left, right) => Number(right.official) - Number(left.official))[0]?.key ?? null
}

export function normalizePersonCredits(data) {
  const seen = new Set()
  const credits = [...(data.cast ?? []), ...(data.crew ?? [])]
    .filter((entry) => {
      const key = `${entry.media_type}-${entry.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((entry) => ({
      ...normalizeMedia(entry, entry.media_type),
      character: entry.character || 'Role unknown',
      creditPopularity: Number(entry.popularity ?? 0),
    }))
    .sort((left, right) => (right.releaseDate || '').localeCompare(left.releaseDate || ''))
  const knownFor = [...credits]
    .sort((left, right) => right.creditPopularity - left.creditPopularity)
    .slice(0, 2)
    .map((entry) => entry.title)
  return { credits, knownFor }
}

export function clearTMDBCache() {
  responseCache.clear()
}
