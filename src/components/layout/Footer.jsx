import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'
import Logo from './Logo.jsx'

const footerLinks = [
  { label: 'About', to: '/about' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  // { label: 'Contact', to: '/contact' },
  { label: 'Credits', to: '/credits' },
]

export default function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 text-sm text-muted-foreground lg:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <Logo variant="icon" />
            <p>© 2026 WatchMeta.</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map(({ label, to }) => (
              <Link key={to} to={to} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <img
              src="https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg"
              alt="TMDB"
              className="h-4 w-auto"
            />
            <span>Data provided by TMDB</span>
          </a>
        </div>
        <Separator />
        <p className="text-xs">
          This site does not host any files. Streams are provided by third-party services.
        </p>
      </div>
    </footer>
  )
}
