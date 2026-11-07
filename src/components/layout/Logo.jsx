import { Link } from 'react-router-dom'

export default function Logo({ variant = 'icon', className = '' }) {
  const isFull = variant === 'full'

  return (
    <Link
      to="/"
      aria-label="WatchMeta home"
      className={`inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <img
        src="/watchmeta2.png"
        alt=""
        aria-hidden="true"
        className="size-10 shrink-0 rounded-xl object-cover"
      />
      {isFull && <span className="text-sm font-bold tracking-[0.16em]">WATCHMETA</span>}
    </Link>
  )
}
