import HeroCarousel from '@/components/home/HeroCarousel.jsx'
import MediaRow from '@/components/home/MediaRow.jsx'
import StreamingServices from '@/components/home/StreamingServices.jsx'
import Top10Today from '@/components/home/Top10Today.jsx'
import ContinueWatchingRow from '@/components/home/ContinueWatchingRow.jsx'
import { useCallback } from 'react'
import { useLibrary } from '@/context/LibraryContext.jsx'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import { normalizeMedia, tmdbRequest } from '@/api/tmdb.js'
import RequestState from '@/components/common/RequestState.jsx'
import { SEO } from '@/components/seo/SEO.jsx'
import { SITE } from '@/config/siteConfig.js'
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx';
import AdsterraNative from '@/components/ads/AdsterraNative.jsx';


export default function HomePage() {
  const loadHome = useCallback(async (signal) => {
    const paths = [
      '/trending/all/day',
      '/movie/popular',
      '/tv/popular',
      '/trending/movie/week',
      '/movie/upcoming',
      '/tv/on_the_air',
      '/movie/top_rated',
      '/tv/top_rated',
    ]
    const responses = await Promise.all(paths.map((path) => tmdbRequest(path, {}, { signal })))
    const [trendingRaw, popularMoviesRaw, popularShowsRaw, weeklyRaw, upcomingRaw, onAirRaw, topMoviesRaw, topShowsRaw] = responses
    const asMedia = (entries, type) => entries.map((entry) => normalizeMedia(entry, type)).filter(Boolean)
    const trendingRawItems = trendingRaw.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    const trendingAll = trendingRawItems.map((item) => normalizeMedia(item)).filter(Boolean)
    const trendingMovies = asMedia(trendingRawItems.filter((item) => item.media_type === 'movie'), 'movie')
    const trendingShows = asMedia(trendingRawItems.filter((item) => item.media_type === 'tv'), 'tv')
    const supplement = (current, candidates) => {
      const ids = new Set(current.map((item) => item.id))
      return [...current, ...candidates.filter((item) => !ids.has(item.id))].slice(0, 10)
    }

    return {
      hero: trendingRawItems.filter((item) => item.backdrop_path).map((item) => normalizeMedia(item)).slice(0, 8),
      topAll: trendingAll.slice(0, 10),
      topMovies: supplement(trendingMovies.slice(0, 10), asMedia(popularMoviesRaw.results, 'movie')),
      topShows: supplement(trendingShows.slice(0, 10), asMedia(popularShowsRaw.results, 'tv')),
      trending: asMedia(weeklyRaw.results, 'movie').slice(0, 10),
      recent: [...asMedia(upcomingRaw.results, 'movie'), ...asMedia(onAirRaw.results, 'tv')]
        .sort((left, right) => right.releaseDate.localeCompare(left.releaseDate)).slice(0, 10),
      popular: [...asMedia(popularMoviesRaw.results, 'movie'), ...asMedia(popularShowsRaw.results, 'tv')]
        .sort((left, right) => right.popularity - left.popularity).slice(0, 10),
      topRated: [...asMedia(topMoviesRaw.results, 'movie'), ...asMedia(topShowsRaw.results, 'tv')]
        .sort((left, right) => right.rating - left.rating).slice(0, 10),
    }
  }, [])
  const { data, loading, error, retry } = useTMDBQuery(loadHome)
  const { continueWatching } = useLibrary()
  const searchAction = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: `${SITE.domain}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.domain}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div>
      <SEO jsonLd={searchAction} />
      <HeroCarousel items={loading ? [] : data?.hero ?? []} />
      <div className="space-y-8 px-4 pb-4 pt-8 sm:space-y-10 sm:px-6 lg:space-y-12 lg:px-8">
        <AdsterraBanner />
        <RequestState error={error} onRetry={retry} />
        <Top10Today
          allItems={data?.topAll ?? []}
          movies={data?.topMovies ?? []}
          shows={data?.topShows ?? []}
          loading={loading}
        />
        <StreamingServices />
        {!loading && <ContinueWatchingRow items={continueWatching} />}
        <MediaRow title="Trending now" items={data?.trending ?? []} loading={loading} />
        <MediaRow title="Recently added" items={data?.recent ?? []} loading={loading} seeAllTo="/movies" />
        <MediaRow title="Popular this week" items={data?.popular ?? []} loading={loading} seeAllTo="/tv" />
        <MediaRow title="Top rated" items={data?.topRated ?? []} loading={loading} />
        <AdsterraNative />
      </div>
    </div>
  )
}
