import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useDebounce from '@/hooks/useDebounce'
import { readStorage, writeStorage } from '@/lib/storage.js'

const HISTORY_KEY = 'wm_search_history'
const HISTORY_LIMIT = 10

function readHistory() {
  return readStorage(HISTORY_KEY, [], (value) =>
    Array.isArray(value) && value.every((item) => typeof item === 'string'))
    .slice(0, HISTORY_LIMIT)
}

function writeHistory(history) {
  writeStorage(HISTORY_KEY, history)
}

export default function SearchBar({ query, onSearch }) {
  const [inputValue, setInputValue] = useState(query)
  const [focused, setFocused] = useState(false)
  const [history, setHistory] = useState(readHistory)
  const lastSearchRef = useRef(query)
  const onSearchRef = useRef(onSearch)
  const debouncedValue = useDebounce(inputValue, 400)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    writeHistory(history)
  }, [history])

  useEffect(() => {
    setInputValue(query)
    lastSearchRef.current = query
  }, [query])

  useEffect(() => {
    const normalized = debouncedValue.trim()
    if (normalized === lastSearchRef.current) return
    lastSearchRef.current = normalized
    onSearchRef.current(normalized)
  }, [debouncedValue])

  useEffect(() => {
    const normalized = query.trim()
    if (!normalized) return
    setHistory((current) => {
      const next = [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())]
        .slice(0, HISTORY_LIMIT)
      return next
    })
  }, [query])

  function commitSearch(value = inputValue) {
    const normalized = value.trim()
    setInputValue(normalized)
    lastSearchRef.current = normalized
    onSearch(normalized)
  }

  function removeSearch(event, value) {
    event.stopPropagation()
    const next = history.filter((item) => item !== value)
    setHistory(next)
  }

  function clearHistory() {
    setHistory([])
  }

  return (
    <div className="relative">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          commitSearch(String(formData.get('q') ?? ''))
        }}
        className="relative"
      >
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          value={inputValue}
          placeholder="Search movies, TV shows, or people"
          aria-label="Search movies, TV shows, or people"
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitSearch(event.currentTarget.value)
            }
          }}
          className="h-12 rounded-xl pl-12 pr-12 text-base"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              commitSearch('')
            }}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </form>
      {focused && !inputValue.trim() && (
        <p className="mt-2 px-1 text-sm text-muted-foreground">
          Type a title, a genre, or a person's name.
        </p>
      )}
      {focused && !inputValue.trim() && history.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Recent searches</div>
          {history.map((item) => (
            <div key={item} className="flex items-center">
              <button
                type="button"
                className="min-w-0 flex-1 truncate rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitSearch(item)}
              >
                {item}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${item} from recent searches`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => removeSearch(event, item)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 w-full"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearHistory}
          >
            Clear history
          </Button>
        </div>
      )}
    </div>
  )
}
