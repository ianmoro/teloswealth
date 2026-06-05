import { useEffect, useRef } from 'react'
import { clamp } from '../../utils/math'
import { CURVE_EVENTS, buildCurve, ageToT } from '../../data'

interface Props { prog: number; startM: number; mood?: 'alive' | 'fading' }

export default function CurveCanvas({ prog, startM, mood = 'alive' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (W < 1 || H < 1) return
    canvas.width = W * dpr; canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!; ctx.scale(dpr, dpr)
    const PAD = { l: 88, r: 64, t: 88, b: 100 }
    const CW = W - PAD.l - PAD.r, CH = H - PAD.t - PAD.b

    const pts = buildCurve(startM)
    const accRate = 0.082, useRate = 0.011
    const valAt60Ghost = startM * Math.pow(1 + accRate, 15)
    const ghostPts = pts.map(p => ({
      ...p,
      v: p.age <= 60
        ? startM * Math.pow(1 + accRate, p.age - 45)
        : valAt60Ghost * Math.pow(1 + useRate, p.age - 60)
    }))
    const maxV = Math.max(...pts.map(p => p.v), ...ghostPts.map(p => p.v)) * 1.08
    const minV = 0
    const toX = (t: number) => PAD.l + t * CW
    const toY = (v: number) => PAD.t + (1 - (v - minV) / (maxV - minV)) * CH

    ctx.clearRect(0, 0, W, H)

    const dim = mood === 'fading'
    const lineCol = dim ? 'rgba(35,35,35,0.32)' : '#232323'
    const accentCol = dim ? 'rgba(94,107,87,0.4)' : '#5E6B57'
    const labelCol = dim ? 'rgba(35,35,35,0.3)' : 'rgba(35,35,35,0.55)'

    ctx.strokeStyle = dim ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 0.5
    const yStep = maxV <= 14 ? 2 : maxV <= 30 ? 5 : maxV <= 70 ? 10 : 20
    const yTicks: number[] = []
    for (let v = 0; v <= maxV; v += yStep) yTicks.push(v)
    yTicks.forEach(v => {
      if (v > maxV) return
      const y = toY(v)
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
      ctx.fillStyle = labelCol
      ctx.font = "10px 'Inter', sans-serif"
      ctx.textAlign = 'right'
      ctx.fillText('R$' + v + 'M', PAD.l - 10, y + 4)
    })

    ctx.beginPath()
    ctx.moveTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b)
    ctx.strokeStyle = dim ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.15)'
    ctx.stroke()

    ;[45, 55, 65, 75, 85, 95].forEach(age => {
      const x = toX(ageToT(age))
      ctx.fillStyle = labelCol
      ctx.font = "10px 'Inter', sans-serif"
      ctx.textAlign = 'center'
      ctx.fillText(age + ' anos', x, H - PAD.b + 18)
    })

    ctx.save()
    ctx.fillStyle = dim ? 'rgba(35,35,35,0.25)' : 'rgba(35,35,35,0.5)'
    ctx.font = "700 9px 'Syncopate', sans-serif"
    ctx.textAlign = 'left'
    ctx.fillText('PATRIMÔNIO', PAD.l, PAD.t - 22)
    ctx.textAlign = 'right'
    ctx.fillText('IDADE', W - PAD.r, H - PAD.b + 38)
    ctx.restore()

    const retT = ageToT(60)
    const retX = toX(retT)
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.font = "700 9.5px 'Syncopate', sans-serif"
    ctx.fillStyle = lineCol
    ctx.textAlign = 'center'
    ctx.fillText('ACUMULAÇÃO', toX(retT / 2), PAD.t - 8)
    ctx.fillText('UTILIZAÇÃO', toX(retT + (1 - retT) / 2), PAD.t - 8)
    ctx.strokeStyle = dim ? 'rgba(94,107,87,0.15)' : 'rgba(94,107,87,0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(retX, PAD.t + 4); ctx.lineTo(retX, H - PAD.b); ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()

    if (prog < 0.01) return

    const cutIdx = Math.round(pts.length * prog)
    const visible = pts.slice(0, cutIdx + 1)
    if (visible.length < 2) return

    if (!dim) {
      ctx.beginPath()
      visible.forEach((p, i) => {
        const x = toX(p.t), y = toY(p.v)
        if (i === 0) ctx.moveTo(x, H - PAD.b)
        ctx.lineTo(x, y)
      })
      ctx.lineTo(toX(visible[visible.length - 1].t), H - PAD.b)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b)
      grad.addColorStop(0, 'rgba(94,107,87,0.18)')
      grad.addColorStop(1, 'rgba(94,107,87,0)')
      ctx.fillStyle = grad
      ctx.fill()
    }

    ctx.beginPath()
    visible.forEach((p, i) => {
      const x = toX(p.t), y = toY(p.v)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = lineCol
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    const last = visible[visible.length - 1]
    ctx.beginPath()
    ctx.arc(toX(last.t), toY(last.v), 6, 0, Math.PI * 2)
    ctx.fillStyle = '#F5F4F1'
    ctx.strokeStyle = lineCol
    ctx.lineWidth = 2
    ctx.fill(); ctx.stroke()

    // Consumption ghost zone — pure compounding vs. life spent
    const retireT = ageToT(60)
    const ghostFade = dim ? 0 : clamp((prog - retireT) / 0.06, 0, 1)
    if (ghostFade > 0) {
      const retI = pts.findIndex(p => p.age >= 59.5)
      const gSeg = ghostPts.slice(retI, cutIdx + 1)
      const rSeg = pts.slice(retI, cutIdx + 1)
      if (gSeg.length > 1 && rSeg.length > 1) {
        ctx.save()
        // Filled zone between ghost and real
        ctx.globalAlpha = ghostFade * 0.55
        ctx.beginPath()
        gSeg.forEach((p, i) => {
          const x = toX(p.t), y = toY(p.v)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        for (let i = rSeg.length - 1; i >= 0; i--) {
          ctx.lineTo(toX(rSeg[i].t), toY(rSeg[i].v))
        }
        ctx.closePath()
        const gc = ctx.createLinearGradient(toX(retireT), 0, toX(1), 0)
        gc.addColorStop(0, 'rgba(198,164,108,0.05)')
        gc.addColorStop(1, 'rgba(198,164,108,0.26)')
        ctx.fillStyle = gc
        ctx.fill()
        // Ghost dashed line
        ctx.globalAlpha = ghostFade * 0.48
        ctx.beginPath()
        gSeg.forEach((p, i) => {
          const x = toX(p.t), y = toY(p.v)
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        })
        ctx.strokeStyle = 'rgba(198,164,108,0.75)'
        ctx.lineWidth = 1.2
        ctx.setLineDash([5, 4])
        ctx.lineJoin = 'round'
        ctx.stroke()
        ctx.setLineDash([])
        // Label centred in the gap
        if (gSeg.length > 14 && ghostFade > 0.65) {
          const mi = Math.floor(gSeg.length * 0.54)
          const lx = toX(gSeg[mi].t)
          const ly = (toY(gSeg[mi].v) + toY(rSeg[Math.min(mi, rSeg.length - 1)].v)) / 2
          ctx.globalAlpha = clamp((ghostFade - 0.65) / 0.3, 0, 1) * 0.65
          ctx.font = "italic 9px 'Inter', sans-serif"
          ctx.fillStyle = 'rgba(154,92,69,0.8)'
          ctx.textAlign = 'center'
          ctx.fillText('consumo financiado', lx, ly + 4)
        }
        ctx.restore()
      }
    }

    CURVE_EVENTS.forEach((ev: any, i) => {
      const eT = ageToT(ev.age)
      if (eT > prog + 0.001) return
      const ex = toX(eT)
      const pAt = pts.reduce((a, b) => Math.abs(b.t - eT) < Math.abs(a.t - eT) ? b : a)
      const ey = toY(pAt.v)

      if (ev.retire) {
        ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2)
        ctx.fillStyle = accentCol; ctx.fill()
        ctx.beginPath(); ctx.arc(ex, ey, 14, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(94,107,87,0.25)'; ctx.lineWidth = 1.2; ctx.stroke()
      } else {
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2)
        ctx.fillStyle = lineCol; ctx.fill()
      }

      const above = ev.retire ? true : i % 2 === 0
      const offset = above ? -86 : 72
      const labelY = ey + offset
      ctx.beginPath()
      ctx.moveTo(ex, ey + (above ? -8 : 8))
      ctx.lineTo(ex, labelY + (above ? 14 : -14))
      ctx.strokeStyle = 'rgba(35,35,35,0.2)'
      ctx.lineWidth = 0.8
      ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([])
      const bw = ev.retire ? 130 : 116
      const bh = 30
      const bx = clamp(ex - bw / 2, PAD.l + 2, W - PAD.r - bw - 2)
      const by = above ? labelY : labelY - bh
      ctx.fillStyle = '#F5F4F1'
      ctx.strokeStyle = ev.retire ? accentCol : 'rgba(35,35,35,0.2)'
      ctx.lineWidth = ev.retire ? 1.2 : 0.8
      ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh)
      ctx.font = "9px 'Inter', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.45)'
      ctx.textAlign = 'center'
      ctx.fillText(ev.age + ' anos', bx + bw / 2, by + 11)
      ctx.font = `${ev.retire ? '600 ' : '400 '}10px 'Inter', sans-serif`
      ctx.fillStyle = lineCol
      ctx.fillText(ev.lbl, bx + bw / 2, by + 23)
      if (!ev.retire && ev.delta !== undefined) {
        ctx.font = "9px 'Inter', sans-serif"
        ctx.fillStyle = ev.tone === 'up' ? accentCol : 'rgba(35,35,35,0.4)'
        ctx.textAlign = 'left'
        const sign = ev.delta > 0 ? '+' : ''
        ctx.fillText(`${sign}${ev.delta}M`, bx + bw + 6, by + 18)
      }
    })
  }, [prog, startM, mood])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
