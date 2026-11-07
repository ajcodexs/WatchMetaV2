import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import ContinueWatchingCard from '@/components/library/ContinueWatchingCard.jsx'
import useDragScroll from '@/hooks/useDragScroll'

export default function ContinueWatchingRow({ items }) {
  const dragScroll = useDragScroll()
  if (items.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Continue watching</h2>
        <Button asChild variant="ghost" size="sm" className="shrink-0 text-muted-foreground">
          <Link to="/library">View library</Link>
        </Button>
      </div>
      <div {...dragScroll} aria-label="Continue watching" className={`${dragScroll.className} flex gap-4 overflow-x-auto pb-3`}>
        {items.map((item) => (
          <ContinueWatchingCard
            key={`${item.type}-${item.id}`}
            item={item}
            className="w-72 shrink-0 snap-start"
          />
        ))}
      </div>
    </section>
  )
}
