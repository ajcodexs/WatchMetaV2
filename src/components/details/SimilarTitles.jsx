import MediaCard from '@/components/common/MediaCard.jsx'
import useDragScroll from '@/hooks/useDragScroll'

export default function SimilarTitles({ items }) {
  const dragScroll = useDragScroll()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold sm:text-2xl">More like this</h2>
      {items.length > 0 ? (
        <div
          {...dragScroll}
          aria-label="More like this"
          className={`${dragScroll.className} flex gap-4 overflow-x-auto pb-3`}
        >
          {items.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No similar titles available.</p>
      )}
    </section>
  )
}
