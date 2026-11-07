import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import CastSection from '@/components/details/CastSection.jsx'
import EpisodeList from '@/components/details/EpisodeList.jsx'
import HeroDetails from '@/components/details/HeroDetails.jsx'
import MovieInfo from '@/components/details/MovieInfo.jsx'
import SeasonSelector from '@/components/details/SeasonSelector.jsx'
import SimilarTitles from '@/components/details/SimilarTitles.jsx'
import TrailerSection from '@/components/details/TrailerSection.jsx'
import WhereToWatch from '@/components/details/WhereToWatch.jsx'
import RequestState from '@/components/common/RequestState.jsx'
import { useLibrary } from '@/context/LibraryContext.jsx'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import { normalizeDetails, normalizeEpisode, tmdbRequest } from '@/api/tmdb.js'
import { SEO, breadcrumbJsonLd } from '@/components/seo/SEO.jsx'

function DetailsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[45vh] min-h-56 w-full rounded-none lg:h-[60vh]" />
      <div className="mx-auto max-w-[1100px] space-y-10 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <Skeleton className="h-48 w-32 shrink-0 rounded-xl sm:h-60 sm:w-40" />
          <div className="flex-1 space-y-4 pt-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function NotFound({ unavailable = false, onRemove }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-[1100px] flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">{unavailable ? 'This title is no longer available.' : 'Title not found.'}</h1>
      {onRemove && <Button type="button" variant="outline" onClick={onRemove}>Remove from library</Button>}
      <Button asChild variant="outline"><Link to="/">Back to Home</Link></Button>
    </div>
  )
}

export default function DetailsPage({ type }) {
  const { id } = useParams()
  const [seasonNumber, setSeasonNumber] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [seasonLoading, setSeasonLoading] = useState(false)
  const [seasonError, setSeasonError] = useState('')
  const [seasonRetry, setSeasonRetry] = useState(0)
  const { watchedEpisodes, toggleEpisodeWatched, watchlist, removeFromWatchlist } = useLibrary()
  const loadDetails = useCallback(async (signal) => {
    const append = type === 'movie'
      ? 'credits,videos,similar,recommendations,watch/providers,release_dates'
      : 'credits,aggregate_credits,videos,similar,recommendations,watch/providers,content_ratings'
    const raw = await tmdbRequest(`/${type}/${id}`, { append_to_response: append }, { signal })
    return normalizeDetails(raw, type)
  }, [id, type])
  const { data: details, loading, error, retry } = useTMDBQuery(loadDetails)
  const activeSeason = details?.seasons.find((entry) => entry.number === seasonNumber) ?? details?.seasons.find((entry) => entry.number > 0)
  const seasonsKey = details?.seasons.map((season) => season.number).join(',') ?? ''

  useEffect(() => {
    if (!activeSeason) return
    if (activeSeason.number !== seasonNumber) setSeasonNumber(activeSeason.number)
  }, [activeSeason, seasonNumber])

  useEffect(() => {
    if (type !== 'tv' || !details || !activeSeason) return undefined
    const controller = new AbortController()
    setSeasonLoading(true)
    setSeasonError('')
    tmdbRequest(`/tv/${id}/season/${activeSeason.number}`, {}, { signal: controller.signal }).then((raw) => {
      if (controller.signal.aborted) return
      setSeasonData({
        ...activeSeason,
        episodeCount: raw.episodes?.length ?? activeSeason.episodeCount,
        airDates: raw.air_date ?? activeSeason.airDates,
        episodes: (raw.episodes ?? []).map(normalizeEpisode),
      })
      setSeasonLoading(false)
    }).catch((requestError) => {
      if (controller.signal.aborted || requestError.name === 'AbortError') return
      setSeasonError(requestError.message || 'Something went wrong. Try again.')
      setSeasonLoading(false)
    })
    return () => controller.abort()
  }, [activeSeason, id, seasonRetry, seasonsKey, type])

  const season = activeSeason
    ? seasonData?.number === activeSeason.number
      ? seasonData
      : { ...activeSeason, episodes: [] }
    : null
  const tvWatched = watchedEpisodes[id] ?? {}
  const nextEpisode = season?.episodes.find((episode) => !tvWatched[`S${season.number}E${episode.number}`])
    ?? season?.episodes[0]

  if (loading) return <DetailsSkeleton />
  if (error?.includes('Not found.')) {
    const savedItem = watchlist.find((item) => String(item.id) === id && item.type === type)
    return (
      <NotFound
        unavailable={Boolean(savedItem)}
        onRemove={savedItem ? () => removeFromWatchlist(savedItem.id, savedItem.type) : undefined}
      />
    )
  }
  if (!details) {
    return <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-8"><RequestState error={error} onRetry={retry} /></div>
  }

  const title = `${details.title} (${details.year ?? '—'}) | WatchMeta`
  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: type === 'movie' ? 'Movies' : 'TV shows', to: type === 'movie' ? '/movies' : '/tv' },
    { label: details.title },
  ]
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'movie' ? 'Movie' : 'TVSeries',
    name: details.title,
    description: details.overview,
    image: details.posterPath,
    datePublished: details.releaseDate,
    ...(type === 'movie' && details.runtime ? { duration: `PT${details.runtime}M` } : {}),
  }
  const canonicalPath = `/${type}/${details.id}`

  return (
    <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] space-y-8 pb-8 sm:-mx-6 sm:space-y-10 lg:mx-0 lg:space-y-12">
      <SEO
        title={title}
        description={details.overview}
        path={canonicalPath}
        image={details.posterPath || details.backdropPath}
        type={type === 'movie' ? 'video.movie' : 'video.tv_show'}
        jsonLd={[structuredData, breadcrumbJsonLd(breadcrumbItems)]}
      />
      {error && <div className="mx-4 sm:mx-6"><RequestState error={error} onRetry={retry} /></div>}
      <HeroDetails
        item={details}
        type={type}
        seasonNumber={season?.number ?? 1}
        episodeNumber={nextEpisode?.number ?? 1}
      />
      <div className="mx-auto max-w-[1100px] space-y-8 px-4 sm:px-6 lg:space-y-12 lg:px-8">
        <CastSection cast={details.cast} director={details.director} writer={details.writer} />
        <MovieInfo item={details} type={type} />
        <div className="lg:hidden">
          <TrailerSection item={details} />
        </div>
        <WhereToWatch providers={details.providers} />
        {type === 'tv' && season && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold sm:text-2xl">Seasons and episodes</h2>
              {nextEpisode && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/watch/tv/${details.id}/${season.number}/${nextEpisode.number}`}>Next episode</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SeasonSelector
                seasons={details.seasons}
                value={season.number}
                onValueChange={(value) => {
                  setSeasonData(null)
                  setSeasonNumber(value)
                }}
              />
              <p className="text-sm text-muted-foreground">
                {season.episodeCount ?? 0} episodes · {season.airDates || '—'}
              </p>
            </div>
            {seasonError && <RequestState error={seasonError} onRetry={() => setSeasonRetry((value) => value + 1)} />}
            {seasonLoading ? (
              <div className="space-y-3" role="status">
                {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : (
              <EpisodeList
                episodes={season.episodes}
                itemId={details.id}
                seasonNumber={season.number}
                watched={tvWatched}
                onWatchedChange={(key, value) => {
                  if (Boolean(tvWatched[key]) !== value) {
                    const match = key.match(/^S(\d+)E(\d+)$/)
                    if (match) toggleEpisodeWatched(details.id, Number(match[1]), Number(match[2]))
                  }
                }}
              />
            )}
          </section>
        )}
        <SimilarTitles items={details.similarTitles.length >= 6
          ? details.similarTitles
          : [...details.similarTitles, ...details.recommendations.filter((item) =>
              !details.similarTitles.some((similar) => similar.id === item.id))].slice(0, 10)} />
      </div>
    </div>
  )
}
