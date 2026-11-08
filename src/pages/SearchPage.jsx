import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import BrowseFilters from '@/components/browse/BrowseFilters'
import MediaCard, { MediaCardSkeleton } from '@/components/common/MediaCard'
import RequestState from '@/components/common/RequestState.jsx'
import SearchBar from '@/components/search/SearchBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useDragScroll from '@/hooks/useDragScroll'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import {
  DEFAULT_REGION,
  fetchStreamingServices,
  normalizeMedia,
  normalizePerson,
  tmdbRequest,
} from '@/api/tmdb.js'
import { countActiveMediaFilters } from '@/lib/mediaFilters'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import { SEO } from '@/components/seo/SEO.jsx'
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx'
import AdsterraNative from '@/components/ads/AdsterraNative.jsx'

const POPULAR_PAGE_SIZE = 20

function PersonCard({ person }) {
  const knownFor = person.knownFor.join(', ')
  return (
    <Link to={`/person/${person.id}`} aria-label={`${person.name}, known for ${knownFor}`} className="group block min-w-0 text-center">
      <Card className="mx-auto aspect-square w-full max-w-48 overflow-hidden rounded-full border-0 bg-muted p-0 shadow-none transition-transform group-hover:scale-[1.02]">
        <img
          src={person.profilePath}
          srcSet={person.profileSrcSet}
          sizes="192px"
          alt={`${person.name} portrait`}
          loading="lazy"
          className="size-full object-cover"
        />
      </Card>
      <h2 className="mt-3 truncate text-sm font-semibold">{person.name}</h2>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Known for {knownFor || '—'}</p>
    </Link>
  )
}

function matchesSearchFilters(item, params) {
  const years = params.get('year')?.split(',').map(Number)
  const runtime = params.get('runtime')?.split(',').map(Number)
  return (!params.has('genre') || params.get('genre').split(',').some((id) => item.genreIds.includes(Number(id)))) &&
    (!years || (item.year >= years[0] && item.year <= years[1])) &&
    (!runtime || item.type !== 'movie' || (item.runtime >= runtime[0] && item.runtime <= runtime[1])) &&
    (!params.has('language') || item.originalLanguage === params.get('language')) &&
    (!params.has('country') || item.originCountry.includes(params.get('country'))) &&
    (!params.has('age') || item.ageRating === params.get('age'))
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sidebarSlot, setSidebarSlot] = useState(null)
  const [popularTab, setPopularTab] = useState('all')
  const [popularVisibleCount, setPopularVisibleCount] = useState(POPULAR_PAGE_SIZE)
  const [searchData, setSearchData] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchAttempt, setSearchAttempt] = useState(0)
  const dragScroll = useDragScroll()
  const query = searchParams.get('q') ?? ''
  const hasQuery = Boolean(query.trim())
  const tab = ['all', 'movies', 'tv', 'people'].includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'all'
  const filtersVisible = tab !== 'people'
  const filterType = tab === 'tv' ? 'tv' : 'movie'
  const filterCount = countActiveMediaFilters(searchParams, filterType)
  const loadPopular = useCallback(async (signal) => {
    const [movies, shows] = await Promise.all([
      tmdbRequest('/movie/popular', { page: '1', region: DEFAULT_REGION }, { signal }),
      tmdbRequest('/tv/popular', { page: '1', region: DEFAULT_REGION }, { signal }),
    ])
    return {
      movies: (movies.results ?? []).map((item) => normalizeMedia(item, 'movie')).filter(Boolean),
      shows: (shows.results ?? []).map((item) => normalizeMedia(item, 'tv')).filter(Boolean),
    }
  }, [])
  const { data: popularData, loading: popularLoading, error: popularError, retry: retryPopular } = useTMDBQuery(loadPopular)
  const loadServices = useCallback((signal) => fetchStreamingServices(signal), [])
  const { data: serviceList = [] } = useTMDBQuery(loadServices)
  const serviceOptions = useMemo(() => (serviceList ?? []).map((service) => ({
    value: String(filterType === 'movie' ? service.movieProviderId ?? service.providerId : service.tvProviderId ?? service.providerId),
    label: service.name,
  })), [filterType, serviceList])
  const popularItems = useMemo(() => {
    const items = popularTab === 'movies'
      ? popularData?.movies ?? []
      : popularTab === 'tv'
        ? popularData?.shows ?? []
        : [...(popularData?.movies ?? []), ...(popularData?.shows ?? [])]
    return [...items].sort((left, right) => right.popularity - left.popularity)
  }, [popularData, popularTab])
  const visiblePopularItems = popularItems.slice(0, popularVisibleCount)
  const mediaResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return searchData.filter((item) => matchesSearchFilters(item, searchParams) &&
      (!normalizedQuery || (item.title ?? item.name ?? '').toLowerCase().includes(normalizedQuery) ||
        item.overview.toLowerCase().includes(normalizedQuery)))
  }, [query, searchData, searchParams])
  const results = mediaResults

  useEffect(() => {
    setSidebarSlot(document.getElementById('sidebar-filter-slot'))
  }, [])

  useEffect(() => {
    if (!filtersVisible) setSheetOpen(false)
  }, [filtersVisible])

  useEffect(() => {
    if (!hasQuery) {
      setSearchData([])
      setSearchLoading(false)
      setSearchError('')
      return undefined
    }
    const controller = new AbortController()
    const searchTerm = query.trim()
    const endpoint = tab === 'people' ? '/search/person'
      : tab === 'movies' ? '/search/movie'
        : tab === 'tv' ? '/search/tv'
          : '/search/multi'
    setSearchLoading(true)
    setSearchError('')
    tmdbRequest(endpoint, { query: searchTerm, page: '1', region: DEFAULT_REGION }, {
      signal: controller.signal,
      includeAdult: false,
    }).then((response) => {
      if (controller.signal.aborted) return
      const entries = response.results ?? []
      setSearchData(tab === 'people'
        ? entries.map((person) => ({
            ...normalizePerson(person),
            knownFor: (person.known_for ?? []).map((entry) => entry.title ?? entry.name).filter(Boolean).slice(0, 2),
          }))
        : entries.map((entry) => normalizeMedia(entry, tab === 'movies' ? 'movie' : tab === 'tv' ? 'tv' : entry.media_type))
          .filter(Boolean))
      setSearchLoading(false)
    }).catch((error) => {
      if (controller.signal.aborted || error.name === 'AbortError') return
      setSearchError(error.message || 'Something went wrong. Try again.')
      setSearchLoading(false)
    })
    return () => controller.abort()
  }, [hasQuery, query, searchAttempt, tab])

  const onSearch = useCallback((value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set('q', value)
    else nextParams.delete('q')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const setTab = (value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value === 'all') nextParams.delete('tab')
    else nextParams.set('tab', value)
    setSearchParams(nextParams)
  }

  function updateFilter(key, value) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, value)
    else nextParams.delete(key)
    setSearchParams(nextParams)
  }

  function clearFilters() {
    const nextParams = new URLSearchParams()
    if (query) nextParams.set('q', query)
    if (tab !== 'all') nextParams.set('tab', tab)
    setSearchParams(nextParams)
  }

  const renderFilters = (onClose) => (
    <BrowseFilters
      type={filterType}
      searchParams={searchParams}
      updateParam={updateFilter}
      clearAll={clearFilters}
      onClose={onClose}
      activeCount={filterCount}
      titleOverride="Search filters"
      serviceOptions={serviceOptions}
    />
  )

  const gridItems = tab === 'people'
    ? searchData.map((person) => <PersonCard key={person.id} person={person} />)
    : mediaResults.map((item) => (
      <MediaCard key={`${item.type}-${item.id}`} item={item} layout="grid" showTypeBadge={tab === 'all'} />
    ))

  return (
    <div className="py-6">
      <SEO title="Search Movies & TV Shows | WatchMeta" description="Search WatchMeta’s movie and TV catalog." path="/search" />
      <div className="mb-6">
        <PillBreadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />
      </div>
      <div className="mb-6 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <SearchBar query={query} onSearch={onSearch} />
      </div>
      <AdsterraBanner />
      {!hasQuery ? (
        <section aria-label="Popular right now" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Popular right now</h2>
            <Tabs value={popularTab} onValueChange={(value) => {
              setPopularTab(value)
              setPopularVisibleCount(POPULAR_PAGE_SIZE)
            }}>
              <TabsList aria-label="Filter popular titles">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="movies">Movies</TabsTrigger>
                <TabsTrigger value="tv">TV</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {popularError && <RequestState error={popularError} onRetry={retryPopular} />}
          {popularLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 8 }, (_, index) => <MediaCardSkeleton key={index} layout="grid" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {visiblePopularItems.map((item) => (
                  <MediaCard key={`${item.type}-${item.id}`} item={item} layout="grid" showTypeBadge={popularTab === 'all'} />
                ))}
              </div>
              {popularVisibleCount < popularItems.length && (
                <div className="flex justify-center">
                  <Button type="button" variant="outline" onClick={() => setPopularVisibleCount((count) => count + POPULAR_PAGE_SIZE)}>Show more</Button>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          <Tabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList aria-label="Search categories" className="w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movies">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV</TabsTrigger>
              {/* <TabsTrigger value="people">People</TabsTrigger> */}
            </TabsList>
          </Tabs>
          {filtersVisible && (
            <>
              <div {...dragScroll} aria-label="Search filters" className={`${dragScroll.className} mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden`}>
                <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => setSheetOpen(true)}>
                  <SlidersHorizontal className="size-4" />Filters{filterCount > 0 && ` (${filterCount})`}
                </Button>
                {['Sort', 'Genre', 'Year', 'Services', 'Language', 'Country', 'Age rating', 'Keywords', ...(filterType === 'movie' ? ['Runtime'] : [])].map((label) => (
                  <Button key={label} type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setSheetOpen(true)}>{label}</Button>
                ))}
              </div>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="left" className="w-[min(90vw,380px)] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>Refine your search results.</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">{renderFilters(() => setSheetOpen(false))}</div>
                </SheetContent>
              </Sheet>
              {sidebarSlot && createPortal(renderFilters(), sidebarSlot)}
            </>
          )}
          {searchError && <RequestState error={searchError} onRetry={() => setSearchAttempt((count) => count + 1)} />}
          <section aria-label="Search results">
            {searchLoading ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">Searching for “{query}”…</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                  {Array.from({ length: 6 }, (_, index) => <MediaCardSkeleton key={index} layout="grid" />)}
                </div>
              </>
            ) : gridItems.length === 0 && !searchError ? (
              <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                No results for “{query}”. Check the spelling or try a different word.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">{gridItems.length} {gridItems.length === 1 ? 'result' : 'results'} for “{query}”</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{gridItems}</div>
              </>
            )}
          </section>
        </>
      )}
      <AdsterraNative />
    </div>
  )
}
