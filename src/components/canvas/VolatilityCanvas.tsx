import { useRef } from 'react'
import { useCanvasTicker } from '../../hooks/useCanvasTicker'
import { clamp, lerp, easeOutCubic, gauss } from '../../utils/math'

interface Props { prog: number }

export default function VolatilityCanvas({ prog }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const seriesRef = useRef<number[] | null>(null)
  const progRef = useRef(prog)
  progRef.current = prog

  if (!seriesRef.current) {
    const N = 2600
    const drift = 0.0018, vol = 0.012
    const s = [1]
    for (let i = 1; i < N; i++) {
      s.push(s[i - 1] * (1 + drift + vol * gauss()))
    }
    seriesRef.current = s
  }

  useCanvasTicker(() => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr
    }
    if (W < 1 || H < 1) return
    const ctx = canvas.getContext('2d')!
    ctx.resetTransform(); ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)
    const prog = progRef.current

    const series = seriesRef.current!
    const labels = ['6 MESES', '1 ANO', '3 ANOS', '5 ANOS', '10 ANOS']

    const minN = 120, maxN = 2520
    const n = Math.max(minN, Math.floor(minN + (maxN - minN) * easeOutCubic(clamp(prog, 0, 1))))
    const data = series.slice(0, n)

    const smoothHW = Math.floor(Math.pow(clamp(prog, 0, 1), 1.35) * 380)
    let displayData: number[] | Float64Array
    if (smoothHW < 1) {
      displayData = data
    } else {
      const ps = new Float64Array(data.length + 1)
      for (let i = 0; i < data.length; i++) ps[i + 1] = ps[i] + data[i]
      const d = new Float64Array(data.length)
      for (let i = 0; i < data.length; i++) {
        const a = Math.max(0, i - smoothHW)
        const b = Math.min(data.length, i + smoothHW + 1)
        d[i] = (ps[b] - ps[a]) / (b - a)
      }
      displayData = d
    }

    let minV = Infinity, maxV = -Infinity
    for (const v of displayData) { if (v < minV) minV = v; if (v > maxV) maxV = v }
    const pad = (maxV - minV) * 0.08
    minV -= pad; maxV += pad

    const expand = 1 + Math.pow(clamp(prog, 0, 1), 1.5) * 1.25
    const center = (minV + maxV) / 2
    const half   = (maxV - minV) / 2 * expand
    minV = center - half
    maxV = center + half
    if (minV < displayData[0]) minV = displayData[0]
    if (maxV <= minV) maxV = minV + 1

    const PAD = { l: 104, r: 120, t: 176, b: 72 }
    const CW = W - PAD.l - PAD.r
    const CH = H - PAD.t - PAD.b
    const rightFrac = lerp(0.30, 1.0, easeOutCubic(clamp(prog, 0, 1)))
    const usableW = CW * rightFrac
    const toX = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * usableW
    const toY = (v: number) => PAD.t + (1 - (v - minV) / (maxV - minV)) * CH
    const data0 = displayData[0]

    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + i * CH / 4
      ctx.strokeStyle = 'rgba(35,35,35,0.06)'
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
      const v = maxV - (i / 4) * (maxV - minV)
      const pct = (v / data0 - 1) * 100
      ctx.font = "10px 'Inter', sans-serif"
      ctx.fillStyle = 'rgba(35,35,35,0.42)'
      ctx.textAlign = 'right'
      ctx.fillText((pct >= 0 ? '+' : '') + pct.toFixed(0) + '%', PAD.l - 12, y + 3.5)
    }
    ctx.strokeStyle = 'rgba(35,35,35,0.14)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(PAD.l, H - PAD.b); ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke()
    ctx.font = "700 9px 'Syncopate', sans-serif"
    ctx.fillStyle = 'rgba(35,35,35,0.4)'
    ctx.textAlign = 'left'
    ctx.save()
    ctx.translate(PAD.l - 64, PAD.t + CH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('VARIAÇÃO', 0, 0)
    ctx.restore()

    const renderN = Math.min(700, n)
    ctx.beginPath()
    for (let i = 0; i < renderN; i++) {
      const di = Math.round(i / (renderN - 1) * (n - 1))
      const x = toX(di), y = toY(displayData[di])
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    const calm = easeOutCubic(prog)
    const r = Math.round(lerp(154, 94, calm))
    const g = Math.round(lerp(92, 107, calm))
    const b = Math.round(lerp(69, 87, calm))
    ctx.strokeStyle = `rgb(${r},${g},${b})`
    ctx.lineWidth = 1.2
    ctx.lineJoin = 'round'
    ctx.stroke()

    {
      const lastIdx = n - 1
      const startV = data0
      const rawSlope = (displayData[lastIdx] - startV) / Math.max(1, lastIdx)
      const slope = Math.max(rawSlope, startV * 0.00012)
      const trendAlpha = 0.22 + easeOutCubic(prog) * 0.30
      ctx.beginPath()
      ctx.moveTo(toX(0), toY(startV))
      ctx.lineTo(toX(lastIdx), toY(startV + slope * lastIdx))
      ctx.strokeStyle = `rgba(198,164,108,${trendAlpha})`
      ctx.lineWidth = 1.4
      ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([])
    }

    ctx.beginPath()
    ctx.arc(PAD.l, toY(data0), 4.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fill()
    ctx.beginPath()
    ctx.arc(PAD.l, toY(data0), 8, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`; ctx.lineWidth = 1; ctx.stroke()

    const lastIdx = n - 1
    ctx.beginPath()
    ctx.arc(toX(lastIdx), toY(displayData[lastIdx]), 5, 0, Math.PI * 2)
    ctx.fillStyle = '#F5F4F1'
    ctx.strokeStyle = `rgb(${r},${g},${b})`
    ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke()

    const stepF = clamp(prog, 0, 0.9999) * labels.length
    const stepIdx = Math.min(labels.length - 1, Math.floor(stepF))
    const stepFrac = stepF - stepIdx
    const nextLbl = labels[Math.min(labels.length - 1, stepIdx + 1)]
    const janelaX = W - PAD.r - 270

    ctx.font = "700 10px 'Syncopate', sans-serif"
    ctx.fillStyle = 'rgba(35,35,35,0.45)'
    ctx.textAlign = 'left'
    ctx.fillText('JANELA', janelaX, PAD.t - 64)

    ctx.save()
    ctx.font = "700 24px 'Syncopate', sans-serif"
    ctx.textAlign = 'left'
    const fadeOutStart = 0.78
    if (stepFrac < fadeOutStart) {
      ctx.fillStyle = '#232323'; ctx.globalAlpha = 1
    } else {
      const t = (stepFrac - fadeOutStart) / (1 - fadeOutStart)
      ctx.fillStyle = '#232323'; ctx.globalAlpha = 1 - t
    }
    ctx.fillText(labels[stepIdx], janelaX, PAD.t - 32)
    if (stepFrac > fadeOutStart && nextLbl !== labels[stepIdx]) {
      const t = (stepFrac - fadeOutStart) / (1 - fadeOutStart)
      ctx.globalAlpha = t
      ctx.fillStyle = '#5E6B57'
      ctx.fillText(nextLbl, janelaX, PAD.t - 32)
    }
    ctx.restore()

    const volPct = (maxV - minV) / data0 * 100
    ctx.font = "700 10px 'Syncopate', sans-serif"
    ctx.fillStyle = 'rgba(35,35,35,0.45)'
    ctx.textAlign = 'right'
    ctx.fillText('AMPLITUDE', W - PAD.r, PAD.t - 64)
    ctx.font = `600 ${volPct > 999 ? 18 : volPct > 99 ? 20 : 22}px 'Inter', sans-serif`
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillText(volPct.toFixed(1) + '%', W - PAD.r, PAD.t - 32)

    ctx.font = "10px 'Inter', sans-serif"
    ctx.fillStyle = 'rgba(35,35,35,0.45)'
    ctx.textAlign = 'left'
    ctx.fillText('hoje', PAD.l, H - PAD.b + 20)
    const endX = clamp(toX(lastIdx), PAD.l + 40, W - PAD.r)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(35,35,35,0.55)'
    ctx.fillText(labels[stepIdx].toLowerCase(), endX, H - PAD.b + 20)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
