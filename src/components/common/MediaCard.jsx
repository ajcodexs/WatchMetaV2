import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import TrailerHoverCard from '@/components/common/TrailerHoverCard.jsx'

export function MediaCardSkeleton({ layout = 'row' }) {
  return (
    <div className={`${layout === 'grid' ? 'w-full min-w-0' : 'w-36 shrink-0 sm:w-40'} space-y-2`}>
      <Skeleton className="aspect-[2/3] w-full rounded-xl" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

export default function MediaCard({ item, className = '', layout = 'row', showTypeBadge = false }) {
  const title = item.title ?? item.name
  const type = item.type ?? 'movie'

  return (
    <TrailerHoverCard item={{ ...item, type }}>
      <div className={`group relative ${layout === 'grid' ? 'w-full min-w-0' : 'w-36 shrink-0 sm:w-40'} ${className}`}>
        <Link
          to={`/${type}/${item.id}`}
          aria-label={`${title} (${item.year})`}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card className="relative aspect-[2/3] overflow-hidden rounded-xl border-0 bg-card p-0 shadow-none transition-transform duration-200 group-hover:scale-[1.02]">
            <img
              src={item.posterPath}
              srcSet={item.posterSrcSet}
              sizes={layout === 'grid' ? '(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw' : '160px'}
              alt={`${title} poster`}
              loading="lazy"
              className="size-full object-cover"
            />
            {showTypeBadge && (
              <Badge className="absolute left-2 top-2 border-0 bg-background/90 text-foreground shadow-none">
                {type === 'movie' ? 'Movie' : 'TV'}
              </Badge>
            )}
            <Badge className="absolute bottom-2 right-2 gap-1 border-0 bg-background/90 text-foreground shadow-none">
              <Star aria-hidden="true" className="size-3 fill-highlight text-highlight" />
              {item.rating.toFixed(1)}
            </Badge>
          </Card>
          <h3 className="mt-2 truncate text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{item.year}</p>
        </Link>
        <WatchlistButton item={{ ...item, type }} />
      </div>
    </TrailerHoverCard>
  )
}
