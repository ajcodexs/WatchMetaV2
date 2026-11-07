import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLibrary } from '@/context/LibraryContext.jsx'

export default function WatchlistButton({ item, size = 'sm', variant = 'overlay', className = '', tabIndex }) {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useLibrary()
  const savedItem = watchlist.find((entry) =>
    String(entry.id) === String(item.id) && entry.type === (item.type ?? 'movie'))
  const isSaved = Boolean(savedItem)
  const mediaType = item.type ?? 'movie'
  const label = isSaved ? 'Remove from watchlist' : 'Add to watchlist'

  function toggleWatchlist(event) {
    event.preventDefault()
    event.stopPropagation()

    if (isSaved) {
      removeFromWatchlist(savedItem.id, savedItem.type)
      toast.success('Removed from watchlist', {
        action: {
          label: 'Undo',
          onClick: () => addToWatchlist(savedItem),
        },
      })
      return
    }

    addToWatchlist({ ...item, type: mediaType })
    toast.success('Added to watchlist', {
      action: {
        label: 'Undo',
        onClick: () => removeFromWatchlist(item.id, mediaType),
      },
    })
  }

  return (
    <Button
      type="button"
      variant={variant === 'overlay' ? 'ghost' : 'outline'}
      size={variant === 'overlay' ? 'icon' : size === 'md' ? 'default' : 'sm'}
      aria-label={label}
      aria-pressed={isSaved}
      tabIndex={tabIndex}
      onClick={toggleWatchlist}
      className={variant === 'overlay'
        ? `watchlist-overlay absolute right-2 top-2 z-20 size-9 rounded-full bg-background/80 p-0 text-foreground shadow-sm backdrop-blur-sm hover:bg-background ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100'} ${className}`
        : `gap-2 ${className}`}
    >
      <Bookmark aria-hidden="true" className={`size-4 ${isSaved ? 'fill-current' : ''}`} />
      {variant === 'inline' && label}
    </Button>
  )
}
