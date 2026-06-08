import { useState, useEffect, useRef } from 'react'
import { clamp, ease, lerp } from './utils/math'
import { PILARES, TEAM, LOCATIONS } from './data'
import { Logo } from './components/Logo'
import HeroCanvas from './components/canvas/HeroCanvas'
import TreeCanvas from './components/canvas/TreeCanvas'
import VolGoalsCanvas from './components/canvas/VolGoalsCanvas'
import TelosMorphCanvas from './components/canvas/TelosMorphCanvas'
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

export default function App() {
  const heroRef = useRef<HTMLElement>(null)
  const famRef  = useRef<HTMLElement>(null)
  const objRef  = useRef<HTMLElement>(null)
  const vulnRef = useRef<HTMLElement>(null)
  const collapseRef = useRef<HTMLElement>(null)
  const metRef  = useRef<HTMLElement>(null)
  const teamRef     = useRef<HTMLElement>(null)
  const conteudoRef = useRef<HTMLElement>(null)
  const ctaRef      = useRef<HTMLElement>(null)

  const [P, setP] = useState({ hero: 0, fam: 0, obj: 0, vuln: 0, collapse: 0, met: 0, team: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [hoverMember, setHoverMember] = useState<number | null>(null)
  const [hoverPillar, setHoverPillar] = useState<number | null>(null)

  const [page, setPage] = useState<'home' | 'artigos'>('home')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const id = setTimeout(() => setMounted(true), 60); return () => clearTimeout(id) }, [])

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
          collapse: getSectionProgress(collapseRef.current),
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
          <Logo size={36} />
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
              ['Vulnerabilidades',  () => scrollToEl(vulnRef.current)],
              ['Pilares',           () => scrollToEl(metRef.current)],
              ['Time',              () => scrollToEl(teamRef.current)],
            ] as [string, () => void][]).map(([l, fn]) => (
              <a key={l} onClick={fn} className="syncop" style={{ fontSize: 9, color: isOverDark ? 'rgba(245,244,241,0.65)' : 'rgba(10,10,10,0.6)', cursor: 'pointer', transition: 'color .4s' }}>{l}</a>
            ))}
            <a onClick={() => scrollToEl(conteudoRef.current)} className="syncop" style={{ fontSize: 9, color: isOverDark ? 'rgba(245,244,241,0.65)' : 'rgba(10,10,10,0.6)', cursor: 'pointer', transition: 'color .4s' }}>Conteúdo</a>
          </div>
        )}
        <button onClick={() => scrollToEl(ctaRef.current)} className="syncop" style={{ fontSize: isMobile ? 8 : 9, background: isOverDark ? 'rgba(245,244,241,0.92)' : '#0A0A0A', color: isOverDark ? '#0A0A0A' : '#F5F4F1', border: 'none', padding: isMobile ? '10px 16px' : '13px 26px', cursor: 'pointer', transition: 'all .4s', letterSpacing: '0.32em' }}>Diagnóstico</button>
      </nav>

      {/* ─── HERO (320vh) ─── */}
      <section ref={heroRef} style={{ height: '320vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#1a1208' }}>

          <video
            muted loop playsInline
            src="/0605.mov"
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
            <h1 className="serif" style={{ position: 'absolute', left: isMobile ? '20px' : '80px', top: '50%', transform: `translateY(calc(-50% + ${(1 - heroPhrase1) * 20}px))`, width: isMobile ? 'calc(100% - 40px)' : '50%', maxWidth: 680, fontSize: 'clamp(22px,2.8vw,48px)', lineHeight: 1.12, color: '#F5F4F1', opacity: heroPhrase1, transition: 'transform .25s linear', textAlign: 'left', textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
              Investimentos e planejamento patrimonial.<br />Para essa geração <em style={{ color: '#A8C49A' }}>e para as próximas.</em>
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
      <section ref={famRef} style={{ height: '340vh', position: 'relative', background: '#F5F4F1' }}>
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
                    Entendemos <em style={{ color: '#5E6B57' }}>onde a sua família está</em>
                  </p>
                  <p className="serif" style={{ fontSize: 'clamp(26px,2.6vw,42px)', lineHeight: 1.22, color: '#0A0A0A', fontStyle: 'italic', opacity: p2, transform: `translateY(${(1 - p2) * 18}px)`, transition: 'transform .4s' }}>
                    e <em style={{ color: '#5E6B57' }}>onde ela quer chegar.</em>
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
      <section ref={objRef} style={{ height: '1000vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {(() => {
            const shrinkP  = ease(clamp((P.obj - 0.03) / 0.10, 0, 1))
            const volMap   = clamp((P.obj - 0.10) / 0.32, 0, 1)
            const morphMap = clamp((P.obj - 0.44) / 0.16, 0, 1)
            const drawMap  = clamp((P.obj - 0.16) / 0.70, 0, 1)
            const anchored = shrinkP > 0.45
            const curveOut = clamp((P.obj - 0.87) / 0.07, 0, 1)
            const phraseIn = clamp((P.obj - 0.89) / 0.07, 0, 1)
            const goalUI   = clamp((morphMap - 0.30) / 0.40, 0, 1)

            const fs    = lerp(56, 33, shrinkP)
            const left  = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 80, shrinkP)}px)`
            const top   = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 64, shrinkP)}px)`
            const tx    = lerp(-50, 0, shrinkP)
            const ty    = lerp(-50, 0, shrinkP)
            const width = lerp(1120, 440, shrinkP)

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
                <div style={{ position: 'absolute', left, top, width, transform: `translate(${tx}%,${ty}%)`, opacity: 1 - phraseIn, pointerEvents: 'none', zIndex: 4, willChange: 'left,top,transform', background: `rgba(245,244,241,${ease(clamp((shrinkP - 0.45) / 0.3, 0, 1))})`, padding: anchored ? '12px 16px 16px 0' : undefined }}>
                  <div className="eyebrow eyebrow-terra" style={{ marginBottom: 10, opacity: clamp((shrinkP - 0.6) / 0.3, 0, 1) }}>
                    — 02 · {goalUI > 0.5 ? 'Objetivos' : 'Alocação'}
                  </div>
                  <h2 className="serif" style={{ fontSize: fs, lineHeight: anchored ? 1.22 : 1.12, textAlign: anchored ? 'left' : 'center', color: '#0A0A0A', margin: '0 auto', overflow: 'visible' }}>
                    Construímos um{' '}
                    <em style={{ color: '#5E6B57', fontStyle: 'italic', ...flyWord(0) }}>plano</em>{' '}
                    que <em style={{ color: '#5E6B57' }}>maximiza a conquista</em> dos seus objetivos e{' '}
                    <em style={{ color: '#5E6B57', fontStyle: 'italic', ...flyWord(0.01) }}>resiste</em>{' '}
                    ao tempo.
                  </h2>
                </div>

                {/* Bridge phrase — "plano" and "resiste" slots empty until words arrive */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px', opacity: phraseIn, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
                  <h2 className="serif" style={{ fontSize: 'clamp(34px,4.2vw,68px)', lineHeight: 1.18, maxWidth: 1280, textAlign: 'center', color: '#0A0A0A' }}>
                    Um{' '}
                    <em style={{ color: '#5E6B57', ...arrWord(0) }}>plano</em>{' '}
                    que{' '}
                    <em style={{ color: '#5E6B57', ...arrWord(0.01) }}>resiste</em>{' '}
                    ao previsível<br />
                    e que está preparado <em style={{ color: '#5E6B57' }}>para o que não é.</em>
                  </h2>
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* ─── VULNERABILIDADES (800vh) ─── */}
      <section ref={vulnRef} style={{ height: '800vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#F5F4F1' }}>
          {(() => {
            const headIn   = clamp((P.vuln - 0.02) / 0.06, 0, 1)
            const headFade = clamp(1 - (P.vuln - 0.65) / 0.08, 0, 1)
            const head     = headIn * headFade
            const CANVAS_START = 0.22
            const canvasIn = clamp((P.vuln - CANVAS_START) / 0.06, 0, 1)
            // Remap so TelosMorphCanvas always receives 0→1 starting from when it first appears
            const canvasProg = clamp((P.vuln - CANVAS_START) / (1 - CANVAS_START), 0, 1)

            // Services spat out from TELOS center after it solidifies
            const cx = 50, cy = 47
            const SERVICES = [
              { lbl: 'Riscos e Seguros',                              xp: 50, yp: 18, rev: 0 },
              { lbl: 'Planejamento Tributário',                       xp: 17, yp: 40, rev: 1 },
              { lbl: 'Planejamento Sucessório',                       xp: 83, yp: 40, rev: 2 },
              { lbl: 'Gestão de investimentos\nlocal e Internacional', xp: 28, yp: 73, rev: 3 },
              { lbl: 'Planejamento de Objetivos',                     xp: 72, yp: 73, rev: 4 },
            ]

            return (
              <>
                {/* Phase B — header */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: isMobile ? '72px 20px 0' : '92px 80px 0', opacity: head, pointerEvents: 'none', zIndex: 2 }}>
                  <div className="eyebrow eyebrow-terra" style={{ marginBottom: 18 }}>03 · Vulnerabilidades</div>
                  <h2 className="serif" style={{ fontSize: 'clamp(26px,2.6vw,40px)', lineHeight: 1.22, color: '#0A0A0A' }}>
                    Mapeamos as <em style={{ color: '#5E6B57' }}>vulnerabilidades</em> e as <em style={{ color: '#5E6B57' }}>resolvemos.</em>
                  </h2>
                </div>

                {/* Phase C — pixels: palavras espalhadas → somem → TELOS */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: canvasIn }}>
                  <TelosMorphCanvas sectionProg={canvasProg} />
                </div>

                {/* Phase D — serviços orbitam TELOS */}
                {SERVICES.map((sv, i) => {
                  const r = ease(clamp((canvasProg - (0.84 + sv.rev * 0.020)) / 0.06, 0, 1))
                  const x = lerp(cx, sv.xp, r)
                  const y = lerp(cy, sv.yp, r)
                  return (
                    <div key={i} style={{
                      position: 'absolute',
                      left: `${x}%`, top: `${y}%`,
                      width: 280,
                      transform: 'translate(-50%,-50%)',
                      opacity: r,
                      pointerEvents: 'none',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C6A46C' }} />
                        <div className="serif" style={{ fontSize: 'clamp(15px,1.5vw,21px)', lineHeight: 1.25, color: '#0A0A0A', textAlign: 'center', whiteSpace: 'pre-line' }}>{sv.lbl}</div>
                      </div>
                    </div>
                  )
                })}
              </>
            )
          })()}
        </div>
      </section>

      {/* ─── NOSSOS PILARES (520vh) ─── */}
      <section ref={metRef} style={{ height: '520vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: isMobile ? '64px 24px 20px' : '88px 80px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
            <div style={{ maxWidth: 760 }}>
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 14 }}>04 · Nossos pilares</div>
              <h2 className="serif" style={{ fontSize: 'clamp(26px,2.6vw,38px)', lineHeight: 1.2, color: '#0A0A0A' }}>
                Os princípios que guiam <em style={{ color: '#5E6B57' }}>cada decisão.</em>
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <span className="syncop" style={{ fontSize: 9, color: 'rgba(10,10,10,0.45)' }}>
                {String(Math.min(PILARES.length, Math.max(1, Math.floor(P.met * PILARES.length) + 1))).padStart(2, '0')} / {String(PILARES.length).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {PILARES.map((_, i) => {
                  const active = Math.floor(P.met * PILARES.length) === i
                  return <div key={i} style={{ width: active ? 28 : 14, height: 2, background: active ? '#5E6B57' : 'rgba(10,10,10,0.18)', transition: 'all .35s' }} />
                })}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', display: 'flex', transform: `translateX(${-P.met * (PILARES.length - 1) * 100}vw)`, willChange: 'transform' }}>
              {PILARES.map((pil, i) => {
                const open = isMobile || hoverPillar === i
                return (
                  <div key={i}
                    onMouseEnter={() => setHoverPillar(i)}
                    onMouseLeave={() => setHoverPillar(h => h === i ? null : h)}
                    style={{ width: '100vw', height: '100%', flexShrink: 0, padding: isMobile ? '28px 24px' : '80px 12vw', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 80, alignItems: isMobile ? 'start' : 'center', borderRight: i < PILARES.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div className="serif" style={{ fontSize: isMobile ? 'clamp(60px,18vw,96px)' : 'clamp(160px,15vw,250px)', color: open ? 'rgba(94,107,87,0.30)' : 'rgba(94,107,87,0.16)', lineHeight: 0.85, letterSpacing: '-0.02em', transition: 'color .5s' }}>{pil.n}</div>
                      <div style={{ width: 60, height: 1, background: '#5E6B57' }} />
                      <div className="eyebrow eyebrow-terra">Pilar {pil.n}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 540 }}>
                        <h3 className="serif" style={{ fontSize: isMobile ? 'clamp(28px,7vw,48px)' : 'clamp(40px,4.4vw,72px)', lineHeight: 1.04, color: '#0A0A0A', letterSpacing: '-0.005em' }}>{pil.lbl}</h3>
                      <div style={{ position: 'relative', minHeight: 150 }}>
                          <p style={{ fontSize: isMobile ? 15 : 19, fontWeight: 300, lineHeight: 1.75, color: 'rgba(35,35,35,0.7)', opacity: open ? 1 : 0, filter: open ? 'blur(0px)' : 'blur(5px)', transform: open ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity .5s ease, filter .5s ease, transform .5s ease', willChange: 'filter' }}>{pil.def}</p>
                        <div className="syncop" style={{ position: 'absolute', top: 4, left: 0, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(94,107,87,0.6)', opacity: open ? 0 : 1, transition: 'opacity .4s', pointerEvents: 'none' }}>passe o mouse para ler</div>
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
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 24 }}>05 · Quem somos</div>
              <h2 className="serif" style={{ fontSize: 'clamp(36px,4vw,62px)', lineHeight: 1.1, color: '#0A0A0A' }}>
                Sete sócios certificados.<br /><em style={{ color: '#5E6B57' }}>Um único critério.</em>
              </h2>
            </div>
            <div style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(10,10,10,0.12)', borderTop: isMobile ? '1px solid rgba(10,10,10,0.12)' : 'none', paddingLeft: isMobile ? 0 : 36, paddingTop: isMobile ? 24 : 0 }}>
              <div className="serif" style={{ fontSize: isMobile ? 48 : 64, color: '#5E6B57', lineHeight: 1 }}>+R$700M</div>
              <div style={{ fontSize: 13, color: 'rgba(10,10,10,0.5)', marginTop: 8, letterSpacing: '0.05em' }}>sob aconselhamento</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, background: 'rgba(10,10,10,0.08)' }}>
            {TEAM.map((p, i) => (
              <a key={i} href={p.li} target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => setHoverMember(i)}
                onMouseLeave={() => setHoverMember(null)}
                style={{ background: hoverMember === i ? '#0A0A0A' : '#F5F4F1', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 280, position: 'relative', cursor: 'pointer', transition: 'background .35s', color: hoverMember === i ? '#F5F4F1' : '#0A0A0A' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: hoverMember === i ? 'rgba(245,244,241,0.08)' : 'rgba(94,107,87,0.1)', border: `1px solid ${hoverMember === i ? 'rgba(245,244,241,0.15)' : 'rgba(94,107,87,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: hoverMember === i ? '#A8B0A2' : '#5E6B57', fontFamily: "'Syncopate', sans-serif", fontSize: 13, letterSpacing: '0.2em', fontWeight: 700, transition: 'all .35s' }}>{p.initials}</div>
                <div>
                  <div className="serif" style={{ fontSize: 20, lineHeight: 1.2, marginBottom: 6 }}>{p.name}</div>
                  <div className="syncop" style={{ fontSize: 8, color: hoverMember === i ? '#A8B0A2' : '#5E6B57' }}>{p.cert}</div>
                </div>
                <div style={{ marginTop: 'auto', opacity: hoverMember === i ? 1 : 0, transform: hoverMember === i ? 'translateY(0)' : 'translateY(8px)', transition: 'all .3s', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.339 18.337H5.667v-8.59h2.672v8.59zM7.003 8.574a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096zm11.335 9.763h-2.669V14.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248h-2.667v-8.59h2.56v1.174h.037c.355-.675 1.227-1.387 2.524-1.387 2.704 0 3.203 1.778 3.203 4.092v4.71z" /></svg>
                  <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>Ver no LinkedIn</span>
                </div>
              </a>
            ))}

            <div style={{ background: '#0A0A0A', color: '#F5F4F1', padding: '32px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 280 }}>
              <div className="eyebrow eyebrow-terra" style={{ color: '#A8B0A2' }}>Onde estamos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {LOCATIONS.map(l => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A8B0A2' }} />
                    <span className="serif" style={{ fontSize: 22 }}>{l}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(245,244,241,0.4)', letterSpacing: '0.06em', lineHeight: 1.6 }}>
                Operação nacional.<br />Atendimento confidencial.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTEÚDO ─── */}
      <section ref={conteudoRef} style={{ background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)', padding: isMobile ? '80px 24px 80px' : '140px 80px 120px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>06 · Conteúdo</div>
          <h2 className="serif" style={{ fontSize: isMobile ? 'clamp(28px,6vw,40px)' : 'clamp(32px,3.6vw,56px)', lineHeight: 1.14, color: '#0A0A0A', marginBottom: isMobile ? 48 : 72 }}>
            Perspectivas sobre<br />patrimônio e planejamento.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { num: '01', label: 'Investir o máximo o quanto antes', file: 'Artigo #1.pdf' },
              { num: '02', label: 'O custo invisível de um modelo interesseiro', file: 'Artigo #2.pdf' },
            ].map(({ num, label, file }) => (
              <a key={file} href={`/docs/${file}`} download
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: isMobile ? '24px 0' : '32px 0', borderBottom: '1px solid rgba(10,10,10,0.08)', textDecoration: 'none', color: '#0A0A0A', transition: 'opacity .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.55' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 16 : 28 }}>
                  <span className="syncop" style={{ fontSize: 9, color: 'rgba(10,10,10,0.35)', letterSpacing: '0.3em', flexShrink: 0 }}>{num}</span>
                  <span className="serif" style={{ fontSize: isMobile ? 16 : 'clamp(18px,1.8vw,26px)', fontWeight: 400, lineHeight: 1.3 }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: 'rgba(10,10,10,0.4)' }}>
                  <span className="syncop" style={{ fontSize: 8, letterSpacing: '0.3em', display: isMobile ? 'none' : 'block' }}>PDF</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
              </a>
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
            <div className="eyebrow eyebrow-terra" style={{ marginBottom: 24, color: '#A8B0A2' }}>Início de relação</div>
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
