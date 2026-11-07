import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Copy,
  Play,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import { loadYouTubeApi } from '@/lib/youtubeApi.js'

export default function HeroDetails({ item, type, seasonNumber = 1, episodeNumber = 1 }) {
  const [overviewExpanded, setOverviewExpanded] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [trailerReady, setTrailerReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const youtubeHostRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  const watchPath = type === 'movie'
    ? `/watch/movie/${item.id}`
    : `/watch/tv/${item.id}/${seasonNumber}/${episodeNumber}`

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreferences = () => {
      setIsDesktop(desktopQuery.matches)
      setReducedMotion(motionQuery.matches)
    }
    updatePreferences()
    desktopQuery.addEventListener('change', updatePreferences)
    motionQuery.addEventListener('change', updatePreferences)
    return () => {
      desktopQuery.removeEventListener('change', updatePreferences)
      motionQuery.removeEventListener('change', updatePreferences)
    }
  }, [])

  useEffect(() => {
    if (!isDesktop || reducedMotion || !item.trailerKey) return undefined

    let active = true
    setTrailerReady(false)
    loadYouTubeApi().then((youtube) => {
      if (!active || !youtubeHostRef.current) return
      const player = new youtube.Player(youtubeHostRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        videoId: item.trailerKey,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: item.trailerKey,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady(event) {
            if (!active) {
              event.target.destroy()
              return
            }
            youtubePlayerRef.current = event.target
            const iframe = event.target.getIframe()
            iframe.id = 'trailer-player-frame'
            iframe.style.setProperty('position', 'absolute', 'important')
            iframe.style.setProperty('top', '50%', 'important')
            iframe.style.setProperty('left', '50%', 'important')
            iframe.style.setProperty(
              'width',
              'max(100%, calc(max(420px, min(70vh, 900px)) * 16 / 9))',
              'important',
            )
            iframe.style.setProperty(
              'height',
              'max(100%, calc((100vw - 15rem) * 9 / 16))',
              'important',
            )
            iframe.style.setProperty('max-width', 'none', 'important')
            iframe.style.setProperty('transform', 'translate(-50%, -50%)', 'important')
            iframe.style.setProperty('z-index', '0', 'important')
            iframe.style.setProperty('pointer-events', 'none', 'important')
            event.target.mute()
            event.target.playVideo()
            setMuted(true)
            setTrailerReady(true)
          },
          onError() {
            setTrailerReady(false)
            youtubePlayerRef.current?.destroy()
            youtubePlayerRef.current = null
          },
        },
      })
      youtubePlayerRef.current = player
    }).catch(() => {})

    return () => {
      active = false
      const player = youtubePlayerRef.current
      if (player) {
        if (typeof player.pauseVideo === 'function') player.pauseVideo()
        if (typeof player.destroy === 'function') player.destroy()
        youtubePlayerRef.current = null
      }
    }
  }, [isDesktop, item.trailerKey, reducedMotion])

  async function sharePage() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Page link copied to clipboard.')
    } catch {
      toast.error('Could not copy the page link.')
    }
  }

  function toggleMuted() {
    const player = youtubePlayerRef.current
    if (!player) return
    if (muted) {
      player.unMute()
    } else {
      player.mute()
    }
    setMuted((current) => !current)
  }

  return (
    <section className="relative">
      <div className="relative isolate h-[45vh] min-h-56 max-h-[680px] overflow-hidden bg-muted lg:h-[min(70vh,900px)] lg:min-h-[420px] lg:max-h-none">
        <div
          className="details-hero-media absolute inset-0 z-0 overflow-hidden"
          data-trailer-playing={trailerReady}
        >
          <img
            src={item.backdropPath}
            srcSet={item.backdropSrcSet}
            sizes="(min-width: 1024px) calc(100vw - 15rem), 100vw"
            alt={`${item.title} backdrop`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-center lg:object-top"
          />
          <div className={`details-hero-player absolute inset-0 hidden overflow-hidden bg-black transition-opacity lg:block ${trailerReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div
              id="trailer-player"
              ref={youtubeHostRef}
              className={`absolute inset-0 transition-opacity ${trailerReady ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/25 to-background/10 lg:via-background/40 lg:to-transparent" />
        <div className="absolute inset-0 z-20">
          <Button
            asChild
            aria-label={`Play ${type === 'movie' ? 'movie' : 'episode'}`}
            className="pointer-events-auto absolute left-1/2 top-1/2 size-[72px] -translate-x-1/2 -translate-y-1/2 rounded-full [&_svg:not([class*='size-'])]:size-8"
          >
            <Link to={watchPath}>
              <Play aria-hidden="true" className="fill-current" />
            </Link>
          </Button>
          {trailerReady ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-lg"
              className="pointer-events-auto absolute bottom-4 right-4 size-11 rounded-full"
              aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
              onClick={toggleMuted}
            >
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
          ) : null}
        </div>
        <div className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-30 max-w-[calc(100%-2rem)] lg:top-4">
          <PillBreadcrumb items={[
            { label: 'Home', to: '/' },
            { label: type === 'movie' ? 'Movies' : 'TV shows', to: type === 'movie' ? '/movies' : '/tv' },
            { label: item.title },
          ]} />
        </div>
      </div>
      <div className="relative mx-auto -mt-24 flex max-w-[1100px] flex-col gap-6 px-4 pb-8 sm:px-6 lg:-mt-36 lg:flex-row lg:items-end lg:gap-8 lg:px-8">
        <img
          src={item.posterPath}
          srcSet={item.posterSrcSet}
          alt={`${item.title} poster`}
          loading="lazy"
          className="w-32 shrink-0 rounded-xl object-cover shadow-xl sm:w-40 lg:w-56"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{item.tagline}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{item.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{item.year}</Badge>
              {type === 'movie' ? (
                <Badge variant="secondary">{item.runtime} min</Badge>
              ) : (
                <Badge variant="secondary">{item.seasonCount} seasons</Badge>
              )}
              <Badge variant="secondary" className="gap-1">
                <Star aria-hidden="true" className="size-3 fill-highlight text-highlight" />
                {item.rating.toFixed(1)}
              </Badge>
              {item.genres.map((genre) => <Badge key={genre} variant="outline">{genre}</Badge>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="gap-2 lg:hidden">
              <Link to={watchPath}><Play aria-hidden="true" className="size-4 fill-current" />Play</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="hidden gap-2 lg:inline-flex">
              <Link to={watchPath}><Play aria-hidden="true" className="size-4 fill-current" />Play</Link>
            </Button>
            <WatchlistButton item={{ ...item, type }} variant="inline" size="md" />
            <Button type="button" variant="outline" size="lg" className="gap-2" onClick={sharePage}>
              <Copy aria-hidden="true" />Share
            </Button>
          </div>
          <div>
            <p className={`max-w-3xl text-sm leading-6 text-muted-foreground ${overviewExpanded ? '' : 'line-clamp-4'}`}>
              {item.overview}
            </p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-1 h-auto p-0 text-foreground"
              aria-expanded={overviewExpanded}
              onClick={() => setOverviewExpanded((current) => !current)}
            >
              {overviewExpanded ? 'Read less' : 'Read more'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
