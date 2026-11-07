import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'

function InfoItem({ label, value }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{Array.isArray(value) ? value.join(', ') : value}</dd>
    </div>
  )
}

export default function PersonHeader({ person }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <section className="relative space-y-6 pt-14">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute right-0 top-[calc(env(safe-area-inset-top)+1rem)] z-10 gap-1.5 lg:top-4"
        onClick={() => navigate(location.key === 'default' ? '/' : -1)}
      >
        <ArrowLeft aria-hidden="true" />
        Back
      </Button>
      <div className="absolute left-0 top-[calc(env(safe-area-inset-top)+1rem)] z-10 max-w-[calc(100%-6rem)] lg:top-4">
        <PillBreadcrumb items={[
          { label: 'Home', to: '/' },
          { label: 'People', to: '/search?tab=people' },
          { label: person.name },
        ]} />
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <img
          src={person.profilePath}
          srcSet={person.profileSrcSet}
          sizes="(min-width: 1024px) 224px, (min-width: 640px) 192px, 160px"
          alt={`${person.name} portrait`}
          loading="lazy"
          className="mx-auto aspect-[2/3] w-40 shrink-0 rounded-xl object-cover sm:mx-0 sm:w-48 lg:w-56"
        />
        <div className="min-w-0 flex-1 space-y-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{person.name}</h1>
            {person.knownFor?.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Known for: <span className="text-foreground">{person.knownFor.join(', ')}</span>
              </p>
            )}
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <InfoItem label="Birthday" value={person.birthday} />
            <InfoItem label="Place of birth" value={person.placeOfBirth} />
            <InfoItem label="Also known as" value={person.alsoKnownAs} />
            <InfoItem label="Department" value={person.department} />
          </dl>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Biography</h2>
            <p className={`text-sm leading-6 text-muted-foreground ${expanded ? '' : 'line-clamp-6'}`}>
              {person.biography || 'No biography available.'}
            </p>
            {person.biography && person.biography.length > 0 && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-foreground"
                aria-expanded={expanded}
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? 'Read less' : 'Read more'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
