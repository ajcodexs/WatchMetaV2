import { useState } from 'react'
import { Link } from 'react-router-dom'
import PillBreadcrumb from '@/components/common/PillBreadcrumb.jsx'
import { SEO, breadcrumbJsonLd } from '@/components/seo/SEO.jsx'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AdsterraBanner from '@/components/ads/AdsterraBanner.jsx';


const staticPages = {
  about: {
    title: 'About WatchMeta',
    description: 'Learn about WatchMeta, a movie and TV discovery experience developed by AJCODER.',
    paragraphs: [
      'WatchMeta helps you discover movies and TV shows, explore cast and crew details, and find information about where titles are available.',
      'WatchMeta is developed by AJCODER. Catalog details and images are supplied by third-party data services.',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    description: 'Terms for using WatchMeta and information about third-party content services.',
    paragraphs: [
      'Use WatchMeta lawfully and at your own discretion. Information is provided for discovery and informational purposes and may change or be incomplete.',
      'WatchMeta does not host movie or television files. Any playback or availability is provided by third-party services, which have their own terms and policies.',
      'For copyright or DMCA concerns, contact: [DMCA contact email].',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How WatchMeta handles local preferences and catalog data.',
    paragraphs: [
      'WatchMeta does not require an account. Your theme, watchlist, and viewing progress are stored in your browser’s localStorage and remain on that device.',
      'Catalog information is supplied by TMDB. WatchMeta does not operate the TMDB service. For privacy questions, contact contact@watchmeta.site.',
    ],
  },
  credits: {
    title: 'Credits',
    description: 'Credits for WatchMeta and the open-source libraries used to build it.',
    paragraphs: [
      'Developed by AJCODER.',
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
      'Built with React, React Router, Vite, Tailwind CSS, Radix UI, Lucide, Embla Carousel, and Sonner.',
    ],
  },
}

export default function StaticPage({ page }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [error, setError] = useState('')
  const isContact = page === 'contact'
  const content = staticPages[page]
  const title = isContact ? 'Contact WatchMeta' : content.title
  const description = isContact
    ? 'Contact the WatchMeta team.'
    : content.description
  const route = `/${page}`
  const breadcrumbItems = [{ label: 'Home', to: '/' }, { label: isContact ? 'Contact' : content.title }]

  function submitContact(event) {
    event.preventDefault()
    const subject = encodeURIComponent(`WatchMeta contact from ${form.name}`)
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    const mailto = `mailto:contact@watchmeta.site?subject=${subject}&body=${body}`
    if (!mailto.startsWith('mailto:')) {
      setError('Could not prepare your email. Please try again.')
      return
    }
    setError('')
    window.location.href = mailto
  }

  return (
    <div className="space-y-6 py-6">
      <SEO
        title={`${title} | WatchMeta`}
        description={description}
        path={route}
        jsonLd={breadcrumbJsonLd(breadcrumbItems)}
      />
      <PillBreadcrumb items={breadcrumbItems} />
      <Card className="mx-auto max-w-3xl space-y-5 rounded-xl border-border bg-card p-6 shadow-none sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {isContact ? (
          <form onSubmit={submitContact} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              Name
              <input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Email
              <input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              Message
              <textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
            </label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Open email app</Button>
          </form>
        ) : (
          <>
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-7 text-muted-foreground">{paragraph}</p>
            ))}
            {page === 'credits' && (
              <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" className="inline-flex items-center">
                <img
                  src="https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg"
                  alt="TMDB"
                  className="h-8 w-auto"
                />
              </a>
            )}
          </>
        )}
        <Button asChild variant="outline"><Link to="/">Back to Home</Link></Button>
      </Card>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="grid min-h-[50vh] place-items-center py-10">
      <SEO title="Page Not Found | WatchMeta" description="The page you requested could not be found." path="/404" />
      <Card className="space-y-4 rounded-xl border-border bg-card p-8 text-center shadow-none">
        <h1 className="text-3xl font-bold">We couldn’t find that page</h1>
        <p className="text-muted-foreground">The page may have moved or the address may be incorrect.</p>
        <Button asChild><Link to="/">Go to Home</Link></Button>
      </Card>
    </div>
  )
}
