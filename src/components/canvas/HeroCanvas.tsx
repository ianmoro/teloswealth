import { useRef } from 'react'
import { useCanvasTicker } from '../../hooks/useCanvasTicker'
import { clamp } from '../../utils/math'

interface Props { prog: number }

export default function HeroCanvas({ prog }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const progRef = useRef(prog)
  progRef.current = prog

  useCanvasTicker((time) => {
    const canvas = ref.current; if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth, H = canvas.offsetHeight
    if (W < 1 || H < 1) return
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr; canvas.height = H * dpr
    }
    const ctx = canvas.getContext('2d')!
    ctx.resetTransform(); ctx.scale(dpr, dpr)
    const prog = progRef.current
    ctx.clearRect(0, 0, W, H)

    const reveal = clamp((prog - 0.05) / 0.85, 0, 1)
    const horY = H * 0.66

    // X-ray layer
    ctx.save()
    ctx.globalAlpha = reveal

    ctx.fillStyle = '#0A0A0A'
    ctx.fillRect(0, 0, W, H)

    // Blueprint grid
    ctx.strokeStyle = 'rgba(168,176,162,0.04)'
    ctx.lineWidth = 0.5
    const gridSize = 56
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Horizon line
    ctx.strokeStyle = 'rgba(168,176,162,0.18)'
    ctx.lineWidth = 0.6
    ctx.setLineDash([3, 5])
    ctx.beginPath(); ctx.moveTo(0, horY); ctx.lineTo(W, horY); ctx.stroke()
    ctx.setLineDash([])

    // Pulsing measurement marks
    for (let i = 0; i < 12; i++) {
      const x = (W / 12) * i + (time * 0.012 % (W / 12))
      const blink = (Math.sin(time * 0.002 + i) + 1) * 0.5
      ctx.fillStyle = `rgba(198,164,108,${0.2 + blink * 0.3})`
      ctx.fillRect(x, horY - 2, 1, 4)
    }

    ctx.restore()

    // Scan line
    const scanProg = reveal
    if (scanProg > 0.02 && scanProg < 0.98) {
      const sy = scanProg * H
      const scanGrad = ctx.createLinearGradient(0, sy - 60, 0, sy + 60)
      scanGrad.addColorStop(0, 'rgba(198,164,108,0)')
      scanGrad.addColorStop(0.5, 'rgba(198,164,108,0.45)')
      scanGrad.addColorStop(1, 'rgba(198,164,108,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, sy - 60, W, 120)
      ctx.fillStyle = 'rgba(245,244,241,0.85)'
      ctx.fillRect(0, sy - 0.5, W, 1)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
