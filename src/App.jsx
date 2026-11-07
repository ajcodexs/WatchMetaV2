import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import DevGuard from '@/components/security/DevGuard.jsx'
import { SEO } from '@/components/seo/SEO.jsx'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchStreamingServices } from '@/api/tmdb.js'
import useTMDBQuery from '@/hooks/useTMDBQuery.js'
import RequestState from '@/components/common/RequestState.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import BrowseLayout from './pages/BrowseLayout.jsx'
import SearchPage from './pages/SearchPage.jsx'
import StaticPage, { NotFoundPage } from './pages/StaticPage.jsx'

const PersonPage = lazy(() => import('./pages/PersonPage.jsx'))
const LibraryPage = lazy(() => import('./pages/LibraryPage.jsx'))
const DetailsPage = lazy(() => import('./pages/DetailsPage.jsx'))
const WatchPage = lazy(() => import('./pages/WatchPage.jsx'))

function LoadingPage({ children }) {
  return (
    <Suspense fallback={<Card className="my-6 rounded-xl border-border bg-card p-6 shadow-none">Loading {children}...</Card>}>
      {children === 'library' ? <LibraryPage />
        : children === 'person' ? <PersonPage />
          : children === 'movie' ? <DetailsPage type="movie" />
            : children === 'tv' ? <DetailsPage type="tv" />
              : <WatchPage />}
    </Suspense>
  )
}

function ServicePage() {
  const { providerId } = useParams()
  const [type, setType] = useState('movie')
  const loadServices = useCallback((signal) => fetchStreamingServices(signal), [])
  const { data: services = [], loading, error, retry } = useTMDBQuery(loadServices)
  const service = useMemo(() => (services ?? []).find((entry) =>
    String(entry.providerId) === providerId ||
    String(entry.movieProviderId) === providerId ||
    String(entry.tvProviderId) === providerId), [providerId, services])
  const serviceName = service?.name ?? 'Streaming service'
  return (
    <section className="space-y-4 py-6">
      <SEO title={`${serviceName} | WatchMeta`} description={`Explore titles associated with ${serviceName}.`} path={`/service/${providerId}`} />
      {error ? <RequestState error={error} onRetry={retry} /> : loading ? (
        <p role="status" className="text-sm text-muted-foreground">Loading streaming services…</p>
      ) : !service ? (
        <div className="space-y-4">
          <PillBreadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Streaming' }]} />
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            This streaming service is not available in your region.
          </p>
        </div>
      ) : (
        <>
          <Tabs value={type} onValueChange={setType}>
            <TabsList aria-label={`${serviceName} title type`}>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV shows</TabsTrigger>
            </TabsList>
          </Tabs>
          <BrowseLayout
            key={`${service.providerId}-${type}`}
            type={type}
            providerId={type === 'movie' ? service.movieProviderId ?? service.providerId : service.tvProviderId ?? service.providerId}
            serviceName={serviceName}
          />
        </>
      )}
    </section>
  )
}

export default function App() {
  return (
    <>
      <DevGuard />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<LoadingPage>library</LoadingPage>} />
          <Route path="/movies" element={<BrowseLayout type="movie" />} />
          <Route path="/tv" element={<BrowseLayout type="tv" />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<LoadingPage>movie</LoadingPage>} />
          <Route path="/tv/:id" element={<LoadingPage>tv</LoadingPage>} />
          <Route path="/person/:id" element={<LoadingPage>person</LoadingPage>} />
          <Route path="/watch/:type/:id/:season?/:episode?" element={<LoadingPage>player</LoadingPage>} />
          <Route path="/service/:providerId" element={<ServicePage />} />
          <Route path="/about" element={<StaticPage page="about" />} />
          <Route path="/terms" element={<StaticPage page="terms" />} />
          <Route path="/privacy" element={<StaticPage page="privacy" />} />
          <Route path="/contact" element={<StaticPage page="contact" />} />
          <Route path="/credits" element={<StaticPage page="credits" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  )
}
