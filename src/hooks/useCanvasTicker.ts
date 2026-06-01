import { useEffect, useRef, useLayoutEffect } from 'react'

export function useCanvasTicker(redrawFn: (time: number) => void, deps: unknown[]) {
  const rafRef = useRef<number | null>(null)
  const fnRef = useRef(redrawFn)
  fnRef.current = redrawFn

  useEffect(() => {
    let alive = true
    let errLogged = false
    const tick = () => {
      if (!alive) return
      try { fnRef.current(performance.now()) }
      catch (e) { if (!errLogged) { console.error('canvas redraw error:', e); errLogged = true } }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useLayoutEffect(() => {
    try { fnRef.current(performance.now()) } catch { /* logged by rAF loop */ }
  })
}
