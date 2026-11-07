import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import ThemeToggle from '@/components/layout/ThemeToggle.jsx'
import ContinueWatchingCard from '@/components/library/ContinueWatchingCard.jsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLibrary } from '@/context/LibraryContext.jsx'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import WatchlistButton from '@/components/common/WatchlistButton.jsx'
import { SEO } from '@/components/seo/SEO.jsx'

function WatchlistCard({ item }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <Link to={`/${item.type}/${item.id}`} className="relative block aspect-[2/3] overflow-hidden bg-muted">
        <img src={item.posterPath} alt={`${item.title} poster`} loading="lazy" className="size-full object-cover" />
        <Badge className="absolute left-2 top-2">{item.type === 'movie' ? 'Movie' : 'TV'}</Badge>
      </Link>
      <div className="space-y-2 p-3">
        <Link to={`/${item.type}/${item.id}`} className="block truncate font-semibold hover:underline">
          {item.title}
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link to={item.type === 'tv' ? `/watch/tv/${item.id}/1/1` : `/watch/movie/${item.id}`}>
              <Play aria-hidden="true" className="size-3.5 fill-current" />Play
            </Link>
          </Button>
          <WatchlistButton item={item} variant="inline" size="sm" />
        </div>
      </div>
    </article>
  )
}

export default function LibraryPage() {
  const {
    watchlist,
    continueWatching,
    clearWatchlist,
    removeProgress,
    clearContinueWatching,
  } = useLibrary()
  const [sort, setSort] = useState('newest')
  const [confirmation, setConfirmation] = useState(null)

  const sortedWatchlist = sort === 'title'
    ? [...watchlist].sort((left, right) => left.title.localeCompare(right.title))
    : watchlist
  const confirmTitle = confirmation?.kind === 'watchlist'
    ? 'Remove all items from your watchlist?'
    : confirmation?.item
      ? `Remove ${confirmation.item.title} from Continue watching?`
      : 'Remove all items from Continue watching?'

  function confirmRemoval() {
    if (!confirmation) return
    if (confirmation.kind === 'watchlist') {
      clearWatchlist()
    } else if (confirmation.item) {
      removeProgress(confirmation.item.id, confirmation.item.type)
    } else {
      clearContinueWatching()
    }
    setConfirmation(null)
  }

  return (
    <section className="space-y-6 pt-2">
      <SEO title="Your Library | WatchMeta" description="Your WatchMeta watchlist and continue-watching library." path="/library" />
      <PillBreadcrumb items={[
        { label: 'Home', to: '/' },
        { label: 'Library' },
      ]} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Library</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      <p className="-mt-3 text-sm text-muted-foreground">Your library is saved in this browser only.</p>

      <Tabs defaultValue="continue" className="space-y-5">
        <TabsList aria-label="Library sections" className="h-auto w-full justify-start">
          <TabsTrigger value="continue" className="flex-none px-3">Continue watching</TabsTrigger>
          <TabsTrigger value="watchlist" className="flex-none px-3">Watchlist</TabsTrigger>
        </TabsList>
        <TabsContent value="continue" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Continue watching</h2>
            {continueWatching.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmation({ kind: 'progress' })}>
                Remove all
              </Button>
            )}
          </div>
          {continueWatching.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {continueWatching.map((item) => (
                <ContinueWatchingCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRemove={(entry) => setConfirmation({ kind: 'progress', item: entry })}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nothing in progress. Start watching something and it will show up here.
            </p>
          )}
        </TabsContent>
        <TabsContent value="watchlist" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Watchlist</h2>
            <div className="flex items-center gap-2">
              {watchlist.length > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmation({ kind: 'watchlist' })}>
                  Remove all
                </Button>
              )}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger aria-label="Sort watchlist" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest added</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {sortedWatchlist.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedWatchlist.map((item) => (
                <WatchlistCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Your watchlist is empty. Add titles from their details page.
            </p>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(confirmation)} onOpenChange={(open) => !open && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmation(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemoval}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
