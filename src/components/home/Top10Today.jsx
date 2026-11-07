import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useDragScroll from '@/hooks/useDragScroll'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import TrailerHoverCard from '@/components/common/TrailerHoverCard.jsx'

export default function Top10Today({ allItems, movies, shows, loading }) {
  const [filter, setFilter] = useState('all')
  const items = useMemo(() => (filter === 'movies' ? movies : filter === 'series' ? shows : allItems).slice(0, 10),
    [allItems, filter, movies, shows])
  const dragScroll = useDragScroll()

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Top 10 Movies This Week</h2>
        <Tabs value={filter} onValueChange={setFilter} aria-label="Filter top ten">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        {...dragScroll}
        role="region"
        aria-label="Top 10 titles"
        className={`${dragScroll.className} flex gap-4 overflow-x-auto px-2 pb-3 pt-12 sm:gap-5 lg:grid lg:grid-cols-5 lg:overflow-visible`}
      >
        {loading
          ? Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="relative w-36 shrink-0 pl-4 sm:w-40 lg:w-auto">
                <div className="relative aspect-[2/3] animate-pulse rounded-xl bg-muted" />
              </div>
            ))
          : items.map((item, index) => (
              <TrailerHoverCard key={`${item.type}-${item.id}`} item={item}>
                <div className="group relative w-36 shrink-0 pl-4 sm:w-40 lg:w-auto">
                  <Link
                    to={`/${item.type}/${item.id}`}
                    aria-label={`${index + 1}. ${item.title ?? item.name}`}
                    className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 z-10 -translate-y-1/2 font-black italic leading-none text-transparent [font-family:Impact,'Arial_Narrow',sans-serif] [-webkit-text-stroke:2px_rgb(244_244_245)] [text-shadow:2px_3px_8px_rgb(0_0_0_/_80%)] text-[64px] md:text-[96px]"
                    >
                      {index + 1}
                    </span>
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card shadow-sm transition-shadow duration-200 group-hover:shadow-lg">
                      <img
                        src={item.posterPath}
                        srcSet={item.posterSrcSet}
                        sizes="160px"
                        alt={`${item.title ?? item.name} poster`}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <Badge className="absolute right-2 top-12 border-0 bg-background/90 text-foreground">
                        {item.type === 'movie' ? 'Movie' : 'TV'}
                      </Badge>
                      <Badge className="absolute bottom-2 right-2 border-0 bg-background/90 text-foreground">
                        {item.rating.toFixed(1)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 truncate text-sm font-medium text-foreground">{item.title ?? item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.year} · {item.type === 'movie' ? 'Movie' : 'TV'}</p>
                  </Link>
                  <WatchlistButton item={item} />
                </div>
              </TrailerHoverCard>
            ))}
        {!loading && items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>
    </section>
  )
}
