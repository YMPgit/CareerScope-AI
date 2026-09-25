import { useEffect, useRef, useState } from 'react'

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs: number, active: boolean, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    if (!active) {
      setLoading(false)
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setInterval>

    const run = async () => {
      try {
        const result = await fetcherRef.current()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    timer = setInterval(run, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, intervalMs, ...deps])

  return { data, error, loading, setData }
}