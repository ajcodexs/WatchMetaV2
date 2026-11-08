import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import RequestState from '@/components/common/RequestState.jsx'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SEO, breadcrumbJsonLd } from '@/components/seo/SEO.jsx'
import useRoadmapItems from '@/hooks/useRoadmapItems.js'
import useRoadmapWatched from '@/hooks/useRoadmapWatched.js'
import { entryKey, releaseOrder, VERIFIED_ROADMAPS } from '@/lib/roadmaps.js'

function RoadmapEntry({ item, index, watched, onToggle }) {
  const entry = item.entry
  const titlePath = `/${item.type}/${item.id}`

  return (
    <article className="flex gap-4 rounded-xl border border-border bg-card p-3 sm:items-center sm:gap-5 sm:p-4">
      <span className="w-7 shrink-0 pt-1 text-center text-lg font-semibold tabular-nums text-muted-foreground sm:pt-0">
        {index + 1}
      </span>
      <Link to={titlePath} className="w-20 shrink-0 overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-24">
        <img
          src={item.posterPath}
          alt={`${item.title} poster`}
          loading="lazy"
          className="aspect-[2/3] w-full object-cover"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link to={titlePath} className="font-semibold hover:underline">{item.title}</Link>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{item.year ?? '—'}</span>
            <Badge variant="secondary">{item.type === 'movie' ? 'Movie' : 'TV'}</Badge>
          </div>
          {entry.note && <p className="text-sm text-muted-foreground">{entry.note}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={Boolean(watched)} onCheckedChange={onToggle} />
            <span>Mark watched</span>
          </label>
          <WatchlistButton item={item} variant="inline" size="sm" />
          <Button asChild size="sm" variant="outline">
            <Link to={titlePath}>View title</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

function EntryList({ items, watched, toggle }) {
  return (
    <ol className="space-y-3">
      {items.map((item, index) => {
        const key = entryKey(item.entry)
        return (
          <li key={key}>
            <RoadmapEntry
              item={item}
              index={index}
              watched={watched[key]}
              onToggle={() => toggle(key)}
            />
          </li>
        )
      })}
    </ol>
  )
}

export default function RoadmapDetailPage() {
  const { slug } = useParams()
  const roadmap = VERIFIED_ROADMAPS.find((entry) => entry.slug === slug)
  const { items, error, retry } = useRoadmapItems(roadmap)
  const { watched, toggle, reset } = useRoadmapWatched(slug)
  const [resetOpen, setResetOpen] = useState(false)
  const released = useMemo(() => releaseOrder(items ?? []), [items])
  const watchedCount = roadmap?.entries.filter((entry) => watched[entryKey(entry)]).length ?? 0
  const total = roadmap?.entries.length ?? 0
  const progress = total ? Math.round((watchedCount / total) * 100) : 0

  if (!roadmap) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-[900px] flex-col items-start justify-center gap-4 py-8">
        <h1 className="text-3xl font-bold">Roadmap not found.</h1>
        <Button asChild variant="outline"><Link to="/roadmaps">Back to roadmaps</Link></Button>
      </div>
    )
  }

  const breadcrumbItems = [
    { label: 'Home', to: '/' },
    { label: 'Roadmaps', to: '/roadmaps' },
    { label: roadmap.name },
  ]

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 py-4 sm:py-6">
      <SEO
        title={`${roadmap.name} Watch Order | WatchMeta`}
        description={roadmap.description}
        path={`/roadmaps/${roadmap.slug}`}
        jsonLd={breadcrumbJsonLd(breadcrumbItems)}
      />
      <PillBreadcrumb items={breadcrumbItems} />
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{roadmap.name}</h1>
          <p className="text-muted-foreground">{roadmap.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-md space-y-2">
            <p className="text-sm text-muted-foreground">{watchedCount} of {total} watched</p>
            <div
              role="progressbar"
              aria-label={`${roadmap.name} watch progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">Reset progress</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset your progress for {roadmap.name}?</AlertDialogTitle>
                <AlertDialogDescription>This clears the watched marks for this roadmap only.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reset}>Reset progress</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Tabs defaultValue="story" className="space-y-4">
        <TabsList aria-label="Roadmap order">
          <TabsTrigger value="story">Story order</TabsTrigger>
          <TabsTrigger value="release">Release order</TabsTrigger>
        </TabsList>
        <AdsterraBanner />
        {error ? (
          <RequestState error={error} onRetry={retry} />
        ) : items === null ? (
          <div className="space-y-3" role="status" aria-label="Loading roadmap titles">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <>
            <TabsContent value="story">
              <EntryList items={items} watched={watched} toggle={toggle} />
            </TabsContent>
            <TabsContent value="release">
              <EntryList items={released} watched={watched} toggle={toggle} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
