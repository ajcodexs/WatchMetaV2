import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { stillUrl } from '@/api/tmdbImages.js'

export default function EpisodeList({ episodes, itemId, seasonNumber, watched, onWatchedChange }) {
  return (
    <div className="space-y-3">
      {episodes.map((episode) => {
        const key = `S${seasonNumber}E${episode.number}`
        return (
          <article key={episode.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:p-4">
            <img
              src={episode.stillPath ?? stillUrl(null)}
              alt={`${episode.title} still`}
              loading="lazy"
              className="aspect-video w-full rounded-lg object-cover sm:w-40"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-semibold">{episode.number}. {episode.title}</h3>
              <p className="text-xs text-muted-foreground">{episode.airDate} · {episode.runtime} min</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{episode.overview}</p>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
              <Button asChild size="sm" className="gap-1.5">
                <Link to={`/watch/tv/${itemId}/${seasonNumber}/${episode.number}`}>
                  <Play aria-hidden="true" className="size-3.5 fill-current" />Play
                </Link>
              </Button>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={Boolean(watched[key])}
                  onCheckedChange={(checked) => onWatchedChange(key, checked === true)}
                />
                Mark watched
              </label>
            </div>
          </article>
        )
      })}
    </div>
  )
}
