const formatCurrency = (amount) => amount === 0
  ? 'Not available'
  : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)

function InfoPair({ label, value }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,0.8fr)_1.2fr] gap-3 border-b border-border/70 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{value}</dd>
    </div>
  )
}

export default function MovieInfo({ item, type }) {
  const entries = [
    ['Status', item.status],
    ['Original title', item.originalTitle],
    ['Original language', item.originalLanguage],
    ['Production companies', item.productionCompanies.join(', ')],
    ['Countries', item.countries.join(', ')],
    ['Release date', item.releaseDate],
    ['Budget', formatCurrency(item.budget)],
    ['Revenue', formatCurrency(item.revenue)],
  ]
  if (type === 'tv') {
    entries.splice(1, 0, ['Number of seasons', item.seasonCount], ['Number of episodes', item.episodeCount])
    entries.splice(4, 0, ['Networks', item.networks.join(', ')], ['Creators', item.creators.join(', ')])
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold sm:text-2xl">More info</h2>
      <dl className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
        {entries.map(([label, value]) => <InfoPair key={label} label={label} value={value} />)}
      </dl>
    </section>
  )
}
