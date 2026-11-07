// DevGuard is a deterrent only. Anyone can still view source, use the network tab, or disable JavaScript. Do not rely on it for real security. Do not block accessibility features.
import { useEffect, useState } from 'react'
import { DEV_GUARD } from '@/config/siteConfig.js'

const blockedShortcuts = new Set(['i', 'j', 'c'])

export default function DevGuard() {
  const [devToolsNotice, setDevToolsNotice] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD) return undefined

    const preventContextMenu = (event) => {
      if (DEV_GUARD.blockContextMenu) event.preventDefault()
    }
    const preventShortcuts = (event) => {
      if (!DEV_GUARD.blockShortcuts) return
      const key = event.key.toLowerCase()
      const blocked = key === 'f12'
        || (event.ctrlKey && event.shiftKey && blockedShortcuts.has(key))
        || (event.ctrlKey && ['u', 's'].includes(key))
        || (event.metaKey && event.altKey && ['i', 'u'].includes(key))
      if (blocked) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    const preventImageDrag = (event) => {
      if (DEV_GUARD.blockImageDrag && event.target instanceof HTMLImageElement) event.preventDefault()
    }

    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', preventShortcuts, true)
    document.addEventListener('dragstart', preventImageDrag)

    let detector
    if (DEV_GUARD.detectDevTools) {
      detector = window.setInterval(() => {
        const opened = window.outerWidth - window.innerWidth > 160
          || window.outerHeight - window.innerHeight > 160
        setDevToolsNotice((visible) => opened && !visible)
      }, 1000)
    }
    if (DEV_GUARD.clearConsole) console.clear()

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', preventShortcuts, true)
      document.removeEventListener('dragstart', preventImageDrag)
      if (detector) window.clearInterval(detector)
    }
  }, [])

  if (!import.meta.env.PROD || !DEV_GUARD.detectDevTools || !devToolsNotice) return null
  return (
    <p role="status" className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-card px-4 py-2 text-sm text-card-foreground shadow-lg">
      Developer tools are open.
    </p>
  )
}
