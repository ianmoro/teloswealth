import { useRef, useLayoutEffect, useEffect, useCallback, useState } from 'react'
import { clamp, lerp, ease } from '../../utils/math'
import { VULN_PAIRS } from '../../data'

interface Props { sectionProg: number }

type RowCache = {
  pts: { x: number; y: number }[]
  scatter: { x: number; y: number }[]
  outDest: { x: number; y: number }[]
  delay: number[]
  tx: number
  ty: number
}

type VulnLayout = {
  rowFs: number
  texts: string[]
}

type Cache = {
  key: string
  rows: RowCache[]
  vulnLayout: VulnLayout
  telosPts: { x: number; y: number }[]
  telosScatter: { x: number; y: number }[]
  telosDelay: number[]
  logoBounds: { x: number; y: number; w: number; h: number }
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

function sampleImage(img: HTMLImageElement, W: number, H: number, step: number) {
  // Draw logo centred in the canvas, scaled to fit nicely
  const logoAspect = img.naturalWidth / img.naturalHeight
  const maxW = W * 0.72
  const maxH = H * 0.30
  let lw = maxW, lh = maxW / logoAspect
  if (lh > maxH) { lh = maxH; lw = lh * logoAspect }
  const lx = (W - lw) / 2
  const ly = (H - lh) / 2

  const off = document.createElement('canvas')
  off.width = W; off.height = H
  const o = off.getContext('2d')!
  o.drawImage(img, lx, ly, lw, lh)
  const data = o.getImageData(0, 0, W, H).data
  const pts: { x: number; y: number }[] = []
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const a = data[(y * W + x) * 4 + 3]
      // logo is dark on white/transparent — sample dark pixels
      const r = data[(y * W + x) * 4]
      if (a > 60 && r < 100) pts.push({ x, y })
    }
  }
  return { pts, bounds: { x: lx, y: ly, w: lw, h: lh } }
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
const VULN_OUT_START = 0.58
const VULN_OUT_DUR   = 0.10
const ROW_OUT_STAG   = 0.007
const TELOS_START    = 0.74
const TELOS_END      = 0.83
const SOLID_START    = 0.80
const SOLID_END      = 0.90
const TELOS_SAMPLE   = 3
const TELOS_MAX_PTS  = 2400

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
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  // Load logo once
  useEffect(() => {
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = '/telos-logo.png'
  }, [])

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
    if (W < 10) return

    const key = `${W}x${H}`
    // Rebuild cache when size changes or when logo first loads
    if (!cacheRef.current || cacheRef.current.key !== key) {
      // If logo not loaded yet, skip telos sample — will rebuild once loaded
      const vulns = VULN_PAIRS.map(pair => pair.vuln)
      const isMobile = W < 768
      const rowFs = clamp(Math.round(H * 0.030), 16, 30)

      const SCATTER_POS = isMobile ? [
        { fx: 0.04, fy: 0.28 }, { fx: 0.50, fy: 0.18 }, { fx: 0.08, fy: 0.42 },
        { fx: 0.38, fy: 0.55 }, { fx: 0.05, fy: 0.65 }, { fx: 0.42, fy: 0.76 },
        { fx: 0.10, fy: 0.86 },
      ] : [
        { fx: 0.05, fy: 0.40 }, { fx: 0.68, fy: 0.36 }, { fx: 0.33, fy: 0.52 },
        { fx: 0.62, fy: 0.65 }, { fx: 0.06, fy: 0.70 }, { fx: 0.42, fy: 0.80 },
        { fx: 0.50, fy: 0.46 },
      ]

      const rows: RowCache[] = vulns.map((v, i) => {
        const pos = SCATTER_POS[i] ?? SCATTER_POS[SCATTER_POS.length - 1]
        const tx = pos.fx * W
        const ty = pos.fy * H
        const pts = sampleText(W, H, 2, (o) => {
          o.fillStyle = '#000'
          o.textAlign = 'left'
          o.textBaseline = 'middle'
          o.font = `400 ${rowFs}px 'Playfair Display', serif`
          o.fillText(v, tx, ty)
        })
        const scatter = scatterPts(pts.length, W, H)
        const outDest = pts.map((pt, j) => ({
          x: pt.x + (scatter[j].x - pt.x) * 1.8 + (pt.x - W / 2) * 0.25,
          y: pt.y + (scatter[j].y - pt.y) * 1.8 + (pt.y - H / 2) * 0.25,
        }))
        return { pts, scatter, outDest, delay: staggerDelays(pts.length, 0.16), tx, ty }
      })

      let telosPts: { x: number; y: number }[] = []
      let logoBounds = { x: 0, y: 0, w: 0, h: 0 }

      if (logoImg) {
        const sampled = sampleImage(logoImg, W, H, TELOS_SAMPLE)
        telosPts = subsamplePts(sampled.pts, TELOS_MAX_PTS)
        logoBounds = sampled.bounds
      }

      cacheRef.current = {
        key,
        rows,
        vulnLayout: { rowFs, texts: vulns },
        telosPts,
        telosScatter: scatterPts(telosPts.length, W, H),
        telosDelay: staggerDelays(telosPts.length, 0.12),
        logoBounds,
      }
    }

    const { rows, vulnLayout, telosPts, telosScatter, telosDelay, logoBounds } = cacheRef.current
    const { rowFs, texts } = vulnLayout
    const lastOutEnd = VULN_OUT_START + (rows.length - 1) * ROW_OUT_STAG + VULN_OUT_DUR
    const showVulns = p < lastOutEnd + 0.01

    // ── Vulnerability rows: já visíveis (apagadas) → mais nítidas com scroll → dispersão ──
    if (showVulns) {
      rows.forEach((row, ri) => {
        const rowOutP = ease(clamp((p - (VULN_OUT_START + ri * ROW_OUT_STAG)) / VULN_OUT_DUR, 0, 1))

        if (rowOutP > 0) {
          for (let i = 0; i < row.pts.length; i++) {
            const t = row.pts[i]
            const d = row.outDest[i]
            const x = lerp(t.x, d.x, rowOutP)
            const y = lerp(t.y, d.y, rowOutP)
            const dotA = (1 - rowOutP) * 0.9
            const size = lerp(2.4, 1.2, rowOutP)
            if (dotA < 0.02) continue
            ctx.fillStyle = `rgba(10,10,10,${dotA.toFixed(2)})`
            ctx.fillRect(x - size / 2, y - size / 2, size, size)
          }
        } else {
          const staggerStart = ri * 0.03
          const revealP = ease(clamp((p - staggerStart) / 0.30, 0, 1))
          const alpha = lerp(0.13, 0.82, revealP)
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = '#0A0A0A'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.font = `400 ${rowFs}px 'Playfair Display', serif`
          ctx.fillText(texts[ri], row.tx, row.ty)
          ctx.restore()
        }
      })
    }

    // ── TELOS logo: pixel dots converge → solid image ──
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

    // Solid image fade-in
    if (solidP > 0.01 && logoImg) {
      ctx.save()
      ctx.globalAlpha = solidP
      ctx.drawImage(logoImg, logoBounds.x, logoBounds.y, logoBounds.w, logoBounds.h)
      ctx.restore()
    }
  }, [sectionProg, logoImg])

  useLayoutEffect(() => { draw() }, [draw])

  useEffect(() => {
    const onResize = () => { cacheRef.current = null; draw() }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  // Rebuild cache when logo loads (was null before)
  useEffect(() => {
    if (logoImg) { cacheRef.current = null; draw() }
  }, [logoImg, draw])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
