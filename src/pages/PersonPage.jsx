import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import Filmography from '@/components/person/Filmography.jsx'
import PersonHeader from '@/components/person/PersonHeader.jsx'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import RequestState from '@/components/common/RequestState.jsx'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import { normalizePerson, normalizePersonCredits, tmdbRequest } from '@/api/tmdb.js'
import { SEO, breadcrumbJsonLd } from '@/components/seo/SEO.jsx'

function PersonSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 pt-14 sm:flex-row">
        <Skeleton className="mx-auto aspect-[2/3] w-40 rounded-xl sm:mx-0 sm:w-48 lg:w-56" />
        <div className="flex-1 space-y-5">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-start justify-center gap-4">
      <h1 className="text-3xl font-bold">Person not found.</h1>
      <Button asChild variant="outline"><Link to="/">Back to Home</Link></Button>
    </div>
  )
}

export default function PersonPage() {
  const { id } = useParams()
  const loadPerson = useCallback(async (signal) => {
    const [personData, creditsData] = await Promise.all([
      tmdbRequest(`/person/${id}`, {}, { signal }),
      tmdbRequest(`/person/${id}/combined_credits`, {}, { signal }),
    ])
    const credits = normalizePersonCredits(creditsData)
    return { ...normalizePerson(personData), ...credits }
  }, [id])
  const { data: person, loading, error, retry } = useTMDBQuery(loadPerson)

  if (loading) return <PersonSkeleton />
  if (error && !person) {
    return <div className="mx-auto max-w-[1100px] px-4 py-8"><RequestState error={error} onRetry={retry} /></div>
  }
  if (error?.includes('Not found.')) return <NotFound />
  if (!person) return <NotFound />

  return (
    <div className="-mx-4 -mt-[max(1rem,env(safe-area-inset-top))] space-y-8 pb-8 sm:-mx-6 lg:mx-0 lg:space-y-12">
      <SEO
        title={`${person.name} | WatchMeta`}
        description={`Explore ${person.name}'s biography and filmography on WatchMeta.`}
        path={`/person/${person.id}`}
        image={person.profilePath}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: person.name,
            image: person.profilePath,
            description: person.biography,
          },
          breadcrumbJsonLd([
            { label: 'Home', to: '/' },
            { label: 'People', to: '/search?tab=people' },
            { label: person.name },
          ]),
        ]}
      />
      {error && <div className="mx-auto max-w-[1100px] px-4"><RequestState error={error} onRetry={retry} /></div>}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-0">
        <PersonHeader person={person} />
      </div>
      <div className="mx-auto max-w-[1100px] space-y-8 px-4 sm:px-6 lg:space-y-12 lg:px-0">
        <Filmography credits={person.credits} />
      </div>
    </div>
  )
}
