import { useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import { clamp, lerp, ease } from '../../utils/math'
import { VULN_PAIRS } from '../../data'

interface Props { sectionProg: number }

type RowCache = {
  pts: { x: number; y: number }[]
  scatter: { x: number; y: number }[]
  outDest: { x: number; y: number }[]
  delay: number[]
}

type VulnLayout = {
  padL: number
  rowFs: number
  startY: number
  rowGap: number
  texts: string[]
}

type Cache = {
  key: string
  rows: RowCache[]
  vulnLayout: VulnLayout
  telosPts: { x: number; y: number }[]
  telosScatter: { x: number; y: number }[]
  telosDelay: number[]
  telosFont: { tFontSize: number; wFontSize: number; baseT: number; baseW: number; ls: number }
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

function scatterPts(n: number, W: number, H: number) {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    pts.push({ x: Math.random() * W, y: Math.random() * H })
  }
  return pts
}

function staggerDelays(n: number, spread: number) {
  const d = new Array(n)
  for (let i = 0; i < n; i++) {
    d[i] = clamp((i / Math.max(1, n - 1)) * spread + Math.random() * 0.04, 0, spread)
  }
  return d
}

// Timings mapped to section scroll progress (P.vuln 0→1)
const DOCK_START     = 0.30
const ROW_STAG       = 0.020
const ROW_ASSEMBLE   = 0.13
const VULN_OUT_START = 0.58
const VULN_OUT_DUR   = 0.10
const ROW_OUT_STAG   = 0.007
const TELOS_START    = 0.74
const TELOS_END      = 0.83
const SOLID_START    = 0.80
const SOLID_END      = 0.90
const TELOS_SAMPLE   = 3
const TELOS_MAX_PTS  = 2200

function subsamplePts<T>(pts: T[], max: number) {
  if (pts.length <= max) return pts
  const out: T[] = []
  const step = pts.length / max
  for (let i = 0; i < max; i++) out.push(pts[Math.floor(i * step)])
  return out
}

export default function TelosMorphCanvas({ sectionProg }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const cacheRef = useRef<Cache | null>(null)

  const draw = useCallback(() => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.resetTransform(); ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)
    const p = clamp(sectionProg, 0, 1)
    if (p < DOCK_START - 0.02 || W < 10) return

    const key = `${W}x${H}`
    if (!cacheRef.current || cacheRef.current.key !== key) {
      const vulns = VULN_PAIRS.map(pair => pair.vuln)
      const isMobile = W < 768
      const padL = isMobile ? 24 : 80
      const rowFs = clamp(Math.round(H * 0.028), 16, 28)
      const rowGap = clamp(Math.round(44 + H * 0.015), 52, 64)
      const headerH = isMobile ? H * 0.28 : H * 0.24
      const listH = H - headerH
      const blockH = (vulns.length - 1) * rowGap
      const startY = headerH + listH * 0.5 - blockH / 2

      const rows: RowCache[] = vulns.map((v, i) => {
        const pts = sampleText(W, H, 2, (o) => {
          o.fillStyle = '#000'
          o.textAlign = 'left'
          o.textBaseline = 'middle'
          o.font = `400 ${rowFs}px 'Playfair Display', serif`
          o.fillText(v, padL, startY + i * rowGap)
        })
        const scatter = scatterPts(pts.length, W, H)
        const outDest = pts.map((pt, j) => ({
          x: pt.x + (scatter[j].x - pt.x) * 1.8 + (pt.x - W / 2) * 0.25,
          y: pt.y + (scatter[j].y - pt.y) * 1.8 + (pt.y - H / 2) * 0.25,
        }))
        return {
          pts,
          scatter,
          outDest,
          delay: staggerDelays(pts.length, 0.16),
        }
      })

      const tFontSize = Math.min(W * 0.19, H * 0.38)
      const wFontSize = Math.max(10, Math.round(tFontSize * 0.15))
      const capH  = tFontSize * 0.72
      const gap   = tFontSize * 0.16
      const logoH = capH + gap + wFontSize * 0.72
      const baseT = (H - logoH) / 2 + capH
      const baseW = baseT + gap + wFontSize * 0.72
      const ls    = Math.round(wFontSize * 0.78)

      const telosPts = subsamplePts(sampleText(W, H, TELOS_SAMPLE, (o) => {
        o.fillStyle = '#000'
        o.textAlign = 'center'
        o.textBaseline = 'alphabetic'
        o.font = `700 ${tFontSize}px 'Syncopate', sans-serif`
        ;(o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-1px'
        o.fillText('TELOS', W / 2, baseT)
        o.font = `400 ${wFontSize}px 'Syncopate', sans-serif`
        ;(o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`
        o.fillText('WEALTH', W / 2 - ls / 2, baseW)
        ;(o as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
      }), TELOS_MAX_PTS)

      cacheRef.current = {
        key,
        rows,
        vulnLayout: { padL, rowFs, startY, rowGap, texts: vulns },
        telosPts,
        telosScatter: scatterPts(telosPts.length, W, H),
        telosDelay: staggerDelays(telosPts.length, 0.12),
        telosFont: { tFontSize, wFontSize, baseT, baseW, ls },
      }
    }

    const { rows, vulnLayout, telosPts, telosScatter, telosDelay, telosFont } = cacheRef.current
    const { padL, rowFs, startY, rowGap, texts } = vulnLayout
    const lastOutEnd = VULN_OUT_START + (rows.length - 1) * ROW_OUT_STAG + VULN_OUT_DUR
    const showVulns = p < lastOutEnd + 0.01

    // ── Vulnerability rows: pixel assemble → texto sólido → pixel disperse ──
    if (showVulns) {
      const maxDelay = 0.16

      rows.forEach((row, ri) => {
        const rowInP  = ease(clamp((p - (DOCK_START + ri * ROW_STAG)) / ROW_ASSEMBLE, 0, 1))
        const rowOutP = ease(clamp((p - (VULN_OUT_START + ri * ROW_OUT_STAG)) / VULN_OUT_DUR, 0, 1))
        if (rowInP <= 0 && rowOutP <= 0) return

        const rowSolidP = rowOutP > 0 ? 0 : ease(clamp((rowInP - 0.65) / 0.35, 0, 1))
        const formed = rowInP >= 0.55 || rowOutP > 0

        if (formed) {
          for (let i = 0; i < row.pts.length; i++) {
            const inE = ease(clamp((rowInP - row.delay[i]) / (1 - maxDelay), 0, 1))
            if (inE <= 0 && rowOutP <= 0) continue

            const t = row.pts[i]
            const s = row.scatter[i]
            const d = row.outDest[i]
            let x: number, y: number, dotA: number, size: number

            if (rowOutP > 0) {
              x = lerp(t.x, d.x, rowOutP)
              y = lerp(t.y, d.y, rowOutP)
              dotA = 1 - rowOutP
              size = lerp(2.4, 1.2, rowOutP)
            } else {
              x = lerp(s.x, t.x, inE)
              y = lerp(s.y, t.y, inE)
              dotA = lerp(0.5, 1, inE) * (1 - rowSolidP)
              size = lerp(1.6, 2.4, inE)
            }

            if (dotA < 0.02) continue
            ctx.fillStyle = `rgba(10,10,10,${dotA})`
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
          }
        }

        if (rowSolidP > 0.02) {
          ctx.save()
          ctx.globalAlpha = rowSolidP
          ctx.fillStyle = '#0A0A0A'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.font = `400 ${rowFs}px 'Playfair Display', serif`
          ctx.fillText(texts[ri], padL, startY + ri * rowGap)
          ctx.restore()
        }
      })
    }

    // ── TELOS pixel → solid (unchanged — user liked this) ──
    const telosPhase = ease(clamp((p - TELOS_START) / (TELOS_END - TELOS_START), 0, 1))
    const solidP = ease(clamp((p - SOLID_START) / (SOLID_END - SOLID_START), 0, 1))
    const dotsAlpha = 1 - solidP

    if (telosPhase > 0.01 && telosPts.length && dotsAlpha > 0.01) {
      const maxDelay = 0.12
      for (let i = 0; i < telosPts.length; i++) {
        const inE = ease(clamp((telosPhase - telosDelay[i]) / (1 - maxDelay), 0, 1))
        if (inE <= 0) continue
        const s = telosScatter[i]
        const t = telosPts[i]
        const x = lerp(s.x, t.x, inE)
        const y = lerp(s.y, t.y, inE)
        const a = lerp(0.45, 0.9, inE) * dotsAlpha
        if (a < 0.02) continue
        ctx.globalAlpha = a
        ctx.fillStyle = '#232323'
        const size = lerp(1.5, 2.0, inE)
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    }

    if (solidP > 0.01) {
      const { tFontSize, wFontSize, baseT, baseW, ls } = telosFont
      ctx.save()
      ctx.globalAlpha = solidP
      ctx.fillStyle = '#232323'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.font = `700 ${tFontSize}px 'Syncopate', sans-serif`
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-1px'
      ctx.fillText('TELOS', W / 2, baseT)
      ctx.font = `400 ${wFontSize}px 'Syncopate', sans-serif`
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`
      ctx.fillText('WEALTH', W / 2 - ls / 2, baseW)
      ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
      ctx.restore()
    }
  }, [sectionProg])

  useLayoutEffect(() => { draw() }, [draw])

  useEffect(() => {
    const onResize = () => { cacheRef.current = null; draw() }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
