import { Badge } from '@/components/ui/badge'
import { DEFAULT_REGION } from '@/api/tmdb.js'
import { logoUrl } from '@/api/tmdbImages.js'

export default function WhereToWatch({ providers }) {
  const groups = [
    ['Stream', providers?.Stream ?? []],
    ['Rent', providers?.Rent ?? []],
    ['Buy', providers?.Buy ?? []],
  ]
  const hasProviders = groups.some(([, entries]) => entries.length > 0)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold sm:text-2xl">Where to watch</h2>
        <p className="text-sm text-muted-foreground">Region: {DEFAULT_REGION}</p>
      </div>
      {hasProviders ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {groups.map(([group, entries]) => (
            <div key={group} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{group}</h3>
              <div className="flex flex-wrap gap-2">
                {entries.map((provider) => (
                  <a
                    key={provider.provider_id}
                    href={providers.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Watch on ${provider.provider_name}`}
                    className="inline-flex items-center gap-2"
                  >
                    <Badge variant="secondary" className="gap-2">
                      <img src={logoUrl(provider.logo_path)} alt="" className="size-5 rounded object-cover" loading="lazy" />
                      {provider.provider_name}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not available in your region yet.</p>
      )}
    </section>
  )
}
