import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const CAST_SDK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js'
const RECEIVER_APP_ID = 'CC1AD845'
let castSdkPromise

function browserSupportsCast() {
  const ua = navigator.userAgent
  const isChrome = /\bChrome\//.test(ua) && !/\bEdg\//.test(ua)
  const isEdge = /\bEdg\//.test(ua)
  const isAndroid = /\bAndroid\b/.test(ua)
  const isDesktop = !isAndroid && !/\b(iPhone|iPad|iPod)\b/.test(ua)
  return (isChrome && (isAndroid || isDesktop) || isEdge && isDesktop)
    && Boolean(window.chrome)
}

function loadCastSdk() {
  if (window.cast?.framework) return Promise.resolve()
  if (castSdkPromise) return castSdkPromise

  castSdkPromise = new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Google Cast SDK timed out.')), 15000)
    window.__onGCastApiAvailable = (available) => {
      window.clearTimeout(timeout)
      if (available) resolve()
      else reject(new Error('Google Cast is unavailable in this browser.'))
    }
    let script = document.querySelector(`script[src="${CAST_SDK_URL}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = CAST_SDK_URL
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('error', () => {
      window.clearTimeout(timeout)
      reject(new Error('Could not load Google Cast SDK.'))
    }, { once: true })
  }).catch((error) => {
    castSdkPromise = null
    throw error
  })

  return castSdkPromise
}

export default function CastButton({ mediaUrl }) {
  const [supported] = useState(browserSupportsCast)
  const [ready, setReady] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supported) return undefined
    let mounted = true
    let context
    let updateSession
    loadCastSdk().then(() => {
      if (!mounted) return
      context = window.cast.framework.CastContext.getInstance()
      context.setOptions({
        receiverApplicationId: RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      })
      updateSession = () => {
        const session = context.getCurrentSession()
        const receiver = session?.getSessionObj()?.receiver
        setDeviceName(receiver?.friendlyName || '')
      }
      context.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        updateSession,
      )
      setReady(true)
      updateSession()
    }).catch((loadError) => {
      if (mounted) setError(loadError.message)
    })
    return () => {
      mounted = false
      if (context && updateSession) {
        context.removeEventListener(
          window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          updateSession,
        )
      }
    }
  }, [supported])

  if (!supported) return null

  async function connect() {
    setError('')
    try {
      const context = window.cast.framework.CastContext.getInstance()
      await context.requestSession()
      if (mediaUrl) {
        const parsedUrl = new URL(mediaUrl)
        if (!['http:', 'https:'].includes(parsedUrl.protocol) || !/\.mp4(?:$|\?)/i.test(parsedUrl.href)) {
          throw new Error('Casting requires a direct MP4 stream URL.')
        }
        const mediaInfo = new window.chrome.cast.media.MediaInfo(
          parsedUrl.href,
          'video/mp4',
        )
        mediaInfo.streamType = window.chrome.cast.media.StreamType.BUFFERED
        const request = new window.chrome.cast.media.LoadRequest(mediaInfo)
        await context.getCurrentSession().loadMedia(request)
      }
    } catch (castError) {
      if (castError?.code !== 'cancel') setError(castError?.message || 'Could not open the Cast device picker.')
    }
  }

  async function stopCasting() {
    setError('')
    try {
      await window.cast.framework.CastContext.getInstance().endCurrentSession(true)
      setDeviceName('')
    } catch (castError) {
      setError(castError?.message || 'Could not stop casting.')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {deviceName ? (
        <>
          <span className="text-sm text-muted-foreground">Casting to {deviceName}</span>
          <Button type="button" variant="outline" size="sm" onClick={stopCasting}>Stop</Button>
        </>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={!ready} onClick={connect}>
          {ready ? 'Cast' : 'Loading Cast…'}
        </Button>
      )}
      {error && <span role="alert" className="w-full text-xs text-destructive">{error}</span>}
    </div>
  )
}
