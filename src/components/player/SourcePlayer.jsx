import { useEffect, useState } from 'react'
import { SOURCES, DEFAULT_SOURCE_NAME, getEmbedUrl } from '@/config/servers.js'

export default function SourcePlayer({ type, id, season, episode, sourceName }) {
  const source =
    SOURCES.find((s) => s.name === sourceName) ??
    SOURCES.find((s) => s.name === DEFAULT_SOURCE_NAME)
  const src = getEmbedUrl(source, type, id, season, episode)
  const [status, setStatus] = useState('loading') // loading | loaded | timeout

  // Reset and start the 10-second timer whenever the URL changes
  useEffect(() => {
    setStatus('loading')
    const timer = setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'timeout' : current))
    }, 10000)
    return () => clearTimeout(timer)
  }, [src])

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {src && (
        <iframe
          key={src}
          src={src}
          title={`${source?.name ?? 'Video'} player`}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="origin"
          loading="lazy"
          onLoad={() => setStatus('loaded')}
        />
      )}

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/70">
          Loading...
        </div>
      )}

      {status === 'timeout' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">
          This server is not responding. Try another server.
        </div>
      )}
    </div>
  )
}