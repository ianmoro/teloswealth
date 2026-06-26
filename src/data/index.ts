// ── All site data ──────────────────────────────────────

export const VULN_PAIRS = [
  { vuln: 'Pouca exposição internacional', sol: 'Alocação Internacional' },
  { vuln: 'Invalidez',                     sol: 'Seguro' },
  { vuln: 'Doença grave',                  sol: 'Seguro' },
  { vuln: 'Perda de renda',                sol: 'DIT' },
  { vuln: 'Conflito sucessório',           sol: 'Holding · Testamento' },
  { vuln: 'Imposto elevado',               sol: 'PGBL' },
  { vuln: 'Governança familiar ruim',      sol: 'Trust' },
]

export const PILARES = [
  {
    n: 'I',
    lbl: 'Transparência',
    def: 'Você sabe exatamente o que fazemos, por que fazemos e quanto custa. Sem letras miúdas, sem remunerações ocultas, sem conflitos disfarçados de recomendação.',
  },
  {
    n: 'II',
    lbl: 'Independência',
    def: 'Sem vínculo com produtos, plataformas ou instituições. Livres para recomendar o que é certo para você.',
  },
  {
    n: 'III',
    lbl: 'Imparcialidade',
    def: 'Cada decisão é tomada com base nos seus objetivos, no seu perfil e no seu momento de vida. Nunca no que nos beneficia. O produto certo é consequência do plano, nunca o ponto de partida.',
  },
  {
    n: 'IV',
    lbl: 'Confidencialidade',
    def: 'As informações que você compartilha conosco ficam restritas à nossa relação.',
  },
]

export const TEAM = [
  {
    name: 'Gabriel Almendra', cert: 'CFP®️', initials: 'GA',
    li: 'https://www.linkedin.com/in/gabriel-almendra-cfp%C2%AE-a66798132/',
    role: 'Co-Founder',
    photo: '/team/gabriel.jpg',
    bio: 'Com quase 15 anos de experiência no mercado financeiro, Gabriel Almendra é Planejador Financeiro CFP®️, formado em Administração de Empresas e CFA Level III Candidate. Ao longo de sua trajetória, construiu sua carreira em algumas das principais instituições financeiras do país, incluindo Banco Santander, Itaú Unibanco e Warren Investimentos, onde liderou o segmento Wealth em São Paulo.',
  },
  {
    name: 'Ian Moro', cert: 'CFP®️', initials: 'IM',
    li: 'https://br.linkedin.com/in/ianmoro',
    role: 'Co-Founder',
    photo: '/team/ian.jpg',
    bio: 'Engenheiro Civil pelo Instituto Mauá de Tecnologia, Ian traz para a gestão patrimonial um olhar estruturado e analítico. Com quase 10 anos de experiência no mercado financeiro, construiu sua trajetória em instituições como Magnetis, onde foi sócio e liderou a área de aquisição de clientes e parcerias, BTG Pactual e Warren Investimentos, sempre com foco no segmento de Wealth Management. Sócio-fundador e um dos administradores da Telos Wealth.',
  },
  {
    name: 'Lucas Taxweiler', cert: 'CFP®️', initials: 'LT',
    li: 'https://www.linkedin.com/in/lucas-taxweiler-cfp%C2%AE-b648a911a/',
    role: 'Co-Founder',
    photo: '/team/lucas.jpg',
    bio: 'Engenheiro Civil pelo Instituto Mauá de Tecnologia. Com quase 10 anos de experiência no mercado financeiro, construiu sua trajetória em instituições como Magnetis, onde foi sócio e liderou a área de wealth e relacionamento com os clientes, BTG Pactual e Warren Investimentos, onde também liderou o segmento Wealth da empresa. Sócio-fundador e um dos administradores da Telos Wealth.',
  },
  {
    name: 'Fernando Cieninga', cert: 'CFP®️', initials: 'FC',
    li: 'https://br.linkedin.com/in/fernando-cieninga-cfp%C2%AE-98a821ab',
    role: 'Senior Partner',
    photo: '/team/fernando.jpg',
    bio: 'Com quase 10 anos de experiência no mercado financeiro, Fernando Cieninga é Planejador Financeiro CFP®️ e formado em Administração. Atuou em instituições como Itaú e Warren, desenvolvendo experiência em planejamento financeiro, gestão patrimonial e acompanhamento de famílias e empresários em decisões financeiras relevantes. Antes do mercado financeiro, foi atleta de voleibol de alto rendimento, experiência que moldou sua visão sobre disciplina, planejamento e execução de longo prazo.',
  },
  {
    name: 'Rodrigo Albuquerque', cert: 'CFP®️', initials: 'RA',
    li: 'https://www.linkedin.com/in/rodrigo-albuquerque-cfp%C2%AE-41a1ba90/',
    role: 'Senior Partner',
    photo: '/team/rodrigo.jpg',
    bio: 'Engenheiro mecânico de formação, com MBA em Finanças pelo IBMEC. Possui 10 anos de experiência no mercado financeiro, com passagens por renomados Multi Family Offices, como Turim e TNA, além da Warren Investimentos.',
  },
  {
    name: 'Higo Hideki', cert: 'CEA', initials: 'HH',
    li: 'https://br.linkedin.com/in/higohideki',
    role: 'Senior Partner',
    photo: '/team/higo.jpg',
    bio: 'Com background em Exatas e formação multidisciplinar em Ciência e Tecnologia pela UFABC, Higo traz um perfil altamente analítico para a área de Wealth Management. É Especialista em Investimentos Anbima e acumula forte experiência no mercado financeiro. Atuando diretamente no relacionamento e na estratégia para clientes de alta renda, possui passagens como Daily Banker por grandes instituições como Itaú, Magnetis, BTG Pactual e Warren.',
  },
  {
    name: 'Renato Andrade', cert: 'CFP®️', initials: 'RA',
    li: 'https://br.linkedin.com/in/renatoandradejunior',
    role: 'Senior Partner',
    photo: '/team/renato.jpg',
    bio: 'Com mais de 15 anos de experiência no mercado financeiro, Renato Andrade é Planejador Financeiro CFP®️ e Especialista em Investimentos certificado pela ANBIMA (CEA). Ao longo de sua trajetória, atuou em instituições como Itaú, Magnetis, BTG Pactual e Warren, desenvolvendo experiência em planejamento financeiro, gestão patrimonial e construção de estratégias de investimento para pessoas e famílias.',
  },
]

export const LOCATIONS = ['São Paulo', 'Rio de Janeiro', 'Curitiba']

// ── Family tree ────────────────────────────────────────
export const TREE_NODES = [
  { id: 'carlos',  cx: 215, cy: 100, lbl: '40 anos',          you: true  },
  { id: 'ana',     cx: 665, cy: 100, lbl: '38 anos'                      },
  { id: 'lucas',   cx: 160, cy: 330, lbl: 'Filho · 8 anos'               },
  { id: 'beatriz', cx: 440, cy: 330, lbl: 'Filha · 5 anos'               },
  { id: 'pedro',   cx: 720, cy: 330, lbl: 'Filho · 2 anos'               },
]
export const TREE_LINES = [
  [275, 100, 605, 100], [440, 100, 440, 210], [160, 210, 720, 210],
  [160, 210, 160, 290], [440, 210, 440, 290], [720, 210, 720, 290],
]
export const TREE_SEQ = [
  { t: 'n', id: 'carlos',  s: 0.05, e: 0.12 },
  { t: 'n', id: 'ana',     s: 0.16, e: 0.24 },
  { t: 'l', i: 0,          s: 0.28, e: 0.40 },
  { t: 'u',                s: 0.40, e: 0.46 },
  { t: 'l', i: 1,          s: 0.46, e: 0.54 },
  { t: 'l', i: 2,          s: 0.54, e: 0.62 },
  { t: 'l', i: 3,          s: 0.62, e: 0.68 },
  { t: 'l', i: 4,          s: 0.63, e: 0.69 },
  { t: 'l', i: 5,          s: 0.64, e: 0.70 },
  { t: 'n', id: 'lucas',   s: 0.74, e: 0.82 },
  { t: 'n', id: 'beatriz', s: 0.77, e: 0.85 },
  { t: 'n', id: 'pedro',   s: 0.80, e: 0.88 },
]
export const GEN_LABELS = [
  { t: 'PRIMEIRA GERAÇÃO', y: 36 },
  { t: 'SEGUNDA GERAÇÃO',  y: 208 },
]

// ── Curve data ─────────────────────────────────────────
export const CURVE_EVENTS = [
  { age: 50,  lbl: 'Faculdade dos filhos', delta: -2,   tone: 'down'  },
  { age: 55,  lbl: 'Viagem em família',    delta: -0.6, tone: 'down'  },
  { age: 60,  lbl: 'Liberdade financeira', retire: true               },
  { age: 68,  lbl: 'Viagens recorrentes',  delta: -1.6, tone: 'down'  },
  { age: 74,  lbl: 'Casa de campo',        delta: -2.2, tone: 'down'  },
  { age: 86,  lbl: 'Doações',              delta: -1.4, tone: 'down'  },
  { age: 100, lbl: 'Legado',               legado: true               },
]

export function ageToT(age: number) { return (age - 45) / 55 }
export function tToAge(t: number)   { return 45 + t * 55 }

export function buildCurve(startM: number) {
  const N = 220
  const accRate = 0.082
  const useRate = 0.011
  const valAt60 = startM * Math.pow(1 + accRate, 15)
  const pts: { age: number; t: number; v: number }[] = []
  for (let i = 0; i <= N; i++) {
    const age = 45 + (i / N) * 55
    const t = (age - 45) / 55
    let v: number
    if (age <= 60) {
      v = startM * Math.pow(1 + accRate, age - 45)
    } else {
      v = valAt60 * Math.pow(1 + useRate, age - 60)
    }
    pts.push({ age, t, v })
  }
  const evs = CURVE_EVENTS
    .filter((e: any) => !e.retire && !e.legado)
    .sort((a: any, b: any) => a.age - b.age)
  for (let i = 0; i < pts.length; i++) {
    let add = 0
    for (const ev of evs as any[]) {
      if (pts[i].age >= ev.age) {
        const d = pts[i].age - ev.age
        const w = 0.8
        add += d < w ? ev.delta * (d / w) : ev.delta
      }
    }
    pts[i].v = Math.max(0.5, pts[i].v + add)
  }
  return pts
}
