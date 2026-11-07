import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = `${isDark ? 'Light' : 'Dark'} mode`

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="gap-2"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span>{label}</span>
    </Button>
  )
}
