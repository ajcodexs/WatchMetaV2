import { Link } from 'react-router-dom'
import useDragScroll from '@/hooks/useDragScroll'
import useRoadmapItems from '@/hooks/useRoadmapItems.js'
import { VERIFIED_ROADMAPS } from '@/lib/roadmaps.js'

function RoadmapCard({ roadmap }) {
  const { items } = useRoadmapItems(roadmap, { firstOnly: true })
  const firstItem = items?.[0]

  return (
    <Link
      to={`/roadmaps/${roadmap.slug}`}
      className="group w-40 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/50 sm:w-48"
    >
      <img
        src={firstItem?.posterPath ?? '/placeholder-poster.png'}
        alt=""
        loading="lazy"
        className="aspect-[2/3] w-full object-cover"
      />
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{roadmap.name}</h3>
        <p className="text-xs text-muted-foreground">{roadmap.entries.length} titles</p>
        <span className="text-xs font-medium text-primary group-hover:underline">View roadmap</span>
      </div>
    </Link>
  )
}

export default function RoadmapsRow() {
  const dragScroll = useDragScroll()
  if (VERIFIED_ROADMAPS.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Watch orders</h2>
        <Link to="/roadmaps" className="shrink-0 rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
          See all
        </Link>
      </div>
      <div
        {...dragScroll}
        role="region"
        aria-label="Watch orders"
        className={`${dragScroll.className} flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3`}
      >
        {VERIFIED_ROADMAPS.slice(0, 6).map((roadmap) => (
          <RoadmapCard key={roadmap.slug} roadmap={roadmap} />
        ))}
      </div>
    </section>
  )
}
