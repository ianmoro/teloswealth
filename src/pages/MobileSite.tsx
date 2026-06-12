import { useState, useRef } from 'react'
import { Logo } from '../components/Logo'
import TreeCanvas from '../components/canvas/TreeCanvas'
import CurveCanvas from '../components/canvas/CurveCanvas'
import { PILARES, TEAM, LOCATIONS, VULN_PAIRS } from '../data'

interface Props {
  onArtigos: () => void
}

type TeamMember = typeof TEAM[0]

export default function MobileSite({ onArtigos }: Props) {
  const ctaRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F5F4F1', color: '#0A0A0A' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(245,244,241,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          <Logo size={32} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onArtigos} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', color: 'rgba(10,10,10,0.55)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
          </button>
          <button onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })} className="syncop" style={{ fontSize: 8, background: '#0A0A0A', color: '#F5F4F1', border: 'none', padding: '10px 16px', cursor: 'pointer', letterSpacing: '0.32em' }}>
            Diagnóstico
          </button>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A0A0A', padding: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', transition: 'transform .25s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', opacity: menuOpen ? 0 : 1, transition: 'opacity .2s' }} />
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', transition: 'transform .25s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* MENU DROPDOWN */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 999, background: 'rgba(245,244,241,0.97)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(10,10,10,0.07)', padding: '24px 20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            ['01 · Família', 'familia'],
            ['02 · Curva de Objetivos', 'objetivos'],
            ['03 · Vulnerabilidades', 'vulnerabilidades'],
            ['04 · Nossos Pilares', 'pilares'],
            ['05 · Quem Somos', 'time'],
          ].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="syncop" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 9, letterSpacing: '0.35em', color: 'rgba(10,10,10,0.65)', padding: 0 }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* HERO */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#1a1208' }}>
        <video muted loop playsInline src="/0610.mov"
          ref={el => { if (!el || (el as any)._init) return; (el as any)._init = true; el.play().catch(() => {}) }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,10,0.5) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 20, right: 20 }}>
          <h1 className="serif" style={{ fontSize: 'clamp(26px,7vw,42px)', lineHeight: 1.15, color: '#F5F4F1', textShadow: '0 2px 18px rgba(0,0,0,0.55)', marginBottom: 16 }}>
            Investimentos e planejamento patrimonial.<br />
            Para essa geração <em style={{ color: '#A8C49A' }}>e para as próximas.</em>
          </h1>
        </div>
      </section>

      {/* 01 · FAMÍLIA */}
      <section id="familia" style={{ padding: '72px 20px 60px', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 16 }}>01 · Família</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px,6.5vw,36px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 8 }}>
          Entendemos <em style={{ color: '#5E6B57' }}>onde a sua família está</em>
        </h2>
        <p className="serif" style={{ fontSize: 'clamp(22px,5.5vw,30px)', lineHeight: 1.22, color: '#0A0A0A', fontStyle: 'italic', marginBottom: 36 }}>
          e <em style={{ color: '#5E6B57' }}>onde ela quer chegar.</em>
        </p>
        <div style={{ height: 280, position: 'relative' }}>
          <TreeCanvas prog={1} />
        </div>
      </section>

      {/* 02 · CURVA DE OBJETIVOS */}
      <section id="objetivos" style={{ padding: '72px 20px 60px', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 16 }}>02 · Curva de Objetivos</div>
        <h2 className="serif" style={{ fontSize: 'clamp(20px,5.5vw,28px)', lineHeight: 1.25, color: '#0A0A0A', marginBottom: 32 }}>
          Construímos um <em style={{ color: '#5E6B57' }}>plano</em> que <em style={{ color: '#5E6B57' }}>maximiza a conquista</em> dos seus objetivos e <em style={{ color: '#5E6B57' }}>resiste ao tempo.</em>
        </h2>
        <div style={{ height: 300, position: 'relative' }}>
          <CurveCanvas prog={1} startM={10} padTop={40} hideTopLabels />
        </div>
      </section>

      {/* 03 · VULNERABILIDADES */}
      <section id="vulnerabilidades" style={{ padding: '72px 20px 60px', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 16 }}>03 · Vulnerabilidades</div>
        <h2 className="serif" style={{ fontSize: 'clamp(22px,5.5vw,32px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 36 }}>
          Mapeamos as <em style={{ color: '#5E6B57' }}>vulnerabilidades</em> e as <em style={{ color: '#5E6B57' }}>resolvemos.</em>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {VULN_PAIRS.map(({ vuln, sol }) => (
            <div key={vuln} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
              <span style={{ fontSize: 14, color: 'rgba(10,10,10,0.7)', fontWeight: 300 }}>{vuln}</span>
              <span className="syncop" style={{ fontSize: 8, color: '#5E6B57', letterSpacing: '0.2em', textAlign: 'right', marginLeft: 12 }}>{sol}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 04 · NOSSOS PILARES */}
      <section id="pilares" style={{ padding: '72px 20px 60px', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 16 }}>04 · Nossos Pilares</div>
        <h2 className="serif" style={{ fontSize: 'clamp(22px,5.5vw,32px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 40 }}>
          Os princípios que guiam <em style={{ color: '#5E6B57' }}>cada decisão.</em>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {PILARES.map((pil) => (
            <div key={pil.n} style={{ paddingBottom: 36, borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <span className="serif" style={{ fontSize: 48, color: 'rgba(94,107,87,0.35)', lineHeight: 1 }}>{pil.n}</span>
                <div>
                  <div style={{ width: 40, height: 1, background: '#5E6B57', marginBottom: 8 }} />
                  <div className="eyebrow eyebrow-terra">Pilar {pil.n}</div>
                </div>
              </div>
              <h3 className="serif" style={{ fontSize: 'clamp(22px,6vw,30px)', lineHeight: 1.15, color: '#0A0A0A', marginBottom: 12 }}>{pil.lbl}</h3>
              <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.75, color: 'rgba(35,35,35,0.7)' }}>{pil.def}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 05 · QUEM SOMOS */}
      <section id="time" style={{ padding: '72px 20px 60px', background: '#F5F4F1', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 16 }}>05 · Nosso Time</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px,6.5vw,36px)', lineHeight: 1.1, color: '#0A0A0A', marginBottom: 12 }}>
          Sete sócios certificados.<br /><em style={{ color: '#5E6B57' }}>Um único critério.</em>
        </h2>
        <div style={{ borderTop: '1px solid rgba(10,10,10,0.1)', paddingTop: 20, marginBottom: 32 }}>
          <div className="serif" style={{ fontSize: 42, color: '#5E6B57', lineHeight: 1 }}>+R$700M</div>
          <div style={{ fontSize: 13, color: 'rgba(10,10,10,0.5)', marginTop: 4 }}>sob aconselhamento</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'rgba(10,10,10,0.08)' }}>
          {TEAM.map((p, i) => (
            <div key={i} onClick={() => p.bio ? setSelectedMember(p) : window.open(p.li, '_blank')}
              style={{ background: '#F5F4F1', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 160, cursor: 'pointer', color: '#0A0A0A' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(94,107,87,0.1)', border: '1px solid rgba(94,107,87,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E6B57', fontFamily: "'Syncopate', sans-serif", fontSize: 10, letterSpacing: '0.2em', fontWeight: 700 }}>{p.initials}</div>
              <div>
                <div className="serif" style={{ fontSize: 15, lineHeight: 1.2, marginBottom: 4 }}>{p.name}</div>
                <div className="syncop" style={{ fontSize: 7, color: '#5E6B57' }}>{p.cert}</div>
              </div>
            </div>
          ))}
          <div style={{ background: '#0A0A0A', color: '#F5F4F1', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, gridColumn: '1 / -1' }}>
            <div className="eyebrow eyebrow-terra" style={{ color: '#A8B0A2' }}>Onde estamos</div>
            <div style={{ display: 'flex', gap: 24 }}>
              {LOCATIONS.map(l => (
                <span key={l} className="serif" style={{ fontSize: 16 }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team member popup */}
      {selectedMember && (
        <div onClick={() => setSelectedMember(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#F5F4F1', width: '100%', maxHeight: '88vh', overflowY: 'auto', borderRadius: '12px 12px 0 0', padding: '36px 24px 48px', position: 'relative' }}>
            <button onClick={() => setSelectedMember(null)}
              style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 8, letterSpacing: '0.24em', color: '#5E6B57', marginBottom: 10, textTransform: 'uppercase' }}>{selectedMember.role}</div>
            <h3 className="serif" style={{ fontSize: 24, lineHeight: 1.15, color: '#0A0A0A', marginBottom: 8 }}>{selectedMember.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span style={{ fontFamily: "'Syncopate', sans-serif", fontSize: 8, color: '#5E6B57', letterSpacing: '0.12em' }}>{selectedMember.cert}</span>
              <span style={{ width: 1, height: 12, background: 'rgba(10,10,10,0.15)' }} />
              <a href={selectedMember.li} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#0A0A0A' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A0A0A"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 500 }}>LinkedIn</span>
              </a>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.78, color: 'rgba(10,10,10,0.68)', margin: 0 }}>{selectedMember.bio}</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <section ref={ctaRef} style={{ background: '#0A0A0A', padding: '80px 20px 60px', color: '#F5F4F1', textAlign: 'center' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20, color: '#A8B0A2' }}>Início de relação</div>
        <h2 className="serif" style={{ fontSize: 'clamp(32px,8vw,48px)', lineHeight: 1.1, color: '#F5F4F1', marginBottom: 36 }}>
          Entre em contato<br />com o <em style={{ color: '#A8B0A2' }}>nosso time.</em>
        </h2>
        <a href="mailto:contato@teloswealth.com.br" className="syncop"
          style={{ display: 'inline-block', background: '#F5F4F1', color: '#0A0A0A', border: 'none', padding: '16px 32px', fontSize: 9, cursor: 'pointer', letterSpacing: '0.32em', textDecoration: 'none' }}>
          Entre em contato →
        </a>

        <div style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid rgba(245,244,241,0.08)' }}>
          <div className="syncop" style={{ fontSize: 8, color: 'rgba(245,244,241,0.35)', letterSpacing: '0.32em', marginBottom: 20 }}>DOCUMENTOS REGULATÓRIOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Código de Ética e Conduta', file: 'TELOS WEALTH - CÓDIGO DE ÉTICA E CONDUTA.pdf' },
              { label: 'Formulário de Referência — Anexo E', file: 'TELOS WEALTH - FORMULÁRIO DE REFERÊNCIA ANEXO - E - Clicksign.pdf' },
              { label: 'Manual de Compliance', file: 'TELOS WEALTH - MANUAL DE COMPLIANCE.pdf' },
              { label: 'Política de Investimentos Pessoais', file: 'TELOS WEALTH - POLÍTICA DE INVESTIMENTOS PESSOAIS.pdf' },
            ].map(({ label, file }) => (
              <a key={file} href={`/docs/${file}`} download
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', border: '1px solid rgba(245,244,241,0.08)', color: 'rgba(245,244,241,0.55)', textDecoration: 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 300, textAlign: 'left' }}>{label}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(245,244,241,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ filter: 'invert(1) brightness(1.6)' }}>
            <Logo size={32} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(245,244,241,0.25)', letterSpacing: '0.05em' }}>
            © 2026 Telos Wealth
          </div>
        </div>
      </section>

    </div>
  )
}
