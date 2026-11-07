import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TrailerSection({ item }) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold sm:text-2xl">Trailer</h2>
      {item.trailerKey ? (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {playing ? (
            <iframe
              className="size-full"
              src={`https://www.youtube-nocookie.com/embed/${item.trailerKey}?autoplay=1`}
              title={`${item.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <>
              <img
                src={item.backdropPath}
                srcSet={item.backdropSrcSet}
                sizes="(min-width: 1920px) 100vw, 1280px"
                alt={`${item.title} trailer preview`}
                className="size-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/35">
                <Button
                  type="button"
                  size="icon-lg"
                  aria-label="Play trailer"
                  className="size-14 rounded-full"
                  onClick={() => setPlaying(true)}
                >
                  <Play className="size-6 fill-current" />
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-muted p-6 text-sm text-muted-foreground">No trailer available.</p>
      )}
    </section>
  )
}
