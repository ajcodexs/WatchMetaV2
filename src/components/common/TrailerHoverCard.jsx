import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Play, Star, Volume2, VolumeX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import { loadYouTubeApi } from '@/lib/youtubeApi.js'
import { selectTrailer, tmdbRequest } from '@/api/tmdb.js'

const activeListeners = new Set()
let activePreviewId = null
const trailerKeyCache = new Map()

function subscribeToActivePreview(listener) {
  activeListeners.add(listener)
  return () => activeListeners.delete(listener)
}

function getActivePreview() {
  return activePreviewId
}

function setActivePreview(nextId) {
  if (activePreviewId === nextId) return
  activePreviewId = nextId
  activeListeners.forEach((listener) => listener())
}

function useDesktopHover() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)')
    const update = () => setEnabled(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return enabled
}

function trailerCacheKey(item) {
  return `${item.type ?? 'movie'}-${item.id}`
}

function getCachedTrailerKey(item) {
  const cacheKey = trailerCacheKey(item)
  if (!trailerKeyCache.has(cacheKey)) {
    if (item.trailerKey) trailerKeyCache.set(cacheKey, item.trailerKey)
    else return undefined
  }
  return trailerKeyCache.get(cacheKey)
}

function TrailerPreview({ item, trailerKey, reducedMotion, trailerLoading, trailerError }) {
  const title = item.title ?? item.name
  const type = item.type ?? 'movie'
  const [playRequested, setPlayRequested] = useState(!reducedMotion && Boolean(trailerKey))
  const [loading, setLoading] = useState(Boolean(trailerKey) && !reducedMotion)
  const [playerReady, setPlayerReady] = useState(false)
  const [muted, setMuted] = useState(true)
  const [failed, setFailed] = useState(false)
  const playerHostRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!trailerKey) {
      setPlayRequested(false)
      setLoading(false)
      return
    }
    setPlayRequested(!reducedMotion)
  }, [reducedMotion, trailerKey])

  useEffect(() => {
    if (!trailerKey || !playRequested) {
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setFailed(false)
    setPlayerReady(false)

    loadYouTubeApi().then((youtube) => {
      if (!active || !playerHostRef.current) return

      const player = new youtube.Player(playerHostRef.current, {
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        videoId: trailerKey,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: trailerKey,
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

            playerRef.current = event.target
            const iframe = event.target.getIframe()
            iframe.title = `${title} trailer`
            iframe.style.position = 'absolute'
            iframe.style.top = '50%'
            iframe.style.left = '50%'
            iframe.style.width = '100%'
            iframe.style.height = '100%'
            iframe.style.transform = 'translate(-50%, -50%)'
            iframe.style.pointerEvents = 'none'
            event.target.mute()
            event.target.playVideo()
            setMuted(true)
            setLoading(false)
            setPlayerReady(true)
          },
          onError() {
            if (!active) return
            playerRef.current?.destroy()
            playerRef.current = null
            setFailed(true)
            setLoading(false)
            setPlayerReady(false)
          },
        },
      })
      playerRef.current = player
    }).catch(() => {
      if (!active) return
      setFailed(true)
      setLoading(false)
    })

    return () => {
      active = false
      const player = playerRef.current
      playerRef.current = null
      if (player && typeof player.destroy === 'function') player.destroy()
    }
  }, [playRequested, trailerKey])

  function toggleMuted() {
    const player = playerRef.current
    if (!player) return
    if (muted) player.unMute()
    else player.mute()
    setMuted(!muted)
  }

  const mediaDetails = type === 'movie'
    ? `${item.runtime} min`
    : `${item.seasons ?? item.seasonCount ?? 1} seasons`
  const watchPath = type === 'tv'
    ? `/watch/tv/${item.id}/1/1`
    : `/watch/movie/${item.id}`

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-muted">
        <img
          src={item.backdropPath || item.posterPath}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        {playRequested && !failed && (
          <div className="absolute inset-0 overflow-hidden">
            <div ref={playerHostRef} className="absolute inset-0" />
          </div>
        )}
        {(loading || trailerLoading) && (
          <Skeleton aria-hidden="true" className="absolute inset-0 rounded-none bg-muted/75" />
        )}
        {trailerKey && !failed && !playerReady && reducedMotion && !playRequested && (
          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            aria-label={`Play ${title} trailer`}
            className="absolute inset-0 m-auto size-11 rounded-full bg-background/90"
            onClick={() => setPlayRequested(true)}
          >
            <Play aria-hidden="true" className="size-5 fill-current" />
          </Button>
        )}
        {playerReady && (
          <Button
            type="button"
            variant="secondary"
            size="icon-lg"
            aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
            className="absolute bottom-3 right-3 z-10 size-11 rounded-full border border-white/30 bg-black/70 text-white hover:bg-black/90 hover:text-white"
            onClick={toggleMuted}
          >
            {muted
              ? <VolumeX aria-hidden="true" className="size-5" />
              : <Volume2 aria-hidden="true" className="size-5" />}
          </Button>
        )}
      </div>
      <div className="space-y-3 p-4">
        {trailerError && <p role="alert" className="text-xs text-destructive">{trailerError}</p>}
        <h2 className="truncate text-base font-bold" title={title}>{title}</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.year}</span>
          <span aria-hidden="true">·</span>
          <span>{mediaDetails}</span>
          <Badge variant="secondary" className="ml-auto shrink-0 gap-1">
            <Star aria-hidden="true" className="size-3 fill-highlight text-highlight" />
            {item.rating.toFixed(1)}
          </Badge>
        </div>
        {item.genres?.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{item.genres.slice(0, 3).join(', ')}</p>
        )}
        {item.overview && (
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{item.overview}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Button asChild size="sm" className="gap-1.5">
            <Link to={watchPath}><Play aria-hidden="true" className="size-3.5 fill-current" />Play</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/${type}/${item.id}`}>More info</Link>
          </Button>
          <WatchlistButton item={{ ...item, type }} variant="inline" size="sm" className="ml-auto" />
        </div>
      </div>
    </div>
  )
}

export default function TrailerHoverCard({ item, children }) {
  const canHover = useDesktopHover()
  const instanceId = useId()
  const activeId = useSyncExternalStore(subscribeToActivePreview, getActivePreview, () => null)
  const isOpen = canHover && activeId === instanceId
  const [reducedMotion, setReducedMotion] = useState(false)
  const focusTimerRef = useRef(null)
  const [trailerKey, setTrailerKey] = useState(() => getCachedTrailerKey(item))
  const [trailerLoading, setTrailerLoading] = useState(false)
  const [trailerError, setTrailerError] = useState('')
  const title = item.title ?? item.name
  const type = item.type ?? 'movie'
  const itemKey = trailerCacheKey(item)

  useEffect(() => {
    const cached = getCachedTrailerKey(item)
    if (cached !== undefined) {
      setTrailerKey(cached)
      return
    }
    if (!isOpen) return

    const controller = new AbortController()
    setTrailerLoading(true)
    setTrailerError('')
    tmdbRequest(`/${type}/${item.id}/videos`, {}, { signal: controller.signal }).then((response) => {
      if (controller.signal.aborted) return
      const selected = selectTrailer(response.results ?? [])
      trailerKeyCache.set(itemKey, selected)
      setTrailerKey(selected)
      setTrailerLoading(false)
    }).catch((error) => {
      if (controller.signal.aborted || error.name === 'AbortError') return
      setTrailerError(error.message || 'Something went wrong. Try again.')
      setTrailerKey(null)
      trailerKeyCache.set(itemKey, null)
      setTrailerLoading(false)
    })
    return () => controller.abort()
  }, [isOpen, item.id, item.trailerKey, itemKey, type])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => () => {
    window.clearTimeout(focusTimerRef.current)
    if (getActivePreview() === instanceId) setActivePreview(null)
  }, [instanceId])

  useEffect(() => {
    if (!isOpen) return
    const timeout = window.setTimeout(() => {
      const content = document.querySelector(`[data-preview-instance="${instanceId}"]`)
      content?.querySelectorAll('a, button').forEach((element) => {
        element.tabIndex = 0
      })
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [instanceId, isOpen])

  if (!canHover) return children

  return (
    <HoverCard
      open={isOpen}
      onOpenChange={(open) => {
        if (open) setActivePreview(instanceId)
        else if (getActivePreview() === instanceId) setActivePreview(null)
      }}
      openDelay={600}
      closeDelay={200}
    >
      <HoverCardTrigger
        asChild
        onFocus={(event) => {
          event.preventDefault()
          window.clearTimeout(focusTimerRef.current)
          focusTimerRef.current = window.setTimeout(() => {
            setActivePreview(instanceId)
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                document.querySelector(`[data-preview-instance="${instanceId}"] a, [data-preview-instance="${instanceId}"] button`)?.focus()
              })
            })
          }, 600)
        }}
        onBlur={(event) => {
          window.clearTimeout(focusTimerRef.current)
          if (event.relatedTarget?.closest?.(`[data-preview-instance="${instanceId}"]`)) {
            event.preventDefault()
          }
        }}
      >
        <div className="contents">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={12}
        role="dialog"
        aria-label={title}
        data-preview-instance={instanceId}
        className="w-[min(360px,calc(100vw-1.5rem))] rounded-xl border-0 bg-transparent p-0"
      >
        <TrailerPreview
          key={`${item.type ?? 'movie'}-${item.id}-${reducedMotion}`}
          item={item}
          trailerKey={trailerKey}
          reducedMotion={reducedMotion}
          trailerLoading={trailerLoading}
          trailerError={trailerError}
        />
      </HoverCardContent>
    </HoverCard>
  )
}
