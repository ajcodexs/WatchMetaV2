import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import MediaCard, { MediaCardSkeleton } from '@/components/common/MediaCard.jsx'
import useDragScroll from '@/hooks/useDragScroll'

export default function MediaRow({ title, items, loading, seeAllTo = '/movies' }) {
  const dragScroll = useDragScroll()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
          <Link to={seeAllTo}>See all</Link>
        </Button>
      </div>
      {loading ? (
        <div {...dragScroll} role="region" aria-label={`${title} loading`} className={`${dragScroll.className} flex gap-4 overflow-hidden`}>
          {Array.from({ length: 6 }, (_, index) => <MediaCardSkeleton key={index} />)}
        </div>
      ) : items.length > 0 ? (
        <div {...dragScroll} role="region" aria-label={title} className={`${dragScroll.className} flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3`}>
          {items.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} className="snap-start" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      )}
    </section>
  )
}
