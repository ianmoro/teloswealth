import { useState, useEffect, useRef } from 'react'
import { clamp, ease, lerp } from './utils/math'
import { PILARES, TEAM, LOCATIONS } from './data'
import { Logo } from './components/Logo'
import HeroCanvas from './components/canvas/HeroCanvas'
import TelosMorphCanvas from './components/canvas/TelosMorphCanvas'
import TreeCanvas from './components/canvas/TreeCanvas'
import VolGoalsCanvas from './components/canvas/VolGoalsCanvas'
import ArtigosPage from './pages/ArtigosPage'
import MobileSite from './pages/MobileSite'

function getSectionProgress(el: HTMLElement | null) {
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const scrollable = el.offsetHeight - window.innerHeight
  if (scrollable <= 0) return rect.top < window.innerHeight * 0.5 ? 1 : 0
  return clamp(-rect.top / scrollable, 0, 1)
}

function scrollToEl(el: HTMLElement | null) {
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: 'smooth' })
}

const VULN_READY_P = 0.82

export default function App() {
  const heroRef = useRef<HTMLElement>(null)
  const famRef  = useRef<HTMLElement>(null)
  const objRef  = useRef<HTMLElement>(null)
  const vulnRef = useRef<HTMLElement>(null)
  const metRef  = useRef<HTMLElement>(null)
  const teamRef     = useRef<HTMLElement>(null)
  const conteudoRef = useRef<HTMLElement>(null)
  const ctaRef      = useRef<HTMLElement>(null)

  const [P, setP] = useState({ hero: 0, fam: 0, obj: 0, vuln: 0, met: 0, team: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [selectedMember, setSelectedMember] = useState<typeof TEAM[0] | null>(null)
  const [previewPdf, setPreviewPdf] = useState<{ label: string; file: string } | null>(null)

  const [page, setPage] = useState<'home' | 'artigos'>('home')
  const [vulnFromMenu, setVulnFromMenu] = useState(false)
  const menuScrollLock = useRef(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const id = setTimeout(() => setMounted(true), 60); return () => clearTimeout(id) }, [])

  const goToVulnerabilidades = () => {
    setVulnFromMenu(true)
    menuScrollLock.current = true
    const el = vulnRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const scrollable = Math.max(0, el.offsetHeight - window.innerHeight)
    window.scrollTo({ top: top + scrollable * VULN_READY_P, behavior: 'auto' })
    requestAnimationFrame(() => {
      setTimeout(() => { menuScrollLock.current = false }, 150)
    })
  }

  useEffect(() => {
    const clearMenuVuln = () => {
      if (menuScrollLock.current) return
      setVulnFromMenu(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) clearMenuVuln()
    }
    window.addEventListener('wheel', clearMenuVuln, { passive: true })
    window.addEventListener('touchmove', clearMenuVuln, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', clearMenuVuln)
      window.removeEventListener('touchmove', clearMenuVuln)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  useEffect(() => {
    const checkSize = () => { setIsMobile(window.innerWidth < 768); setIsTablet(window.innerWidth < 1024) }
    window.addEventListener('resize', checkSize, { passive: true })
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const startM = 10

  useEffect(() => {
    let ticking = false
    const update = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        setP({
          hero:     getSectionProgress(heroRef.current),
          fam:      getSectionProgress(famRef.current),
          obj:      getSectionProgress(objRef.current),
          vuln:     getSectionProgress(vulnRef.current),

          met:      getSectionProgress(metRef.current),
          team:     getSectionProgress(teamRef.current),
        })
        ticking = false
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  const heroDark = scrollY > window.innerHeight * 1.4 && scrollY < window.innerHeight * 3.4
  const isOverDark = heroDark
  const heroReveal = clamp((P.hero - 0.05) / 0.85, 0, 1)
  const heroPhrase1 = (mounted ? 1 : 0) * clamp(1 - (heroReveal - 0.30) / 0.16, 0, 1)
  const heroPhrase2 = clamp((heroReveal - 0.62) / 0.20, 0, 1)


  if (page === 'artigos') return <ArtigosPage onBack={() => setPage('home')} isMobile={isMobile} />
  if (isMobile) return <MobileSite onArtigos={() => setPage('artigos')} />

  return (
    <div>

      {/* ─── NAV ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: isMobile ? 60 : 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 20px' : '0 56px', background: isOverDark ? 'rgba(10,10,10,0.4)' : 'rgba(245,244,241,0.86)', backdropFilter: 'blur(14px)', borderBottom: isOverDark ? '1px solid rgba(245,244,241,0.06)' : '1px solid rgba(10,10,10,0.06)', transition: 'background .4s, border-color .4s' }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer', filter: isOverDark ? 'invert(1) brightness(1.6)' : 'none', transition: 'filter .4s' }}>
          <Logo size={40} />
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            {([
              ['Família', () => {
                const el = famRef.current; if (!el) return
                const top = el.getBoundingClientRect().top + window.scrollY
                window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * 0.45, behavior: 'smooth' })
              }],
              ['Curva de Objetivos', () => {
                const el = objRef.current; if (!el) return
                const top = el.getBoundingClientRect().top + window.scrollY
                window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * 0.40, behavior: 'smooth' })
              }],
              ['Vulnerabilidades',  goToVulnerabilidades],
              ['Pilares',           () => scrollToEl(metRef.current)],
              ['Time',              () => scrollToEl(teamRef.current)],
            ] as [string, () => void][]).map(([l, fn]) => (
              <a key={l} onClick={fn} className="syncop" style={{ fontSize: 11, color: isOverDark ? 'rgba(245,244,241,0.85)' : '#0A0A0A', cursor: 'pointer', transition: 'color .4s' }}>{l}</a>
            ))}
            <a onClick={() => scrollToEl(conteudoRef.current)} className="syncop" style={{ fontSize: 11, color: isOverDark ? 'rgba(245,244,241,0.85)' : '#0A0A0A', cursor: 'pointer', transition: 'color .4s' }}>Conteúdo</a>
          </div>
        )}
        <button onClick={() => scrollToEl(ctaRef.current)} className="syncop" style={{ fontSize: isMobile ? 8 : 9, background: isOverDark ? 'rgba(245,244,241,0.92)' : '#0A0A0A', color: isOverDark ? '#0A0A0A' : '#F5F4F1', border: 'none', padding: isMobile ? '10px 16px' : '13px 26px', cursor: 'pointer', transition: 'all .4s', letterSpacing: '0.32em' }}>Diagnóstico</button>
      </nav>

      {/* ─── HERO (320vh) ─── */}
      <section ref={heroRef} style={{ height: '180vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#1a1208' }}>

          <video
            muted loop playsInline
            src="/hero-0717.mp4"
            ref={(el) => {
              if (!el || (el as any)._telosInit) return
              ;(el as any)._telosInit = true
              el.muted = true
              const tryPlay = () => {
                if (!el.paused) return
                el.play().catch(() => setTimeout(tryPlay, 300))
              }
              el.addEventListener('canplaythrough', tryPlay, { once: true })
              el.addEventListener('loadedmetadata', tryPlay, { once: true })
              tryPlay()
            }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 1 - heroReveal, pointerEvents: 'none', zIndex: 0 }}
          />

          <HeroCanvas prog={P.hero} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 40px', pointerEvents: 'none' }}>
            <h1 className="serif" style={{ position: 'absolute', left: isMobile ? '20px' : '80px', top: '50%', transform: `translateY(calc(-50% + ${(1 - heroPhrase1) * 20}px))`, width: isMobile ? 'calc(100% - 40px)' : '50%', maxWidth: 680, fontSize: 'clamp(22px,2.8vw,48px)', lineHeight: 1.12, color: '#F5F4F1', opacity: heroPhrase1, transition: 'transform .25s linear', textAlign: 'left', textShadow: '0 2px 18px rgba(0,0,0,0.55)', background: 'rgba(18,20,18,0.32)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', padding: '22px 26px', borderRadius: 6 }}>
              Investimentos e planejamento patrimonial.<br />Para essa geração <em style={{ color: '#89B45A' }}>e para as próximas.</em>
            </h1>
            <h1 className="serif" style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,calc(-50% + ${(1 - heroPhrase2) * 22}px))`, width: isMobile ? 'calc(100% - 40px)' : 'calc(100% - 80px)', maxWidth: 1240, fontSize: 'clamp(28px,4.4vw,68px)', lineHeight: 1.14, color: '#F5F4F1', opacity: heroPhrase2, transition: 'transform .25s linear', textShadow: '0 0 50px rgba(0,0,0,0.4)' }}>
              Nosso trabalho é garantir tranquilidade com um <em style={{ color: '#C6A46C' }}>planejamento patrimonial completo e independente.</em>
            </h1>
          </div>

          <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', opacity: Math.max(0, 1 - P.hero * 3), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
            <div className="syncop" style={{ fontSize: 8, color: 'rgba(35,35,35,0.5)' }}>Scroll</div>
            <div style={{ width: 1, height: 38, background: 'linear-gradient(to bottom, rgba(35,35,35,0.45), transparent)', animation: 'scrollPulse 2.2s ease-in-out infinite' }} />
          </div>

        </div>
      </section>

      {/* ─── FAMÍLIA (340vh) ─── */}
      <section ref={famRef} style={{ height: '200vh', position: 'relative', background: '#F5F4F1' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', padding: isMobile ? '0 24px' : '0 80px' }}>
          {(() => {
            const treeProg = clamp((P.fam - 0.16) / 0.52, 0, 1)
            const blurP    = clamp((P.fam - 0.72) / 0.16, 0, 1)
            const p1 = clamp((P.fam - 0.02) / 0.05, 0, 1)
            const p2 = clamp((P.fam - 0.78) / 0.10, 0, 1)
            return (
              <div style={{ height: '100%', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(320px,38%) 1fr', gridTemplateRows: isMobile ? 'auto 1fr' : undefined, gap: isMobile ? 12 : 40, alignItems: isMobile ? 'start' : 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 30, padding: isMobile ? '20px 0 0' : '40px 0' }}>
                  <div className="eyebrow eyebrow-terra" style={{ opacity: p1 }}>01 · Família</div>
                  <p className="serif" style={{ fontSize: 'clamp(26px,2.6vw,42px)', lineHeight: 1.22, color: '#0A0A0A', opacity: p1 * (1 - blurP * 0.15), transform: `translateY(${(1 - p1) * 16}px)`, transition: 'transform .4s' }}>
                    Entendemos <em style={{ color: '#414E3A' }}>onde a sua família está</em>
                  </p>
                  <p className="serif" style={{ fontSize: 'clamp(26px,2.6vw,42px)', lineHeight: 1.22, color: '#0A0A0A', fontStyle: 'italic', opacity: p2, transform: `translateY(${(1 - p2) * 18}px)`, transition: 'transform .4s' }}>
                    e <em style={{ color: '#414E3A' }}>onde ela quer chegar.</em>
                  </p>
                </div>
                <div style={{ position: 'relative', height: '100%', padding: isMobile ? '16px 0 24px' : '70px 0 40px', filter: `blur(${(blurP * 6).toFixed(2)}px)`, opacity: 1 - blurP * 0.42, transition: 'opacity .3s' }}>
                  <TreeCanvas prog={treeProg} />
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ─── ALOCAÇÃO → OBJETIVOS (1000vh) ─── */}
      <section ref={objRef} style={{ height: '550vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {(() => {
            const shrinkP  = ease(clamp((P.obj - 0.03) / 0.10, 0, 1))
            const volMap   = clamp((P.obj - 0.10) / 0.32, 0, 1)
            const morphMap = clamp((P.obj - 0.44) / 0.16, 0, 1)
            const drawMap  = clamp((P.obj - 0.16) / 0.70, 0, 1)
            const anchored = shrinkP > 0.45
            const curveOut = clamp((P.obj - 0.87) / 0.07, 0, 1)
            const phraseIn = clamp((P.obj - 0.89) / 0.07, 0, 1)

            const fs    = lerp(56, 33, shrinkP)
            const left  = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 168, shrinkP)}px)`
            const top   = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 108, shrinkP)}px)`
            const tx    = lerp(-50, 0, shrinkP)
            const ty    = lerp(-50, 0, shrinkP)
            const width = lerp(1120, 520, shrinkP)

            // Flying word shared style
            const flyWord = (delay = 0) => {
              const p = ease(clamp((P.obj - (0.80 + delay)) / 0.09, 0, 1))
              return {
                display: 'inline-block' as const,
                opacity: 1 - p,
                transform: `translateY(${p * 80}px)`,
              }
            }
            const arrWord = (delay = 0) => {
              const p = ease(clamp((P.obj - (0.89 + delay)) / 0.07, 0, 1))
              return {
                display: 'inline-block' as const,
                opacity: p,
                transform: `translateY(${(1 - p) * -60}px)`,
              }
            }

            return (
              <>
                {/* Chart layer */}
                <div style={{ position: 'absolute', inset: 0, opacity: clamp((shrinkP - 0.25) / 0.4, 0, 1) * (1 - curveOut), display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <VolGoalsCanvas volProg={volMap} morphProg={morphMap} drawProg={drawMap} startM={startM} />
                  </div>
                  {/* scroll hint — volatility window */}
                  <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: clamp((shrinkP - 0.5) / 0.3, 0, 1) * clamp(1 - (volMap - 0.85) / 0.1, 0, 1) * (1 - morphMap), pointerEvents: 'none' }}>
                    <p style={{ fontSize: 11, color: 'rgba(35,35,35,0.45)', fontWeight: 300, fontStyle: 'italic' }}>
                      Role para esticar a janela de observação.
                    </p>
                  </div>
                </div>

                {/* Phrase — shrinks & migrates to top-left, then anchors */}
                <div style={{ position: 'absolute', left, top, width, transform: `translate(${tx}%,${ty}%)`, opacity: 1 - phraseIn, pointerEvents: 'none', zIndex: 4, willChange: 'left,top,transform', padding: anchored ? '12px 16px 16px 0' : undefined }}>
                  <div className="eyebrow eyebrow-terra" style={{ marginBottom: 10, opacity: clamp((shrinkP - 0.6) / 0.3, 0, 1) }}>
                    02 · Objetivos
                  </div>
                  <h2 className="serif" style={{ fontSize: fs, lineHeight: anchored ? 1.22 : 1.12, textAlign: anchored ? 'left' : 'center', color: '#0A0A0A', margin: '0 auto', overflow: 'visible' }}>
                    Construímos um{' '}
                    <em style={{ color: '#414E3A', ...flyWord(0) }}>plano</em>{' '}
                    que <em style={{ color: '#414E3A' }}>maximiza a conquista</em> dos seus objetivos e{' '}
                    <em style={{ color: '#414E3A', ...flyWord(0.01) }}>resiste</em>{' '}
                    ao tempo.
                  </h2>
                </div>

                {/* Bridge phrase — "plano" and "resiste" slots empty until words arrive */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px', opacity: phraseIn, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
                  <h2 className="serif" style={{ fontSize: 'clamp(34px,4.2vw,68px)', lineHeight: 1.18, maxWidth: 1280, textAlign: 'center', color: '#0A0A0A' }}>
                    Um{' '}
                    <em style={{ color: '#414E3A', ...arrWord(0) }}>plano</em>{' '}
                    que{' '}
                    <em style={{ color: '#414E3A', ...arrWord(0.01) }}>resiste</em>{' '}
                    ao previsível<br />
                    e que está preparado <em style={{ color: '#414E3A' }}>para o que não é.</em>
                  </h2>
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* ─── VULNERABILIDADES (700vh) ─── */}
      <section ref={vulnRef} style={{ height: '500vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#F5F4F1' }}>
          {(() => {
            const p = vulnFromMenu ? VULN_READY_P : P.vuln

            // circles & matrix fade out, then logo morph fades in
            const matrixAlpha = 1 - ease(clamp((p - 0.60) / 0.14, 0, 1))
            const logoAlpha   = ease(clamp((p - 0.64) / 0.08, 0, 1))
            // map vuln progress 0.65→0.98 → TelosMorphCanvas sectionProg 0.72→1.0
            const morphProg   = 0.72 + clamp((p - 0.65) / 0.33, 0, 1) * 0.28

            const headIn  = clamp((p - 0.03) / 0.06, 0, 1)
            const frameIn = ease(clamp((p - 0.10) / 0.10, 0, 1))
            const hint    = vulnFromMenu ? 0 : clamp((p - 0.16) / 0.04, 0, 1) * clamp(1 - (p - 0.74) / 0.05, 0, 1)

            const SPHERES: { lbl: string; x: number; y: number; r: number }[] = [
              { lbl: 'Riscos e Seguros',          x: 0.19, y: 0.82, r: 124 },
              { lbl: 'Planejamento de Objetivos', x: 0.36, y: 0.55, r: 142 },
              { lbl: 'Planejamento Tributário',   x: 0.60, y: 0.77, r: 120 },
              { lbl: 'Sucessório',                x: 0.80, y: 0.63, r: 116 },
              { lbl: 'Gestão de Ativos',          x: 0.29, y: 0.27, r: 122 },
              { lbl: 'Previdência',               x: 0.75, y: 0.25, r: 116 },
            ]
            const SEQ0 = 0.20, SEQ_STEP = 0.105, SEQ_DUR = 0.075

            const quad: [string, { top?: number; bottom?: number; left?: number; right?: number }][] = [
              ['Prioridade',      { top: 12,    left: 14  }],
              ['Agir',            { top: 12,    right: 14 }],
              ['Agir',            { bottom: 12, left: 14  }],
              ['Não prioritário', { bottom: 12, right: 14 }],
            ]

            return (
              <>
                {/* cabeçalho — desaparece junto com a matriz */}
                <div style={{ position: 'absolute', top: 88, left: 80, maxWidth: 760, opacity: headIn * matrixAlpha, pointerEvents: 'none', zIndex: 3 }}>
                  <div className="eyebrow eyebrow-terra" style={{ marginBottom: 14 }}>— 03 · Vulnerabilidades</div>
                  <h2 className="serif" style={{ fontSize: 'clamp(23px,2.2vw,33px)', lineHeight: 1.3, color: '#0A0A0A' }}>
                    Mapeamos as <em style={{ color: '#414E3A', fontStyle: 'normal' }}>vulnerabilidades patrimoniais</em> que podem comprometer o plano e as <em style={{ color: '#414E3A', fontStyle: 'normal' }}>resolvemos</em> ao longo do tempo.
                  </h2>
                </div>

                {/* matriz esforço × impacto — some ao rolar para o final */}
                <div style={{
                  position: 'absolute',
                  left: 'calc(50% + 26px)',
                  top: '58%',
                  transform: 'translate(-50%,-50%)',
                  width: 'min(800px,58vw)',
                  height: 'min(516px,52vh)',
                  opacity: matrixAlpha,
                }}>
                  <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(10,10,10,0.07)', opacity: frameIn }} />
                  <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 0, borderLeft: '1px dotted rgba(10,10,10,0.22)', opacity: frameIn, transform: `scaleY(${frameIn})`, transformOrigin: 'center' }} />
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 0, borderTop: '1px dotted rgba(10,10,10,0.22)', opacity: frameIn, transform: `scaleX(${frameIn})`, transformOrigin: 'center' }} />
                  <div style={{ position: 'absolute', left: -64, top: 0, bottom: 0, width: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', opacity: frameIn }}>
                    <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.42)', letterSpacing: '0.2em' }}>Alto</span>
                    <span className="syncop" style={{ fontSize: 9, color: '#9A5C45', letterSpacing: '0.3em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Impacto</span>
                    <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.42)', letterSpacing: '0.2em' }}>Baixo</span>
                  </div>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: -44, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: frameIn }}>
                    <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.42)', letterSpacing: '0.2em' }}>Baixo</span>
                    <span className="syncop" style={{ fontSize: 9, color: '#9A5C45', letterSpacing: '0.3em' }}>Esforço</span>
                    <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.42)', letterSpacing: '0.2em' }}>Alto</span>
                  </div>
                  {quad.map(([t, pos], qi) => (
                    <span key={qi} className="syncop" style={{ position: 'absolute', ...pos, fontSize: 8.5, color: 'rgba(154,92,69,0.78)', letterSpacing: '0.24em', opacity: frameIn }}>{t}</span>
                  ))}
                  {SPHERES.map((s, i) => {
                    const rev = ease(clamp((p - (SEQ0 + i * SEQ_STEP)) / SEQ_DUR, 0, 1))
                    const sc  = lerp(0.55, 1, rev)
                    return (
                      <div key={i} style={{
                        position: 'absolute',
                        left: `${s.x * 100}%`,
                        top: `${(1 - s.y) * 100}%`,
                        width: s.r,
                        height: s.r,
                        marginLeft: -s.r / 2,
                        marginTop: -s.r / 2,
                        opacity: rev,
                        transform: `scale(${sc})`,
                        transformOrigin: 'center',
                        pointerEvents: 'none',
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at 38% 30%, rgba(198,164,108,0.30), rgba(198,164,108,0.13) 58%, rgba(198,164,108,0.05) 100%)',
                          border: '1px solid rgba(198,164,108,0.5)',
                          boxShadow: '0 10px 34px rgba(154,92,69,0.07)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 14px',
                        }}>
                          <span className="serif" style={{ fontSize: 'clamp(12px,1.05vw,15px)', lineHeight: 1.22, color: '#2A2A28', textAlign: 'center' }}>{s.lbl}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* scroll hint */}
                <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', opacity: hint * matrixAlpha }}>
                  <span className="syncop" style={{ fontSize: 9, color: 'rgba(154,92,69,0.7)', letterSpacing: '0.42em' }}>— role · cada esfera encontra seu lugar na matriz —</span>
                </div>

                {/* logo morph — aparece no lugar da matriz ao rolar */}
                {logoAlpha > 0.01 && (
                  <div style={{ position: 'absolute', inset: 0, opacity: logoAlpha, pointerEvents: 'none' }}>
                    <TelosMorphCanvas sectionProg={morphProg} />
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </section>

      {/* ─── NOSSOS PILARES (520vh) ─── */}
      <section ref={metRef} style={{ height: '300vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: isMobile ? '64px 24px 20px' : '88px 80px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
            <div style={{ maxWidth: 760 }}>
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 14 }}>04 · Nossos pilares</div>
              <h2 className="serif" style={{ fontSize: 'clamp(26px,2.6vw,38px)', lineHeight: 1.2, color: '#0A0A0A' }}>
                Os princípios que guiam <em style={{ color: '#414E3A' }}>cada decisão.</em>
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span className="syncop" style={{ fontSize: 9, color: 'rgba(10,10,10,0.45)' }}>
                {String(Math.min(PILARES.length, Math.max(1, Math.floor(P.met * PILARES.length) + 1))).padStart(2, '0')} / {String(PILARES.length).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {PILARES.map((_, i) => {
                  const active = Math.floor(P.met * PILARES.length) === i
                  return <div key={i} style={{ width: active ? 28 : 14, height: 2, background: active ? '#414E3A' : 'rgba(10,10,10,0.18)', transition: 'all .35s' }} />
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', display: 'flex', transform: `translateX(${-P.met * (PILARES.length - 1) * 100}vw)`, willChange: 'transform' }}>
              {PILARES.map((pil, i) => {
                return (
                  <div key={i}
                    style={{ width: '100vw', height: '100%', flexShrink: 0, padding: isMobile ? '28px 24px' : '80px 12vw', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 80, alignItems: isMobile ? 'start' : 'center', borderRight: i < PILARES.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div className="serif" style={{ fontSize: isMobile ? 'clamp(60px,18vw,96px)' : 'clamp(160px,15vw,250px)', color: 'rgba(65,78,58,0.30)', lineHeight: 0.85, letterSpacing: '-0.02em' }}>{pil.n}</div>
                      <div style={{ width: 60, height: 1, background: '#414E3A' }} />
                      <div className="eyebrow eyebrow-terra">Pilar {pil.n}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 540 }}>
                      <h3 className="serif" style={{ fontSize: isMobile ? 'clamp(28px,7vw,48px)' : 'clamp(40px,4.4vw,72px)', lineHeight: 1.04, color: '#0A0A0A', letterSpacing: '-0.005em' }}>{pil.lbl}</h3>
                      <div style={{ position: 'relative', minHeight: 150 }}>
                        <p style={{ fontSize: isMobile ? 15 : 19, fontWeight: 300, lineHeight: 1.75, color: 'rgba(35,35,35,0.7)' }}>{pil.def}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: isMobile ? '10px 24px 14px' : '18px 80px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,10,10,0.06)', flexShrink: 0 }}>
            <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.35)' }}>
              {PILARES[Math.min(PILARES.length - 1, Math.floor(P.met * PILARES.length))].lbl}
            </span>
            <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.35)' }}>
              {isMobile ? '↑ role para avançar' : '← role para avançar · passe o mouse para ler →'}
            </span>
          </div>
        </div>
      </section>

      {/* ─── TIME ─── */}
      <section ref={teamRef} style={{ background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)', padding: isMobile ? '80px 24px 80px' : '140px 80px 120px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? 32 : 96, marginBottom: isMobile ? 40 : 80, alignItems: 'end' }}>
            <div>
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 24 }}>05 · Nosso Time</div>
              <h2 className="serif" style={{ fontSize: 'clamp(36px,4vw,62px)', lineHeight: 1.1, color: '#0A0A0A' }}>
                Nosso Time
              </h2>
            </div>
            <div style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(10,10,10,0.12)', borderTop: isMobile ? '1px solid rgba(10,10,10,0.12)' : 'none', paddingLeft: isMobile ? 0 : 36, paddingTop: isMobile ? 24 : 0 }}>
              <div className="serif" style={{ fontSize: isMobile ? 48 : 64, color: '#414E3A', lineHeight: 1 }}>+R$700M</div>
              <div style={{ fontSize: 13, color: 'rgba(10,10,10,0.5)', marginTop: 8, letterSpacing: '0.05em' }}>sob aconselhamento</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, background: 'transparent', marginTop: 8 }}>
            {TEAM.map((p, i) => (
              <div key={i} onClick={() => p.bio ? setSelectedMember(p) : window.open(p.li, '_blank')}
                style={{ background: '#ECEAE5', border: '1px solid rgba(10,10,10,0.08)', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', transition: 'background .35s', color: '#0A0A0A', overflow: 'hidden', width: isMobile ? 'calc(50% - 8px)' : isTablet ? 'calc(50% - 8px)' : 'calc(25% - 12px)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = '#0A0A0A'; el.style.color = '#F5F4F1'; el.querySelectorAll<HTMLElement>('[data-cert]').forEach(x => x.style.color = '#A8B0A2'); el.querySelectorAll<HTMLElement>('[data-role]').forEach(x => x.style.color = 'rgba(245,244,241,0.4)'); el.querySelectorAll<HTMLElement>('[data-li]').forEach(x => x.style.opacity = '1') }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = '#ECEAE5'; el.style.color = '#0A0A0A'; el.querySelectorAll<HTMLElement>('[data-cert]').forEach(x => x.style.color = '#414E3A'); el.querySelectorAll<HTMLElement>('[data-role]').forEach(x => x.style.color = 'rgba(10,10,10,0.4)'); el.querySelectorAll<HTMLElement>('[data-li]').forEach(x => x.style.opacity = '0') }}>
                <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div>
                    <div className="serif" style={{ fontSize: isMobile ? 16 : 20, lineHeight: 1.2, marginBottom: 4 }}>{p.name}</div>
                    <div data-role style={{ fontSize: 10, color: 'rgba(10,10,10,0.4)', letterSpacing: '0.08em', marginBottom: 4, transition: 'color .35s' }}>{p.role}</div>
                    <div data-cert className="syncop" style={{ fontSize: 8, color: '#414E3A', transition: 'color .35s' }}>{p.cert}</div>
                  </div>
                  <div data-li style={{ marginTop: 'auto', paddingTop: 8, opacity: 0, transition: 'opacity .3s', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.339 18.337H5.667v-8.59h2.672v8.59zM7.003 8.574a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096zm11.335 9.763h-2.669V14.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248h-2.667v-8.59h2.56v1.174h.037c.355-.675 1.227-1.387 2.524-1.387 2.704 0 3.203 1.778 3.203 4.092v4.71z" /></svg>
                    <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>{p.bio ? 'Ver mais' : 'Ver no LinkedIn'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team member popup */}
      {selectedMember && (
        <div onClick={() => setSelectedMember(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#F5F4F1', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '48px 44px', position: 'relative' }}>
            <button onClick={() => setSelectedMember(null)}
              style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 8, letterSpacing: '0.26em', color: '#414E3A', marginBottom: 12, textTransform: 'uppercase' }}>{selectedMember.role}</div>
            <h3 className="serif" style={{ fontSize: 30, lineHeight: 1.12, color: '#0A0A0A', marginBottom: 10 }}>{selectedMember.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 8, color: '#414E3A', letterSpacing: '0.12em' }}>{selectedMember.cert}</span>
              <span style={{ width: 1, height: 12, background: 'rgba(10,10,10,0.15)' }} />
              <a href={selectedMember.li} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: '#0A0A0A' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A0A0A"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 500 }}>LinkedIn</span>
              </a>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.78, color: 'rgba(10,10,10,0.68)', margin: 0 }}>{selectedMember.bio}</p>
          </div>
        </div>
      )}

      {/* PDF preview modal */}
      {previewPdf && (
        <div onClick={() => setPreviewPdf(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.80)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 40 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 860, height: isMobile ? '85vh' : '88vh', background: '#F5F4F1', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(10,10,10,0.10)', flexShrink: 0 }}>
              <span className="serif" style={{ fontSize: 15, color: '#0A0A0A' }}>{previewPdf.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a href={`/docs/${previewPdf.file}`} download onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: '#0A0A0A', color: '#F5F4F1', textDecoration: 'none', fontSize: 11, letterSpacing: '0.08em', fontFamily: "'Syncopate', sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Baixar
                </a>
                <button onClick={() => setPreviewPdf(null)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            {/* iframe */}
            <iframe src={`/docs/${previewPdf.file}#toolbar=0`} style={{ flex: 1, border: 'none', width: '100%' }} title={previewPdf.label} />
          </div>
        </div>
      )}

      {/* ─── CONTEÚDO ─── */}
      <section ref={conteudoRef} style={{ background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)', padding: isMobile ? '80px 24px 80px' : '140px 80px 120px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>06 · Conteúdo</div>
          <h2 className="serif" style={{ fontSize: isMobile ? 'clamp(28px,6vw,40px)' : 'clamp(32px,3.6vw,56px)', lineHeight: 1.14, color: '#0A0A0A', marginBottom: isMobile ? 48 : 72 }}>
            Perspectivas sobre<br />patrimônio e planejamento.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { num: '01', label: 'Investir o máximo o quanto antes', file: 'artigo-1.pdf' },
              { num: '02', label: 'O custo invisível de um modelo interesseiro', file: 'artigo-2.pdf' },
            ].map(({ num, label, file }) => (
              <div key={file} onClick={() => setPreviewPdf({ label, file })}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: isMobile ? '24px 0' : '32px 0', borderBottom: '1px solid rgba(10,10,10,0.08)', cursor: 'pointer', color: '#0A0A0A', transition: 'opacity .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.55' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 16 : 28 }}>
                  <span className="syncop" style={{ fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: '0.3em', flexShrink: 0 }}>{num}</span>
                  <span className="serif" style={{ fontSize: isMobile ? 16 : 'clamp(18px,1.8vw,26px)', fontWeight: 400, lineHeight: 1.3 }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'rgba(10,10,10,0.4)' }}>
                  <span className="syncop" style={{ fontSize: 8, letterSpacing: '0.3em', display: isMobile ? 'none' : 'block' }}>PDF</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: isMobile ? 48 : 72, fontSize: 13, color: 'rgba(10,10,10,0.4)', lineHeight: 1.7, maxWidth: 480 }}>
            Novos artigos são publicados periodicamente. Entre em contato para receber atualizações.
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section ref={ctaRef} style={{ background: '#0A0A0A', padding: isMobile ? '80px 24px 60px' : '140px 80px 80px', color: '#F5F4F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 48 }}>
          <div>

            <h2 className="serif" style={{ fontSize: 'clamp(40px,4.4vw,68px)', lineHeight: 1.08, color: '#F5F4F1' }}>
              Entre em contato<br />com o <em style={{ color: '#A8B0A2' }}>nosso time.</em>
            </h2>
          </div>
          <a href="mailto:contato@teloswealth.com.br" className="syncop"
            style={{ display: 'inline-block', background: '#F5F4F1', color: '#0A0A0A', border: 'none', padding: isMobile ? '16px 32px' : '20px 56px', fontSize: 10, cursor: 'pointer', letterSpacing: '0.32em', textDecoration: 'none' }}>
            Entre em contato conosco →
          </a>
        </div>

        <div style={{ maxWidth: 1100, margin: isMobile ? '60px auto 0' : '100px auto 0', paddingTop: 48, borderTop: '1px solid rgba(245,244,241,0.08)' }}>
          <div className="syncop" style={{ fontSize: 8, color: 'rgba(245,244,241,0.35)', letterSpacing: '0.32em', marginBottom: 28 }}>DOCUMENTOS REGULATÓRIOS</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 12 }}>
            {[
              { label: 'Código de Ética e Conduta', file: 'TELOS WEALTH - CÓDIGO DE ÉTICA E CONDUTA.pdf' },
              { label: 'Formulário de Referência — Anexo E', file: 'TELOS WEALTH - FORMULÁRIO DE REFERÊNCIA ANEXO - E - Clicksign.pdf' },
              { label: 'Manual de Compliance', file: 'TELOS WEALTH - MANUAL DE COMPLIANCE.pdf' },
              { label: 'Política de Investimentos Pessoais', file: 'TELOS WEALTH - POLÍTICA DE INVESTIMENTOS PESSOAIS.pdf' },
            ].map(({ label, file }) => (
              <a key={file} href={`/docs/${file}`} download
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', border: '1px solid rgba(245,244,241,0.08)', color: 'rgba(245,244,241,0.55)', textDecoration: 'none', transition: 'border-color .25s, color .25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,244,241,0.22)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,244,241,0.9)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,244,241,0.08)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,244,241,0.55)' }}>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 300, letterSpacing: '0.02em' }}>{label}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: isMobile ? '40px auto 0' : '60px auto 0', paddingTop: 40, borderTop: '1px solid rgba(245,244,241,0.06)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: isMobile ? 20 : 0 }}>
          <div style={{ filter: 'invert(1) brightness(1.6)' }}>
            <Logo size={42} />
          </div>
          <div style={{ display: 'flex', gap: 42 }}>
            {LOCATIONS.map(l => (
              <span key={l} className="syncop" style={{ fontSize: 9, color: 'rgba(245,244,241,0.35)' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(245,244,241,0.25)', letterSpacing: '0.05em' }}>
            © 2026 Telos Wealth
          </div>
        </div>
      </section>

      {/* ─── Travelling words overlay ─── */}

    </div>
  )
}
