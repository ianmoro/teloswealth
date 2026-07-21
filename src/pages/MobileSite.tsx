import { useState, useRef } from 'react'
import { Logo } from '../components/Logo'
import { PILARES, TEAM, LOCATIONS, PLANEJAMENTO_BLOCOS } from '../data'

interface Props {
  onArtigos: () => void
}

type TeamMember = typeof TEAM[0]

const ARTIGOS = [
  { num: '01', label: 'Investir o máximo o quanto antes', file: 'artigo-1.pdf' },
  { num: '02', label: 'O custo invisível de um modelo interesseiro', file: 'artigo-2.pdf' },
]

export default function MobileSite({ onArtigos: _onArtigos }: Props) {
  const ctaRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [previewPdf, setPreviewPdf] = useState<{ label: string; file: string } | null>(null)
  const [openPilar, setOpenPilar] = useState<string | null>(null)

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 10)
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F5F4F1', color: '#0A0A0A', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(245,244,241,0.94)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
          <Logo size={30} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })} className="syncop"
            style={{ fontSize: 7, background: '#0A0A0A', color: '#F5F4F1', border: 'none', padding: '9px 14px', cursor: 'pointer', letterSpacing: '0.28em' }}>
            Diagnóstico
          </button>
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A0A0A', padding: 6, display: 'flex', flexDirection: 'column', gap: 4.5 }}>
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', transition: 'transform .25s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', opacity: menuOpen ? 0 : 1, transition: 'opacity .2s' }} />
            <span style={{ display: 'block', width: 20, height: 1.5, background: 'currentColor', transition: 'transform .25s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* MENU */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 999, background: '#F5F4F1', borderBottom: '1px solid rgba(10,10,10,0.08)', padding: menuOpen ? '28px 20px 32px' : '0 20px', maxHeight: menuOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height .3s ease, padding .3s ease' }}>
        {[
          ['01 · Família', 'familia'],
          ['02 · Curva de Objetivos', 'objetivos'],
          ['03 · Vulnerabilidades', 'vulnerabilidades'],
          ['04 · Nossos Pilares', 'pilares'],
          ['05 · Nosso Time', 'time'],
          ['06 · Conteúdo', 'conteudo'],
        ].map(([label, id]) => (
          <button key={id} onClick={() => scrollTo(id)} className="syncop"
            style={{ display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 9, letterSpacing: '0.35em', color: 'rgba(10,10,10,0.6)', padding: '10px 0', borderBottom: '1px solid rgba(10,10,10,0.05)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* HERO */}
      <section style={{ minHeight: '100svh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '56px 20px 52px' }}>
        <div className="eyebrow eyebrow-terra" style={{ color: '#A8B0A2', marginBottom: 28 }}>Telos Wealth</div>
        <h1 className="serif" style={{ fontSize: 'clamp(32px,8.5vw,52px)', lineHeight: 1.22, color: '#F5F4F1', marginBottom: 36 }}>
          Investimentos e planejamento patrimonial.<br />
          Para essa geração <em style={{ color: '#A8C49A' }}>e para as próximas.</em>
        </h1>
        <button onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' })} className="syncop"
          style={{ alignSelf: 'flex-start', fontSize: 8, background: '#F5F4F1', color: '#0A0A0A', border: 'none', padding: '14px 26px', cursor: 'pointer', letterSpacing: '0.28em' }}>
          Falar com o time →
        </button>
      </section>

      {/* 01 · FAMÍLIA */}
      <section id="familia" style={{ padding: '64px 20px 56px', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>01 · Família</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px,7vw,38px)', lineHeight: 1.2, color: '#0A0A0A', marginBottom: 24 }}>
          Entendemos <em style={{ color: '#414E3A' }}>onde a sua família está</em> e <em style={{ color: '#414E3A' }}>onde ela quer chegar.</em>
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(10,10,10,0.6)', fontWeight: 300 }}>
          Cada família tem uma história, objetivos próprios e um caminho único. Nosso trabalho começa pelo entendimento profundo de onde você está e para onde quer ir.
        </p>
      </section>

      {/* 02 · CURVA DE OBJETIVOS */}
      <section id="objetivos" style={{ padding: '64px 20px 56px', borderTop: '1px solid rgba(10,10,10,0.06)', background: '#F0EFE9' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>02 · Curva de Objetivos</div>
        <h2 className="serif" style={{ fontSize: 'clamp(22px,6vw,34px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 24 }}>
          Construímos um <em style={{ color: '#414E3A' }}>plano</em> que <em style={{ color: '#414E3A' }}>maximiza a conquista</em> dos seus objetivos e <em style={{ color: '#414E3A' }}>resiste ao tempo.</em>
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(10,10,10,0.6)', fontWeight: 300 }}>
          Mapeamos cada objetivo — educação dos filhos, aposentadoria, aquisição de imóveis — e construímos uma curva de acumulação realista e sustentável.
        </p>
      </section>

      {/* 03 · VULNERABILIDADES */}
      <section id="vulnerabilidades" style={{ padding: '64px 20px 56px', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>03 · Vulnerabilidades</div>
        <h2 className="serif" style={{ fontSize: 'clamp(22px,6vw,34px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 36 }}>
          Mapeamos as <em style={{ color: '#414E3A' }}>vulnerabilidades patrimoniais</em> e as <em style={{ color: '#414E3A' }}>resolvemos</em> ao longo do tempo.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PLANEJAMENTO_BLOCOS.map((bloco) => (
            <div key={bloco} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(10,10,10,0.07)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#414E3A', flexShrink: 0 }} />
              <span style={{ fontSize: 15, color: 'rgba(10,10,10,0.7)', fontWeight: 300, lineHeight: 1.4 }}>{bloco}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 04 · PILARES */}
      <section id="pilares" style={{ padding: '64px 0 56px', borderTop: '1px solid rgba(10,10,10,0.06)', background: '#F0EFE9' }}>
        <div style={{ padding: '0 20px' }}>
          <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>04 · Nossos Pilares</div>
          <h2 className="serif" style={{ fontSize: 'clamp(22px,6vw,34px)', lineHeight: 1.22, color: '#0A0A0A', marginBottom: 32 }}>
            Os princípios que guiam <em style={{ color: '#414E3A' }}>cada decisão.</em>
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {PILARES.map((pil) => (
            <div key={pil.n} style={{ borderTop: '1px solid rgba(10,10,10,0.08)' }}>
              <button onClick={() => setOpenPilar(openPilar === pil.n ? null : pil.n)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px', gap: 16, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className="serif" style={{ fontSize: 28, color: 'rgba(65,78,58,0.4)', lineHeight: 1, flexShrink: 0 }}>{pil.n}</span>
                  <span className="serif" style={{ fontSize: 'clamp(16px,4.5vw,20px)', color: '#0A0A0A', lineHeight: 1.2 }}>{pil.lbl}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#414E3A" strokeWidth="1.5" strokeLinecap="round"
                  style={{ flexShrink: 0, transition: 'transform .25s', transform: openPilar === pil.n ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openPilar === pil.n && (
                <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.78, color: 'rgba(10,10,10,0.65)', margin: 0, padding: '0 20px 24px 56px' }}>{pil.def}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 05 · TIME */}
      <section id="time" style={{ padding: '64px 20px 56px', borderTop: '1px solid rgba(10,10,10,0.06)' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>05 · Nosso Time</div>
        <h2 className="serif" style={{ fontSize: 'clamp(26px,7vw,38px)', lineHeight: 1.1, color: '#0A0A0A', marginBottom: 28 }}>
          Sócios certificados.<br /><em style={{ color: '#414E3A' }}>Um único critério.</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'rgba(10,10,10,0.08)', marginBottom: 1 }}>
          {TEAM.map((p, i) => (
            <div key={i} onClick={() => setSelectedMember(p)}
              style={{ background: '#F5F4F1', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ padding: '24px 16px', minHeight: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(65,78,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syncopate', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: '#414E3A', fontWeight: 700 }}>{p.initials}</div>
                <div>
                  <div className="serif" style={{ fontSize: 14, lineHeight: 1.2, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(10,10,10,0.4)', marginBottom: 2 }}>{p.role}</div>
                  <div className="syncop" style={{ fontSize: 7, color: '#414E3A' }}>{p.cert}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: '#0A0A0A', color: '#F5F4F1', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="eyebrow eyebrow-terra" style={{ color: '#A8B0A2' }}>Onde estamos</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {LOCATIONS.map(l => (
              <span key={l} className="serif" style={{ fontSize: 14 }}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 06 · CONTEÚDO */}
      <section id="conteudo" style={{ padding: '64px 20px 56px', borderTop: '1px solid rgba(10,10,10,0.06)', background: '#F0EFE9' }}>
        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>06 · Conteúdo</div>
        <h2 className="serif" style={{ fontSize: 'clamp(24px,6.5vw,36px)', lineHeight: 1.15, color: '#0A0A0A', marginBottom: 40 }}>
          Perspectivas sobre<br />patrimônio e planejamento.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {ARTIGOS.map(({ num, label, file }) => (
            <div key={file} onClick={() => setPreviewPdf({ label, file })}
              style={{ background: '#F5F4F1', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span className="syncop" style={{ fontSize: 8, color: 'rgba(10,10,10,0.3)', letterSpacing: '0.3em', flexShrink: 0 }}>{num}</span>
                <span className="serif" style={{ fontSize: 16, lineHeight: 1.3, color: '#0A0A0A' }}>{label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(10,10,10,0.35)', flexShrink: 0 }}>
                <span className="syncop" style={{ fontSize: 7, letterSpacing: '0.25em' }}>PDF</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 28, fontSize: 12, color: 'rgba(10,10,10,0.4)', lineHeight: 1.7 }}>
          Novos artigos são publicados periodicamente. Entre em contato para receber atualizações.
        </p>
      </section>

      {/* CTA */}
      <section ref={ctaRef} style={{ background: '#0A0A0A', padding: '80px 20px 64px', color: '#F5F4F1', textAlign: 'center' }}>
        <h2 className="serif" style={{ fontSize: 'clamp(32px,9vw,52px)', lineHeight: 1.1, color: '#F5F4F1', marginBottom: 40 }}>
          Entre em contato<br />com o <em style={{ color: '#A8B0A2' }}>nosso time.</em>
        </h2>
        <a href="mailto:contato@teloswealth.com.br" className="syncop"
          style={{ display: 'inline-block', background: '#F5F4F1', color: '#0A0A0A', border: 'none', padding: '16px 32px', fontSize: 8, cursor: 'pointer', letterSpacing: '0.32em', textDecoration: 'none' }}>
          Entre em contato →
        </a>

        <div style={{ marginTop: 64, paddingTop: 40, borderTop: '1px solid rgba(245,244,241,0.08)' }}>
          <div className="syncop" style={{ fontSize: 7, color: 'rgba(245,244,241,0.3)', letterSpacing: '0.32em', marginBottom: 16 }}>DOCUMENTOS REGULATÓRIOS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: 'Código de Ética e Conduta', file: 'TELOS WEALTH - CÓDIGO DE ÉTICA E CONDUTA.pdf' },
              { label: 'Formulário de Referência — Anexo E', file: 'TELOS WEALTH - FORMULÁRIO DE REFERÊNCIA ANEXO - E - Clicksign.pdf' },
              { label: 'Manual de Compliance', file: 'TELOS WEALTH - MANUAL DE COMPLIANCE.pdf' },
              { label: 'Política de Investimentos Pessoais', file: 'TELOS WEALTH - POLÍTICA DE INVESTIMENTOS PESSOAIS.pdf' },
            ].map(({ label, file }) => (
              <a key={file} href={`/docs/${file}`} download
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 0', borderBottom: '1px solid rgba(245,244,241,0.06)', color: 'rgba(245,244,241,0.45)', textDecoration: 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 300, textAlign: 'left', lineHeight: 1.4 }}>{label}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </a>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(245,244,241,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ filter: 'invert(1) brightness(1.6)' }}>
            <Logo size={28} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(245,244,241,0.22)', letterSpacing: '0.05em' }}>© 2026 Telos Wealth</div>
        </div>
      </section>

      {/* TEAM POPUP */}
      {selectedMember && (
        <div onClick={() => setSelectedMember(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#F5F4F1', width: '100%', maxHeight: '90svh', overflowY: 'auto', borderRadius: '16px 16px 0 0', position: 'relative' }}>
            <div style={{ padding: '48px 24px 48px' }}>
              <button onClick={() => setSelectedMember(null)}
                style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="syncop" style={{ fontSize: 7, letterSpacing: '0.24em', color: '#414E3A', marginBottom: 8 }}>{selectedMember.role}</div>
              <h3 className="serif" style={{ fontSize: 26, lineHeight: 1.15, color: '#0A0A0A', marginBottom: 8 }}>{selectedMember.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span className="syncop" style={{ fontSize: 7, color: '#414E3A', letterSpacing: '0.12em' }}>{selectedMember.cert}</span>
                {selectedMember.li && <>
                  <span style={{ width: 1, height: 12, background: 'rgba(10,10,10,0.15)' }} />
                  <a href={selectedMember.li} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#0A0A0A' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#0A0A0A"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    <span style={{ fontSize: 11 }}>LinkedIn</span>
                  </a>
                </>}
              </div>
              {selectedMember.bio && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(10,10,10,0.65)', margin: 0 }}>{selectedMember.bio}</p>}
            </div>
          </div>
        </div>
      )}

      {/* PDF PREVIEW */}
      {previewPdf && (
        <div onClick={() => setPreviewPdf(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', height: '92svh', background: '#F5F4F1', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(10,10,10,0.08)', flexShrink: 0 }}>
              <span className="serif" style={{ fontSize: 14, color: '#0A0A0A', flex: 1, marginRight: 12 }}>{previewPdf.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a href={`/docs/${previewPdf.file}`} download onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#0A0A0A', color: '#F5F4F1', textDecoration: 'none', fontSize: 10, letterSpacing: '0.1em', fontFamily: "'Syncopate', sans-serif", borderRadius: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Baixar
                </a>
                <button onClick={() => setPreviewPdf(null)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(10,10,10,0.07)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <iframe src={`/docs/${previewPdf.file}#toolbar=0`} style={{ flex: 1, border: 'none', width: '100%' }} title={previewPdf.label} />
          </div>
        </div>
      )}

    </div>
  )
}
