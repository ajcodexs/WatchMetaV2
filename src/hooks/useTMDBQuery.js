import { useCallback, useEffect, useState } from 'react'

export default function useTMDBQuery(query, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [attempt, setAttempt] = useState(0)

  const runQuery = useCallback(query, dependencies)

  useEffect(() => {
    const controller = new AbortController()
    setState((current) => ({ ...current, loading: true, error: '' }))
    runQuery(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: '' })
    }).catch((error) => {
      if (error.name === 'AbortError' || controller.signal.aborted) return
      setState({ data: null, loading: false, error: error.message || 'Something went wrong. Try again.' })
    })
    return () => controller.abort()
  }, [runQuery, attempt])

  const retry = useCallback(() => setAttempt((current) => current + 1), [])
  return { ...state, retry }
}
