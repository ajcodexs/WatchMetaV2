import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { promoGroups } from '@/data/promos.js'
import useDragScroll from '@/hooks/useDragScroll.js'

function getNameColor(name) {
  let hash = 0
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0
  }
  return `hsl(${Math.abs(hash) % 360} 45% 32%)`
}

function PromoCard({ item, groupId }) {
  const [imageFailed, setImageFailed] = useState(false)
  const [firstLetter] = item.name.trim()
  const color = getNameColor(item.name)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'promo_click', { site: item.name, group: groupId })
        }
      }}
      className="group flex min-w-0 w-[min(20rem,calc(100vw-2rem))] shrink-0 snap-start gap-3 rounded-2xl border border-border bg-card p-3 text-card-foreground transition-colors hover:border-foreground/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {item.image && !imageFailed ? (
        <img
          src={item.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-[120px] w-20 shrink-0 rounded-xl object-cover"
        />
      ) : null}
      {(!item.image || imageFailed) && (
        <div
          aria-hidden="true"
          className="grid h-[120px] w-20 shrink-0 place-items-center rounded-xl text-3xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {firstLetter?.toUpperCase() ?? '?'}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 font-semibold leading-snug">{item.name}</h3>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {item.badge && (
            <span className="max-w-[9rem] truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {item.badge}
            </span>
          )}
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Visit <ArrowUpRight aria-hidden="true" className="size-4" />
          </span>
        </div>
      </div>
    </a>
  )
}

export default function PromoSection() {
  const dragScroll = useDragScroll()

  return (
    <div className="min-w-0 space-y-8">
      {promoGroups.map((group) => {
        const items = group.items.filter((item) => item.enabled !== false)
        if (items.length === 0) return null

        return (
          <section key={group.id} className="min-w-0 space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold sm:text-2xl">{group.title}</h2>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                Promoted
              </span>
            </div>
            <div
              {...dragScroll}
              aria-label={group.title}
              className={`${dragScroll.className} flex min-w-0 snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
            >
              {items.map((item, index) => (
                <PromoCard key={`${group.id}-${index}`} item={item} groupId={group.id} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
