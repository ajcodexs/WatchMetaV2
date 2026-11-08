// Usage: node scripts/resolve-roadmaps.mjs TMDB_V3_KEY
// Reports candidate ids only. Review results and paste confirmed ids into roadmaps.js manually.
import { ROADMAPS } from '../src/data/roadmaps.js'

const key = process.argv[2]
if (!key) {
  console.error('Pass your TMDB v3 key as the first argument.')
  process.exit(1)
}

const baseUrl = 'https://api.themoviedb.org/3'

async function tmdbRequest(path, params = {}) {
  const query = new URLSearchParams({ api_key: key, ...params })
  const response = await fetch(`${baseUrl}${path}?${query}`)
  if (!response.ok) throw new Error(`TMDB ${response.status} for ${path}`)
  return response.json()
}

function normalizedTitle(title) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function titleAndYearMatch(item, entry) {
  const title = item.title ?? item.name ?? ''
  const date = item.release_date ?? item.first_air_date ?? ''
  return normalizedTitle(title) === normalizedTitle(entry.title) &&
    date.slice(0, 4) === String(entry.year)
}

function printEntry(roadmap, entry, status, result, source = '') {
  const candidate = result
    ? ` -> id ${result.id}, "${result.title ?? result.name ?? ''}" (${(result.release_date ?? result.first_air_date ?? '').slice(0, 4)})`
    : ''
  const sourceLabel = source ? ` (${source})` : ''
  console.log(`[${roadmap.slug}] ${status}${sourceLabel}: ${entry.title} (${entry.year})${candidate}`)
}

async function searchCollection(name) {
  const data = await tmdbRequest('/search/collection', { query: name })
  return data.results?.[0] ?? null
}

async function searchTitle(entry) {
  const path = entry.type === 'tv' ? '/search/tv' : '/search/movie'
  const yearParameter = entry.type === 'tv' ? 'first_air_date_year' : 'year'
  const data = await tmdbRequest(path, {
    query: entry.title,
    [yearParameter]: String(entry.year),
    include_adult: 'false',
  })
  return data.results ?? []
}

for (const roadmap of ROADMAPS) {
  let collection = null
  let collectionMovies = []
  const matchedCollectionIds = new Set(
    roadmap.entries.filter((entry) => entry.tmdbId !== null).map((entry) => entry.tmdbId),
  )

  if (roadmap.collectionQuery) {
    try {
      collection = await searchCollection(roadmap.collectionQuery)
      if (collection) {
        console.log(`[${roadmap.slug}] COLLECTION: query "${roadmap.collectionQuery}" -> id ${collection.id}, "${collection.name}"`)
        const details = await tmdbRequest(`/collection/${collection.id}`)
        collectionMovies = details.parts ?? []
      } else {
        console.log(`[${roadmap.slug}] COLLECTION NOT FOUND: "${roadmap.collectionQuery}"`)
      }
    } catch (error) {
      console.log(`[${roadmap.slug}] COLLECTION ERROR: ${error.message}`)
    }
  }

  for (const entry of roadmap.entries) {
    try {
      if (entry.tmdbId !== null) {
        const existing = await tmdbRequest(`/${entry.type}/${entry.tmdbId}`)
        const status = titleAndYearMatch(existing, entry) ? 'OK' : 'CHECK'
        printEntry(roadmap, entry, status, existing, 'existing id')
        continue
      }

      let candidate = entry.type === 'movie'
        ? collectionMovies.find((item) => titleAndYearMatch(item, entry))
        : null
      let source = candidate ? 'collection' : 'search'

      if (!candidate) {
        const results = await searchTitle(entry)
        candidate = results.find((item) => titleAndYearMatch(item, entry)) ?? results[0] ?? null
      }

      if (!candidate) {
        printEntry(roadmap, entry, 'NOT FOUND', null, source)
        continue
      }

      const status = titleAndYearMatch(candidate, entry) ? 'OK' : 'CHECK'
      printEntry(roadmap, entry, status, candidate, source)
      if (entry.type === 'movie' && collectionMovies.some((item) => item.id === candidate.id)) {
        matchedCollectionIds.add(candidate.id)
      }
    } catch (error) {
      printEntry(roadmap, entry, 'CHECK', null, `ERROR: ${error.message}`)
    }
  }

  for (const extra of collectionMovies.filter((item) => !matchedCollectionIds.has(item.id))) {
    console.log(`[${roadmap.slug}] EXTRA: id ${extra.id}, "${extra.title}" (${(extra.release_date ?? '').slice(0, 4)})`)
  }

  const unresolved = roadmap.entries.filter((entry) => entry.tmdbId === null).length
  console.log(`[${roadmap.slug}] SUMMARY: ${unresolved} entries still have null tmdbId`)
}
