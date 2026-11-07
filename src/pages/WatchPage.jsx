import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ListVideo } from 'lucide-react'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import SimilarTitles from '@/components/details/SimilarTitles.jsx'
import RequestState from '@/components/common/RequestState.jsx'
import { SEO, breadcrumbJsonLd } from '@/components/seo/SEO.jsx'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import { normalizeDetails, normalizeEpisode, tmdbRequest } from '@/api/tmdb.js'
import SourcePlayer from '@/components/player/SourcePlayer.jsx'
import { SOURCES, DEFAULT_SOURCE_NAME } from '@/config/servers.js'

function EpisodePanel({ details, season, currentEpisode, onEpisodeSelect, onSeasonChange }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {details.seasons.filter((entry) => entry.number > 0).map((entry) => (
          <Button
            key={entry.number}
            type="button"
            size="sm"
            variant={entry.number === season.number ? 'default' : 'outline'}
            onClick={() => onSeasonChange(entry.number)}
          >
            Season {entry.number}
          </Button>
        ))}
      </div>
      <ol className="max-h-[55vh] space-y-1 overflow-y-auto">
        {season.episodes.map((episode) => (
          <li key={episode.id}>
            <button
              type="button"
              aria-current={episode.number === currentEpisode.number ? 'true' : undefined}
              onClick={() => onEpisodeSelect(season.number, episode.number)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                episode.number === currentEpisode.number ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <span className="block font-medium">E{episode.number} · {episode.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{episode.runtime} min</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function WatchPage() {
  const { type, id, season: seasonParam, episode: episodeParam } = useParams()
  const navigate = useNavigate()
  const mediaType = type === 'movie' || type === 'tv' ? type : null
  const seasonNumber = mediaType === 'tv' ? Number(seasonParam ?? 1) : 1
  const episodeNumber = mediaType === 'tv' ? Number(episodeParam ?? 1) : 1
  const [season, setSeason] = useState(null)
  const [seasonLoading, setSeasonLoading] = useState(false)
  const [seasonError, setSeasonError] = useState('')
  const [seasonRetry, setSeasonRetry] = useState(0)
  const [episodesOpen, setEpisodesOpen] = useState(false)

  // Source selection. These hooks must stay above every early return.
  const [sourceName, setSourceName] = useState(() => {
    try {
      return localStorage.getItem('wm_server_pref') || DEFAULT_SOURCE_NAME
    } catch {
      return DEFAULT_SOURCE_NAME
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('wm_server_pref', sourceName)
    } catch {
      // ignore storage errors
    }
  }, [sourceName])

  const loadDetails = useCallback(async (signal) => {
    if (!mediaType) throw new Error('Not found.')
    const raw = await tmdbRequest(`/${mediaType}/${id}`, { append_to_response: 'similar,recommendations,watch/providers' }, { signal })
    return normalizeDetails(raw, mediaType)
  }, [id, mediaType])
  const { data: details, loading, error, retry } = useTMDBQuery(loadDetails)

  useEffect(() => {
    if (!details || mediaType !== 'tv') return undefined
    const controller = new AbortController()
    setSeasonLoading(true)
    setSeasonError('')
    tmdbRequest(`/tv/${id}/season/${seasonNumber}`, {}, { signal: controller.signal }).then((raw) => {
      if (controller.signal.aborted) return
      setSeason({
        number: raw.season_number,
        episodeCount: raw.episodes?.length ?? 0,
        airDates: raw.air_date ?? '',
        episodes: (raw.episodes ?? []).map(normalizeEpisode),
      })
      setSeasonLoading(false)
    }).catch((requestError) => {
      if (controller.signal.aborted || requestError.name === 'AbortError') return
      setSeasonError(requestError.message || 'Something went wrong. Try again.')
      setSeasonLoading(false)
    })
    return () => controller.abort()
  }, [details, id, mediaType, seasonNumber, seasonRetry])

  const currentEpisode = season?.number === seasonNumber
    ? season.episodes.find((entry) => entry.number === episodeNumber)
    : null
  const episodeSequence = season?.episodes.map((episode) => episode.number) ?? []
  const currentEpisodeIndex = episodeSequence.indexOf(episodeNumber)
  const previousEpisode = episodeSequence[currentEpisodeIndex - 1]
  const nextEpisode = episodeSequence[currentEpisodeIndex + 1]
  const watchPath = (nextSeason, nextEpisodeNumber) => `/watch/tv/${id}/${nextSeason}/${nextEpisodeNumber}`
  const detailsPath = mediaType ? `/${mediaType}/${id}` : '/'

  if (loading) {
    return <div className="space-y-6 py-6" role="status"><Skeleton className="aspect-video w-full rounded-xl" /></div>
  }
  if (error || !details) {
    return <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-8"><RequestState error={error || 'Not found.'} onRetry={retry} /></div>
  }
  if (mediaType === 'tv' && seasonError) {
    return <div className="mx-auto max-w-[1100px] space-y-4 px-4 py-8"><RequestState error={seasonError} onRetry={() => setSeasonRetry((value) => value + 1)} /></div>
  }
  if (mediaType === 'tv' && (seasonLoading || !season)) {
    return <div className="space-y-6 py-6" role="status"><Skeleton className="aspect-video w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div>
  }
  if (mediaType === 'tv' && !currentEpisode) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start justify-center gap-4">
        <h1 className="text-3xl font-bold">Episode not found.</h1>
        <Button asChild variant="outline"><Link to={detailsPath}>Back to title details</Link></Button>
      </div>
    )
  }

  const heading = mediaType === 'tv'
    ? `${details.title} · S${seasonNumber} E${episodeNumber} · ${currentEpisode.title}`
    : details.title
  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: mediaType === 'movie' ? 'Movies' : 'TV shows', to: mediaType === 'movie' ? '/movies' : '/tv' },
    { label: details.title, to: detailsPath },
    { label: 'Where to watch' },
  ]
  const watchSeoPath = mediaType === 'tv'
    ? `/watch/tv/${id}/${seasonNumber}/${episodeNumber}`
    : `/watch/movie/${id}`
  const justWatchUrl = details.providers?.link

  return (
    <div className="space-y-6 py-4 sm:py-6">
      <SEO title={`${heading} | WatchMeta`} description={`Find where to watch ${heading}.`} path={watchSeoPath} image={details.posterPath} jsonLd={breadcrumbJsonLd(breadcrumbItems)} />
      <PillBreadcrumb items={breadcrumbItems} />
      <div className="mx-auto grid max-w-[1300px] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <div className="mx-auto w-full max-w-[1000px] space-y-3">
            <SourcePlayer
              type={mediaType}
              id={id}
              season={seasonNumber}
              episode={episodeNumber}
              sourceName={sourceName}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Now playing: {sourceName}</p>
              <Select value={sourceName} onValueChange={setSourceName}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => (
                    <SelectItem key={source.name} value={source.name}>{source.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {justWatchUrl && (
              <Button asChild variant="outline">
                <a href={justWatchUrl} target="_blank" rel="noreferrer">Find a streaming service</a>
              </Button>
            )}
          </div>

          <section className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="ghost" className="gap-2">
                <Link to={detailsPath}><ArrowLeft aria-hidden="true" className="size-4" />Back to details</Link>
              </Button>
              <WatchlistButton item={details} variant="inline" size="md" />
              {mediaType === 'tv' && (
                <>
                  <Button type="button" variant="outline" disabled={!previousEpisode} onClick={() => previousEpisode && navigate(watchPath(seasonNumber, previousEpisode))}>Previous episode</Button>
                  <Button type="button" variant="outline" disabled={!nextEpisode} onClick={() => nextEpisode && navigate(watchPath(seasonNumber, nextEpisode))}>Next episode <ArrowRight aria-hidden="true" className="ml-1 size-4" /></Button>
                </>
              )}
            </div>
          </section>
          {mediaType === 'tv' && (
            <div className="lg:hidden">
              <Sheet open={episodesOpen} onOpenChange={setEpisodesOpen}>
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2"><ListVideo aria-hidden="true" className="size-4" />Episodes</Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(90vw,420px)] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{details.title} episodes</SheetTitle>
                    <SheetDescription>Choose an episode to continue.</SheetDescription>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <EpisodePanel
                      details={details}
                      season={season}
                      currentEpisode={currentEpisode}
                      onEpisodeSelect={(nextSeason, nextEpisodeNumber) => {
                        setEpisodesOpen(false)
                        navigate(watchPath(nextSeason, nextEpisodeNumber))
                      }}
                      onSeasonChange={(nextSeason) => navigate(watchPath(nextSeason, 1))}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          <p className="text-xs leading-relaxed text-muted-foreground">Playback progress is unavailable here. This title won’t be added to Continue Watching automatically.</p>
        </div>
        {mediaType === 'tv' && (
          <aside className="hidden min-w-0 space-y-3 lg:block">
            <h2 className="text-lg font-semibold">Episodes</h2>
            <EpisodePanel
              details={details}
              season={season}
              currentEpisode={currentEpisode}
              onEpisodeSelect={(nextSeason, nextEpisodeNumber) => navigate(watchPath(nextSeason, nextEpisodeNumber))}
              onSeasonChange={(nextSeason) => navigate(watchPath(nextSeason, 1))}
            />
          </aside>
        )}
      </div>
      <div className="mx-auto max-w-[1300px] space-y-6">
        <SimilarTitles items={details.similarTitles.length >= 6
          ? details.similarTitles
          : [...details.similarTitles, ...details.recommendations.filter((item) =>
              !details.similarTitles.some((similar) => similar.id === item.id))].slice(0, 10)} />
      </div>
    </div>
  )
}