import { Bookmark, Clapperboard, Home, Search, Tv } from 'lucide-react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Logo from './Logo.jsx'

const navigation = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Movie', to: '/movies', icon: Clapperboard },
  { label: 'TV', to: '/tv', icon: Tv },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Library', to: '/library', icon: Bookmark },
]

function SidebarFilterSlot() {
  return <div id="sidebar-filter-slot" className="sidebar-filter-scroll min-h-0 flex-1 overflow-y-auto" />
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const showFilterSeparator = pathname === '/movies' || pathname === '/tv' ||
    (pathname === '/search' && searchParams.get('tab') !== 'people')

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background px-5 py-6 lg:flex">
      <Logo variant="full" className="mb-10" />
      <nav aria-label="Main navigation" className="flex flex-col gap-1">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <Button
            key={to}
            asChild
            variant="ghost"
            className="h-11 justify-start gap-3 px-3 text-muted-foreground [&[aria-current=page]]:bg-primary/10 [&[aria-current=page]]:text-primary"
          >
            <NavLink to={to} end={end}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </Button>
        ))}
      </nav>
      {showFilterSeparator && <Separator className="my-4" />}
      <SidebarFilterSlot />
    </aside>
  )
}
