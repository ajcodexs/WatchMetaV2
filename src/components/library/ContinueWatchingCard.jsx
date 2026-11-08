import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function ContinueWatchingCard({ item, onRemove, className = '' }) {
  const percent = item.durationSeconds > 0
    ? Math.min(100, Math.max(0, item.progressSeconds / item.durationSeconds * 100))
    : 0
  const minutesLeft = Math.max(0, Math.ceil((item.durationSeconds - item.progressSeconds) / 60))
  const path = item.type === 'tv' && item.season && item.episode
    ? `/watch/tv/${item.id}/${item.season}/${item.episode}`
    : `/watch/${item.type}/${item.id}`

  return (
    <article className={`flex min-w-0 gap-3 rounded-xl border border-border bg-card p-3 ${className}`}>
      <Link to={path} className="w-20 shrink-0 self-start">
        <img src={item.posterPath} alt={`${item.title} poster`} loading="lazy" className="aspect-[2/3] w-full rounded-md object-cover" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="space-y-1">
          <Link to={path} className="line-clamp-2 font-semibold hover:underline">{item.title}</Link>
          {item.type === 'tv' && (
            <p className="text-xs text-muted-foreground">S{item.season} E{item.episode}</p>
          )}
          <div
            role="progressbar"
            aria-label={`${item.title} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {item.durationSeconds > 0 ? `${minutesLeft} min left` : 'Last opened'}
          </p>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-fit gap-1 px-2 text-muted-foreground"
            aria-label={`Remove ${item.title} from Continue watching`}
            onClick={() => onRemove(item)}
          >
            <Trash2 aria-hidden="true" />Remove
          </Button>
        )}
      </div>
    </article>
  )
}
