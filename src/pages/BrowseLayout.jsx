import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import BrowseFilters from '@/components/browse/BrowseFilters'
import MediaCard, { MediaCardSkeleton } from '@/components/common/MediaCard'
import RequestState from '@/components/common/RequestState.jsx'
import { Button } from '@/components/ui/button'
import useDragScroll from '@/hooks/useDragScroll'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import { countActiveMediaFilters } from '@/lib/mediaFilters'
import {
  DEFAULT_REGION,
  fetchStreamingServices,
  normalizeMedia,
  tmdbRequest,
} from '@/api/tmdb.js'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import { SEO } from '@/components/seo/SEO.jsx'

const INITIAL_COUNT = 6
const MAX_PAGE = 500

function discoverSort(type, sort) {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date'
  const titleField = type === 'movie' ? 'original_title' : 'original_name'
  if (sort === 'rating') return { sort_by: 'vote_average.desc', 'vote_count.gte': '100' }
  if (sort === 'release_date') return { sort_by: `${dateField}.desc` }
  if (sort === 'title_asc') return { sort_by: `${titleField}.asc` }
  if (sort === 'title_desc') return { sort_by: `${titleField}.desc` }
  return { sort_by: 'popularity.desc' }
}

function makeDiscoverParams(type, filters, providerId, page, keywordId) {
  const params = {
    ...discoverSort(type, filters.get('sort') ?? 'popularity'),
    page: String(page),
    region: DEFAULT_REGION,
    watch_region: DEFAULT_REGION,
  }
  const genres = filters.get('genre')
  if (genres) params.with_genres = genres
  const yearRange = filters.get('year')?.split(',') ?? []
  if (yearRange.length === 2) {
    const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date'
    params[`${dateField}.gte`] = `${yearRange[0]}-01-01`
    params[`${dateField}.lte`] = `${yearRange[1]}-12-31`
  }
  const providers = [...new Set([
    ...(providerId ? [String(providerId)] : []),
    ...(filters.get('service')?.split(',').filter(Boolean) ?? []),
  ])]
  if (providers.length) params.with_watch_providers = providers.join(',')
  if (providers.length || filters.has('service') || providerId) params.watch_region = DEFAULT_REGION
  if (filters.has('language')) params.with_original_language = filters.get('language')
  if (filters.has('country')) params.with_origin_country = filters.get('country')
  if (filters.has('age')) {
    params.certification_country = 'US'
    params.certification = filters.get('age')
  }
  if (keywordId) params.with_keywords = String(keywordId)
  if (type === 'movie' && filters.has('runtime')) {
    const [min, max] = filters.get('runtime').split(',')
    params['with_runtime.gte'] = min
    params['with_runtime.lte'] = max
  }
  return params
}

async function loadDiscoverPage(type, filters, providerId, page, signal) {
  let keywordId = null
  const keyword = filters.get('keyword')?.trim()
  if (keyword) {
    const match = await tmdbRequest('/search/keyword', { query: keyword, page: '1' }, { signal, includeAdult: false })
    keywordId = match.results?.[0]?.id
    if (!keywordId) return { items: [], page, totalPages: 1, keywordNotFound: true }
  }

  const params = makeDiscoverParams(type, filters, providerId, page, keywordId)
  try {
    const data = await tmdbRequest(`/discover/${type}`, params, { signal, includeAdult: false })
    return {
      items: (data.results ?? []).map((item) => normalizeMedia(item, type)).filter(Boolean),
      page: data.page ?? page,
      totalPages: Math.min(data.total_pages ?? 1, MAX_PAGE),
      keywordNotFound: false,
    }
  } catch (error) {
    if (!(type === 'tv' && filters.has('age') && error.status === 400)) throw error

    const fallbackParams = { ...params }
    delete fallbackParams.certification_country
    delete fallbackParams.certification
    const data = await tmdbRequest(`/discover/${type}`, fallbackParams, { signal, includeAdult: false })
    const results = await Promise.all((data.results ?? []).map(async (item) => {
      const details = await tmdbRequest(`/tv/${item.id}/content_ratings`, {}, { signal })
      const rating = details.results?.find((entry) => entry.iso_3166_1 === 'US')?.rating
      return rating === filters.get('age') ? normalizeMedia(item, type) : null
    }))
    return {
      items: results.filter(Boolean),
      page: data.page ?? page,
      totalPages: Math.min(data.total_pages ?? 1, MAX_PAGE),
      keywordNotFound: false,
    }
  }
}

export default function BrowseLayout({ type, providerId, serviceName }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const [sidebarSlot, setSidebarSlot] = useState(null)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keywordNotFound, setKeywordNotFound] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const dragScroll = useDragScroll()
  const isMovie = type === 'movie'
  const paramsKey = searchParams.toString()
  const filterCount = countActiveMediaFilters(searchParams, type)
  const loadServices = useCallback((signal) => fetchStreamingServices(signal), [])
  const { data: serviceList = [] } = useTMDBQuery(loadServices)
  const serviceOptions = useMemo(() => (serviceList ?? []).map((service) => ({
    value: String(isMovie ? service.movieProviderId ?? service.providerId : service.tvProviderId ?? service.providerId),
    label: service.name,
  })), [isMovie, serviceList])

  useEffect(() => {
    setSidebarSlot(document.getElementById('sidebar-filter-slot'))
  }, [])

  useEffect(() => {
    setPage(1)
    setVisibleCount(INITIAL_COUNT)
  }, [type, paramsKey, providerId])

  useEffect(() => {
    const controller = new AbortController()
    const filters = new URLSearchParams(paramsKey)
    setLoading(true)
    setError('')
    loadDiscoverPage(type, filters, providerId, page, controller.signal).then((result) => {
      if (controller.signal.aborted) return
      setItems((current) => page === 1 ? result.items : [...current, ...result.items])
      setTotalPages(result.totalPages)
      setKeywordNotFound(result.keywordNotFound)
      setLoading(false)
    }).catch((requestError) => {
      if (controller.signal.aborted || requestError.name === 'AbortError') return
      setError(requestError.message || 'Something went wrong. Try again.')
      setLoading(false)
    })
    return () => controller.abort()
  }, [page, paramsKey, providerId, retryCount, type])

  const shownItems = items.slice(0, visibleCount)

  function updateParam(key, value) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, value)
    else nextParams.delete(key)
    setSearchParams(nextParams)
  }

  function clearAll() {
    setSearchParams(new URLSearchParams())
    setVisibleCount(INITIAL_COUNT)
  }

  function renderFilters(onClose) {
    return (
      <BrowseFilters
        type={type}
        searchParams={searchParams}
        updateParam={updateParam}
        clearAll={clearAll}
        onClose={onClose}
        activeCount={filterCount}
        serviceOptions={serviceOptions}
        hideServiceFilter={Boolean(providerId)}
      />
    )
  }

  return (
    <div className="py-6">
      <SEO
        title={`${serviceName ? `${serviceName} ` : ''}${isMovie ? 'Movies' : 'TV Shows'} | WatchMeta`}
        description={`Browse and discover ${isMovie ? 'movies' : 'TV shows'}${serviceName ? ` on ${serviceName}` : ''} on WatchMeta.`}
        path={serviceName ? `/service/${providerId}` : isMovie ? '/movies' : '/tv'}
      />
      <div className="mb-4">
        <PillBreadcrumb items={[
          { label: 'Home', to: '/' },
          ...(serviceName ? [{ label: 'Streaming', to: '/' }, { label: serviceName }] : [{ label: isMovie ? 'Movies' : 'TV shows' }]),
        ]} />
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{serviceName ? `${serviceName} · ${isMovie ? 'Movies' : 'TV shows'}` : isMovie ? 'Movies' : 'TV shows'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading && page === 1 ? 'Loading titles…' : `${items.length} ${items.length === 1 ? 'title' : 'titles'}`}
        </p>
      </div>
      <div
        {...dragScroll}
        aria-label="Browse filters"
        className={`${dragScroll.className} mb-4 flex items-center gap-2 overflow-x-auto pb-1 lg:hidden`}
      >
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal className="size-4" />
          Filters{filterCount > 0 && ` (${filterCount})`}
        </Button>
        {['Sort', 'Genre', 'Year', ...(providerId ? [] : ['Services']), 'Language', 'Country', 'Age rating', 'Keywords', ...(isMovie ? ['Runtime'] : [])].map((label) => (
          <Button
            key={label}
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setSheetOpen(true)}
          >
            {label}
          </Button>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[min(90vw,380px)] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Refine the {isMovie ? 'movie' : 'TV show'} results.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">{renderFilters(() => setSheetOpen(false))}</div>
        </SheetContent>
      </Sheet>

      {sidebarSlot && createPortal(renderFilters(), sidebarSlot)}
      <section aria-label={`${isMovie ? 'Movie' : 'TV show'} results`} className="min-w-0">
        {error && <RequestState error={error} onRetry={() => setRetryCount((count) => count + 1)} />}
        {loading && page === 1 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: INITIAL_COUNT }, (_, index) => <MediaCardSkeleton key={index} layout="grid" />)}
          </div>
        ) : keywordNotFound ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">No titles match these keywords.</p>
        ) : items.length === 0 && !error ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 text-center">
            <h2 className="text-lg font-semibold">No titles match these filters.</h2>
            <Button type="button" variant="outline" className="mt-4" onClick={clearAll}>Clear filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {shownItems.map((item) => <MediaCard key={`${item.type}-${item.id}`} item={item} layout="grid" />)}
            </div>
            {(visibleCount < items.length || (page < totalPages && page < MAX_PAGE)) && (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => visibleCount < items.length
                    ? setVisibleCount((count) => count + 12)
                    : setPage((current) => Math.min(current + 1, totalPages, MAX_PAGE))}
                >
                  {loading && page > 1 ? 'Loading…' : visibleCount < items.length ? 'Show more' : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
