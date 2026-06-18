import { useRef, useEffect } from 'react'
import { useCanvasTicker } from '../../hooks/useCanvasTicker'
import { clamp, lerp, ease, easeOutCubic, gauss } from '../../utils/math'
import { buildCurve, ageToT, CURVE_EVENTS } from '../../data'

interface Props {
  volProg: number
  morphProg: number
  drawProg: number
  startM: number
}

export default function VolGoalsCanvas({ volProg, morphProg, drawProg, startM }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const seriesRef = useRef<number[] | null>(null)

  const vpRef = useRef(volProg)
  const mpRef = useRef(morphProg)
  const dpRef = useRef(drawProg)
  const smRef = useRef(startM)
  useEffect(() => { vpRef.current = volProg }, [volProg])
  useEffect(() => { mpRef.current = morphProg }, [morphProg])
  useEffect(() => { dpRef.current = drawProg }, [drawProg])
  useEffect(() => { smRef.current = startM }, [startM])

  if (!seriesRef.current) {
    const N = 2600
    const drift = 0.00098, vol = 0.012
    const s: number[] = [1]
    for (let i = 1; i < N; i++) s.push(s[i - 1] * (1 + drift + vol * gauss()))
    seriesRef.current = s
  }

  useCanvasTicker(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.resetTransform()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const volP   = clamp(vpRef.current, 0, 1)
    const morphP = clamp(mpRef.current, 0, 1)
    const drawP  = clamp(dpRef.current || 0, 0, 1)
    const em     = ease(morphP)
    const sm     = smRef.current || 5

    const PAD = { l: 104, r: 120, t: 150, b: 92 }
    const CW = W - PAD.l - PAD.r
    const CH = H - PAD.t - PAD.b

    // ── Volatility display data ──
    const series = seriesRef.current!
    const labels = ['6 MESES', '1 ANO', '3 ANOS', '5 ANOS', '10 ANOS']
    const minN = 120, maxN = 2520
    const n = Math.max(minN, Math.floor(minN + (maxN - minN) * easeOutCubic(volP)))
    const data = series.slice(0, n)
    const smoothHW = Math.floor(Math.pow(volP, 1.35) * 380)
    let displayData: number[] | Float64Array
    if (smoothHW < 1) {
      displayData = data
    } else {
      const ps = new Float64Array(data.length + 1)
      for (let i = 0; i < data.length; i++) ps[i + 1] = ps[i] + data[i]
      const dd = new Float64Array(data.length)
      for (let i = 0; i < data.length; i++) {
        const a = Math.max(0, i - smoothHW)
        const b = Math.min(data.length, i + smoothHW + 1)
        dd[i] = (ps[b] - ps[a]) / (b - a)
      }
      displayData = dd
    }
    let vMin = Infinity, vMax = -Infinity
    for (const v of displayData) { if (v < vMin) vMin = v; if (v > vMax) vMax = v }
    const vpad = (vMax - vMin) * 0.08
    vMin -= vpad; vMax += vpad
    const expand = 1 + Math.pow(volP, 1.5) * 1.25
    const vCenter = (vMin + vMax) / 2
    const vHalf = (vMax - vMin) / 2 * expand
    vMin = vCenter - vHalf; vMax = vCenter + vHalf
    const data0 = displayData[0]
    const volNormAt = (f: number) => {
      const idx = Math.round(f * (n - 1))
      return (displayData[idx] - vMin) / (vMax - vMin)
    }

    // ── Goals curve ──
    const pts = buildCurve(sm)
    const gMax = Math.max(...pts.map(p => p.v)) * 1.08
    const goalNormAt = (f: number) => {
      const idx = clamp(Math.round(f * (pts.length - 1)), 0, pts.length - 1)
      return pts[idx].v / gMax
    }
    const valNorm = (v: number) => v / gMax

    // Pin the start — goals curve start height stays fixed
    const goalStart = goalNormAt(0)
    const volShift  = goalStart - volNormAt(0)
    const volNormS  = (f: number) => volNormAt(f) + volShift

    // ── Shared mapping ──
    const xFracSpan = lerp(lerp(0.30, 1.0, easeOutCubic(volP)), 1, em)
    const usableW   = CW * xFracSpan
    const toX = (f: number) => PAD.l + f * usableW
    const toY = (norm: number) => PAD.t + (1 - norm) * CH

    // Chrome alphas
    const volChrome  = clamp(1 - morphP / 0.42, 0, 1)
    const goalChrome = clamp((morphP - 0.34) / 0.46, 0, 1)

    // ── Grid ──
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + i * CH / 4
      ctx.strokeStyle = 'rgba(35,35,35,0.06)'
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
    }
    // Y-axis line starts below phrase when anchored (phrase bottom ≈ 360px)
    const yAxisStart = lerp(PAD.t, H * 0.42, em)
    ctx.strokeStyle = 'rgba(35,35,35,0.14)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD.l, yAxisStart); ctx.lineTo(PAD.l, H - PAD.b); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke()

    // ── Volatility chrome (fades out) ──
    if (volChrome > 0.01) {
      ctx.save(); ctx.globalAlpha = volChrome
      // % labels
      for (let i = 0; i <= 4; i++) {
        const y = PAD.t + i * CH / 4
        const v = vMax - (i / 4) * (vMax - vMin)
        const pct = (v / data0 - 1) * 100
        if (pct < 0) continue
        ctx.font = "10px 'Inter', sans-serif"
        ctx.fillStyle = 'rgba(35,35,35,0.42)'
        ctx.textAlign = 'right'
        ctx.fillText('+' + pct.toFixed(0) + '%', PAD.l - 12, y + 3.5)
      }
      // VARIAÇÃO axis title
      ctx.save()
      ctx.translate(PAD.l - 64, PAD.t + CH / 2); ctx.rotate(-Math.PI / 2)
      ctx.font = "700 9px 'Syncopate', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.4)'
      ctx.textAlign = 'center'; ctx.fillText('VARIAÇÃO', 0, 0)
      ctx.restore()

      // ── PRAZO × RISCO bars ──
      const stepF   = clamp(volP, 0, 0.9999) * labels.length
      const stepIdx = Math.min(labels.length - 1, Math.floor(stepF))
      const eVol    = easeOutCubic(volP)
      const prazoFill = clamp(eVol, 0.06, 1)
      const volFill   = clamp(1 - eVol * 0.90, 0.08, 1)
      const shortLbl  = ['6M', '1A', '3A', '5A', '10A']
      const volWord   = ['ALTO', 'ALTO', 'MÉDIO', 'BAIXO', 'MÍN.']
      const C_PRAZO = 'rgb(198,164,108)'
      const C_VOL   = 'rgb(94,107,87)'
      const barW = 34, barGap = 24, barMaxH = 120
      const yTop  = PAD.t + 36, yBase = yTop + barMaxH
      const xPrazo = W - PAD.r + 10
      const xVol   = xPrazo + barW + barGap

      const rrect = (x: number, y: number, w: number, h: number, r: number) => {
        r = Math.min(r, w / 2, Math.abs(h) / 2)
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, h, r)
        } else {
          ctx.moveTo(x + r, y)
          ctx.arcTo(x + w, y, x + w, y + h, r)
          ctx.arcTo(x + w, y + h, x, y + h, r)
          ctx.arcTo(x, y + h, x, y, r)
          ctx.arcTo(x, y, x + w, y, r)
          ctx.closePath()
        }
      }

      const tri = (cx: number, cy: number, dir: number, col: string) => {
        const s = 4.5
        ctx.beginPath()
        ctx.moveTo(cx, cy - dir * s)
        ctx.lineTo(cx - s, cy + dir * s * 0.6)
        ctx.lineTo(cx + s, cy + dir * s * 0.6)
        ctx.closePath(); ctx.fillStyle = col; ctx.fill()
      }

      const drawBar = (x: number, fill: number, col: string, dir: number, capTop: string, capBot: string) => {
        rrect(x, yTop, barW, barMaxH, 7)
        ctx.fillStyle = 'rgba(35,35,35,0.045)'; ctx.fill()
        ctx.strokeStyle = 'rgba(35,35,35,0.13)'; ctx.lineWidth = 1
        rrect(x, yTop, barW, barMaxH, 7); ctx.stroke()
        const h = Math.max(barMaxH * fill, 6)
        rrect(x, yBase - h, barW, h, 7)
        ctx.fillStyle = col; ctx.fill()
        ctx.font = "700 8px 'Syncopate', sans-serif"
        ctx.fillStyle = 'rgba(35,35,35,0.5)'; ctx.textAlign = 'center'
        ctx.fillText(capTop, x + barW / 2, yTop - 22)
        tri(x + barW / 2, yTop - 10, dir, col)
        ctx.font = "700 12px 'Syncopate', sans-serif"
        ctx.fillStyle = col; ctx.textAlign = 'center'
        ctx.fillText(capBot, x + barW / 2, yBase + 20)
      }

      drawBar(xPrazo, prazoFill, C_PRAZO, 1,  'PRAZO', shortLbl[stepIdx])
      drawBar(xVol,   volFill,   C_VOL,   -1, 'RISCO', volWord[stepIdx])

      // X labels
      ctx.font = "10px 'Inter', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.45)'; ctx.textAlign = 'left'
      ctx.fillText('hoje', PAD.l, H - PAD.b + 20)
      const endX = clamp(toX(1), PAD.l + 40, W - PAD.r)
      ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(35,35,35,0.55)'
      ctx.fillText(labels[stepIdx].toLowerCase(), endX, H - PAD.b + 20)
      ctx.restore()
    }

    // ── Goals chrome (fades in) ──
    if (goalChrome > 0.01) {
      ctx.save(); ctx.globalAlpha = goalChrome
      const yStep = 10
      const yLabelMax = 30
      for (let v = 0; v <= yLabelMax; v += yStep) {
        const y = toY(valNorm(v))
        ctx.fillStyle = 'rgba(35,35,35,0.5)'
        ctx.font = "10px 'Inter', sans-serif"; ctx.textAlign = 'left'
        ctx.fillText('R$' + v + 'M', PAD.l + 8, y - 4)
      }
      ;[45, 55, 65, 75, 85, 95].forEach(age => {
        const x = toX(ageToT(age))
        ctx.fillStyle = 'rgba(35,35,35,0.5)'
        ctx.font = "10px 'Inter', sans-serif"; ctx.textAlign = 'center'
        ctx.fillText(age + ' anos', x, H - PAD.b + 18)
      })
      ctx.font = "700 9px 'Syncopate', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.5)'
      ctx.textAlign = 'right'; ctx.fillText('IDADE', W - PAD.r, H - PAD.b + 38)

      const retT = ageToT(60), retX = toX(retT)
      ctx.save(); ctx.globalAlpha = goalChrome * 0.6
      ctx.font = "700 9.5px 'Syncopate', sans-serif"
      ctx.fillStyle = '#232323'; ctx.textAlign = 'center'
      ctx.fillText('UTILIZAÇÃO', toX(retT + (1 - retT) / 2), PAD.t - 4)
      ctx.strokeStyle = 'rgba(94,107,87,0.35)'; ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.beginPath(); ctx.moveTo(retX, PAD.t + 4); ctx.lineTo(retX, H - PAD.b)
      ctx.stroke(); ctx.setLineDash([])
      ctx.restore()
      ctx.restore()
    }

    // ── Morph line ──
    const K = 240
    const linePts: { x: number; y: number }[] = []
    for (let i = 0; i < K; i++) {
      const f = i / (K - 1)
      const yNorm = lerp(volNormS(f), goalNormAt(f), em)
      linePts.push({ x: toX(f), y: toY(yNorm) })
    }

    // Clip to chart area so line/fill don't escape above PAD.t
    ctx.save()
    ctx.beginPath()
    ctx.rect(PAD.l, PAD.t, CW, CH)
    ctx.clip()

    // Area fill (goals)
    if (goalChrome > 0.01) {
      ctx.save(); ctx.globalAlpha = goalChrome
      ctx.beginPath()
      ctx.moveTo(linePts[0].x, H - PAD.b)
      linePts.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.lineTo(linePts[linePts.length - 1].x, H - PAD.b)
      ctx.closePath()
      const grad = ctx.createLinearGradient(0, PAD.t, 0, H - PAD.b)
      grad.addColorStop(0, 'rgba(94,107,87,0.18)')
      grad.addColorStop(1, 'rgba(94,107,87,0)')
      ctx.fillStyle = grad; ctx.fill()
      ctx.restore()
    }

    // Line
    const calm = easeOutCubic(volP)
    const vr = lerp(154, 94, calm), vg = lerp(92, 107, calm), vb = lerp(69, 87, calm)
    const lr = Math.round(lerp(vr, 35, em))
    const lg = Math.round(lerp(vg, 35, em))
    const lb = Math.round(lerp(vb, 35, em))
    ctx.beginPath()
    linePts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y) })
    ctx.strokeStyle = `rgb(${lr},${lg},${lb})`
    ctx.lineWidth = lerp(1.2, 2.5, em)
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.restore() // end chart-area clip

    // Trend dashed (volatility)
    if (volChrome > 0.01) {
      ctx.save(); ctx.globalAlpha = volChrome
      const startV = volNormS(0), endV = volNormS(1)
      const slope = Math.max(endV - startV, 0.04)
      ctx.beginPath()
      ctx.moveTo(toX(0), toY(startV))
      ctx.lineTo(toX(1), toY(clamp(startV + slope, 0, 1)))
      ctx.strokeStyle = `rgba(198,164,108,${0.22 + calm * 0.30})`
      ctx.lineWidth = 1.4; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([])
      ctx.restore()
    }

    // Start dot
    if (volChrome > 0.01) {
      ctx.save(); ctx.globalAlpha = volChrome
      ctx.beginPath(); ctx.arc(linePts[0].x, linePts[0].y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgb(${lr},${lg},${lb})`; ctx.fill()
      ctx.beginPath(); ctx.arc(linePts[0].x, linePts[0].y, 8, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},0.35)`; ctx.lineWidth = 1; ctx.stroke()
      ctx.restore()
    }

    // Endpoint dot
    const lastP = linePts[linePts.length - 1]
    ctx.beginPath(); ctx.arc(lastP.x, lastP.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#F5F4F1'
    ctx.strokeStyle = `rgb(${lr},${lg},${lb})`; ctx.lineWidth = 1.5
    ctx.fill(); ctx.stroke()

    // ── Playhead ──
    if (drawP > 0.001 && drawP < 0.999) {
      const xH = toX(drawP)
      const yH = toY(lerp(volNormS(drawP), goalNormAt(drawP), em))
      const glowR = lerp(20, 34, goalChrome)
      const coreR = lerp(4.5, 6, goalChrome)
      ctx.save()
      const g = ctx.createRadialGradient(xH, yH, 0, xH, yH, glowR)
      g.addColorStop(0, 'rgba(94,107,87,0.42)')
      g.addColorStop(1, 'rgba(94,107,87,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(xH, yH, glowR, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(xH, yH, coreR, 0, Math.PI * 2)
      ctx.fillStyle = '#5E6B57'; ctx.fill()
      ctx.strokeStyle = '#F5F4F1'; ctx.lineWidth = 2; ctx.stroke()
      ctx.restore()
    }

    // ── Event markers ──
    if (drawP > 0.001) {
      ctx.save()
      CURVE_EVENTS.forEach((ev, i) => {
        const eT  = ageToT(ev.age)
        const rev = clamp((drawP - eT + 0.05) / 0.05, 0, 1)
        if (rev <= 0.001) return
        ctx.globalAlpha = rev
        const ex = toX(eT)
        const ey = toY(lerp(volNormS(eT), goalNormAt(eT), em))
        ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#232323'; ctx.fill()

        const above = i % 2 === 0
        const offset = above ? -86 : 72
        const labelY = ey + offset
        ctx.globalAlpha = rev
        ctx.strokeStyle = 'rgba(35,35,35,0.2)'; ctx.lineWidth = 0.8
        ctx.setLineDash([2, 3])
        ctx.beginPath()
        ctx.moveTo(ex, ey + (above ? -8 : 8))
        ctx.lineTo(ex, labelY + (above ? 14 : -14))
        ctx.stroke(); ctx.setLineDash([])

        const bw = 116, bh = 30
        const bx = clamp(ex - bw / 2, PAD.l + 2, W - PAD.r - bw - 2)
        const by = above ? labelY : labelY - bh
        ctx.globalAlpha = rev
        ctx.fillStyle = '#F5F4F1'
        ctx.strokeStyle = 'rgba(35,35,35,0.2)'; ctx.lineWidth = 0.8
        ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh)
        ctx.font = "9px 'Inter', sans-serif"
        ctx.fillStyle = 'rgba(35,35,35,0.45)'; ctx.textAlign = 'center'
        ctx.fillText(ev.age + ' anos', bx + bw / 2, by + 11)
        ctx.font = "400 10px 'Inter', sans-serif"
        ctx.fillStyle = '#232323'
        ctx.fillText(ev.lbl, bx + bw / 2, by + 23)

        const delta = (ev as any).delta
        if (delta != null) {
          ctx.font = "9px 'Inter', sans-serif"
          ctx.fillStyle = (ev as any).tone === 'up' ? '#5E6B57' : 'rgba(35,35,35,0.4)'
          ctx.textAlign = 'left'
          const sign = delta > 0 ? '+' : ''
          ctx.fillText(`${sign}${delta}M`, bx + bw + 6, by + 18)
        }
      })
      ctx.restore()
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
