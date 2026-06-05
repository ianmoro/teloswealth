import { Logo } from '../components/Logo'

const ARTIGOS = [
  {
    num: '01',
    label: 'Investir o máximo o quanto antes',
    file: 'Artigo #1.pdf',
  },
  {
    num: '02',
    label: 'O custo invisível de um modelo interesseiro',
    file: 'Artigo #2.pdf',
  },
]

interface Props {
  onBack: () => void
  isMobile: boolean
}

export default function ArtigosPage({ onBack, isMobile }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F4F1' }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: isMobile ? 60 : 78, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 20px' : '0 56px', background: 'rgba(245,244,241,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(10,10,10,0.06)' }}>
        <div onClick={onBack} style={{ cursor: 'pointer' }}>
          <Logo size={36} />
        </div>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(10,10,10,0.55)', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          <span className="syncop" style={{ fontSize: 9, letterSpacing: '0.32em' }}>Voltar</span>
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '100px 20px 80px' : '140px 56px 100px' }}>

        <div className="eyebrow eyebrow-terra" style={{ marginBottom: 20 }}>Artigos</div>

        <h1 className="serif" style={{ fontSize: isMobile ? 'clamp(28px,6vw,40px)' : 'clamp(32px,3.6vw,56px)', lineHeight: 1.14, color: '#0A0A0A', marginBottom: isMobile ? 48 : 72 }}>
          Perspectivas sobre<br />patrimônio e planejamento.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {ARTIGOS.map(({ num, label, file }) => (
            <a
              key={file}
              href={`/docs/${file}`}
              download
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: isMobile ? '24px 0' : '32px 0', borderBottom: '1px solid rgba(10,10,10,0.08)', textDecoration: 'none', color: '#0A0A0A', transition: 'opacity .2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.55' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
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
    </div>
  )
}
