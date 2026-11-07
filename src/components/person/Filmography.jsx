import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import TrailerHoverCard from '@/components/common/TrailerHoverCard.jsx'

const PAGE_SIZE = 20

function CreditRow({ credit }) {
  const title = credit.title ?? credit.name
  return (
    <div className="group relative min-w-0 rounded-xl border border-border bg-card transition-colors hover:bg-muted/70">
      <Link
        to={`/${credit.type}/${credit.id}`}
        className="flex min-w-0 gap-4 rounded-xl p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={credit.posterPath}
          srcSet={credit.posterSrcSet}
          sizes="80px"
          alt={`${title} poster`}
          loading="lazy"
          className="aspect-[2/3] w-16 shrink-0 rounded-md object-cover sm:w-20"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className="line-clamp-2 font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{credit.year}</p>
          <p className="line-clamp-1 text-sm text-muted-foreground">{credit.character || 'Role unknown'}</p>
        </div>
        <Badge variant="secondary" className="h-fit shrink-0 gap-1">
          <Star aria-hidden="true" className="size-3 fill-highlight text-highlight" />
          {credit.rating.toFixed(1)}
        </Badge>
      </Link>
      <WatchlistButton
        item={credit}
        className="!left-[2.5rem] !right-auto sm:!left-[3.5rem]"
      />
    </div>
  )
}

export default function Filmography({ credits }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sortedCredits = [...credits].sort((left, right) => right.releaseDate.localeCompare(left.releaseDate))

  function renderCredits(type) {
    const filtered = type === 'all'
      ? sortedCredits
      : sortedCredits.filter((credit) => credit.type === type)
    const visible = filtered.slice(0, visibleCount)

    return (
      <div className="space-y-4">
        {visible.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((credit, index) => (
              <TrailerHoverCard key={`${credit.type}-${credit.id}-${index}-preview`} item={credit}>
                <CreditRow credit={credit} />
              </TrailerHoverCard>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No credits found.
          </p>
        )}
        {visible.length < filtered.length && (
          <div className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show more
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-semibold">Filmography</h2>
      <Tabs
        defaultValue="all"
        onValueChange={() => setVisibleCount(PAGE_SIZE)}
        className="space-y-5"
      >
        <TabsList aria-label="Filter filmography">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="movie">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV</TabsTrigger>
        </TabsList>
        <TabsContent value="all">{renderCredits('all')}</TabsContent>
        <TabsContent value="movie">{renderCredits('movie')}</TabsContent>
        <TabsContent value="tv">{renderCredits('tv')}</TabsContent>
      </Tabs>
    </section>
  )
}
