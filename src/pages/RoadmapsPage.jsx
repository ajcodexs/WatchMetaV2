import { Link } from 'react-router-dom'
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/components/seo/SEO.jsx'
import useRoadmapWatched from '@/hooks/useRoadmapWatched.js'
import { VERIFIED_ROADMAPS } from '@/lib/roadmaps.js'

function RoadmapSummary({ roadmap }) {
  const { watched } = useRoadmapWatched(roadmap.slug)
  const watchedCount = roadmap.entries.filter((entry) => watched[`${entry.type}-${entry.tmdbId}`]).length

  return (
    <Link to={`/roadmaps/${roadmap.slug}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{roadmap.name}</CardTitle>
          <p className="line-clamp-2 text-sm text-muted-foreground">{roadmap.description}</p>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">{roadmap.entries.length} titles</p>
          <p className="text-xs text-muted-foreground">Watched {watchedCount} of {roadmap.entries.length}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function RoadmapsPage() {
  return (
    <div className="space-y-6 py-4 sm:py-6">
      <SEO title="Roadmaps | WatchMeta" description="Watch franchises in story order or release order." path="/roadmaps" />
      <PillBreadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Roadmaps' }]} />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Roadmaps</h1>
        <p className="text-muted-foreground">Watch franchises in story order, or in release order.</p>
      </header>
      <AdsterraBanner />
      {VERIFIED_ROADMAPS.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VERIFIED_ROADMAPS.map((roadmap) => <RoadmapSummary key={roadmap.slug} roadmap={roadmap} />)}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No roadmaps yet. Check back soon.
        </p>
      )}
    </div>
  )
}
