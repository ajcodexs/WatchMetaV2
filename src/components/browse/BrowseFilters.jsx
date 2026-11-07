import { useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { COUNTRIES, GENRES, LANGUAGES } from '@/api/tmdb.js'

const SORT_OPTIONS = [
  ['popularity', 'Popularity'],
  ['rating', 'Rating'],
  ['release_date', 'Release date'],
  ['title_asc', 'Title (A-Z)'],
  ['title_desc', 'Title (Z-A)'],
]

const splitParam = (value) => value?.split(',').filter(Boolean) ?? []

function FilterGroup({ title, children, defaultOpen = false }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group border-b border-border py-3 last:border-0">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-left text-sm font-semibold">
        {title}
        <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-4">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function ChoiceList({ label, options, values, onChange }) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value
        const text = typeof option === 'string' ? option : option.label
        return (
        <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={values.includes(value)}
            onCheckedChange={(checked) => {
              const nextValues = checked
                ? [...values, value]
                : values.filter((entry) => entry !== value)
              onChange(nextValues)
            }}
          />
          <span>{text}</span>
        </label>
        )
      })}
    </fieldset>
  )
}

function RangeControl({ label, value, min, max, onChange, format = (number) => number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{format(value[0])}</span>
        <span>{format(value[1])}</span>
      </div>
      <Slider
        aria-label={label}
        value={value}
        min={min}
        max={max}
        step={1}
        onValueChange={onChange}
      />
    </div>
  )
}

export default function BrowseFilters({
  type,
  searchParams,
  updateParam,
  clearAll,
  onClose,
  activeCount,
  titleOverride,
  serviceOptions = [],
  hideServiceFilter = false,
}) {
  const year = useMemo(() => {
    const [from, to] = splitParam(searchParams.get('year'))
    return [Number(from) || 1900, Number(to) || new Date().getFullYear()]
  }, [searchParams])
  const runtime = useMemo(() => {
    const [from, to] = splitParam(searchParams.get('runtime'))
    return [Number(from) || 0, Number(to) || 300]
  }, [searchParams])
  const genres = splitParam(searchParams.get('genre'))
  const services = splitParam(searchParams.get('service'))
  const title = type === 'movie' ? 'Movies' : 'TV shows'
  const ageRatings = type === 'movie'
    ? ['G', 'PG', 'PG-13', 'R', 'NC-17']
    : ['TV-Y', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA']
  const genreOptions = GENRES[type]

  const setRange = (key, values, defaults) =>
    updateParam(key, values[0] === defaults[0] && values[1] === defaults[1] ? '' : values.join(','))

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">{titleOverride ?? `${title} filters`}</div>
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
      </div>
      <p className="pb-1 text-xs text-muted-foreground">{activeCount} active {activeCount === 1 ? 'filter' : 'filters'}</p>
      <FilterGroup title="Sort by" defaultOpen>
        <Select value={searchParams.get('sort') ?? 'popularity'} onValueChange={(value) => updateParam('sort', value === 'popularity' ? '' : value)}>
          <SelectTrigger aria-label="Sort by" className="w-full">
            <SelectValue placeholder="Popularity" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Genre" defaultOpen>
        <ChoiceList
          label="Genre"
          options={genreOptions}
          values={genres}
          onChange={(values) => updateParam('genre', values.join(','))}
        />
      </FilterGroup>
      <FilterGroup title="Year released">
        <RangeControl
          label="Year released"
          value={year}
          min={1900}
          max={new Date().getFullYear()}
          onChange={(values) => setRange('year', values, [1900, new Date().getFullYear()])}
        />
      </FilterGroup>
      {type === 'movie' && <FilterGroup title="Runtime">
        <RangeControl
          label="Runtime"
          value={runtime}
          min={0}
          max={300}
          format={(value) => `${value} min`}
          onChange={(values) => setRange('runtime', values, [0, 300])}
        />
      </FilterGroup>}
      {!hideServiceFilter && (
        <FilterGroup title="Streaming service">
          <ChoiceList label="Streaming service" options={serviceOptions} values={services} onChange={(values) => updateParam('service', values.join(','))} />
        </FilterGroup>
      )}
      <FilterGroup title="Language">
        <Select value={searchParams.get('language') ?? 'all'} onValueChange={(value) => updateParam('language', value === 'all' ? '' : value)}>
          <SelectTrigger aria-label="Language" className="w-full"><SelectValue placeholder="All languages" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All languages</SelectItem>{LANGUAGES.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Country">
        <Select value={searchParams.get('country') ?? 'all'} onValueChange={(value) => updateParam('country', value === 'all' ? '' : value)}>
          <SelectTrigger aria-label="Country" className="w-full"><SelectValue placeholder="All countries" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All countries</SelectItem>{COUNTRIES.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Age rating">
        <Select value={searchParams.get('age') ?? 'all'} onValueChange={(value) => updateParam('age', value === 'all' ? '' : value)}>
          <SelectTrigger aria-label="Age rating" className="w-full"><SelectValue placeholder="All ratings" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All ratings</SelectItem>{ageRatings.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup title="Keywords">
        <Input
          aria-label="Keywords"
          value={searchParams.get('keyword') ?? ''}
          placeholder="Search titles"
          onChange={(event) => updateParam('keyword', event.target.value)}
        />
      </FilterGroup>
      {onClose && <Button type="button" className="mt-4 w-full" onClick={onClose}>Show results</Button>}
    </div>
  )
}
