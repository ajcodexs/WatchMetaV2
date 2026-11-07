import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useDragScroll from '@/hooks/useDragScroll'

function CastCard({ person }) {
  return (
    <Link to={`/person/${person.id}`} className="w-24 shrink-0 text-center sm:w-28">
      <Avatar className="mx-auto size-20 sm:size-24">
        <AvatarImage src={person.profilePath} alt={person.name} />
        <AvatarFallback>{person.name.split(' ').map((part) => part[0]).join('')}</AvatarFallback>
      </Avatar>
      <p className="mt-2 truncate text-sm font-medium">{person.name}</p>
      <p className="truncate text-xs text-muted-foreground">{person.character}</p>
    </Link>
  )
}

export default function CastSection({ cast, director, writer }) {
  const [expanded, setExpanded] = useState(false)
  const dragScroll = useDragScroll()

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold sm:text-2xl">Cast</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Show less' : 'View all'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Director: {director.id ? <Link className="text-foreground hover:underline" to={`/person/${director.id}`}>{director.name}</Link> : director.name}
        <span className="px-2">·</span>
        Writer: {writer.id ? <Link className="text-foreground hover:underline" to={`/person/${writer.id}`}>{writer.name}</Link> : writer.name}
      </p>
      {expanded ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cast.map((person) => <CastCard key={person.id} person={person} />)}
        </div>
      ) : (
        <div
          {...dragScroll}
          aria-label="Cast"
          className={`${dragScroll.className} flex gap-4 overflow-x-auto pb-2`}
        >
          {cast.slice(0, 12).map((person) => <CastCard key={person.id} person={person} />)}
        </div>
      )}
    </section>
  )
}
