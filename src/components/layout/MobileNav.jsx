import { Bookmark, Clapperboard, Home, Search, Tv } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Movie', to: '/movies', icon: Clapperboard },
  { label: 'TV', to: '/tv', icon: Tv },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Library', to: '/library', icon: Bookmark },
]

export default function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 flex min-h-16 items-stretch justify-around border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {navigation.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors ${
              isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
            }`
          }
        >
          <Icon aria-hidden="true" className="size-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
