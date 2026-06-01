import { useRef, useEffect } from 'react'
import { useCanvasTicker } from '../../hooks/useCanvasTicker'
import { clamp, lerp, ease } from '../../utils/math'
import { VULN_PAIRS } from '../../data'

interface Props { prog: number }

type Cache = {
  key: string
  tgt: { x: number; y: number }[]
  from: { x: number; y: number }[]
  delay: number[]
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
      if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y })
    }
  }
  return pts
}

export default function TelosMorphCanvas({ prog }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const progRef = useRef(prog)
  const cacheRef = useRef<Cache | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const imgReadyRef = useRef(false)
  progRef.current = prog

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgReadyRef.current = true; cacheRef.current = null }
    img.src = '/telos-logo.png'
    imgRef.current = img
  }, [])

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
      if (!imgReadyRef.current) return
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
      const img = imgRef.current!
      const imgNH = img.naturalHeight || 4501
      const imgNW = img.naturalWidth  || 5001
      const cropSY = Math.floor(0.578 * imgNH)
      const cropSH = Math.floor(0.333 * imgNH)
      const cropAspect = imgNW / cropSH
      let tw = W * 0.65, th = tw / cropAspect
      const maxH = H * 0.34
      if (th > maxH) { th = maxH; tw = th * cropAspect }
      const tx0 = (W - tw) / 2, ty0 = (H - th) / 2
      const tgt = sampleText(W, H, 2, (o) => {
        o.drawImage(img, 0, cropSY, imgNW, cropSH, tx0, ty0, tw, th)
      })
      const from = new Array(tgt.length)
      const delay = new Array(tgt.length)
      const sLen = src.length || 1
      for (let i = 0; i < tgt.length; i++) {
        from[i] = src.length ? src[(i * 7919) % sLen] : { x: W / 2, y: H / 2 }
        delay[i] = clamp((tgt[i].x / W) * 0.16 + Math.random() * 0.08, 0, 0.28)
      }
      cacheRef.current = { key, tgt, from, delay }
    }

    const { tgt, from, delay } = cacheRef.current
    if (!tgt.length) return

    for (let i = 0; i < tgt.length; i++) {
      const d = delay[i]
      const e = ease(clamp((prog - d) / (1 - 0.28), 0, 1))
      const s = from[i], t = tgt[i]
      const x = lerp(s.x, t.x, e)
      const y = lerp(s.y, t.y, e)
      const r = Math.round(lerp(94, 35, e))
      const g = Math.round(lerp(107, 35, e))
      const b = Math.round(lerp(87, 35, e))
      const a = lerp(0.5, 0.92, e)
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`
      const size = lerp(1.4, 1.8, e)
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
