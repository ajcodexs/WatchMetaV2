import { ChevronRight, House } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PillBreadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-[13px] text-muted-foreground backdrop-blur-sm">
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />}
              {current ? (
                <span aria-current="page" className="max-w-[min(240px,45vw)] truncate font-medium text-foreground">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link
                  to={item.to}
                  aria-label={index === 0 ? 'Home' : undefined}
                  className="max-w-[min(240px,45vw)] truncate text-muted-foreground no-underline hover:text-foreground"
                >
                  {index === 0
                    ? <House aria-hidden="true" className="size-4" />
                    : item.label}
                </Link>
              ) : (
                <span className="max-w-[min(240px,45vw)] truncate text-muted-foreground">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
