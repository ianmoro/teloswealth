import { useState, useEffect, useRef } from 'react'
import { clamp, ease, lerp } from './utils/math'
import { VULN_PAIRS, PILARES, TEAM, LOCATIONS } from './data'
import { Logo } from './components/Logo'
import HeroCanvas from './components/canvas/HeroCanvas'
import TreeCanvas from './components/canvas/TreeCanvas'
import CurveCanvas from './components/canvas/CurveCanvas'
import VolatilityCanvas from './components/canvas/VolatilityCanvas'
import TelosMorphCanvas from './components/canvas/TelosMorphCanvas'

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

function SectionIntro({ eyebrow, title, sub, dark = false }: { eyebrow: string; title: string; sub?: string; dark?: boolean }) {
  return (
    <div style={{ padding: '120px 80px 60px', maxWidth: 1400, margin: '0 auto' }}>
      <div className={`eyebrow ${dark ? 'eyebrow-dark' : ''}`} style={{ marginBottom: 24 }}>{eyebrow}</div>
      <h2 className="serif" style={{ fontSize: 'clamp(36px,4.4vw,68px)', lineHeight: 1.1, fontWeight: 400, color: dark ? '#F5F4F1' : '#0A0A0A', maxWidth: 1100 }} dangerouslySetInnerHTML={{ __html: title }} />
      {sub && <p style={{ marginTop: 28, fontSize: 17, fontWeight: 300, lineHeight: 1.75, color: dark ? 'rgba(245,244,241,0.6)' : 'rgba(10,10,10,0.55)', maxWidth: 680 }}>{sub}</p>}
    </div>
  )
}

export default function App() {
  const heroRef = useRef<HTMLElement>(null)
  const famRef  = useRef<HTMLElement>(null)
  const beforeObjRef = useRef<HTMLElement>(null)
  const volRef  = useRef<HTMLElement>(null)
  const curveRef = useRef<HTMLElement>(null)
  const vulnRef = useRef<HTMLElement>(null)
  const collapseRef = useRef<HTMLElement>(null)
  const metRef  = useRef<HTMLElement>(null)
  const teamRef = useRef<HTMLElement>(null)
  const ctaRef  = useRef<HTMLElement>(null)

  const [P, setP] = useState({ hero: 0, fam: 0, beforeObj: 0, vol: 0, curve: 0, vuln: 0, collapse: 0, met: 0, team: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [hoverMember, setHoverMember] = useState<number | null>(null)
  const [hoverPillar, setHoverPillar] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const addReveal = (i: number) => setRevealed(s => s.has(i) ? s : new Set(s).add(i))
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const id = setTimeout(() => setMounted(true), 60); return () => clearTimeout(id) }, [])

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
          beforeObj:getSectionProgress(beforeObjRef.current),
          vol:      getSectionProgress(volRef.current),
          curve:    getSectionProgress(curveRef.current),
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

  const handoffP = P.vol < 0.999
    ? clamp((P.vol - 0.90) / 0.10, 0, 1) * 0.42
    : 0.42 + 0.58 * clamp(P.vuln / 0.07, 0, 1)
  const handoffE = ease(handoffP)
  const lockedIn = clamp((handoffP - 0.90) / 0.08, 0, 1)

  return (
    <div>

      {/* ─── NAV ─── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', background: isOverDark ? 'rgba(10,10,10,0.4)' : 'rgba(245,244,241,0.86)', backdropFilter: 'blur(14px)', borderBottom: isOverDark ? '1px solid rgba(245,244,241,0.06)' : '1px solid rgba(10,10,10,0.06)', transition: 'background .4s, border-color .4s' }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer', filter: isOverDark ? 'invert(1) brightness(1.6)' : 'none', transition: 'filter .4s' }}>
          <Logo size={36} />
        </div>
        <div style={{ display: 'flex', gap: 42 }}>
          {([['Família', famRef], ['Objetivos', curveRef], ['Vulnerabilidades', vulnRef], ['Pilares', metRef], ['Time', teamRef]] as [string, React.RefObject<HTMLElement>][]).map(([l, r]) => (
            <a key={l} onClick={() => scrollToEl(r.current)} className="syncop" style={{ fontSize: 9, color: isOverDark ? 'rgba(245,244,241,0.65)' : 'rgba(10,10,10,0.6)', cursor: 'pointer', transition: 'color .4s' }}>{l}</a>
          ))}
        </div>
        <button onClick={() => scrollToEl(ctaRef.current)} className="syncop" style={{ fontSize: 9, background: isOverDark ? 'rgba(245,244,241,0.92)' : '#0A0A0A', color: isOverDark ? '#0A0A0A' : '#F5F4F1', border: 'none', padding: '13px 26px', cursor: 'pointer', transition: 'all .4s', letterSpacing: '0.32em' }}>Diagnóstico</button>
      </nav>

      {/* ─── HERO (320vh) ─── */}
      <section ref={heroRef} style={{ height: '320vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#1a1208' }}>

          <video
            muted loop playsInline
            src="/bannerinicial.mp4"
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
            <h1 className="serif" style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,calc(-50% + ${(1 - heroPhrase1) * 20}px))`, width: 'calc(100% - 80px)', maxWidth: 1300, fontSize: 'clamp(40px,5vw,76px)', lineHeight: 1.08, color: '#232323', opacity: heroPhrase1, transition: 'transform .25s linear' }}>
              Investimentos e planejamento patrimonial.<br />Para essa geração <em style={{ color: '#5E6B57' }}>e para as próximas.</em>
            </h1>
            <h1 className="serif" style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,calc(-50% + ${(1 - heroPhrase2) * 22}px))`, width: 'calc(100% - 80px)', maxWidth: 1240, fontSize: 'clamp(36px,4.4vw,68px)', lineHeight: 1.14, color: '#F5F4F1', opacity: heroPhrase2, transition: 'transform .25s linear', textShadow: '0 0 50px rgba(0,0,0,0.4)' }}>
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
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', padding: '0 80px' }}>
          {(() => {
            const treeProg = clamp((P.fam - 0.16) / 0.52, 0, 1)
            const blurP    = clamp((P.fam - 0.72) / 0.16, 0, 1)
            const p1 = clamp((P.fam - 0.02) / 0.05, 0, 1)
            const p2 = clamp((P.fam - 0.78) / 0.10, 0, 1)
            return (
              <div style={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(320px,38%) 1fr', gap: 40, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30, padding: '40px 0' }}>
                  <div className="eyebrow eyebrow-terra" style={{ opacity: p1 }}>01 · Família</div>
                  <p className="serif" style={{ fontSize: 'clamp(26px,2.6vw,42px)', lineHeight: 1.22, color: '#0A0A0A', opacity: p1 * (1 - blurP * 0.15), transform: `translateY(${(1 - p1) * 16}px)`, transition: 'transform .4s' }}>
                    Entendemos <em style={{ color: '#5E6B57' }}>onde a sua família está</em>
                  </p>
                  <p className="serif" style={{ fontSize: 'clamp(26px,2.6vw,42px)', lineHeight: 1.22, color: '#0A0A0A', fontStyle: 'italic', opacity: p2, transform: `translateY(${(1 - p2) * 18}px)`, transition: 'transform .4s' }}>
                    e <em style={{ color: '#5E6B57' }}>onde ela quer chegar.</em>
                  </p>
                </div>
                <div style={{ position: 'relative', height: '100%', padding: '70px 0 40px', filter: `blur(${(blurP * 6).toFixed(2)}px)`, opacity: 1 - blurP * 0.42, transition: 'opacity .3s' }}>
                  <TreeCanvas prog={treeProg} />
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ─── OBJETIVOS (560vh) ─── */}
      <section ref={curveRef} style={{ height: '560vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 80px', pointerEvents: 'none', opacity: clamp((P.curve - 0.02) / 0.06, 0, 1) * clamp(1 - (P.curve - 0.16) / 0.06, 0, 1) }}>
            <h2 className="serif" style={{ fontSize: 'clamp(36px,4.2vw,68px)', lineHeight: 1.12, maxWidth: 1400, textAlign: 'center', color: '#0A0A0A' }}>
              Entendemos em conjunto <em style={{ color: '#5E6B57' }}>os seus objetivos de vida.</em>
            </h2>
          </div>

          <div style={{ position: 'absolute', inset: 0, opacity: clamp((P.curve - 0.18) / 0.06, 0, 1), pointerEvents: P.curve > 0.18 ? 'auto' : 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '104px 80px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{ maxWidth: 760 }}>
                <div className="eyebrow eyebrow-terra" style={{ marginBottom: 18 }}>02 · Objetivos</div>
                <h2 className="serif" style={{ fontSize: 'clamp(28px,2.6vw,40px)', lineHeight: 1.18, color: '#0A0A0A' }}>
                  Entendemos em conjunto <em style={{ color: '#5E6B57' }}>os seus objetivos de vida.</em>
                </h2>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', padding: '56px 40px 80px', minHeight: 0 }}>
              <CurveCanvas prog={clamp((P.curve - 0.18) / 0.68, 0, 1)} startM={startM} mood="alive" />
            </div>
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 80px 96px', pointerEvents: 'none', opacity: clamp((P.curve - 0.88) / 0.05, 0, 1) }}>
            <h2 className="serif" style={{ fontSize: 'clamp(30px,3.4vw,54px)', lineHeight: 1.12, maxWidth: 1100, textAlign: 'center', color: '#0A0A0A', transform: `translateY(${(1 - clamp((P.curve - 0.88) / 0.05, 0, 1)) * 18}px)`, transition: 'transform .3s linear' }}>
              E traduzimos em <em style={{ color: '#5E6B57' }}>um plano possível.</em>
            </h2>
          </div>
        </div>
      </section>

      {/* ─── ALOCAÇÃO / VOLATILIDADE (560vh) ─── */}
      <section ref={volRef} style={{ height: '560vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {(() => {
            const shrinkP = ease(clamp((P.vol - 0.05) / 0.18, 0, 1))
            const volMap = clamp((P.vol - 0.16) / 0.80, 0, 1)
            const anchored = shrinkP > 0.45
            const kw = (extra?: React.CSSProperties): React.CSSProperties => ({
              color: '#5E6B57',
              display: 'inline-block',
              opacity: 1 - clamp(handoffP / 0.10, 0, 1),
              ...extra,
            })
            const fs = lerp(56, 33, shrinkP)
            const left = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 80, shrinkP)}px)`
            const top  = `calc(${lerp(50, 0, shrinkP)}% + ${lerp(0, 102, shrinkP)}px)`
            const tx   = lerp(-50, 0, shrinkP)
            const ty   = lerp(-50, 0, shrinkP)
            const width = lerp(1120, 440, shrinkP)
            return (
              <>
                <div style={{ position: 'absolute', inset: 0, opacity: clamp((shrinkP - 0.25) / 0.4, 0, 1), display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <VolatilityCanvas prog={volMap} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: clamp((shrinkP - 0.5) / 0.3, 0, 1) * clamp(1 - (volMap - 0.85) / 0.1, 0, 1), pointerEvents: 'none' }}>
                    <p style={{ fontSize: 11, color: 'rgba(35,35,35,0.45)', fontWeight: 300, fontStyle: 'italic' }}>
                      Role para esticar a janela de observação.
                    </p>
                  </div>
                </div>

                <div style={{ position: 'absolute', left, top, width, transform: `translate(${tx}%,${ty}%)`, pointerEvents: 'none', zIndex: 4, willChange: 'left,top,transform' }}>
                  <div className="eyebrow eyebrow-terra" style={{ marginBottom: 10, opacity: clamp((shrinkP - 0.6) / 0.3, 0, 1) }}>03 · Alocação</div>
                  <h2 className="serif" style={{ fontSize: fs, lineHeight: anchored ? 1.22 : 1.12, textAlign: anchored ? 'left' : 'center', color: '#0A0A0A', margin: '0 auto' }}>
                    Em um <em style={kw()}>plano</em> que <em style={{ color: '#5E6B57' }}>maximiza a conquista</em> dos seus objetivos e <em style={kw()}>resiste</em> <em style={{ color: '#5E6B57' }}>ao tempo.</em>
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
            const introIn  = clamp((P.vuln - 0.002) / 0.02, 0, 1)
            const introOut = clamp(1 - (P.vuln - 0.10) / 0.03, 0, 1)
            const intro = introIn * introOut
            const listIn    = clamp((P.vuln - 0.115) / 0.035, 0, 1)
            const dockStart = 0.30, dockSpan = 0.24, rowStag = 0.020
            const autoReveal = P.vuln > 0.275
            const revealedCount = autoReveal ? 7 : revealed.size
            const morphStart = 0.66, morphEnd = 0.96
            const morphP   = clamp((P.vuln - morphStart) / (morphEnd - morphStart), 0, 1)
            const listFade = clamp(1 - morphP / 0.14, 0, 1)
            const headFade = clamp(1 - (P.vuln - 0.60) / 0.05, 0, 1)

            return (
              <>
                {/* Phase A — intro phrase */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px', opacity: intro, pointerEvents: 'none' }}>
                  <h2 className="serif" style={{ fontSize: 'clamp(34px,4.2vw,68px)', lineHeight: 1.18, maxWidth: 1280, textAlign: 'center', color: '#0A0A0A' }}>
                    Um <em style={{ color: '#5E6B57', opacity: lockedIn }}>plano</em> que <em style={{ color: '#5E6B57', opacity: lockedIn }}>resiste</em> ao previsível —<br />
                    e que está preparado <em style={{ color: '#5E6B57' }}>para o que não é.</em>
                  </h2>
                </div>

                {/* Phases B/C — vulnerabilidades → soluções */}
                <div style={{ position: 'absolute', inset: 0, opacity: listIn * listFade, pointerEvents: (listIn > 0.5 && morphP < 0.05) ? 'auto' : 'none', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '92px 80px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, opacity: headFade }}>
                    <div style={{ maxWidth: 900 }}>
                      <div className="eyebrow eyebrow-terra" style={{ marginBottom: 18 }}>04 · Vulnerabilidades</div>
                      <h2 className="serif" style={{ fontSize: 'clamp(26px,2.6vw,40px)', lineHeight: 1.22, color: '#0A0A0A' }}>
                        Mapeamos as <em style={{ color: '#5E6B57' }}>vulnerabilidades</em> — e as <em style={{ color: '#5E6B57' }}>resolvemos.</em>
                      </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="syncop" style={{ fontSize: 13, color: '#9A5C45', letterSpacing: '0.2em' }}>{revealedCount} / 7</div>
                      <div className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.35)', letterSpacing: '0.3em', marginTop: 6 }}>
                        {P.vuln < dockStart ? 'reveladas' : 'soluções'}
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px,1.3vh,16px)', padding: '0 80px 56px', minHeight: 0 }}>
                    {VULN_PAIRS.map((pair, i) => {
                      const dockT = ease(clamp((P.vuln - (dockStart + i * rowStag)) / dockSpan, 0, 1))
                      const shown = revealed.has(i) || autoReveal
                      const reveal = shown ? 1 : 0
                      return (
                        <div key={i}
                          onMouseEnter={() => addReveal(i)}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 130px 1fr', alignItems: 'center', minHeight: 44, cursor: shown ? 'default' : 'pointer' }}>
                          <div style={{ position: 'relative', textAlign: 'right', paddingRight: 10, minHeight: '1.4em' }}>
                            <span className="serif" style={{ fontSize: 'clamp(16px,1.65vw,25px)', color: '#0A0A0A', display: 'inline-block', opacity: 0.38 + reveal * 0.62, filter: `blur(${((1 - reveal) * 7).toFixed(2)}px)`, transition: 'opacity .5s ease, filter .5s ease', willChange: 'filter' }}>{pair.vuln}</span>
                          </div>
                          <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
                            <div style={{ position: 'absolute', left: 10, right: 18, top: '50%', height: 1, background: 'rgba(154,92,69,0.32)', transform: `scaleX(${dockT})`, transformOrigin: 'left' }} />
                            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid #9A5C45', opacity: dockT }} />
                          </div>
                          <div style={{ textAlign: 'left', paddingLeft: 10, minHeight: '1.4em' }}>
                            <span className="serif" style={{ fontSize: 'clamp(16px,1.65vw,25px)', color: '#5E6B57', opacity: dockT, transform: `translateX(${(1 - dockT) * -22}px)`, display: 'inline-block', transition: 'opacity .25s linear' }}>{pair.sol}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', opacity: clamp((listIn - 0.3) / 0.4, 0, 1) * clamp(1 - (P.vuln - 0.27) / 0.04, 0, 1) }}>
                    <span className="syncop" style={{ fontSize: 9, color: 'rgba(154,92,69,0.7)', letterSpacing: '0.42em' }}>passe o mouse para revelar</span>
                  </div>
                </div>

                {/* Phase D — TELOS morph */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: clamp(morphP / 0.1, 0, 1) }}>
                  <TelosMorphCanvas prog={morphP} />
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* ─── NOSSOS PILARES (520vh) ─── */}
      <section ref={metRef} style={{ height: '520vh', position: 'relative', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          <div style={{ padding: '88px 80px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0, borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
            <div style={{ maxWidth: 760 }}>
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 14 }}>05 · Nossos pilares</div>
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
                const open = hoverPillar === i
                return (
                  <div key={i}
                    onMouseEnter={() => setHoverPillar(i)}
                    onMouseLeave={() => setHoverPillar(h => h === i ? null : h)}
                    style={{ width: '100vw', height: '100%', flexShrink: 0, padding: '80px 12vw', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', borderRight: i < PILARES.length - 1 ? '1px solid rgba(10,10,10,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div className="serif" style={{ fontSize: 'clamp(160px,15vw,250px)', color: open ? 'rgba(94,107,87,0.30)' : 'rgba(94,107,87,0.16)', lineHeight: 0.85, letterSpacing: '-0.02em', transition: 'color .5s' }}>{pil.n}</div>
                      <div style={{ width: 60, height: 1, background: '#5E6B57' }} />
                      <div className="eyebrow eyebrow-terra">Pilar {pil.n}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 540 }}>
                      <h3 className="serif" style={{ fontSize: 'clamp(40px,4.4vw,72px)', lineHeight: 1.04, color: '#0A0A0A', letterSpacing: '-0.005em' }}>{pil.lbl}</h3>
                      <div style={{ position: 'relative', minHeight: 150 }}>
                        <p style={{ fontSize: 19, fontWeight: 300, lineHeight: 1.75, color: 'rgba(35,35,35,0.7)', opacity: open ? 1 : 0, filter: open ? 'blur(0px)' : 'blur(5px)', transform: open ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity .5s ease, filter .5s ease, transform .5s ease', willChange: 'filter' }}>{pil.def}</p>
                        <div className="syncop" style={{ position: 'absolute', top: 4, left: 0, fontSize: 9, letterSpacing: '0.32em', color: 'rgba(94,107,87,0.6)', opacity: open ? 0 : 1, transition: 'opacity .4s', pointerEvents: 'none' }}>passe o mouse para ler</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '18px 80px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(10,10,10,0.06)', flexShrink: 0 }}>
            <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.35)' }}>
              {PILARES[Math.min(PILARES.length - 1, Math.floor(P.met * PILARES.length))].lbl}
            </span>
            <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.35)' }}>
              ← role para avançar · passe o mouse para ler →
            </span>
          </div>
        </div>
      </section>

      {/* ─── TIME ─── */}
      <section ref={teamRef} style={{ background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)', padding: '140px 80px 120px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 96, marginBottom: 80, alignItems: 'end' }}>
            <div>
              <div className="eyebrow eyebrow-terra" style={{ marginBottom: 24 }}>06 · Quem somos</div>
              <h2 className="serif" style={{ fontSize: 'clamp(36px,4vw,62px)', lineHeight: 1.1, color: '#0A0A0A' }}>
                Sete sócios certificados.<br /><em style={{ color: '#5E6B57' }}>Um único critério.</em>
              </h2>
            </div>
            <div style={{ borderLeft: '1px solid rgba(10,10,10,0.12)', paddingLeft: 36 }}>
              <div className="serif" style={{ fontSize: 64, color: '#5E6B57', lineHeight: 1 }}>+R$700M</div>
              <div style={{ fontSize: 13, color: 'rgba(10,10,10,0.5)', marginTop: 8, letterSpacing: '0.05em' }}>sob aconselhamento</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'rgba(10,10,10,0.08)' }}>
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

      {/* ─── CTA ─── */}
      <section ref={ctaRef} style={{ background: '#0A0A0A', padding: '140px 80px 80px', color: '#F5F4F1' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 48 }}>
          <div>
            <div className="eyebrow eyebrow-terra" style={{ marginBottom: 24, color: '#A8B0A2' }}>Início de relação</div>
            <h2 className="serif" style={{ fontSize: 'clamp(40px,4.4vw,68px)', lineHeight: 1.08, color: '#F5F4F1' }}>
              A primeira conversa<br />já <em style={{ color: '#A8B0A2' }}>vale por ela mesma.</em>
            </h2>
          </div>
          <a href="mailto:contato@teloswealth.com.br" className="syncop"
            style={{ display: 'inline-block', background: '#F5F4F1', color: '#0A0A0A', border: 'none', padding: '20px 56px', fontSize: 10, cursor: 'pointer', letterSpacing: '0.32em', textDecoration: 'none' }}>
            Entre em contato conosco →
          </a>
        </div>

        <div style={{ maxWidth: 1100, margin: '120px auto 0', paddingTop: 48, borderTop: '1px solid rgba(245,244,241,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
      {(() => {
        const vwHalf = typeof window !== 'undefined' ? window.innerWidth  / 2 : 720
        const vhHalf = typeof window !== 'undefined' ? window.innerHeight / 2 : 450
        const dx0 = Math.round(300 - vwHalf)
        const dy0 = Math.round(202 - vhHalf)
        return (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px', pointerEvents: 'none', zIndex: 1400, opacity: clamp(handoffP / 0.05, 0, 1) * (1 - lockedIn) }}>
            <h2 className="serif" style={{ fontSize: 'clamp(34px,4.2vw,68px)', lineHeight: 1.18, maxWidth: 1280, textAlign: 'center', color: '#0A0A0A', transform: `translate(${lerp(dx0, 0, handoffE).toFixed(1)}px, ${lerp(dy0, 0, handoffE).toFixed(1)}px) scale(${lerp(0.52, 1, handoffE).toFixed(3)})`, transformOrigin: 'center', willChange: 'transform' }}>
              <span style={{ opacity: 0 }}>Um </span><em style={{ color: '#5E6B57' }}>plano</em><span style={{ opacity: 0 }}> que </span><em style={{ color: '#5E6B57' }}>resiste</em><span style={{ opacity: 0 }}> ao previsível —</span><br /><span style={{ opacity: 0 }}>e que está preparado </span><em style={{ color: '#5E6B57', opacity: 0 }}>para o que não é.</em>
            </h2>
          </div>
        )
      })()}

    </div>
  )
}
