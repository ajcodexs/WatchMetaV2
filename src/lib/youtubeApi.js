let youtubeApiPromise

export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady
    const onApiReady = () => {
      window.onYouTubeIframeAPIReady = previousCallback
      try {
        previousCallback?.()
      } finally {
        resolve(window.YT)
      }
    }
    window.onYouTubeIframeAPIReady = onApiReady

    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('error', () => {
      window.onYouTubeIframeAPIReady = previousCallback
      reject(new Error('Could not load the YouTube IFrame API.'))
    }, { once: true })
  }).catch((error) => {
    youtubeApiPromise = null
    throw error
  })

  return youtubeApiPromise
}
