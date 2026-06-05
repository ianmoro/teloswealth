import { useRef } from 'react'
import { useCanvasTicker } from '../../hooks/useCanvasTicker'
import { clamp, lerp, ease } from '../../utils/math'
import { VULN_PAIRS } from '../../data'

interface Props { prog: number }

type Cache = {
  key: string
  tgt: { x: number; y: number }[]
  from: { x: number; y: number }[]
  delay: number[]
  tFontSize: number
  wFontSize: number
  baseT: number
  baseW: number
  ls: number
}

function sampleText(W: number, H: number, step: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const off = document.createElement('canvas')
  off.width = W; off.height = H
  const o = off.getContext('2d')!
  draw(o)
  const data = o.getImageData(0, 0, W, H).data
  const pts: { x: number; y: number }[] = []
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 80) pts.push({ x, y })
    }
  }
  return pts
}

export default function TelosMorphCanvas({ prog }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const progRef = useRef(prog)
  const cacheRef = useRef<Cache | null>(null)
  progRef.current = prog

  useCanvasTicker(() => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.resetTransform(); ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)
    const prog = clamp(progRef.current, 0, 1)
    if (prog <= 0.0001 || W < 10) return

    const key = `${W}x${H}`
    if (!cacheRef.current || cacheRef.current.key !== key) {
      const sols = VULN_PAIRS.map(p => p.sol)
      const rowFs = clamp(Math.round(H * 0.05), 22, 38)
      const rowGap = rowFs * 1.95
      const startY = H / 2 - (sols.length - 1) * rowGap / 2
      const src = sampleText(W, H, 4, (o) => {
        o.fillStyle = '#000'
        o.textAlign = 'center'
        o.textBaseline = 'middle'
        o.font = `500 ${rowFs}px 'Playfair Display', serif`
        sols.forEach((s, i) => o.fillText(s, W / 2, startY + i * rowGap))
      })

      const tFontSize = Math.min(W * 0.19, H * 0.38)
      const wFontSize = Math.max(10, Math.round(tFontSize * 0.15))
      const capH  = tFontSize * 0.72
      const gap   = tFontSize * 0.16
      const logoH = capH + gap + wFontSize * 0.72
      const baseT = (H - logoH) / 2 + capH
      const baseW = baseT + gap + wFontSize * 0.72
      const ls    = Math.round(wFontSize * 0.78)

      const tgt = sampleText(W, H, 2, (o) => {
        o.fillStyle = '#000'
        o.textAlign = 'center'
        o.textBaseline = 'alphabetic'
        o.font = `700 ${tFontSize}px 'Syncopate', sans-serif`
        ;(o as any).letterSpacing = '-1px'
        o.fillText('TELOS', W / 2, baseT)
        o.font = `400 ${wFontSize}px 'Syncopate', sans-serif`
        ;(o as any).letterSpacing = `${ls}px`
        o.fillText('WEALTH', W / 2 - ls / 2, baseW)
        ;(o as any).letterSpacing = '0px'
      })

      const from = new Array(tgt.length)
      const delay = new Array(tgt.length)
      const sLen = src.length || 1
      for (let i = 0; i < tgt.length; i++) {
        from[i] = src.length ? src[(i * 7919) % sLen] : { x: W / 2, y: H / 2 }
        delay[i] = clamp((tgt[i].x / W) * 0.16 + Math.random() * 0.08, 0, 0.28)
      }
      cacheRef.current = { key, tgt, from, delay, tFontSize, wFontSize, baseT, baseW, ls }
    }

    const { tgt, from, delay, tFontSize, wFontSize } = cacheRef.current
    if (!tgt.length) return

    // Crossfade: dots → crisp text in the last 18% of animation
    const textAlpha = ease(clamp((prog - 0.82) / 0.18, 0, 1))
    const dotsAlpha = 1 - textAlpha           // dots fully gone when text arrives

    // Draw morph dots
    for (let i = 0; i < tgt.length; i++) {
      const d = delay[i]
      const e = ease(clamp((prog - d) / (1 - 0.28), 0, 1))
      const s = from[i], t = tgt[i]
      const x = lerp(s.x, t.x, e)
      const y = lerp(s.y, t.y, e)
      const r = Math.round(lerp(94, 35, e))
      const g = Math.round(lerp(107, 35, e))
      const b = Math.round(lerp(87, 35, e))
      const a = lerp(0.5, 0.92, e) * dotsAlpha
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`
      const size = lerp(1.4, 1.8, e)
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
    }

    // Fade in clean vector text on top — smaller than the dot silhouette
    if (textAlpha > 0.01) {
      const fScale = 0.58
      const fT = tFontSize * fScale
      const fW = wFontSize * fScale
      const fCapH = fT * 0.72
      const fGap  = fT * 0.16
      const fLogoH = fCapH + fGap + fW * 0.72
      const fBaseT = (H - fLogoH) / 2 + fCapH
      const fBaseW = fBaseT + fGap + fW * 0.72
      const fLs = Math.round(fW * 0.78)
      ctx.save()
      ctx.globalAlpha = textAlpha
      ctx.fillStyle = '#232323'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.font = `700 ${fT}px 'Syncopate', sans-serif`
      ;(ctx as any).letterSpacing = '-1px'
      ctx.fillText('TELOS', W / 2, fBaseT)
      ctx.font = `400 ${fW}px 'Syncopate', sans-serif`
      ;(ctx as any).letterSpacing = `${fLs}px`
      ctx.fillText('WEALTH', W / 2 - fLs / 2, fBaseW)
      ;(ctx as any).letterSpacing = '0px'
      ctx.restore()
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
