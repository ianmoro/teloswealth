import { useEffect, useRef } from 'react'
import { ease, lerp, hexToRgba, roundRect } from '../../utils/math'
import { TREE_NODES, TREE_LINES, TREE_SEQ, GEN_LABELS } from '../../data'

interface Props { prog: number }

const nodeWashes: Record<string, { base: string; accent: string; isYou?: boolean }> = {
  carlos:  { base: '#414E3A', accent: '#C6A46C', isYou: true },
  ana:     { base: '#C6A46C', accent: '#A8B0A2' },
  lucas:   { base: '#A8B0A2', accent: '#414E3A' },
  beatriz: { base: '#D9D6D1', accent: '#C6A46C' },
  pedro:   { base: '#414E3A', accent: '#A8B0A2' },
}

function drawPaintedCard(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, halfW: number, halfH: number,
  opts: { lbl: string; sub?: string; wash: { base: string; accent: string }; isYou?: boolean; alpha: number }
) {
  const w = halfW * 2, h = halfH * 2
  const x = cx - halfW, y = cy - halfH
  const r = Math.min(halfW, halfH) * 0.42

  ctx.save()
  ctx.globalAlpha = opts.alpha

  ctx.save()
  ctx.shadowColor = 'rgba(35,35,35,0.15)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 10
  ctx.fillStyle = '#F5F4F1'
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.restore()

  roundRect(ctx, x, y, w, h, r)
  ctx.save()
  ctx.clip()
  const g1 = ctx.createLinearGradient(x, y, x + w, y + h)
  g1.addColorStop(0, hexToRgba(opts.wash.base, 0.20))
  g1.addColorStop(1, hexToRgba(opts.wash.accent, 0.10))
  ctx.fillStyle = g1
  ctx.fillRect(x, y, w, h)

  const seedN = (opts.lbl || 'x').charCodeAt(0)
  for (let i = 0; i < 22; i++) {
    const sx = x + ((seedN * 13 + i * 47) % w)
    const sy = y + ((seedN * 7 + i * 91) % h)
    const sr = 4 + ((seedN + i * 11) % 14)
    const blot = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
    blot.addColorStop(0, hexToRgba(opts.wash.base, 0.10))
    blot.addColorStop(1, hexToRgba(opts.wash.base, 0))
    ctx.fillStyle = blot
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2)
  }

  const hcx = cx, hcy = cy - h * 0.16
  const hr = w * 0.18
  const hg = ctx.createRadialGradient(hcx - hr * 0.3, hcy - hr * 0.3, 1, hcx, hcy, hr)
  hg.addColorStop(0, hexToRgba(opts.wash.accent, 0.55))
  hg.addColorStop(1, hexToRgba(opts.wash.base, 0.7))
  ctx.fillStyle = hg
  ctx.beginPath()
  ctx.arc(hcx, hcy, hr, 0, Math.PI * 2)
  ctx.fill()

  const bg = ctx.createLinearGradient(cx, cy, cx, cy + h * 0.4)
  bg.addColorStop(0, hexToRgba(opts.wash.base, 0.65))
  bg.addColorStop(1, hexToRgba(opts.wash.base, 0.25))
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.32, cy + h * 0.40)
  ctx.bezierCurveTo(cx - w * 0.34, cy + h * 0.05, cx - w * 0.2, cy - h * 0.02, cx, cy - h * 0.02)
  ctx.bezierCurveTo(cx + w * 0.2, cy - h * 0.02, cx + w * 0.34, cy + h * 0.05, cx + w * 0.32, cy + h * 0.40)
  ctx.closePath()
  ctx.fill()

  ctx.restore()

  ctx.strokeStyle = 'rgba(35,35,35,0.10)'
  ctx.lineWidth = 1
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r)
  ctx.stroke()


  ctx.font = `500 ${Math.max(12, halfH * 0.16)}px 'Inter', sans-serif`
  ctx.fillStyle = '#232323'
  ctx.textAlign = 'center'
  ctx.fillText(opts.lbl, cx, y + h + Math.max(20, halfH * 0.22))
  if (opts.sub) {
    ctx.font = `300 ${Math.max(10, halfH * 0.12)}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(35,35,35,0.5)'
    ctx.fillText(opts.sub, cx, y + h + Math.max(38, halfH * 0.40))
  }

  ctx.restore()
}

export default function TreeCanvas({ prog }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (W < 1 || H < 1) return
    canvas.width = W * dpr; canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!; ctx.scale(dpr, dpr)
    const VW = 880, VH = 480
    const vx = (x: number) => x / VW * W
    const vy = (y: number) => y / VH * H
    const iA = (s: number, e: number, p: number) => p <= s ? 0 : p >= e ? 1 : ease((p - s) / (e - s))
    ctx.clearRect(0, 0, W, H)

    const genLabelStarts = [0.05, 0.74]
    const genLabelEnds   = [0.14, 0.84]
    GEN_LABELS.forEach((g, idx) => {
      const a = iA(genLabelStarts[idx], genLabelEnds[idx], prog)
      if (a <= 0) return
      ctx.save()
      ctx.globalAlpha = a
      ctx.font = "400 9.5px 'Syncopate', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.3)'
      ctx.textAlign = 'center'
      const w = ctx.measureText(g.t).width
      ctx.strokeStyle = 'rgba(35,35,35,0.12)'
      ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.moveTo(vx(440) - w / 2 - 14, vy(g.y) - 4); ctx.lineTo(vx(440) - w / 2 - 28, vy(g.y) - 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(vx(440) + w / 2 + 14, vy(g.y) - 4); ctx.lineTo(vx(440) + w / 2 + 28, vy(g.y) - 4); ctx.stroke()
      ctx.fillText(g.t, vx(440), vy(g.y))
      ctx.restore()
    })

    TREE_SEQ.filter(s => s.t === 'l').forEach(s => {
      const a = iA(s.s, s.e, prog); if (a <= 0) return
      const ln = TREE_LINES[s.i!]
      const x1 = vx(ln[0]), y1 = vy(ln[1]), x2 = vx(ln[2]), y2 = vy(ln[3])
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(lerp(x1, x2, a), lerp(y1, y2, a))
      ctx.strokeStyle = `rgba(65,78,58,${a * 0.55})`
      ctx.lineWidth = 1; ctx.stroke()
    })

    const us = TREE_SEQ.find(s => s.t === 'u')
    const ua = us ? iA(us.s, us.e, prog) : 0
    if (ua > 0) {
      ctx.beginPath(); ctx.arc(vx(440), vy(100), 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(65,78,58,${ua})`; ctx.fill()
    }

    TREE_NODES.forEach(node => {
      const seq = TREE_SEQ.find(s => s.t === 'n' && s.id === node.id); if (!seq) return
      const a = iA(seq.s, seq.e, prog); if (a <= 0) return
      const wash = nodeWashes[node.id] || { base: '#414E3A', accent: '#C6A46C' }
      drawPaintedCard(ctx, vx(node.cx), vy(node.cy), vx(56), vy(64), {
        lbl: node.lbl, wash, isYou: !!node.you, alpha: a,
      })
    })
  }, [prog])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
