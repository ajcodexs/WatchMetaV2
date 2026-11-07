import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { logoUrl } from '@/api/tmdbImages.js'
import { fetchStreamingServices } from '@/api/tmdb.js'
import { Button } from '@/components/ui/button'
import RequestState from '@/components/common/RequestState.jsx'
import useDragScroll from '@/hooks/useDragScroll'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'

export default function StreamingServices() {
  const dragScroll = useDragScroll()
  const loadServices = useCallback((signal) => fetchStreamingServices(signal), [])
  const { data: services = [], loading, error, retry } = useTMDBQuery(loadServices)

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold sm:text-2xl">Watch on your service</h2>
      <RequestState error={error} onRetry={retry} />
      <div
        {...dragScroll}
        role="region"
        aria-label="Streaming services"
        className={`${dragScroll.className} flex gap-3 overflow-x-auto pb-2 sm:flex-wrap`}
      >
        {loading
          ? Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-12 w-36 shrink-0 animate-pulse rounded-xl bg-muted" />
          ))
          : (services ?? []).map((service) => (
            <Button
              key={service.name}
              asChild
              variant="outline"
              className="h-12 shrink-0 justify-start gap-3 rounded-xl px-4"
            >
              <Link to={`/service/${service.providerId}`} aria-label={`${service.name} titles`}>
                <img src={logoUrl(service.logoPath)} alt="" className="max-h-7 max-w-16 object-contain" loading="lazy" />
                {service.name}
              </Link>
            </Button>
          ))}
      </div>
    </section>
  )
}
