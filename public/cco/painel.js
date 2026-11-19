// Painel CCO · lógica do painel (a mesma do painel no Claude)
/* ===== Formatos ===== */
const BRL = v => {
  v = Number(v) || 0; const a = Math.abs(v);
  if (a >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' mi';
  if (a >= 1e3) return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
};
const INT = v => Number(v || 0).toLocaleString('pt-BR');
const PCT = v => Math.round(Number(v) * 100) + '%';
const PCTN = v => v == null ? '—' : PCT(v);
const PCT1 = v => v == null ? '—' : (Number(v) * 100).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%';
const PART = v => v == null ? 'sem base' : PCT1(v);
const DIAS = v => v == null ? '—' : INT(v) + ' d';
const DATA = v => { if (!v) return 'Sem data'; const [y, m, d] = String(v).slice(0, 10).split('-'); return d + '/' + m + '/' + y.slice(2); };
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESLBL = v => /^\d{4}-\d{2}$/.test(v) ? MES[+v.slice(5) - 1] + '/' + v.slice(2, 4) : v;
const DBRL = v => (Number(v) > 0 ? '+' : Number(v) < 0 ? '−' : '') + BRL(Math.abs(Number(v) || 0));
const FMT = {dbrl: DBRL, brl: BRL, int: INT, pct: PCT, part: PART, data: DATA, dec: v => Number(v).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})};

const BANKERS = ['Tax', 'Fernando', 'Gabe', 'Ian', 'Renato', 'Rodrigo'];
/* Originadores mostrados na visão de originação. Para incluir outro, acrescente o nome aqui. */
const ORIGINADORES = ['Tax', 'Ian', 'Gabe'];

const num = v => Number(v) || 0;
const soma = (l, f) => l.reduce((t, r) => t + (typeof f === 'function' ? f(r) : num(r[f])), 0);
const LINHA_CAP = t => t === 'Conta nova' || t === 'Aporte adicional' || t === 'Previdência';
const PROB = (etapa, temp) => etapa === 'Ganho' ? 1 : etapa === 'Perdido' ? 0 : temp === 'Quente' ? 0.9 : temp === 'Morno' ? 0.6 : temp === 'Frio' ? 0.1 : 0;
const ABERTO = e => e !== 'Ganho' && e !== 'Perdido';
const doB = b => r => b === 'Todos' || r.banker === b;
const ehAberto = r => Number(r.aberto) === 1;
/* Regra única de ponderação: resgate em aberto conta pelo valor cheio, sem olhar a temperatura. */
const pondDe = r => r.linha === 'Saída' ? num(r.valor) : num(r.valor) * PROB(r.etapa, r.temperatura);
const isCap = r => r.linha === 'Captação', isRec = r => r.linha === 'Receita', isSai = r => r.linha === 'Saída';

/* ===== Período ===== */
const pad2 = n => String(n).padStart(2, '0');
const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const fimMes = ym => { const [y, m] = ym.split('-').map(Number); return ym + '-' + pad2(new Date(Date.UTC(y, m, 0)).getUTCDate()); };
const mesAnt = ym => { let [y, m] = ym.split('-').map(Number); m--; if (!m) { m = 12; y--; } return y + '-' + pad2(m); };
function proxMes(m) { let [y, mm] = m.split('-').map(Number); mm++; if (mm > 12) { mm = 1; y++; } return y + '-' + pad2(mm); }
const mesAtualIni = () => hojeISO().slice(0, 7) + '-01';
function PER() {
  const p = dash.params() || {};
  if (p.per_tipo === 'tudo') return {tipo: 'tudo', ini: null, fim: null};
  if (['mes', 'ano', 'intervalo'].includes(p.per_tipo) && p.per_ini && p.per_fim) return {tipo: p.per_tipo, ini: p.per_ini, fim: p.per_fim};
  const m = hojeISO().slice(0, 7); return {tipo: 'mes', ini: m + '-01', fim: fimMes(m)};
}
const perLabel = P => P.tipo === 'tudo' ? 'Período inteiro' : P.tipo === 'mes' ? MESLBL(P.ini.slice(0, 7)) : P.tipo === 'ano' ? P.ini.slice(0, 4) : DATA(P.ini) + ' a ' + DATA(P.fim);
const dentro = (d, P) => P.tipo === 'tudo' || (!!d && d >= P.ini && d <= P.fim);
/* Em aberto conta pela previsão de fechamento; previsões de meses anteriores ao mês de referência contam nele. */
const efetAberto = (r, refIni) => r.previsao ? (r.previsao < refIni ? refIni : r.previsao) : null;
const abertoNoPer = (r, P) => P.tipo === 'tudo' || dentro(efetAberto(r, mesAtualIni()), P);
const fechadoNoPer = (r, P) => !!r.concluido && dentro(r.concluido, P);
const mesNoPer = (m, P) => P.tipo === 'tudo' || (m >= P.ini.slice(0, 7) && m <= P.fim.slice(0, 7));

/* ===== Leitura do Notion: todas as páginas de 100 linhas ===== */
const PAGINAR_NOTION = async ({answer, call, args}) => {
  const ler = a => {
    if (a && Array.isArray(a.content)) a = a.content.map(c => c.text || '').join('');
    if (typeof a === 'string') { let t = a.slice(a.indexOf('{')); const k = t.indexOf('\n\n['); if (k > 0) t = t.slice(0, k); a = JSON.parse(t.trim()); }
    if (!a || !Array.isArray(a.results)) throw new Error((a && (a.message || a.error)) || 'Resposta do Notion sem linhas.');
    return a;
  };
  let pag = ler(answer); const rows = [...pag.results];
  const base = args.data.query.replace(/\s*LIMIT\s+100\s+OFFSET\s+\d+\s*$/i, '');
  let n = 0;
  while ((pag.has_more || pag.results.length === 100) && n < 30) {
    n++;
    pag = ler(await call('notion-query-data-sources', {...args, data: {...args.data, query: base + '\nLIMIT 100 OFFSET ' + (100 * n)}}));
    rows.push(...pag.results);
    if (!pag.results.length) break;
  }
  return {rows, columns: rows.length ? Object.keys(rows[0]) : [], cut: n >= 30 && (pag.has_more || pag.results.length === 100)};
};
['historico', 'negocios_vivo', 'tarefas_abertas', 'originacao', 'params', 'reunioes'].forEach(id => dash.loader(id, {description: 'Lê todas as páginas de 100 linhas que o Notion devolve.', fn: PAGINAR_NOTION}));

/* ===== Resumo ===== */
dash.calc('ritmo_bp', {
  inputs: ['bp_additional'],
  title: 'Ritmo mensal do BP por banker',
  description: 'Additional esperado no BP 2027, dividido por 12 meses, em reais, para cada banker do painel e a soma deles (Todos).',
  fn: (bp_additional) => {
    const rows = BANKERS.map(b => { const r = bp_additional.find(x => x.banker === b); return {banker: b, ritmo_mensal: r ? Math.round(Number(r.esperado_mi) * 1e6 / 12) : null}; });
    const completo = rows.every(r => r.ritmo_mensal != null);
    return [{banker: 'Todos', ritmo_mensal: completo ? rows.reduce((t, r) => t + r.ritmo_mensal, 0) : null}, ...rows];
  }
});
dash.calc('c_kpis', {
  inputs: ['negocios_vivo'],
  title: 'Números do Resumo no período',
  description: 'Por banker, no período do filtro. Em aberto conta pela previsão de fechamento (atrasados no mês atual); realizado pela data de conclusão. Captação esperada e receita esperada são ponderadas pela Temperatura. Resgates em risco contam pelo valor cheio. Captação na mesa é todo o pipeline de captação em aberto, de qualquer data.',
  fn: (negocios_vivo) => {
    const P = PER(), hoje = hojeISO();
    return ['Todos', ...BANKERS].map(b => {
      const l = negocios_vivo.filter(doB(b)), ab = l.filter(ehAberto), abP = ab.filter(r => abertoNoPer(r, P));
      return {banker: b,
        cap_esperada: Math.round(soma(abP.filter(isCap), pondDe)), cap_esperada_bruta: Math.round(soma(abP.filter(isCap), 'valor')),
        captado: Math.round(soma(l.filter(r => r.etapa === 'Ganho' && isCap(r) && fechadoNoPer(r, P)), 'valor')),
        receita_esperada: Math.round(soma(abP.filter(isRec), pondDe)), receita_esperada_bruta: Math.round(soma(abP.filter(isRec), 'valor')),
        cap_mesa: Math.round(soma(ab.filter(isCap), pondDe)), cap_mesa_bruta: Math.round(soma(ab.filter(isCap), 'valor')),
        resg_risco: Math.round(soma(abP.filter(isSai), 'valor')),
        abertos: abP.length, vencidas: abP.filter(r => r.previsao && r.previsao < hoje).length};
    });
  }
});
dash.calc('c_fluxo', {
  inputs: ['negocios_vivo'],
  title: 'Captação, resgates e receita por mês',
  description: 'Por banker e mês: realizado pela data de conclusão (captação ganha, resgate efetivado, receita ganha) e em aberto pela previsão de fechamento, com atrasados no mês atual. Captação e receita em aberto vêm ponderadas e brutas; resgates em aberto pelo valor cheio. Negócios em aberto sem previsão ficam fora.',
  fn: (negocios_vivo) => {
    const g = {}, ref = mesAtualIni();
    const add = (b, m, k, v) => ['Todos', b].forEach(bb => { const key = bb + '|' + m; const o = g[key] = g[key] || {chave: key, banker: bb, mes: m, cap_real: 0, cap_prev: 0, cap_prev_abs: 0, sai_real: 0, sai_prev: 0, rec_real: 0, rec_prev: 0, rec_prev_abs: 0}; o[k] += v; });
    negocios_vivo.forEach(r => {
      const v = num(r.valor);
      if (ehAberto(r)) {
        const e = efetAberto(r, ref); if (!e) return; const m = e.slice(0, 7);
        if (isCap(r)) { add(r.banker, m, 'cap_prev', pondDe(r)); add(r.banker, m, 'cap_prev_abs', v); }
        else if (isRec(r)) { add(r.banker, m, 'rec_prev', pondDe(r)); add(r.banker, m, 'rec_prev_abs', v); }
        else if (isSai(r)) add(r.banker, m, 'sai_prev', v);
      } else if (r.concluido) {
        const m = r.concluido.slice(0, 7);
        if (r.etapa === 'Ganho' && isCap(r)) add(r.banker, m, 'cap_real', v);
        else if (r.etapa === 'Ganho' && isRec(r)) add(r.banker, m, 'rec_real', v);
        else if (r.etapa === 'Perdido' && isSai(r)) add(r.banker, m, 'sai_real', v);
      }
    });
    return Object.values(g).map(o => { Object.keys(o).forEach(k => { if (typeof o[k] === 'number') o[k] = Math.round(o[k]); }); return o; }).sort((a, b) => a.chave < b.chave ? -1 : 1);
  }
});
dash.calc('c_conc5', {
  inputs: ['negocios_vivo'],
  title: 'Concentração do pipeline no período',
  description: 'Por banker e consolidado: os 5 maiores negócios de captação em aberto no período, pelo valor ponderado, com o cliente, a participação de cada um e a acumulada no total ponderado do período.',
  fn: (negocios_vivo) => {
    const P = PER(), out = [];
    ['Todos', ...BANKERS].forEach(b => {
      const l = negocios_vivo.filter(r => doB(b)(r) && ehAberto(r) && isCap(r) && abertoNoPer(r, P)).map(r => ({...r, pond: pondDe(r)})).filter(r => r.pond > 0).sort((x, y) => y.pond - x.pond);
      const tot = soma(l, 'pond'); let acc = 0;
      l.slice(0, 5).forEach((r, i) => { acc += r.pond; out.push({chave: b + '|' + (i + 1), banker: b, posicao: i + 1, negocio: r.negocio, cliente: r.cliente, dono: r.banker, tipo: r.tipo, ponderado: Math.round(r.pond), participacao: Math.round(r.pond / tot * 10000) / 10000, acumulado: Math.round(acc / tot * 10000) / 10000}); });
    });
    return out;
  }
});

/* ===== Forecast (não segue o filtro de período) ===== */
const FIM_HORIZONTE = '2027-12';
function projetar(params, vivo, metas) {
  const telos = params.find(p => p.tipo === 'Telos');
  const ref = (telos && telos.data_ref) ? String(telos.data_ref).slice(0, 10) : null;
  if (!ref) return {rows: [], resumo: [], itens: []};
  const inicio = ref.slice(0, 7), mesAt = hojeISO().slice(0, 7), refIni = mesAt + '-01';
  const meses = []; for (let m = inicio; m <= FIM_HORIZONTE; m = proxMes(m)) meses.push(m);
  const ganho = {}; params.filter(p => p.tipo === 'Mercado').forEach(p => { ganho[String(p.ano)] = Number(p.ganho_aa) || 0; });
  const meta = {}; metas.forEach(r => { meta[r.mes] = Number(r.meta); });
  const rows = [], resumo = [], itens = [];
  ['Todos', ...BANKERS].forEach(b => {
    const pr = b === 'Todos' ? telos : params.find(p => p.tipo === 'Banker' && p.linha === b);
    if (!pr || pr.aua_inicial == null) return;
    const aua0 = Number(pr.aua_inicial), dref = String(pr.data_ref || ref).slice(0, 10);
    ['pond', 'abs'].forEach(base => {
      const fluxo = {}; meses.forEach(m => { fluxo[m] = {cap: 0, sai: 0}; });
      let semPrev = 0;
      vivo.filter(doB(b)).forEach(r => {
        const v = num(r.valor);
        const item = (m, cat, valor, pond) => itens.push({chave: `${b}|${base}|${r.id}`, banker: b, dono: r.banker, base, mes: m, ano: m.slice(0, 4), negocio: r.negocio, categoria: cat, detalhe: [r.tipo, r.etapa, ...(ehAberto(r) ? [r.temperatura || 'sem temperatura', 'previsão ' + DATA(r.previsao)] : ['concluído em ' + DATA(r.concluido)])].join(' · '), valor: Math.round(valor), ponderado: Math.round(pond)});
        if (!ehAberto(r)) {
          if (!r.concluido || r.concluido < dref) return;
          let m = r.concluido.slice(0, 7); if (m < inicio) m = inicio; if (!fluxo[m]) return;
          if (r.etapa === 'Ganho' && isCap(r)) { fluxo[m].cap += v; item(m, 'Captado', v, v); }
          else if (r.etapa === 'Perdido' && isSai(r)) { fluxo[m].sai += v; item(m, 'Resgate efetivado', -v, -v); }
          return;
        }
        if (!isCap(r) && !isSai(r)) return;
        if (!r.previsao) { if (isCap(r)) semPrev += v; return; }
        let m = efetAberto(r, refIni).slice(0, 7); if (m < inicio) m = inicio; if (!fluxo[m]) return;
        if (isCap(r)) { const a = base === 'pond' ? pondDe(r) : v; fluxo[m].cap += a; item(m, 'Captação em aberto', v, a); }
        else { fluxo[m].sai += v; item(m, 'Resgate em risco', -v, -v); }
      });
      const idx = {}; meses.forEach((m, i) => { idx[m] = i; });
      const ancoras = [[-1, aua0]];
      if (b === 'Todos') Object.keys(meta).sort().forEach(m => { if (idx[m] != null) ancoras.push([idx[m], meta[m]]); });
      const traj = i => {
        if (ancoras.length < 2) return null;
        for (let k = 1; k < ancoras.length; k++) { const [i0, v0] = ancoras[k - 1], [i1, v1] = ancoras[k]; if (i <= i1) return Math.round(v0 + (v1 - v0) * (i - i0) / (i1 - i0)); }
        return null;
      };
      let aua = aua0, mkt = aua0, capLiq = 0; const capAno = {}, mktAno = {};
      rows.push({chave: `${b}|${base}|inicio`, banker: b, base, mes: 'inicio', data: dref, aua: aua0, so_mercado: aua0, captacao: 0, saida: 0, ganho_mes: 0, taxa_mes: 0, aua_inicio_mes: aua0, meta_traj: b === 'Todos' ? aua0 : null});
      meses.forEach((m, i) => {
        const taxa = Math.pow(1 + (ganho[m.slice(0, 4)] || 0), 1 / 12) - 1;
        const f = fluxo[m], a0 = aua, g = aua * taxa;
        aua = aua + g + f.cap - f.sai; mkt = mkt * (1 + taxa); capLiq += f.cap - f.sai;
        capAno[m.slice(0, 4)] = (capAno[m.slice(0, 4)] || 0) + f.cap - f.sai; mktAno[m.slice(0, 4)] = (mktAno[m.slice(0, 4)] || 0) + g;
        rows.push({chave: `${b}|${base}|${m}`, banker: b, base, mes: m, data: null, aua: Math.round(aua), so_mercado: Math.round(mkt), captacao: Math.round(f.cap), saida: Math.round(f.sai), ganho_mes: Math.round(g), taxa_mes: Math.round(taxa * 1e6) / 1e6, aua_inicio_mes: Math.round(a0), meta_traj: b === 'Todos' ? traj(i) : null});
      });
      const p26 = rows.find(r => r.chave === `${b}|${base}|2026-12`), p27 = rows.find(r => r.chave === `${b}|${base}|2027-12`);
      const m26 = b === 'Todos' ? (meta['2026-12'] ?? null) : null, m27 = b === 'Todos' ? (meta['2027-12'] ?? null) : null;
      resumo.push({chave: `${b}|${base}`, banker: b, base, aua_inicial: aua0, data_ref: dref,
        proj_2026: p26 ? p26.aua : null, proj_2027: p27 ? p27.aua : null, meta_2026: m26, meta_2027: m27,
        gap_2026: m26 != null && p26 ? m26 - p26.aua : null, gap_2027: m27 != null && p27 ? m27 - p27.aua : null,
        capt_liquida: Math.round(capLiq), mercado: Math.round((mktAno['2026'] || 0) + (mktAno['2027'] || 0)),
        capt_liq_2026: Math.round(capAno['2026'] || 0), capt_liq_2027: Math.round(capAno['2027'] || 0),
        mercado_2026: Math.round(mktAno['2026'] || 0), mercado_2027: Math.round(mktAno['2027'] || 0),
        sem_previsao: Math.round(semPrev), ganho_2026: ganho['2026'] ?? null, ganho_2027: ganho['2027'] ?? null});
    });
  });
  return {rows, resumo, itens};
}
dash.calc('forecast', {
  inputs: ['params', 'negocios_vivo', 'metas'],
  title: 'Curva de AuA projetada',
  description: 'Mês a mês até dez/2027: AuA inicial dos Parâmetros, mais ganho de capital mensal (taxa anual dos Parâmetros), mais captação ganha desde a data de referência e captação em aberto pelo mês de fechamento (ponderada ou bruta), menos resgates efetivados desde a data de referência e resgates em aberto pelo valor cheio. Atrasados entram no mês atual; negócios sem previsão ficam fora.',
  fn: (params, negocios_vivo, metas) => projetar(params, negocios_vivo, metas).rows
});
dash.calc('forecast_resumo', {
  inputs: ['params', 'negocios_vivo', 'metas'],
  title: 'Resumo do forecast',
  description: 'AuA projetado em dez/2026 e dez/2027, gap para as metas da Telos, captação líquida esperada e ganho de capital por ano, por banker e base.',
  fn: (params, negocios_vivo, metas) => projetar(params, negocios_vivo, metas).resumo
});
dash.calc('forecast_itens', {
  inputs: ['params', 'negocios_vivo', 'metas'],
  title: 'Negócios por trás da captação líquida do forecast',
  description: 'Cada negócio que entra na curva: captado e resgate efetivado desde a data de referência, captação em aberto (ponderada ou bruta) e resgate em risco pelo valor cheio, no mês em que entra.',
  fn: (params, negocios_vivo, metas) => projetar(params, negocios_vivo, metas).itens
});
dash.calc('aua_atual', {
  inputs: ['params', 'negocios_vivo'],
  title: 'AuA atual',
  description: 'AuA inicial dos Parâmetros, mais a captação ganha (Conta nova, Aporte adicional e Previdência com conclusão a partir da data de referência), menos os resgates efetivados no mesmo período. Sem ganho de capital.',
  fn: (params, negocios_vivo) => ['Todos', ...BANKERS].map(b => {
    const p = b === 'Todos' ? params.find(x => x.tipo === 'Telos') : params.find(x => x.tipo === 'Banker' && x.linha === b);
    if (!p || p.aua_inicial == null) return null;
    const ref = String(p.data_ref || '').slice(0, 10);
    const d = negocios_vivo.filter(r => doB(b)(r) && r.concluido && (!ref || r.concluido >= ref));
    const captado = soma(d.filter(r => r.etapa === 'Ganho' && isCap(r)), 'valor'), resgatado = soma(d.filter(r => r.etapa === 'Perdido' && isSai(r)), 'valor');
    const aua0 = Number(p.aua_inicial);
    return {banker: b, aua_inicial: aua0, data_ref: ref || null, captado, resgatado, aua_atual: aua0 + captado - resgatado};
  }).filter(Boolean)
});

/* ===== Pipeline ===== */
dash.calc('c_tipo', {
  inputs: ['negocios_vivo'],
  title: 'Em aberto por tipo no período',
  description: 'Negócios em aberto com previsão no período (atrasados no mês atual), por banker e tipo: quantidade, valor bruto, ponderado (resgates pelo valor cheio) e idade média.',
  fn: (negocios_vivo) => {
    const P = PER(), g = {};
    negocios_vivo.filter(r => ehAberto(r) && abertoNoPer(r, P)).forEach(r => ['Todos', r.banker].forEach(b => {
      const k = b + '|' + r.tipo; const o = g[k] = g[k] || {chave: k, banker: b, tipo: r.tipo, linha: r.linha, negocios: 0, valor: 0, ponderado: 0, idade: 0};
      o.negocios++; o.valor += num(r.valor); o.ponderado += pondDe(r); o.idade += num(r.idade_dias);
    }));
    return Object.values(g).map(o => ({chave: o.chave, banker: o.banker, tipo: o.tipo, linha: o.linha, negocios: o.negocios, valor: Math.round(o.valor), ponderado: Math.round(o.ponderado), idade_media_dias: Math.round(o.idade / o.negocios)})).sort((a, b) => a.linha.localeCompare(b.linha) || b.ponderado - a.ponderado);
  }
});
dash.calc('c_concl', {
  inputs: ['negocios_vivo'],
  title: 'Concluídos por tipo no período',
  description: 'Negócios concluídos com data de conclusão no período, por banker e tipo: ganhos, perdidos, taxa de ganho, ciclo médio (início até conclusão) e valor ganho.',
  fn: (negocios_vivo) => {
    const P = PER(), g = {};
    negocios_vivo.filter(r => !ehAberto(r) && fechadoNoPer(r, P)).forEach(r => ['Todos', r.banker].forEach(b => {
      const k = b + '|' + r.tipo; const o = g[k] = g[k] || {chave: k, banker: b, tipo: r.tipo, linha: r.linha, ganhos: 0, perdidos: 0, dias: 0, nd: 0, realizado: 0};
      if (r.etapa === 'Ganho') { o.ganhos++; o.realizado += num(r.valor); } else o.perdidos++;
      if (r.inicio) { o.dias += (Date.parse(r.concluido) - Date.parse(r.inicio)) / 864e5; o.nd++; }
    }));
    return Object.values(g).map(o => ({chave: o.chave, banker: o.banker, tipo: o.tipo, linha: o.linha, ganhos: o.ganhos, perdidos: o.perdidos, taxa_ganho: Math.round(o.ganhos / (o.ganhos + o.perdidos) * 100) / 100, ciclo_medio_dias: o.nd ? Math.round(o.dias / o.nd) : null, realizado: Math.round(o.realizado)})).sort((a, b) => a.linha.localeCompare(b.linha) || a.tipo.localeCompare(b.tipo));
  }
});
dash.calc('c_origem', {
  inputs: ['negocios_vivo'],
  title: 'Pipeline por origem no período',
  description: 'Sem resgates. Em aberto e ponderados pela previsão no período; ganhos, perdidos, taxa e captado pela conclusão no período. % do captado = fatia da linha no captado total do banker no período.',
  fn: (negocios_vivo) => {
    const P = PER(), g = {}, tot = {};
    negocios_vivo.filter(r => !isSai(r)).forEach(r => {
      const ab = ehAberto(r) && abertoNoPer(r, P), fe = !ehAberto(r) && fechadoNoPer(r, P);
      if (!ab && !fe) return;
      ['Todos', r.banker].forEach(b => {
        const k = b + '|' + r.origem; const o = g[k] = g[k] || {chave: k, banker: b, origem: r.origem, abertos: 0, captacao_ponderada: 0, receita_ponderada: 0, ganhos: 0, perdidos: 0, captado: 0};
        if (ab) { o.abertos++; if (isCap(r)) o.captacao_ponderada += pondDe(r); if (isRec(r)) o.receita_ponderada += pondDe(r); }
        else { if (r.etapa === 'Ganho') o.ganhos++; else o.perdidos++; if (r.etapa === 'Ganho' && isCap(r)) { o.captado += num(r.valor); tot[b] = (tot[b] || 0) + num(r.valor); } }
      });
    });
    return Object.values(g).map(o => ({...o, captacao_ponderada: Math.round(o.captacao_ponderada), receita_ponderada: Math.round(o.receita_ponderada), captado: Math.round(o.captado), taxa_ganho: o.ganhos + o.perdidos ? Math.round(o.ganhos / (o.ganhos + o.perdidos) * 100) / 100 : null, pct_captado: tot[o.banker] ? Math.round(o.captado / tot[o.banker] * 1000) / 1000 : null})).sort((a, b) => b.captacao_ponderada - a.captacao_ponderada || b.abertos - a.abertos);
  }
});
dash.calc('c_perdas', {
  inputs: ['negocios_vivo'],
  title: 'Motivos de perda no período',
  description: 'Sem resgates: negócios perdidos com conclusão no período e valor, por Motivo de perda.',
  fn: (negocios_vivo) => {
    const P = PER(), g = {};
    negocios_vivo.filter(r => r.etapa === 'Perdido' && !isSai(r) && fechadoNoPer(r, P)).forEach(r => ['Todos', r.banker].forEach(b => {
      const k = b + '|' + r.motivo; const o = g[k] = g[k] || {chave: k, banker: b, motivo: r.motivo, negocios: 0, valor: 0}; o.negocios++; o.valor += num(r.valor);
    }));
    return Object.values(g).sort((a, b) => b.negocios - a.negocios || b.valor - a.valor);
  }
});
dash.calc('c_lista', {
  inputs: ['negocios_vivo'],
  title: 'Negócios em aberto no período',
  description: 'Negócios em aberto com previsão no período (atrasados no mês atual; sem previsão só em Período inteiro), com cliente, valores e previsão. Ponderado de resgate = valor cheio.',
  fn: (negocios_vivo) => {
    const P = PER(), hoje = hojeISO();
    return negocios_vivo.filter(r => ehAberto(r) && abertoNoPer(r, P)).map(r => ({chave: r.id, url: r.url, banker: r.banker, negocio: r.negocio, cliente: r.cliente, tipo: r.tipo, etapa: r.etapa, temperatura: r.temperatura || '—', valor: num(r.valor), valor_vazio: Number(r.valor_vazio), ponderado: Math.round(pondDe(r)), previsao: r.previsao, vencida: r.previsao && r.previsao < hoje ? 'Sim' : 'Não', idade_dias: r.idade_dias}))
      .sort((a, b) => (a.previsao || '9999') < (b.previsao || '9999') ? -1 : (a.previsao || '9999') > (b.previsao || '9999') ? 1 : 0);
  }
});

/* ===== Time ===== */
const semanaDe = d => { const t = new Date(d + 'T12:00:00Z'); const w = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - w); return t.toISOString().slice(0, 10); };
dash.calc('c_reun', {
  inputs: ['reunioes'],
  title: 'Reuniões no período',
  description: 'Por banker: reuniões no período até hoje, média por semana do período, agendadas a partir de amanhã (independe do período) e última reunião. Lê a base de Reuniões pela Data da reunião.',
  fn: (reunioes) => {
    const P = PER(), hoje = hojeISO();
    const ini = P.tipo === 'tudo' ? (reunioes.reduce((m, r) => r.data && r.data < m ? r.data : m, hoje)) : P.ini;
    const fim = P.tipo === 'tudo' ? hoje : (P.fim < hoje ? P.fim : hoje);
    const semanas = fim >= ini ? Math.max(1, Math.round((Date.parse(fim) - Date.parse(semanaDe(ini))) / (7 * 864e5)) + 1) : null;
    return ['Todos', ...BANKERS].map(b => {
      const l = reunioes.filter(doB(b)).filter(r => r.data);
      const np = l.filter(r => r.data <= hoje && dentro(r.data, P)).length;
      return {banker: b, no_periodo: np, media_semanal: semanas ? Math.round(np / semanas * 10) / 10 : null, agendadas: l.filter(r => r.data > hoje).length, ultima: l.reduce((m, r) => r.data <= hoje && (!m || r.data > m) ? r.data : m, null)};
    });
  }
});
dash.calc('c_comp', {
  inputs: ['negocios_vivo', 'reunioes', 'params'],
  title: 'Comparativo entre bankers no período',
  description: 'Por banker: pipeline ponderado de captação, receita ponderada, resgates em risco (valor cheio) e negócios em aberto com previsão no período; ganhos, taxa de ganho e ciclo médio (captação e receita, início até conclusão) com conclusão no período; reuniões no período. % do AuA = pipeline ponderado sobre o AuA inicial dos Parâmetros.',
  fn: (negocios_vivo, reunioes, params) => {
    const P = PER(), hoje = hojeISO();
    const ciclo = l => { const d = l.filter(r => r.inicio).map(r => (Date.parse(r.concluido) - Date.parse(r.inicio)) / 864e5); return d.length ? Math.round(d.reduce((a, x) => a + x, 0) / d.length) : null; };
    return [...BANKERS, 'Todos'].map(b => {
      const p = b === 'Todos' ? params.find(x => x.tipo === 'Telos') : params.find(x => x.tipo === 'Banker' && x.linha === b);
      const aua = p && p.aua_inicial != null ? Number(p.aua_inicial) : null;
      const l = negocios_vivo.filter(doB(b)), abP = l.filter(r => ehAberto(r) && abertoNoPer(r, P)), fe = l.filter(r => !ehAberto(r) && fechadoNoPer(r, P));
      const cp = Math.round(soma(abP.filter(isCap), pondDe)), ganhos = fe.filter(r => r.etapa === 'Ganho').length;
      return {banker: b, aua_inicial: aua, captacao_ponderada: cp, pipeline_sobre_aua: aua ? Math.round(cp / aua * 10000) / 10000 : null,
        receita_ponderada: Math.round(soma(abP.filter(isRec), pondDe)), resg_risco: Math.round(soma(abP.filter(isSai), 'valor')), abertos: abP.length,
        ganhos, taxa_ganho: fe.length ? Math.round(ganhos / fe.length * 100) / 100 : null,
        ciclo_cap: ciclo(fe.filter(isCap)), ciclo_rec: ciclo(fe.filter(isRec)),
        reunioes: reunioes.filter(r => doB(b)(r) && r.data && r.data <= hoje && dentro(r.data, P)).length};
    });
  }
});
dash.calc('c_orig_res', {
  inputs: ['originacao'],
  title: 'Originação por banker no período',
  description: 'Por quem originou (Tax, Ian e Gabe) e a soma dos três: originações em aberto com previsão no período, ganhas e perdidas com conclusão no período, conversão e volume cadastrado. Não entra em captação nem receita.',
  fn: (originacao) => {
    const P = PER(), ref = mesAtualIni();
    return ['Todos', ...ORIGINADORES].map(b => {
      const r = originacao.filter(x => b === 'Todos' ? ORIGINADORES.includes(x.banker) : x.banker === b);
      const a = r.filter(x => ABERTO(x.etapa) && (P.tipo === 'tudo' || dentro(efetAberto(x, ref), P))), f = r.filter(x => !ABERTO(x.etapa) && fechadoNoPer(x, P));
      const g = f.filter(x => x.etapa === 'Ganho'), p = f.filter(x => x.etapa === 'Perdido');
      return {banker: b, abertas: a.length, ganhas: g.length, perdidas: p.length, conversao: f.length ? Math.round(g.length / f.length * 100) / 100 : null, volume_aberto: soma(a, 'valor'), volume_ganho: soma(g, 'valor')};
    });
  }
});
dash.calc('c_orig_lista', {
  inputs: ['originacao'],
  title: 'Originações no período',
  description: 'Originações em aberto com previsão no período ou concluídas no período, com quem originou e o banker do deal ligado em Deal conduzido.',
  fn: (originacao) => {
    const P = PER(), ref = mesAtualIni();
    return originacao.filter(x => ABERTO(x.etapa) ? (P.tipo === 'tudo' || dentro(efetAberto(x, ref), P)) : fechadoNoPer(x, P)).map(x => ({chave: x.id, banker: x.banker, conduzido: x.conduzido, negocio: x.negocio, etapa: x.etapa, etapa_conduzido: x.etapa_conduzido, temperatura: x.temperatura || '—', valor: num(x.valor), previsao: x.previsao, concluido: x.concluido}));
  }
});

/* ===== Saúde do pipeline ===== */
function pendencias(vivo, tarefas, P) {
  const comTarefa = new Set(tarefas.map(t => t.negocio_id)), hoje = hojeISO();
  return vivo.filter(r => ehAberto(r) && (!r.previsao || abertoNoPer(r, P))).map(r => {
    const p = [];
    if (r.previsao && r.previsao < hoje) p.push('Previsão vencida');
    if (Number(r.valor_vazio) === 1) p.push('Valor não preenchido');
    if (!r.previsao) p.push('Sem previsão');
    if (!r.temperatura) p.push('Sem temperatura');
    if (!comTarefa.has(r.id)) p.push('Sem próximo passo');
    return {id: r.id, banker: r.banker, negocio: r.negocio, tipo: r.tipo, etapa: r.etapa, valor: num(r.valor), valor_zero: Number(r.valor_vazio) !== 1 && num(r.valor) === 0 ? 'Sim' : 'Não', previsao: r.previsao, pendencias: p.join(' · '), n_pendencias: p.length, _p: p};
  });
}
dash.calc('saude', {
  inputs: ['negocios_vivo', 'tarefas_abertas'],
  title: 'Negócios com pendências',
  description: 'Negócios em aberto com previsão no período ou sem previsão, com pelo menos uma pendência: previsão vencida, valor não preenchido (vazio; zero preenchido não é pendência), sem previsão, sem temperatura ou sem tarefa aberta vinculada (sem próximo passo).',
  fn: (vivo, tarefas) => pendencias(vivo, tarefas, PER()).filter(r => r.n_pendencias > 0).map(({_p, ...r}) => r).sort((a, b) => b.n_pendencias - a.n_pendencias || b.valor - a.valor)
});
dash.calc('saude_resumo', {
  inputs: ['negocios_vivo', 'tarefas_abertas'],
  title: 'Resumo de pendências',
  description: 'Por banker e consolidado: negócios em aberto (com previsão no período ou sem previsão) e quantos têm cada pendência.',
  fn: (vivo, tarefas) => {
    const l = pendencias(vivo, tarefas, PER());
    return ['Todos', ...BANKERS].map(b => { const a = l.filter(doB(b)); const c = k => a.filter(r => r._p.includes(k)).length;
      return {banker: b, abertos: a.length, vencida: c('Previsão vencida'), sem_valor: c('Valor não preenchido'), sem_previsao: c('Sem previsão'), sem_temperatura: c('Sem temperatura'), sem_tarefa: c('Sem próximo passo')}; });
  }
});

/* ===== Revisão semanal ===== */
/* Originação fica fora de captação e receita: o dinheiro já entra pelo negócio de quem fechou. */
const LINHA_REV = t => LINHA_CAP(t) || t === 'Resgate' ? 'cap' : (!t || t === 'Sem tipo' || t === 'Indicação' || t === 'Originação' ? null : 'rec');
const ultimaSemana = h => h.reduce((m, r) => (r.semana && r.semana > m ? r.semana : m), '');
const dataDaFoto = (foto, S) => foto.reduce((m, r) => (r.data_foto && r.data_foto > m ? r.data_foto : m), '') || S;
const itemNoPer = (r, P) => P.tipo === 'tudo' || dentro(r.data, P);
dash.calc('rev_itens', {
  inputs: ['historico', 'negocios_vivo'],
  title: 'Negócios por trás dos números da Revisão',
  description: 'Uma linha por negócio e momento (foto mais recente do Histórico ou agora): captação realizada (ganha, pela data de conclusão), resgate efetivado (Resgate perdido), captação e receita a realizar (em aberto pela previsão, atrasados no mês corrente; ponderado pela Temperatura), resgate em risco (em aberto, valor cheio) e receita realizada.',
  fn: (historico, negocios_vivo) => {
    const S = ultimaSemana(historico); if (!S) return [];
    const foto = historico.filter(r => r.semana === S && LINHA_REV(r.tipo)), vivo = negocios_vivo.filter(r => LINHA_REV(r.tipo));
    const dataFoto = dataDaFoto(foto, S), out = [];
    const linhas = (rows, refIni, momento) => rows.forEach(r => {
      const v = num(r.valor), res = r.tipo === 'Resgate', cap = LINHA_REV(r.tipo) === 'cap', ab = ABERTO(r.etapa);
      let medida = null, pond = v, data = null;
      if (r.etapa === 'Ganho' && !res) { medida = cap ? 'cap_realizada' : 'rec_realizada'; data = r.concluido; }
      else if (r.etapa === 'Perdido' && res) { medida = 'resg_efetivado'; data = r.concluido; }
      else if (ab) { data = efetAberto(r, refIni); if (res) medida = 'resg_risco'; else { medida = cap ? 'cap_aberta' : 'rec_aberta'; pond = v * PROB(r.etapa, r.temperatura); } }
      if (!medida || (!ab && !data)) return;
      const detalhe = [r.etapa, ...(ab ? [r.temperatura || 'sem temperatura', 'previsão ' + DATA(r.previsao)] : ['concluído em ' + DATA(r.concluido)])].join(' · ');
      out.push({chave: `${momento}|${r.id}|${medida}`, momento, id: r.id, banker: r.banker, medida, negocio: r.negocio, tipo: r.tipo, detalhe, valor: Math.round(v), ponderado: Math.round(pond), data, semana: S, data_foto: dataFoto});
    });
    linhas(vivo, mesAtualIni(), 'agora');
    linhas(foto, dataFoto.slice(0, 7) + '-01', 'foto');
    return out;
  }
});
const REV_CAMPOS = ['cap_realizada', 'resg_efetivado', 'cap_liquida', 'cap_aberta', 'cap_aberta_pond', 'resg_risco', 'rec_realizada', 'rec_aberta', 'rec_aberta_pond'];
dash.calc('rev_kpis', {
  inputs: ['rev_itens'],
  title: 'Números da Revisão no período',
  description: 'Soma os negócios de cada número por banker no período do filtro, agora e na foto, e a diferença (d_). Captação líquida = captação realizada menos resgates efetivados. Ponderados somam a coluna ponderado; resgates em risco pelo valor cheio.',
  fn: (rev_itens) => {
    if (!rev_itens.length) return [];
    const P = PER(), S = rev_itens[0].semana, dataFoto = rev_itens[0].data_foto, g = {};
    rev_itens.filter(r => itemNoPer(r, P)).forEach(r => ['Todos', r.banker].forEach(b => {
      const o = g[r.momento + '|' + b] = g[r.momento + '|' + b] || {};
      const add = (k, x) => { o[k] = (o[k] || 0) + x; };
      add(r.medida, r.valor);
      if (r.medida === 'cap_aberta') add('cap_aberta_pond', r.ponderado);
      if (r.medida === 'rec_aberta') add('rec_aberta_pond', r.ponderado);
    }));
    return ['Todos', ...BANKERS].map(b => {
      const a = g['agora|' + b] || {}, f = g['foto|' + b] || {};
      a.cap_liquida = (a.cap_realizada || 0) - (a.resg_efetivado || 0); f.cap_liquida = (f.cap_realizada || 0) - (f.resg_efetivado || 0);
      const o = {banker: b, semana: S, data_foto: dataFoto};
      REV_CAMPOS.forEach(k => { o[k] = Math.round(a[k] || 0); o['d_' + k] = Math.round((a[k] || 0) - (f[k] || 0)); });
      return o;
    });
  }
});
dash.calc('rev_bankers', {
  inputs: ['rev_kpis'],
  title: 'Revisão por banker',
  description: 'Os números da Revisão por banker no período. Participações: fatia de cada banker no total da coluna (captação líquida de resgates, net esperado, receita realizada e a realizar); sem base quando o total é zero ou negativo. Net esperado = captação a realizar ponderada − resgates em risco (valor cheio).',
  fn: (rev_kpis) => {
    const t = rev_kpis.find(x => x.banker === 'Todos'); if (!t) return [];
    const net = r => r.cap_aberta_pond - r.resg_risco, part = (v, tot) => tot > 0 ? Math.round(v / tot * 1000) / 1000 : null;
    return rev_kpis.map(r => ({banker: r.banker, captado: r.cap_realizada, resg_efetivado: r.resg_efetivado, liquido: r.cap_liquida, part_liquido: part(r.cap_liquida, t.cap_liquida), a_captar_pond: r.cap_aberta_pond, resg_risco: r.resg_risco, net_esperado: net(r), part_net: part(net(r), net(t)), receita: r.rec_realizada, part_receita: part(r.rec_realizada, t.rec_realizada), rec_aberta: r.rec_aberta, rec_aberta_pond: r.rec_aberta_pond, part_rec_aberta: part(r.rec_aberta, t.rec_aberta)}));
  }
});
dash.calc('cascata_itens', {
  inputs: ['historico', 'negocios_vivo'],
  title: 'Negócios por barra da cascata',
  description: 'Pipe em aberto com previsão no período, na foto mais recente do Histórico e agora, e a barra em que cada negócio cai. Atrasados contam no mês corrente (da foto ou de hoje). Captação inclui Resgate com sinal negativo, sempre pelo valor cheio. Data ajustada = previsão que mudou para dentro do período, ou negócio reaberto. Mudou de valor indica se mudou o valor, a temperatura ou ambos.',
  fn: (historico, negocios_vivo) => {
    const P = PER(), S = ultimaSemana(historico); if (!S) return [];
    const foto = historico.filter(r => r.semana === S && LINHA_REV(r.tipo)), vivo = negocios_vivo.filter(r => LINHA_REV(r.tipo));
    const fRef = dataDaFoto(foto, S).slice(0, 7) + '-01', hRef = mesAtualIni();
    const fMap = new Map(foto.map(r => [r.id, r])), vMap = new Map(vivo.map(r => [r.id, r]));
    const inP = (r, ref) => ABERTO(r.etapa) && (P.tipo === 'tudo' || dentro(efetAberto(r, ref), P));
    const peso = (r, base) => r.tipo === 'Resgate' ? -1 : (base === 'abs' ? 1 : PROB(r.etapa, r.temperatura));
    const desc = r => [r.etapa || 'sem etapa', r.temperatura || 'sem temperatura', 'previsão ' + DATA(r.previsao)].join(' · ');
    const out = [];
    const add = (r, passo, categoria, detalhe, va, vp) => { if (passo !== 'inicio' && passo !== 'atual' && Math.round(va) === 0 && Math.round(vp) === 0) return; out.push({chave: `${r.id}|${passo}`, banker: r.banker, linha: LINHA_REV(r.tipo), resgate: r.tipo === 'Resgate' ? 'Sim' : 'Não', passo, negocio: r.negocio, categoria, detalhe, valor_abs: Math.round(va), valor_pond: Math.round(vp)}); };
    new Set([...fMap.keys(), ...vMap.keys()]).forEach(id => {
      const f = fMap.get(id), a = vMap.get(id), fIn = !!f && inP(f, fRef), aIn = !!a && inP(a, hRef);
      if (!fIn && !aIn) return;
      const vf = f ? num(f.valor) : 0, va = a ? num(a.valor) : 0;
      const pf = b => fIn ? vf * peso(f, b) : 0, pa = b => aIn ? va * peso(a, b) : 0;
      if (fIn) add(f, 'inicio', f.tipo, desc(f), pf('abs'), pf('pond'));
      if (aIn) add(a, 'atual', a.tipo, desc(a), pa('abs'), pa('pond'));
      if (!f) add(a, 'novos', a.tipo, 'Novo · ' + desc(a), pa('abs'), pa('pond'));
      else if (fIn && !a) add(f, 'removidos', f.tipo, 'Não existe mais no Notion (estava em ' + (f.etapa || 'sem etapa') + ')', -pf('abs'), -pf('pond'));
      else if (fIn && !ABERTO(a.etapa)) {
        const res = a.tipo === 'Resgate' ? (a.etapa === 'Ganho' ? ' (resgate retido)' : ' (resgate efetivado)') : '';
        if (a.etapa === 'Perdido') add(a, 'perdidos', a.tipo, f.etapa + ' → Perdido' + res, -pf('abs'), -pf('pond'));
        else {
          add(a, 'ganhos', a.tipo, f.etapa + ' → Ganho' + res + ' · ' + BRL(va), -va * peso(f, 'abs'), -va * peso(f, 'pond'));
          if (va !== vf) add({...a, id: a.id + '|v'}, 'variacao', 'Valor (no ganho)', 'Ganho com valor diferente: ' + BRL(vf) + ' → ' + BRL(va), (va - vf) * peso(f, 'abs'), (va - vf) * peso(f, 'pond'));
        }
      }
      else if (fIn && !aIn) add(a, 'sairam', a.tipo, 'Previsão ' + DATA(f.previsao) + ' → ' + DATA(a.previsao), -pf('abs'), -pf('pond'));
      else if (!fIn && aIn) add(a, 'vieram', ABERTO(f.etapa) ? 'Previsão ajustada' : 'Reaberto', ABERTO(f.etapa) ? 'Previsão ' + DATA(f.previsao) + ' → ' + DATA(a.previsao) : 'Reaberto (' + f.etapa + ' → ' + a.etapa + ')', pa('abs'), pa('pond'));
      else {
        const mv = va !== vf, mt = (a.temperatura || '') !== (f.temperatura || ''), m = [];
        if (mv) m.push('Valor ' + BRL(vf) + ' → ' + BRL(va));
        if (mt) m.push((f.temperatura || 'Sem temperatura') + ' → ' + (a.temperatura || 'sem temperatura'));
        add(a, 'variacao', mv && mt ? 'Valor e temperatura' : mv ? 'Valor' : mt ? 'Temperatura' : 'Etapa', m.join(' · ') || 'Mudança de etapa', pa('abs') - pf('abs'), pa('pond') - pf('pond'));
      }
    });
    return out;
  }
});
dash.calc('c_cascata', {
  inputs: ['cascata_itens'],
  title: 'Cascata no período',
  description: 'Soma, por banker, linha (captação ou receita) e base (bruto ou ponderado), o pipe na foto, cada barra da cascata e o pipe agora. Na foto, Novos e Agora separam captação e resgate.',
  fn: (cascata_itens) => {
    const g = {};
    cascata_itens.forEach(r => ['Todos', r.banker].forEach(b => ['pond', 'abs'].forEach(base => {
      const k = `${b}|${r.linha}|${base}`;
      const o = g[k] = g[k] || {chave: k, banker: b, linha: r.linha, base, inicio_resgate: 0, atual_resgate: 0, inicio: 0, novos: 0, novos_resgate: 0, vieram: 0, ganhos: 0, perdidos: 0, removidos: 0, sairam: 0, variacao: 0, atual: 0, n_novos: 0, n_novos_resgate: 0, n_vieram: 0, n_ganhos: 0, n_perdidos: 0, n_removidos: 0, n_sairam: 0, n_variacao: 0};
      const v = base === 'pond' ? r.valor_pond : r.valor_abs;
      o[r.passo] += v; if (r.passo !== 'inicio' && r.passo !== 'atual') o['n_' + r.passo]++;
      if (r.passo === 'novos' && r.resgate === 'Sim') { o.novos_resgate += v; o.n_novos_resgate++; }
      if ((r.passo === 'inicio' || r.passo === 'atual') && r.resgate === 'Sim') o[r.passo + '_resgate'] += v;
    })));
    return Object.values(g);
  }
});
dash.calc('precisao', {
  inputs: ['historico', 'negocios_vivo'],
  title: 'Precisão das previsões',
  description: 'Para cada mês, a captação prevista (ponderada e bruta) na última foto tirada antes do mês começar, contra o captado de fato no mês (Conta nova, Aporte adicional e Previdência ganhos com conclusão no mês).',
  fn: (hist, vivo) => {
    const semanas = [...new Set(hist.map(r => r.semana).filter(Boolean))].sort(); if (!semanas.length) return [];
    const hoje = hojeISO().slice(0, 7), out = [];
    for (let m = proxMes(semanas[0].slice(0, 7)); m <= hoje; m = proxMes(m)) {
      const S = semanas.filter(s => s < m + '-01').pop(); if (!S) continue;
      ['Todos', ...BANKERS].forEach(b => {
        const f = hist.filter(r => r.semana === S && LINHA_CAP(r.tipo) && ABERTO(r.etapa) && r.previsao && r.previsao.slice(0, 7) <= m && doB(b)(r));
        const prevP = f.reduce((t, r) => t + num(r.valor) * PROB(r.etapa, r.temperatura), 0), prevB = soma(f, 'valor');
        const real = soma(vivo.filter(r => LINHA_CAP(r.tipo) && r.etapa === 'Ganho' && r.concluido && r.concluido.slice(0, 7) === m && doB(b)(r)), 'valor');
        out.push({chave: `${b}|${m}`, banker: b, mes: m, foto: S, previsto_ponderado: Math.round(prevP), previsto_bruto: Math.round(prevB), realizado: Math.round(real), aderencia: prevP ? Math.round(real / prevP * 100) / 100 : null, em_andamento: m === hoje ? 'Sim' : 'Não'});
      });
    }
    return out;
  }
});

/* ===================== Página ===================== */
const $ = id => document.getElementById(id);
const sel = $('sel-banker');
let bankerSel = null;
sel.replaceChildren(...['Todos', ...BANKERS].map(n => new Option(n === 'Todos' ? 'Todos (consolidado)' : n, n)));
sel.addEventListener('change', () => { bankerSel = sel.value; dash.setParams({banker: sel.value}); });
const atual = () => dash.params().banker || bankerSel || 'Todos';
const doAtual = r => atual() === 'Todos' || r.banker === atual();

/* ----- Filtro de período ----- */
const perBtn = $('per-btn'), perPop = $('per-pop'), perErro = $('per-erro');
function setPer(tipo, ini, fim) { dash.setParams({per_tipo: tipo, per_ini: ini, per_fim: fim}); fecharPer(); }
function fecharPer() { perPop.hidden = true; perBtn.setAttribute('aria-expanded', 'false'); }
function abrirPer() {
  const P = PER(), y = Number(hojeISO().slice(0, 4)), anoSel = $('per-ano');
  if (!anoSel.options.length) anoSel.replaceChildren(new Option('Escolha um ano', ''), ...[y - 1, y, y + 1].map(a => new Option(String(a), String(a))));
  $('per-mes').value = P.tipo === 'mes' ? P.ini.slice(0, 7) : '';
  anoSel.value = P.tipo === 'ano' ? P.ini.slice(0, 4) : '';
  $('per-de').value = P.tipo === 'intervalo' ? P.ini : ''; $('per-ate').value = P.tipo === 'intervalo' ? P.fim : '';
  perErro.hidden = true;
  perPop.hidden = false; perBtn.setAttribute('aria-expanded', 'true');
}
perBtn.addEventListener('click', ev => { ev.stopPropagation(); perPop.hidden ? abrirPer() : fecharPer(); });
perPop.addEventListener('click', ev => ev.stopPropagation());
document.addEventListener('click', () => { if (!perPop.hidden) fecharPer(); });
document.querySelectorAll('#per-pop [data-q]').forEach(b => b.addEventListener('click', () => {
  const m = hojeISO().slice(0, 7), y = m.slice(0, 4);
  if (b.dataset.q === 'mes') setPer('mes', m + '-01', fimMes(m));
  if (b.dataset.q === 'mesant') { const a = mesAnt(m); setPer('mes', a + '-01', fimMes(a)); }
  if (b.dataset.q === 'ano') setPer('ano', y + '-01-01', y + '-12-31');
  if (b.dataset.q === 'tudo') setPer('tudo', null, null);
}));
$('per-mes').addEventListener('change', ev => { const v = ev.target.value; if (/^\d{4}-\d{2}$/.test(v)) setPer('mes', v + '-01', fimMes(v)); });
$('per-ano').addEventListener('change', ev => { const v = ev.target.value; if (v) setPer('ano', v + '-01-01', v + '-12-31'); });
$('per-aplicar').addEventListener('click', () => {
  const de = $('per-de'), ate = $('per-ate');
  const ok = de.value && ate.value && de.validity.valid && ate.validity.valid && de.value <= ate.value;
  perErro.hidden = !!ok; if (ok) setPer('intervalo', de.value, ate.value);
});

/* ----- Marcas e tabelas ----- */
function drawFilter() {
  sel.value = atual();
  $('titulo-pagina').textContent = 'Painel comercial · ' + atual();
  const lbl = perLabel(PER());
  perBtn.querySelector('span').textContent = lbl;
  document.querySelectorAll('#tw .tw-per-lbl').forEach(el => { el.textContent = lbl; });
  document.querySelectorAll('#tw [data-fcf]').forEach(el => { el.dataset.field = FC_CAMPOS[el.dataset.fcf][periodoFc]; });
  document.querySelectorAll('#tw [data-fmt]').forEach(el => { el.dataset.where = el.hasAttribute('data-fc') ? 'chave=' + atual() + '|' + baseFc : 'banker=' + atual(); });
}
const BAD = ['error', 'connect', 'declined', 'missing'];
function state(el, ids) {
  const sts = ids.map(id => dash.data(id).status);
  if (sts.every(s => s === 'ok')) { el.classList.remove('dash-skeleton'); return 'ok'; }
  el.replaceChildren();
  if (sts.some(s => BAD.includes(s))) { el.classList.remove('dash-skeleton'); const f = document.createElement('div'); f.className = 'cc-fail'; f.textContent = 'Não carregou'; el.appendChild(f); return 'fail'; }
  el.classList.add('dash-skeleton'); return 'loading';
}
function valueOf(el) {
  const d = dash.data(el.dataset.source);
  if (d.status !== 'ok') return null;
  const rows = Array.isArray(d.data) ? d.data : [];
  let row = null;
  if (el.dataset.where) { const i = el.dataset.where.indexOf('='); const k = el.dataset.where.slice(0, i), v = el.dataset.where.slice(i + 1); row = rows.find(r => String(r[k]) === v); }
  if (!row) return null;
  return row[el.dataset.field] === undefined ? null : row[el.dataset.field];
}
function fillMarks() {
  document.querySelectorAll('#tw [data-fmt]').forEach(el => {
    const v = valueOf(el);
    if (v == null && el.dataset.fmt !== 'part') { el.textContent = '—'; return; }
    el.classList.remove('dash-skeleton');
    el.textContent = FMT[el.dataset.fmt](v);
  });
}
function fillTable(tableId, src, cols, opts = {}) {
  const tbl = $(tableId); if (!tbl) return;
  const tb = tbl.querySelector('tbody'); tb.replaceChildren();
  const d = dash.data(src);
  const old = tbl.parentNode.querySelector('.cc-empty'); if (old) old.remove();
  if (d.status !== 'ok') return;
  let data = opts.filter ? d.data.filter(opts.filter) : d.data.slice();
  if (opts.sort) data.sort(opts.sort);
  if (!data.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = opts.empty || 'Nada por aqui ainda.'; tbl.parentNode.appendChild(p); return; }
  data.forEach(r => {
    const tr = document.createElement('tr');
    if (opts.key) tr.dataset.key = r[opts.key];
    cols.forEach(([f, fmt, cls]) => {
      const td = document.createElement('td');
      td.textContent = fmt ? fmt(r[f], r) : String(r[f] ?? '—');
      const c = typeof cls === 'function' ? cls(r) : cls; if (c) td.className = c;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}
function marcarLinhas(tableId, total = 'Todos') {
  document.querySelectorAll('#' + tableId + ' tbody tr').forEach(tr => {
    const b = String(tr.dataset.key || '').split('|')[0];
    tr.classList.toggle('tw-sel', b === atual() && atual() !== 'Todos'); tr.classList.toggle('tw-total', b === total);
  });
}
function makeTip(el) { const t = document.createElement('div'); t.className = 'cc-tip'; el.appendChild(t); return t; }
function showTip(el, tip, ev, title, lines) {
  tip.replaceChildren();
  const h = document.createElement('div'); h.className = 't'; h.textContent = title; tip.appendChild(h);
  lines.forEach(([c, n, v]) => {
    const l = document.createElement('div');
    if (c) { const i = document.createElement('i'); i.style.cssText = 'display:inline-block;width:.5rem;height:.5rem;border-radius:2px;margin-right:.35rem;background:' + c; l.appendChild(i); }
    l.appendChild(document.createTextNode(n + ': ' + v)); tip.appendChild(l);
  });
  tip.style.display = 'block';
  const r = el.getBoundingClientRect();
  let x = ev.clientX - r.left + 12, y = ev.clientY - r.top + 12;
  const w = tip.offsetWidth, h2 = tip.offsetHeight;
  if (x + w > r.width) x = Math.max(0, ev.clientX - r.left - w - 12);
  if (y + h2 > r.height) y = Math.max(0, ev.clientY - r.top - h2 - 12);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function textWidth(svg, s) { const t = svg.append('text').text(s); const w = t.node().getComputedTextLength(); t.remove(); return w; }

/* ----- Pop-up padrão: filtro por banker, por valor e por categoria; ordenação e agrupamento ----- */
const modalEl = $('tw-modal'); $('tw').appendChild(modalEl);
const mdl = {};
function fecharModal() { modalEl.hidden = true; }
$('mdl-x').addEventListener('click', fecharModal);
modalEl.addEventListener('click', ev => { if (ev.target === modalEl) fecharModal(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (!modalEl.hidden) fecharModal(); if (!perPop.hidden) fecharPer(); } });
function opcoes(selEl, lista) { selEl.replaceChildren(...lista.map(([v, t]) => new Option(t, v))); }
function abrirModal(cfg) {
  Object.assign(mdl, {cfg, banker: '', valor: '', cat: '', grupo: '', sort: cfg.sort || null, dir: cfg.dir || -1});
  $('mdl-tit').textContent = cfg.titulo; $('mdl-nota').textContent = cfg.nota || '';
  $('tbl-modal').dataset.source = cfg.fonte;
  const bks = [...new Set(cfg.rows.map(r => r.banker).filter(Boolean))].sort();
  opcoes($('mdl-banker'), [['', 'Todos'], ...bks.map(b => [b, b])]);
  $('mdl-f-banker').hidden = bks.length < 2;
  opcoes($('mdl-valor'), [['', 'Todos'], ['pos', 'Maior que zero'], ['zero', 'Igual a zero'], ['neg', 'Menor que zero']]);
  $('mdl-f-cat').hidden = !cfg.catF;
  if (cfg.catF) { $('mdl-cat-lbl').textContent = cfg.catT; opcoes($('mdl-cat'), [['', 'Todos'], ...[...new Set(cfg.rows.map(r => r[cfg.catF]).filter(Boolean))].sort().map(c => [c, c])]); }
  opcoes($('mdl-grupo'), [['', 'Sem agrupar'], ...(bks.length > 1 ? [['banker', 'Banker']] : []), ['sinal', 'Faixa de valor'], ...(cfg.catF ? [['cat', cfg.catT]] : [])]);
  renderModal();
  modalEl.hidden = false;
  const tw = $('tw'), box = modalEl.querySelector('.tw-modal-box');
  const topo = cfg.ancora ? cfg.ancora.getBoundingClientRect().top - tw.getBoundingClientRect().top : 16;
  box.style.top = Math.max(16, Math.min(topo, tw.scrollHeight - box.offsetHeight - 16)) + 'px';
  box.scrollIntoView({block: 'nearest', behavior: 'smooth'});
}
[['mdl-banker', 'banker'], ['mdl-valor', 'valor'], ['mdl-cat', 'cat'], ['mdl-grupo', 'grupo']].forEach(([id, k]) => $(id).addEventListener('change', ev => { mdl[k] = ev.target.value; renderModal(); }));
function renderModal() {
  const c = mdl.cfg, vf = c.valorF || 'valor', tbl = $('tbl-modal');
  let rows = c.rows.filter(r => (!mdl.banker || r.banker === mdl.banker) && (!mdl.cat || r[c.catF] === mdl.cat) &&
    (!mdl.valor || (mdl.valor === 'pos' ? num(r[vf]) > 0 : mdl.valor === 'neg' ? num(r[vf]) < 0 : num(r[vf]) === 0)));
  if (mdl.sort) { const col = c.cols.find(x => x.f === mdl.sort) || {}; rows = rows.slice().sort((a, b) => (col.num ? num(a[mdl.sort]) - num(b[mdl.sort]) : String(a[mdl.sort] ?? '').localeCompare(String(b[mdl.sort] ?? ''), 'pt-BR')) * mdl.dir); }
  const hr = tbl.querySelector('thead tr'); hr.replaceChildren();
  c.cols.forEach(col => {
    const th = document.createElement('th'); th.dataset.field = col.f; if (!col.num) th.className = 'l';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tw-sort';
    b.textContent = col.t + (mdl.sort === col.f ? (mdl.dir > 0 ? ' ↑' : ' ↓') : '');
    b.setAttribute('aria-label', 'Ordenar por ' + col.t);
    b.addEventListener('click', () => { if (mdl.sort === col.f) mdl.dir = -mdl.dir; else { mdl.sort = col.f; mdl.dir = col.num ? -1 : 1; } renderModal(); });
    th.appendChild(b); hr.appendChild(th);
  });
  const tb = tbl.querySelector('tbody'); tb.replaceChildren();
  const wrap = tbl.parentNode; const old = wrap.querySelector('.cc-empty'); if (old) old.remove();
  $('mdl-cont').textContent = rows.length === 1 ? '1 item' : INT(rows.length) + (c.unidade || ' negócios');
  if (!rows.length) { const e = document.createElement('div'); e.className = 'cc-empty'; e.textContent = c.vazio || 'Nada neste número.'; wrap.appendChild(e); return; }
  const cel = (col, r) => { const td = document.createElement('td'); const v = r[col.f]; td.textContent = col.fmt ? col.fmt(v, r) : String(v ?? '—'); if (!col.num) td.className = 'l'; else if (Number(v) < 0) td.className = 'bad'; return td; };
  const somaLinha = (rot, l, cls) => {
    const tr = document.createElement('tr'); tr.className = cls;
    c.cols.forEach((col, i) => { const td = document.createElement('td'); if (i === 0) { td.textContent = rot + ' (' + l.length + ')'; td.className = 'l'; } else if (col.num && col.soma !== false) { const s = soma(l, col.f); td.textContent = BRL(s); if (s < 0) td.className = 'bad'; } tr.appendChild(td); });
    tb.appendChild(tr);
  };
  const grp = mdl.grupo === 'banker' ? r => r.banker : mdl.grupo === 'sinal' ? r => num(r[vf]) > 0 ? 'Maior que zero' : num(r[vf]) < 0 ? 'Menor que zero' : 'Igual a zero' : mdl.grupo === 'cat' ? r => r[c.catF] || '—' : null;
  const linha = r => { const tr = document.createElement('tr'); tr.dataset.key = r.chave; c.cols.forEach(col => tr.appendChild(cel(col, r))); tb.appendChild(tr); };
  if (grp) { const g = new Map(); rows.forEach(r => { const k = grp(r); if (!g.has(k)) g.set(k, []); g.get(k).push(r); }); g.forEach((l, k) => { somaLinha(k, l, 'tw-grp'); l.forEach(linha); }); }
  else rows.forEach(linha);
  if (rows.length > 1) somaLinha('Total', rows, 'tw-total');
}
const COLS = {
  negocio: {f: 'negocio', t: 'Negócio'}, banker: {f: 'banker', t: 'Banker'}, cliente: {f: 'cliente', t: 'Cliente'},
  cat: t => ({f: 'categoria', t}), detalhe: {f: 'detalhe', t: 'Detalhe'},
  valor: {f: 'valor', t: 'Valor', num: true, fmt: BRL}, pond: {f: 'ponderado', t: 'Ponderado', num: true, fmt: BRL}
};
const detalheVivo = r => [r.etapa, ...(ehAberto(r) ? [r.temperatura || 'sem temperatura', 'previsão ' + DATA(r.previsao)] : ['concluído em ' + DATA(r.concluido)])].join(' · ');
const linhaVivo = r => ({chave: r.id, negocio: r.negocio, banker: r.banker, cliente: r.cliente, categoria: r.tipo, detalhe: detalheVivo(r), valor: num(r.valor), ponderado: Math.round(pondDe(r))});
const vivoOk = () => { const d = dash.data('negocios_vivo'); return d.status === 'ok' ? d.data : []; };
const vazioCarregando = id => dash.data(id).status === 'ok' ? 'Nenhum negócio neste número.' : 'Carregando…';

/* ----- Resumo ----- */
const POP_RESUMO = {
  res_capesp: {t: 'Captação esperada', f: r => ehAberto(r) && isCap(r) && abertoNoPer(r, PER()), pond: true, nota: 'Captação em aberto com previsão no período (atrasados no mês atual). Ponderado pela Temperatura.'},
  res_captado: {t: 'Captado', f: r => r.etapa === 'Ganho' && isCap(r) && fechadoNoPer(r, PER()), nota: 'Conta nova, Aporte adicional e Previdência ganhos com conclusão no período.'},
  res_recesp: {t: 'Receita esperada', f: r => ehAberto(r) && isRec(r) && abertoNoPer(r, PER()), pond: true, nota: 'Receita em aberto com previsão no período, ponderada pela Temperatura.'},
  res_mesa: {t: 'Captação na mesa', f: r => ehAberto(r) && isCap(r), pond: true, nota: 'Todo o pipeline de captação em aberto, de qualquer data: este número não segue o filtro de período.'},
  res_resg: {t: 'Resgates em risco', f: r => ehAberto(r) && isSai(r) && abertoNoPer(r, PER()), nota: 'Resgates em aberto com previsão no período, pelo valor cheio.'},
  res_abertos: {t: 'Negócios em aberto', f: r => ehAberto(r) && abertoNoPer(r, PER()), pond: true, nota: 'Todos os negócios em aberto com previsão no período. Ponderado de resgate = valor cheio.'}
};
function abrirResumo(card) {
  const M = POP_RESUMO[card.dataset.pop]; if (!M) return;
  const rows = vivoOk().filter(r => doAtual(r) && M.f(r)).map(linhaVivo);
  abrirModal({fonte: 'negocios_vivo', titulo: M.t + ' · ' + (card.dataset.pop === 'res_mesa' ? 'todas as datas' : perLabel(PER())) + (atual() === 'Todos' ? '' : ' · ' + atual()), nota: M.nota, rows,
    cols: [COLS.negocio, COLS.banker, COLS.cliente, COLS.cat('Tipo'), COLS.detalhe, COLS.valor, ...(M.pond ? [COLS.pond] : [])], catF: 'categoria', catT: 'Tipo',
    sort: M.pond ? 'ponderado' : 'valor', ancora: card, vazio: vazioCarregando('negocios_vivo')});
}

let modoMes = 'cap', baseMes = 'pond';
function textoMes() {
  const pond = baseMes === 'pond';
  $('titulo-mes').textContent = modoMes === 'cap' ? (pond ? 'Captação e resgates por mês: realizado e esperado' : 'Captação e resgates por mês: realizado e cadastrado') : (pond ? 'Receita por mês: realizada e esperada' : 'Receita por mês: realizada e cadastrada');
  const base = pond ? 'Captação e receita ponderadas pela Temperatura (Quente 90%, Morno 60%, Frio 10%); resgates sempre pelo valor cheio.' : 'Valores absolutos: o total cadastrado, sem aplicar a Temperatura.';
  $('nota-mes').textContent = (modoMes === 'cap' ? base + ' Parte cheia = realizado; clara = previsto. Captação acima do zero, resgates abaixo; a linha é o líquido.' : base + ' Seguro, crédito, câmbio, tributário, sucessório e outros.') + ' Mostra os meses do período escolhido; atrasados contam no mês atual.';
}
function setModo(m) { modoMes = m; $('btn-cap').setAttribute('aria-pressed', m === 'cap'); $('btn-rec').setAttribute('aria-pressed', m === 'rec'); textoMes(); drawMes(); }
function setBase(b) {
  baseMes = b; baseFc = b;
  ['btn-pond', 'btn-fc-pond'].forEach(id => $(id).setAttribute('aria-pressed', b === 'pond')); ['btn-abs', 'btn-fc-abs'].forEach(id => $(id).setAttribute('aria-pressed', b === 'abs'));
  textoMes(); drawFilter(); fillMarks(); drawMes(); drawForecast();
}
$('btn-pond').addEventListener('click', () => setBase('pond')); $('btn-abs').addEventListener('click', () => setBase('abs'));
$('btn-cap').addEventListener('click', () => setModo('cap')); $('btn-rec').addEventListener('click', () => setModo('rec'));
function legenda(id, items) {
  const lg = $(id); lg.replaceChildren();
  items.forEach(([c, n, line, op]) => { const s = document.createElement('span'); const i = document.createElement('i'); i.style.background = c; if (op) i.style.opacity = op; if (line) { i.style.height = '2px'; i.style.width = '.9rem'; i.style.borderRadius = '0'; } s.appendChild(i); s.appendChild(document.createTextNode(n)); lg.appendChild(s); });
}
function drawMes() {
  const el = $('chart-mes');
  const cCap = 'var(--tw-cap)', cSai = 'var(--tw-sai)', cNet = 'var(--tw-net)', cap = modoMes === 'cap';
  legenda('lg-mes', cap ? [[cCap, 'Captado'], [cCap, 'Captação prevista', false, .4], [cSai, 'Resgate efetivado'], [cSai, 'Resgate em risco', false, .4], [cNet, 'Líquido', true]] : [[cCap, 'Receita realizada'], [cCap, 'Receita prevista', false, .4]]);
  if (state(el, ['c_fluxo']) !== 'ok') return;
  const abs = baseMes === 'abs', P = PER();
  let rows = dash.data('c_fluxo').data.filter(r => r.banker === atual() && mesNoPer(r.mes, P)).map(r => ({mes: r.mes, capReal: r.cap_real, capPrev: abs ? r.cap_prev_abs : r.cap_prev, saiReal: r.sai_real, saiPrev: r.sai_prev, recReal: r.rec_real, recPrev: abs ? r.rec_prev_abs : r.rec_prev}));
  rows.forEach(r => { r.cap = r.capReal + r.capPrev; r.sai = r.saiReal + r.saiPrev; r.rec = r.recReal + r.recPrev; r.net = r.cap - r.sai; });
  rows = (cap ? rows.filter(r => r.cap || r.sai) : rows.filter(r => r.rec)).sort((a, b) => a.mes < b.mes ? -1 : 1);
  el.replaceChildren();
  if (!rows.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = cap ? 'Nenhuma captação ou resgate no período.' : 'Nenhum negócio de receita no período.'; el.appendChild(p); return; }
  const tip = makeTip(el);
  const W = el.clientWidth || 600, H = 300, mt = 24, mb = 24;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const lo = cap ? Math.min(0, d3.min(rows, r => Math.min(-r.sai, r.net))) : 0;
  const hi = cap ? Math.max(0, d3.max(rows, r => Math.max(r.cap, r.net))) : d3.max(rows, r => r.rec);
  const pad = (hi - lo || 1) * 0.12;
  const y = d3.scaleLinear([lo < 0 ? lo - pad : 0, (hi || 1) + pad], [H - mb, mt]).nice();
  const yt = y.ticks(5); const ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10;
  const x = d3.scaleBand(rows.map(r => r.mes), [ml, W - 8]).paddingInner(0.35).paddingOuter(0.2);
  const bw = Math.min(x.bandwidth(), 40), bx = r => x(r.mes) + (x.bandwidth() - bw) / 2;
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', d => d === 0 ? 'var(--tw-axis)' : 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  const passo = Math.ceil(rows.length / Math.max(2, Math.floor((W - ml) / 48)));
  svg.append('g').selectAll('text').data(rows.filter((r, i) => i % passo === 0)).join('text').attr('x', r => x(r.mes) + x.bandwidth() / 2).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(r => MESLBL(r.mes));
  const seg = (from, to, color, op) => svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', bx).attr('width', bw)
    .attr('y', r => Math.min(y(from(r)), y(to(r)))).attr('height', r => Math.abs(y(from(r)) - y(to(r)))).attr('rx', 3).style('fill', color).style('opacity', op);
  if (cap) {
    seg(r => 0, r => r.capReal, cCap, 1); seg(r => r.capReal, r => r.cap, cCap, .4); seg(r => 0, r => -r.saiReal, cSai, 1); seg(r => -r.saiReal, r => -r.sai, cSai, .4);
    svg.append('path').datum(rows).attr('fill', 'none').attr('stroke-width', 2).style('stroke', cNet).attr('d', d3.line().x(r => x(r.mes) + x.bandwidth() / 2).y(r => y(r.net)));
    svg.append('g').selectAll('circle').data(rows).join('circle').attr('cx', r => x(r.mes) + x.bandwidth() / 2).attr('cy', r => y(r.net)).attr('r', 4).style('fill', cNet);
    if (rows.length <= 8) rows.forEach(r => {
      const g = svg.append('g'); const t = g.append('text').attr('dy', '0.35em').style('font-weight', '600').style('fill', r.net < 0 ? 'var(--tw-sai)' : cNet).text(BRL(r.net));
      const tw = t.node().getComputedTextLength(), cx = x(r.mes) + x.bandwidth() / 2; let tx = cx + bw / 2 + 10; if (tx + tw + 6 > W) tx = cx - bw / 2 - 10 - tw;
      const ty = Math.min(Math.max(y(r.net), mt), H - mb - 8); t.attr('x', tx).attr('y', ty);
      g.insert('rect', 'text').attr('x', tx - 5).attr('y', ty - 10).attr('width', tw + 10).attr('height', 20).attr('rx', 4).style('fill', 'var(--tw-card)').style('stroke', 'var(--tw-line)');
    });
  } else {
    seg(r => 0, r => r.recReal, cCap, 1); seg(r => r.recReal, r => r.rec, cCap, .4);
    svg.append('g').selectAll('text').data(rows).join('text').attr('x', r => x(r.mes) + x.bandwidth() / 2).attr('y', r => y(r.rec) - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(r => BRL(r.rec));
  }
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', r => x(r.mes) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(el, tip, ev, MESLBL(r.mes), cap ? [[cCap, 'Captado', BRL(r.capReal)], [cCap, 'Captação prevista', BRL(r.capPrev)], [cSai, 'Resgate efetivado', BRL(r.saiReal)], [cSai, 'Resgate em risco', BRL(r.saiPrev)], [cNet, 'Líquido', BRL(r.net)]] : [[cCap, 'Receita realizada', BRL(r.recReal)], [cCap, 'Receita prevista', BRL(r.recPrev)]]))
    .on('mouseleave', () => { tip.style.display = 'none'; });
}
function barrasPct(tableId, col) {
  document.querySelectorAll('#' + tableId + ' tbody tr').forEach(tr => {
    const td = tr.children[col]; if (!td || tr.classList.contains('tw-total')) return;
    const v = Math.max(0, parseFloat(td.textContent.replace('%', '').replace(',', '.')) || 0);
    td.style.background = `linear-gradient(to left, var(--tw-soft) ${Math.min(100, v)}%, transparent ${Math.min(100, v)}%)`;
  });
}

/* ----- Forecast (fora do filtro de período) ----- */
let baseFc = 'pond', simAua = null, periodoFc = '2026';
$('btn-fc-pond').addEventListener('click', () => setBase('pond')); $('btn-fc-abs').addEventListener('click', () => setBase('abs'));
$('sim-aua').addEventListener('input', ev => { const v = parseFloat(String(ev.target.value).replace(',', '.')); simAua = isFinite(v) && v > 0 ? v * 1e6 : null; drawForecast(); });
$('sim-limpar').addEventListener('click', () => { $('sim-aua').value = ''; simAua = null; drawForecast(); });
const FC_CAMPOS = {
  ini: {all: 'aua_inicial', '2026': 'aua_inicial', '2027': 'proj_2026'}, fim: {all: 'proj_2027', '2026': 'proj_2026', '2027': 'proj_2027'},
  meta: {all: 'meta_2027', '2026': 'meta_2026', '2027': 'meta_2027'}, gap: {all: 'gap_2027', '2026': 'gap_2026', '2027': 'gap_2027'},
  cap: {all: 'capt_liquida', '2026': 'capt_liq_2026', '2027': 'capt_liq_2027'}, mkt: {all: 'mercado', '2026': 'mercado_2026', '2027': 'mercado_2027'}
};
function rotulosFc(p) {
  document.querySelectorAll('[data-per]').forEach(b => b.setAttribute('aria-pressed', b.dataset.per === p));
  const fim = p === '2026' ? 'dez/2026' : 'dez/2027', desde = p === '2027' ? 'em 2027' : 'até ' + fim;
  $('lbl-fc-ini').textContent = p === '2027' ? 'AuA no início de 2027' : 'AuA inicial';
  $('sub-fc-ref').hidden = p === '2027'; $('sub-fc-proj').hidden = p !== '2027';
  $('lbl-fc-fim').textContent = 'AuA projetado · ' + fim;
  $('lbl-fc-cap').textContent = 'Captação líquida · ' + desde;
  $('lbl-fc-mkt').textContent = 'Ganho de capital · ' + desde;
  $('titulo-fc').textContent = p === 'all' ? 'Curva de AuA projetada' : 'Curva de AuA projetada · ' + p;
}
rotulosFc(periodoFc);
document.querySelectorAll('[data-per]').forEach(b => b.addEventListener('click', () => { periodoFc = b.dataset.per; rotulosFc(periodoFc); drawFilter(); fillMarks(); drawForecast(); }));
const mesNoFc = m => m !== 'inicio' && (periodoFc === 'all' || (periodoFc === '2026' ? m <= '2026-12' : m >= '2027-01'));
function drawForecast() {
  const el = $('chart-fc');
  const cProj = 'var(--tw-cap)', cMkt = 'var(--tw-muted)', cMeta = 'var(--tw-net)', cSim = 'var(--tw-accent)', ehTodos = atual() === 'Todos';
  document.querySelectorAll('.tw-so-telos').forEach(n => { n.hidden = !ehTodos; });
  const itens = [[cProj, 'AuA projetado'], [cMkt, 'Só mercado, sem captação', true]];
  if (ehTodos) itens.push([cMeta, 'Trajetória até as metas', true]);
  if (simAua) itens.push([cSim, 'Simulado', true]);
  legenda('lg-fc', itens);
  if (state(el, ['forecast']) !== 'ok') return;
  const todas = dash.data('forecast').data.filter(r => r.banker === atual() && r.base === baseFc);
  const rows = todas.filter(r => periodoFc === 'all' || (periodoFc === '2026' ? (r.mes === 'inicio' || r.mes <= '2026-12') : (r.mes !== 'inicio' && r.mes >= '2026-12')));
  el.replaceChildren();
  if (!rows.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = 'Sem AuA inicial para este banker nos Parâmetros do painel.'; el.appendChild(p); return; }
  const ini = todas.find(r => r.mes === 'inicio'), aua0 = ini ? ini.aua : rows[0].aua;
  rows.forEach(r => { r.sim = simAua ? Math.round(r.aua + (simAua - aua0) * (r.so_mercado / aua0)) : null; });
  const tip = makeTip(el);
  const W = el.clientWidth || 700, H = 340, mt = 28, mb = 28;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const vals = rows.flatMap(r => [r.aua, r.so_mercado, ehTodos ? r.meta_traj : null, r.sim]).filter(v => v != null);
  const lo = d3.min(vals), hi = d3.max(vals), pad = (hi - lo || hi) * 0.08;
  const y = d3.scaleLinear([Math.max(0, lo - pad), hi + pad], [H - mb, mt]).nice();
  const yt = y.ticks(5), ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10, ultimo = rows[rows.length - 1];
  const mr = d3.max([BRL(ultimo.aua), BRL(ultimo.so_mercado)], s => textWidth(svg, s)) + 18;
  const x = d3.scalePoint(rows.map(r => r.mes), [ml + 6, W - mr]);
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - mr + 6).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  const passo = Math.ceil(rows.length / Math.max(2, Math.floor((W - ml - mr) / 52)));
  svg.append('g').selectAll('text').data(rows.filter((r, i) => i % passo === 0 || r.mes.endsWith('-12'))).join('text').attr('x', r => x(r.mes)).attr('y', H - 8).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(r => r.mes === 'inicio' ? 'início' : MESLBL(r.mes));
  const linha = (k, cor, w, tr) => { const d = rows.filter(r => r[k] != null); if (d.length < 2) return; svg.append('path').datum(d).attr('fill', 'none').attr('stroke-width', w).style('stroke', cor).attr('stroke-dasharray', tr || null).attr('d', d3.line().x(r => x(r.mes)).y(r => y(r[k]))); };
  linha('so_mercado', cMkt, 1.5, '5 4'); if (ehTodos) linha('meta_traj', cMeta, 1.5, '2 4'); if (simAua) linha('sim', cSim, 2, '7 4'); linha('aua', cProj, 3);
  if (ehTodos) rows.filter(r => (r.mes === '2026-12' && periodoFc !== '2027') || r.mes === '2027-12').forEach(r => {
    if (r.meta_traj == null) return; const cx = x(r.mes), cy = y(r.meta_traj);
    svg.append('path').attr('d', d3.symbol(d3.symbolDiamond, 70)()).attr('transform', `translate(${cx},${cy})`).style('fill', cMeta);
    svg.append('text').attr('x', cx).attr('y', cy - 12).attr('text-anchor', 'middle').style('fill', cMeta).style('font-weight', 600).text('Meta ' + BRL(r.meta_traj));
  });
  [['aua', cProj], ['so_mercado', cMkt]].forEach(([k, c], j) => svg.append('text').attr('x', x(ultimo.mes) + 8).attr('y', y(ultimo[k])).attr('dy', j ? '1em' : '0.35em').style('fill', c).style('font-weight', j ? 400 : 700).text(BRL(ultimo[k])));
  const rule = svg.append('line').attr('y1', mt).attr('y2', H - mb).attr('stroke', 'var(--tw-axis)').attr('stroke-dasharray', '2 3').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', mt).attr('width', Math.max(0, W - ml - mr + 6)).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', ev => {
      const [px] = d3.pointer(ev); const r = rows.reduce((a, b) => Math.abs(x(b.mes) - px) < Math.abs(x(a.mes) - px) ? b : a);
      rule.attr('x1', x(r.mes)).attr('x2', x(r.mes)).style('display', null);
      const l = [[cProj, 'AuA projetado', BRL(r.aua)], [cMkt, 'Só mercado', BRL(r.so_mercado)]];
      if (r.mes !== 'inicio') l.push([null, 'Captação no mês', BRL(r.captacao)], [null, 'Resgates no mês', BRL(r.saida)], [null, 'Ganho de capital', BRL(r.ganho_mes)]);
      if (ehTodos && r.meta_traj != null) l.push([cMeta, 'Trajetória da meta', BRL(r.meta_traj)]);
      if (simAua) l.push([cSim, 'Simulado', BRL(r.sim)]);
      showTip(el, tip, ev, r.mes === 'inicio' ? 'Início · ' + DATA(r.data) : MESLBL(r.mes), l);
    }).on('mouseleave', () => { tip.style.display = 'none'; rule.style('display', 'none'); });
}
const COLS_MES = [{f: 'mes', t: 'Mês', fmt: MESLBL}, {f: 'aua_inicio_mes', t: 'AuA no início do mês', num: true, fmt: BRL, soma: false}, {f: 'ganho_mes', t: 'Ganho de capital', num: true, fmt: BRL}, {f: 'captacao', t: 'Captação', num: true, fmt: BRL}, {f: 'saida', t: 'Resgates', num: true, fmt: BRL}, {f: 'aua', t: 'AuA no fim do mês', num: true, fmt: BRL, soma: false}];
function abrirForecast(card) {
  const b = atual(), base = baseFc, k = card.dataset.pop, perTxt = periodoFc === 'all' ? 'até dez/2027' : periodoFc;
  const res = (dash.data('forecast_resumo').data || []).find(r => r.chave === b + '|' + base) || {};
  const meses = (dash.data('forecast').status === 'ok' ? dash.data('forecast').data : []).filter(r => r.banker === b && r.base === base && mesNoFc(r.mes)).map(r => ({...r, valor: r.captacao - r.saida}));
  const baseTxt = base === 'pond' ? 'captação em aberto ponderada pela Temperatura' : 'captação em aberto pelo valor bruto';
  if (k === 'fc_ini') {
    const pr = dash.data('params').status === 'ok' ? dash.data('params').data.filter(p => p.tipo !== 'Mercado' && p.aua_inicial != null) : [];
    const rows = pr.map(p => ({chave: p.linha, negocio: p.linha, banker: p.tipo === 'Banker' ? p.linha : '', categoria: p.tipo === 'Telos' ? 'Telos (total)' : 'Banker', detalhe: 'Referência em ' + DATA(p.data_ref), valor: Number(p.aua_inicial)})).filter(r => b === 'Todos' || r.banker === b);
    const somaBk = soma(pr.filter(p => p.tipo === 'Banker'), 'aua_inicial'), telos = pr.find(p => p.tipo === 'Telos');
    abrirModal({fonte: 'params', titulo: 'AuA inicial · Parâmetros do painel', nota: (periodoFc === '2027' ? 'Em 2027 o card mostra o AuA projetado para dez/2026 (veja AuA projetado). ' : '') + 'Vem da tabela Parâmetros do painel no Notion.' + (b === 'Todos' && telos ? ' Soma dos bankers: ' + BRL(somaBk) + '; Telos: ' + BRL(telos.aua_inicial) + '.' : ''), rows,
      cols: [{f: 'negocio', t: 'Linha'}, COLS.cat('Tipo'), COLS.detalhe, {f: 'valor', t: 'AuA inicial', num: true, fmt: BRL}], catF: 'categoria', catT: 'Tipo', unidade: ' linhas', ancora: card, vazio: vazioCarregando('params')});
  } else if (k === 'fc_atual') {
    const a = (dash.data('aua_atual').data || []).find(r => r.banker === b) || {};
    const rows = vivoOk().filter(r => doAtual(r) && r.concluido && a.data_ref && r.concluido >= a.data_ref && ((r.etapa === 'Ganho' && isCap(r)) || (r.etapa === 'Perdido' && isSai(r)))).map(r => ({...linhaVivo(r), categoria: isSai(r) ? 'Resgate efetivado' : 'Captado', valor: isSai(r) ? -num(r.valor) : num(r.valor)}));
    abrirModal({fonte: 'negocios_vivo', titulo: 'AuA atual · ' + b, nota: 'AuA inicial ' + BRL(a.aua_inicial) + ' + captado ' + BRL(a.captado) + ' − resgatado ' + BRL(a.resgatado) + ' = ' + BRL(a.aua_atual) + ', desde ' + DATA(a.data_ref) + '. Não inclui ganho de capital.', rows,
      cols: [COLS.negocio, COLS.banker, COLS.cat('O que mudou'), COLS.detalhe, COLS.valor], catF: 'categoria', catT: 'O que mudou', sort: 'valor', ancora: card, vazio: vazioCarregando('negocios_vivo')});
  } else if (k === 'fc_fim') {
    const cap = res[FC_CAMPOS.cap[periodoFc]], mkt = res[FC_CAMPOS.mkt[periodoFc]], ini = res[FC_CAMPOS.ini[periodoFc]], fim = res[FC_CAMPOS.fim[periodoFc]];
    abrirModal({fonte: 'forecast', titulo: 'AuA projetado · ' + perTxt + ' · ' + b, nota: BRL(ini) + ' no início + ' + BRL(cap) + ' de captação líquida + ' + BRL(mkt) + ' de ganho de capital = ' + BRL(fim) + '. Base: ' + baseTxt + '; resgates pelo valor cheio.', rows: meses,
      cols: COLS_MES, valorF: 'valor', unidade: ' meses', ancora: card, vazio: vazioCarregando('forecast')});
  } else if (k === 'fc_cap') {
    const it = dash.data('forecast_itens'), rows = (it.status === 'ok' ? it.data : []).filter(r => r.banker === b && r.base === base && mesNoFc(r.mes)).map(r => ({...r, chave: r.chave + '|' + r.mes, banker: r.dono, mesl: MESLBL(r.mes)}));
    abrirModal({fonte: 'forecast_itens', titulo: 'Captação líquida · ' + perTxt + ' · ' + b, nota: 'Captado e resgates efetivados desde a data de referência, mais ' + baseTxt + ' e resgates em aberto pelo valor cheio, no mês da previsão (atrasados no mês atual). Fora da curva por não ter previsão: ' + BRL(res.sem_previsao) + ' em captação bruta.', rows,
      cols: [COLS.negocio, COLS.banker, COLS.cat('O que mudou'), {f: 'mesl', t: 'Mês'}, COLS.detalhe, COLS.valor, COLS.pond], catF: 'categoria', catT: 'O que mudou', valorF: 'ponderado', sort: 'ponderado', ancora: card, vazio: vazioCarregando('forecast_itens')});
  } else if (k === 'fc_mkt') {
    abrirModal({fonte: 'forecast', titulo: 'Ganho de capital · ' + perTxt + ' · ' + b, nota: 'AuA do início de cada mês × taxa mensal equivalente ao ganho anual dos Parâmetros (' + PCT1(res.ganho_2026) + ' em 2026, ' + PCT1(res.ganho_2027) + ' em 2027). O ganho incide também sobre a captação dos meses anteriores.', rows: meses.map(r => ({...r, valor: r.ganho_mes})),
      cols: [{f: 'mes', t: 'Mês', fmt: MESLBL}, {f: 'aua_inicio_mes', t: 'AuA no início do mês', num: true, fmt: BRL, soma: false}, {f: 'taxa_mes', t: 'Taxa no mês', num: true, soma: false, fmt: v => (Number(v) * 100).toLocaleString('pt-BR', {maximumFractionDigits: 3}) + '%'}, {f: 'ganho_mes', t: 'Ganho de capital', num: true, fmt: BRL}], unidade: ' meses', ancora: card, vazio: vazioCarregando('forecast')});
  }
}

/* ----- Pipeline ----- */
let semZero = false;
const chkSemZero = $('chk-sem-zero');
if (chkSemZero) chkSemZero.addEventListener('change', () => { semZero = chkSemZero.checked; fillLista(); });
function fillLista() {
  fillTable('tbl-lista', 'c_lista', [['negocio'], ['cliente', null, 'l'], ['banker', null, 'l'], ['tipo', null, 'l'], ['etapa', null, 'l'], ['temperatura', null, 'l'], ['valor', (v, r) => r.valor_vazio === 1 ? 'Vazio' : BRL(v)], ['ponderado', BRL], ['previsao', DATA, r => r.vencida === 'Sim' ? 'bad' : ''], ['idade_dias', DIAS]],
    {key: 'chave', filter: r => doAtual(r) && (!semZero || r.valor_vazio === 1 || Number(r.valor) !== 0), empty: 'Nenhum negócio em aberto no período.'});
}
function fillPipeline() {
  const doB2 = r => r.banker === atual();
  fillTable('tbl-tipo', 'c_tipo', [['tipo'], ['negocios', INT], ['valor', BRL], ['ponderado', BRL], ['idade_media_dias', DIAS]], {key: 'chave', filter: doB2, empty: 'Nenhum negócio em aberto no período.'});
  fillTable('tbl-conc', 'c_concl', [['tipo'], ['ganhos', INT], ['perdidos', INT], ['taxa_ganho', PCT], ['ciclo_medio_dias', DIAS], ['realizado', BRL]], {key: 'chave', filter: doB2, empty: 'Nenhum negócio concluído no período.'});
  fillTable('tbl-origem', 'c_origem', [['origem'], ['abertos', INT], ['captacao_ponderada', BRL], ['receita_ponderada', BRL], ['ganhos', INT], ['perdidos', INT], ['taxa_ganho', PCTN], ['captado', BRL], ['pct_captado', PCT1]], {key: 'chave', filter: doB2, empty: 'Nenhum negócio no período.'});
  barrasPct('tbl-origem', 8);
  fillTable('tbl-perdas', 'c_perdas', [['motivo'], ['negocios', INT], ['valor', BRL]], {key: 'chave', filter: doB2, empty: 'Nenhum negócio perdido no período.'});
  fillLista();
}

/* ----- Time ----- */
function fillTime() {
  fillTable('tbl-comp', 'c_comp', [['banker'], ['aua_inicial', v => v == null ? '—' : BRL(v)], ['captacao_ponderada', BRL], ['pipeline_sobre_aua', PCT1], ['receita_ponderada', BRL], ['resg_risco', BRL], ['abertos', INT], ['ganhos', INT], ['taxa_ganho', PCTN], ['ciclo_cap', DIAS], ['ciclo_rec', DIAS], ['reunioes', INT]], {key: 'banker', empty: 'Sem dados.'});
  marcarLinhas('tbl-comp');
  fillTable('tbl-orig-res', 'c_orig_res', [['banker'], ['abertas', INT], ['ganhas', INT], ['perdidas', INT], ['conversao', PCTN], ['volume_aberto', BRL], ['volume_ganho', BRL]], {key: 'banker', empty: 'Nenhuma originação no período.', sort: (a, b) => (a.banker === 'Todos') - (b.banker === 'Todos')});
  marcarLinhas('tbl-orig-res');
  fillTable('tbl-orig-lista', 'c_orig_lista', [['negocio'], ['banker', null, 'l'], ['conduzido', null, r => r.conduzido === 'Não vinculado' ? 'l tw-mudo' : 'l'], ['etapa', null, 'l'], ['etapa_conduzido', v => v || '—', 'l'], ['temperatura', null, 'l'], ['valor', BRL], ['previsao', DATA], ['concluido', v => v ? DATA(v) : '—']],
    {key: 'chave', filter: r => atual() === 'Todos' || r.banker === atual() || String(r.conduzido).includes(atual()), empty: 'Nenhuma originação no período.'});
}
function drawReunioes() {
  const el = $('chart-reun'), nomes = atual() === 'Todos' ? BANKERS : [atual()], cor = b => 'var(--tw-b' + (BANKERS.indexOf(b) + 1) + ')';
  legenda('lg-reun', nomes.length > 1 ? nomes.map(b => [cor(b), b]) : []);
  $('titulo-reun').textContent = 'Reuniões por semana' + (atual() === 'Todos' ? ', por banker' : ' · ' + atual());
  if (state(el, ['reunioes']) !== 'ok') return;
  const dados = dash.data('reunioes').data.filter(r => r.data), P = PER(), hoje = hojeISO(), atualSem = semanaDe(hoje);
  const prox = (() => { const t = new Date(atualSem + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + 7); return t.toISOString().slice(0, 10); })();
  const ini = semanaDe(P.tipo === 'tudo' ? dados.reduce((m, r) => r.data < m ? r.data : m, hoje) : P.ini), fim = P.tipo === 'tudo' ? prox : semanaDe(P.fim);
  const semanas = []; for (let w = ini, i = 0; w <= fim && i < 80; i++) { semanas.push(w); const t = new Date(w + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + 7); w = t.toISOString().slice(0, 10); }
  const cont = {}; dados.forEach(r => { if (!dentro(r.data, P)) return; const k = r.banker + '|' + semanaDe(r.data); cont[k] = (cont[k] || 0) + 1; });
  const rows = semanas.map(w => { const o = {semana: w}; let t = 0; nomes.forEach(b => { o[b] = cont[b + '|' + w] || 0; t += o[b]; }); o.total = t; return o; });
  el.replaceChildren();
  if (!rows.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = 'Nenhuma semana no período.'; el.appendChild(p); return; }
  const tip = makeTip(el), W = el.clientWidth || 700, H = 260, mt = 18, mb = 26;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const y = d3.scaleLinear([0, Math.max(1, d3.max(rows, r => r.total))], [H - mb, mt]).nice();
  const yt = y.ticks(4).filter(t => Number.isInteger(t)), ml = d3.max(yt, t => textWidth(svg, INT(t))) + 10;
  const x = d3.scaleBand(semanas, [ml, W - 8]).paddingInner(0.3).paddingOuter(0.1), bw = Math.min(x.bandwidth(), 34), bx = w => x(w) + (x.bandwidth() - bw) / 2;
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => INT(d));
  const lbl = w => w.slice(8, 10) + '/' + w.slice(5, 7), passo = Math.ceil(semanas.length / Math.max(2, Math.floor((W - ml) / 56)));
  svg.append('g').selectAll('text').data(semanas.filter((w, i) => i % passo === 0 || w === atualSem)).join('text').attr('x', w => x(w) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle')
    .attr('fill', w => w === atualSem ? 'var(--tw-ink)' : 'var(--tw-muted)').style('font-weight', w => w === atualSem ? 700 : 400).text(w => w === atualSem ? 'esta semana' : lbl(w));
  rows.forEach(r => { let acc = 0; nomes.forEach(b => { if (!r[b]) return; svg.append('rect').attr('x', bx(r.semana)).attr('width', bw).attr('y', y(acc + r[b])).attr('height', Math.max(0, y(acc) - y(acc + r[b]))).style('fill', cor(b)).style('opacity', r.semana > atualSem ? 0.45 : 1); acc += r[b]; });
    if (r.total && semanas.length <= 26) svg.append('text').attr('x', x(r.semana) + x.bandwidth() / 2).attr('y', y(r.total) - 5).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(INT(r.total)); });
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', r => x(r.semana) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(el, tip, ev, 'Semana de ' + lbl(r.semana), [...nomes.filter(b => r[b]).map(b => [cor(b), b, INT(r[b])]), [null, 'Total', INT(r.total)]])).on('mouseleave', () => { tip.style.display = 'none'; });
}

/* ----- Revisão semanal ----- */
let baseCasc = 'abs', linhaRev = 'cap', visaoBk = 'cap';
const btnSet = (pares, v) => pares.forEach(([id, val]) => $(id).setAttribute('aria-pressed', v === val));
$('btn-casc-abs').addEventListener('click', () => { baseCasc = 'abs'; btnSet([['btn-casc-abs', 'abs'], ['btn-casc-pond', 'pond']], 'abs'); drawCascata(); });
$('btn-casc-pond').addEventListener('click', () => { baseCasc = 'pond'; btnSet([['btn-casc-abs', 'abs'], ['btn-casc-pond', 'pond']], 'pond'); drawCascata(); });
$('btn-rev-cap').addEventListener('click', () => { linhaRev = 'cap'; btnSet([['btn-rev-cap', 'cap'], ['btn-rev-rec', 'rec']], 'cap'); drawCascata(); });
$('btn-rev-rec').addEventListener('click', () => { linhaRev = 'rec'; btnSet([['btn-rev-cap', 'cap'], ['btn-rev-rec', 'rec']], 'rec'); drawCascata(); });
$('btn-bk-cap').addEventListener('click', () => { visaoBk = 'cap'; btnSet([['btn-bk-cap', 'cap'], ['btn-bk-rec', 'rec']], 'cap'); fillRevBankers(); });
$('btn-bk-rec').addEventListener('click', () => { visaoBk = 'rec'; btnSet([['btn-bk-cap', 'cap'], ['btn-bk-rec', 'rec']], 'rec'); fillRevBankers(); });
const BK_COLS = {
  cap: [['banker', 'Banker'], ['captado', 'Captado', BRL], ['resg_efetivado', 'Resgates efetivados', BRL], ['liquido', 'Líquido de resgates', BRL, r => r.liquido < 0 ? 'bad' : ''], ['part_liquido', 'Participação', PART], ['a_captar_pond', 'A captar ponderado', BRL], ['resg_risco', 'Resgates em risco', BRL], ['net_esperado', 'Net esperado', BRL, r => r.net_esperado < 0 ? 'bad' : ''], ['part_net', 'Part. no net esperado', PART]],
  rec: [['banker', 'Banker'], ['receita', 'Receita realizada', BRL], ['part_receita', 'Part. na realizada', PART], ['rec_aberta', 'Receita a realizar', BRL], ['part_rec_aberta', 'Part. na a realizar', PART]]
};
function fillRevBankers() {
  const cols = BK_COLS[visaoBk], tbl = $('tbl-rev-bk'), hr = tbl.querySelector('thead tr');
  hr.replaceChildren(...cols.map(([f, t]) => { const th = document.createElement('th'); th.dataset.field = f; th.textContent = t; return th; }));
  $('nota-rev-bk').textContent = visaoBk === 'cap'
    ? 'Participação = fatia de cada banker na captação líquida de resgates do período. Net esperado = captação a realizar ponderada − resgates em risco (valor cheio). "sem base" quando o total da coluna é zero ou negativo.'
    : 'Participação = fatia de cada banker na receita realizada e na receita a realizar (bruta) do período. "sem base" quando o total é zero.';
  const k = visaoBk === 'cap' ? 'liquido' : 'receita';
  fillTable('tbl-rev-bk', 'rev_bankers', cols.map(([f, , fmt, cls]) => [f, fmt, cls]), {key: 'banker', empty: 'Sem dados para o período.', sort: (a, b) => (a.banker === 'Todos') - (b.banker === 'Todos') || b[k] - a[k]});
  marcarLinhas('tbl-rev-bk');
  barrasPct('tbl-rev-bk', visaoBk === 'cap' ? 4 : 2);
}
const MEDIDAS = {
  cap_realizada: {t: 'Captação net realizada', m: ['cap_realizada', 'resg_efetivado'], nota: 'Captação ganha no período, menos os resgates efetivados (em vermelho).'},
  cap_aberta: {t: 'Captação a realizar', m: ['cap_aberta'], pond: true, nota: 'Captação em aberto com previsão no período; atrasados contam no mês corrente. Ponderado pela Temperatura.'},
  resg_risco: {t: 'Resgates em risco', m: ['resg_risco'], nota: 'Resgates em aberto com previsão no período, pelo valor cheio, sem ponderação.'},
  rec_realizada: {t: 'Receita realizada', m: ['rec_realizada'], nota: 'Receita ganha no período. Use "O que mudou" para separar câmbio, crédito, seguro e os demais.'},
  rec_aberta: {t: 'Receita a realizar', m: ['rec_aberta'], pond: true, nota: 'Receita em aberto com previsão no período; atrasados no mês corrente. Use "O que mudou" para separar os tipos.'}
};
function abrirCard(card) {
  const M = MEDIDAS[card.dataset.medida]; if (!M) return;
  const d = dash.data('rev_itens'), P = PER();
  const todos = d.status === 'ok' ? d.data.filter(r => itemNoPer(r, P) && doAtual(r) && M.m.includes(r.medida)) : [];
  const naFoto = new Set(todos.filter(r => r.momento === 'foto').map(r => r.id + '|' + r.medida));
  const rows = todos.filter(r => r.momento === 'agora').map(r => ({...r, categoria: r.medida === 'resg_efetivado' ? 'Resgate efetivado' : r.tipo, valor: r.medida === 'resg_efetivado' ? -r.valor : r.valor, detalhe: (naFoto.has(r.id + '|' + r.medida) ? '' : 'Novo desde a foto · ') + r.detalhe}));
  abrirModal({fonte: 'rev_itens', titulo: M.t + ' · ' + perLabel(P) + (atual() === 'Todos' ? '' : ' · ' + atual()), nota: M.nota + ' "Novo desde a foto" marca o que não estava neste número na foto da semana.', rows,
    cols: [COLS.negocio, COLS.banker, COLS.cat('O que mudou'), COLS.detalhe, COLS.valor, ...(M.pond ? [COLS.pond] : [])], catF: 'categoria', catT: 'O que mudou', sort: M.pond ? 'ponderado' : 'valor', ancora: card, vazio: vazioCarregando('rev_itens')});
}
function drawCascata() {
  const el = $('chart-cascata'), pond = baseCasc === 'pond', cap = linhaRev === 'cap', P = PER();
  $('titulo-casc').textContent = cap ? 'Cascata do pipe de captação' : 'Cascata do pipe de receita';
  $('nota-casc').textContent = 'Tudo o que está previsto para fechar em ' + perLabel(P) + ', da foto até agora. O objetivo é zerar o pipe: cada ganho, perda ou adiamento tira valor dele. ' + (cap ? 'Conta nova, Aporte adicional e Previdência somam; Resgate desconta pelo valor cheio. ' : 'Crédito, câmbio, seguro e demais negócios de receita. ') + (pond ? 'Ponderado pela Temperatura.' : 'Valor bruto.') + ' Data ajustada = previsão que mudou para dentro do período, ou negócio reaberto. Atrasados contam no mês corrente; sem previsão só em Período inteiro.';
  if (state(el, ['c_cascata']) !== 'ok') return;
  const c = dash.data('c_cascata').data.find(r => r.banker === atual() && r.linha === linhaRev && r.base === baseCasc);
  el.replaceChildren();
  if (!c) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = 'Nenhum negócio previsto para ' + perLabel(P) + '.'; el.appendChild(p); return; }
  const cor = v => v >= 0 ? 'var(--tw-cap)' : 'var(--tw-sai)';
  const passos = [
    {id: 'inicio', k: 'Na foto', v: c.inicio, total: true, seg: cap && c.inicio_resgate ? [[c.inicio - c.inicio_resgate, 'var(--tw-ink)', 'Captação'], [c.inicio_resgate, 'var(--tw-b4)', 'Resgates']] : null},
    {id: 'novos', k: 'Novos', v: c.novos, n: c.n_novos, cor: 'var(--tw-cap)', seg: cap && c.novos_resgate ? [[c.novos - c.novos_resgate, 'var(--tw-cap)', 'Captação'], [c.novos_resgate, 'var(--tw-b4)', 'Resgates']] : null},
    {id: 'vieram', k: 'Data ajustada', v: c.vieram, n: c.n_vieram, cor: cor(c.vieram)},
    {id: 'ganhos', k: 'Ganhos', v: c.ganhos, n: c.n_ganhos, cor: 'var(--tw-accent)'},
    {id: 'perdidos', k: 'Perdidos', v: c.perdidos, n: c.n_perdidos, cor: 'var(--tw-sai)'},
    {id: 'removidos', k: 'Removidos', v: c.removidos, n: c.n_removidos, cor: 'var(--tw-sai)'},
    {id: 'sairam', k: 'Adiados', v: c.sairam, n: c.n_sairam, cor: 'var(--tw-sai)'},
    {id: 'variacao', k: pond ? 'Mudou de valor ou temperatura' : 'Mudou de valor', v: c.variacao, n: c.n_variacao, cor: cor(c.variacao)},
    {id: 'atual', k: 'Agora', v: c.atual, total: true, seg: cap && c.atual_resgate ? [[c.atual - c.atual_resgate, 'var(--tw-ink)', 'Captação'], [c.atual_resgate, 'var(--tw-b4)', 'Resgates']] : null}];
  let acc = 0; passos.forEach(p => { if (p.total) { p.a = 0; p.b = p.v; acc = p.v; } else { p.a = acc; p.b = acc + p.v; acc = p.b; } });
  const tip = makeTip(el), W = el.clientWidth || 700, H = 320, mt = 44, mb = 42;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  passos.forEach(p => { p.pk = [p.a, p.b]; if (p.seg) { let b0 = p.a; p.seg.forEach(([v]) => { b0 += v; p.pk.push(b0); }); } });
  const hi = d3.max(passos, p => Math.max(...p.pk, 0)) || 1, lo = d3.min(passos, p => Math.min(...p.pk, 0));
  const y = d3.scaleLinear([lo * 1.12, hi * 1.12], [H - mb, mt]).nice(), yt = y.ticks(4), ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10;
  const x = d3.scaleBand(passos.map(p => p.k), [ml, W - 8]).paddingInner(0.3).paddingOuter(0.1), bw = Math.min(x.bandwidth(), 56);
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  passos.forEach((p, i) => {
    const xx = x(p.k) + (x.bandwidth() - bw) / 2, y0 = y(Math.max(...p.pk)), h = Math.max(p.v ? 1 : 0, Math.abs(y(p.a) - y(p.b)));
    svg.append('rect').attr('x', xx).attr('width', bw).attr('y', y0).attr('height', h).attr('rx', 3).style('fill', p.total ? 'var(--tw-ink)' : p.cor).style('opacity', p.seg ? 0 : p.total ? 0.85 : 1);
    if (p.seg) { let b0 = p.a; p.seg.forEach(([v, c2]) => { if (!v) return; svg.append('rect').attr('x', xx).attr('width', bw).attr('y', y(Math.max(b0, b0 + v))).attr('height', Math.abs(y(b0) - y(b0 + v))).style('fill', c2); b0 += v; }); }
    if (p.total && p.seg) {
      svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 20).attr('text-anchor', 'middle').attr('fill', 'var(--tw-ink)').style('font-weight', 600).text((p.v < 0 ? '−' : '') + BRL(Math.abs(p.v)));
      svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').style('font-size', '11px').text(BRL(p.seg[0][0]) + ' − ' + BRL(Math.abs(p.seg[1][0])) + ' resg.');
    } else svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-ink)').style('font-weight', 600).text(p.total ? (p.v < 0 ? '−' : '') + BRL(Math.abs(p.v)) : DBRL(p.v));
    if (i < passos.length - 1) { const nx = passos[i + 1]; svg.append('line').attr('x1', xx + bw).attr('x2', x(nx.k) + (x.bandwidth() - bw) / 2).attr('y1', y(p.b)).attr('y2', y(p.b)).attr('stroke', 'var(--tw-axis)').attr('stroke-dasharray', '2 3'); }
    const rot = svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', H - 18).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').style('font-size', '12px');
    const pal = (p.k + (p.n ? ` (${p.n})` : '')).split(' '), meio = Math.ceil(pal.length / 2);
    (x.bandwidth() < textWidth(svg, pal.join(' ')) && pal.length > 1 ? [pal.slice(0, meio).join(' '), pal.slice(meio).join(' ')] : [pal.join(' ')]).forEach((ln, j) => rot.append('tspan').attr('x', x(p.k) + x.bandwidth() / 2).attr('dy', j ? '1.15em' : 0).text(ln));
  });
  svg.append('g').selectAll('rect').data(passos).join('rect').attr('x', p => x(p.k)).attr('width', x.bandwidth()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent').attr('class', 'tw-clk')
    .on('click', (ev, p) => { tip.style.display = 'none'; abrirCascata(p); })
    .on('mousemove', (ev, p) => showTip(el, tip, ev, p.k, [[null, 'Valor', p.total ? BRL(p.v) : DBRL(p.v)], ...(p.n != null ? [[null, 'Negócios', INT(p.n)]] : []), ...(p.seg ? p.seg.filter(s => s[0]).map(([v, c2, n]) => [c2, n, BRL(v)]) : []), [null, 'Clique', 'ver os negócios']]))
    .on('mouseleave', () => { tip.style.display = 'none'; });
}
function abrirCascata(p) {
  const d = dash.data('cascata_itens'), campo = baseCasc === 'pond' ? 'valor_pond' : 'valor_abs';
  const rows = d.status === 'ok' ? d.data.filter(r => r.passo === p.id && r.linha === linhaRev && doAtual(r) && (p.total || r[campo] !== 0)).map(r => ({...r, valor: r[campo]})) : [];
  abrirModal({fonte: 'cascata_itens', titulo: p.k + ' · ' + perLabel(PER()) + (atual() === 'Todos' ? '' : ' · ' + atual()), nota: 'Comparação com a foto do Histórico, pipe de ' + (linhaRev === 'cap' ? 'captação' : 'receita') + ', ' + (baseCasc === 'pond' ? 'valores ponderados pela Temperatura (resgate pelo valor cheio).' : 'valores brutos.') + (p.total ? '' : ' Valor = efeito no pipe.') + (p.id === 'variacao' ? ' "O que mudou" diz se foi edição do valor, mudança de temperatura ou ambos.' : ''), rows,
    cols: [COLS.negocio, COLS.banker, COLS.cat('O que mudou'), COLS.detalhe, {f: 'valor', t: baseCasc === 'pond' ? 'Valor ponderado' : 'Valor', num: true, fmt: BRL}], catF: 'categoria', catT: 'O que mudou', sort: 'valor', ancora: $('chart-cascata'), vazio: vazioCarregando('cascata_itens')});
}
let saudeZero = true;
$('chk-saude-zero').addEventListener('change', ev => { saudeZero = ev.target.checked; fillSaude(); });
function fillSaude() {
  fillTable('tbl-saude', 'saude', [['negocio'], ['banker', null, 'l'], ['etapa', null, 'l'], ['valor', (v, r) => r.pendencias.includes('Valor não preenchido') ? 'Vazio' : BRL(v)], ['previsao', DATA], ['pendencias', null, 'l']],
    {key: 'id', filter: r => doAtual(r) && (saudeZero || r.valor_zero !== 'Sim'), empty: 'Nenhuma pendência. Pipeline em ordem.'});
}
function fillRevisao() {
  fillRevBankers(); fillSaude();
  const P = PER();
  fillTable('tbl-prec', 'precisao', [['mes', MESLBL], ['foto', DATA], ['previsto_ponderado', BRL], ['previsto_bruto', BRL], ['realizado', BRL], ['aderencia', PCTN], ['em_andamento', null, 'l']], {key: 'chave', filter: r => r.banker === atual() && mesNoPer(r.mes, P), empty: 'Nenhum mês do período tem foto anterior para comparar.'});
}

/* ----- Navegação, tema e cliques ----- */
const SECOES = ['resumo', 'forecast', 'pipeline', 'time', 'revisao'];
let secaoSel = (() => { const h = (location.hash || '').slice(1); return SECOES.includes(h) ? h : 'resumo'; })();
function mostrarSecao() {
  if (bankerSel && dash.params().banker !== bankerSel) dash.setParams({banker: bankerSel});
  drawFilter(); fillMarks();
  document.querySelectorAll('.tw-sec').forEach(el => { el.hidden = el.id !== secaoSel; });
  document.querySelectorAll('.tw-nav a').forEach(a => a.setAttribute('aria-current', a.dataset.sec === secaoSel ? 'page' : 'false'));
  $('per-wrap').hidden = secaoSel === 'forecast';
  if (secaoSel === 'forecast' && !perPop.hidden) fecharPer();
  if (secaoSel === 'resumo') drawMes();
  if (secaoSel === 'forecast') drawForecast();
  if (secaoSel === 'time') drawReunioes();
  if (secaoSel === 'revisao') drawCascata();
}
document.querySelectorAll('.tw-nav a').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); secaoSel = a.dataset.sec; try { dash.setLink(secaoSel); } catch (e) {} mostrarSecao(); }));
window.addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (SECOES.includes(h)) { secaoSel = h; mostrarSecao(); } });
function aplicarTema() {
  const p = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;background:var(--color-bg)';
  document.body.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove();
  const m = c.match(/\d+(\.\d+)?/g); if (!m) return;
  $('tw').classList.toggle('tw-dark', (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255 < 0.5);
}
const clicavel = (sel2, fn) => document.querySelectorAll(sel2).forEach(c => { c.addEventListener('click', () => fn(c)); c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(c); } }); });
clicavel('#revisao .cc-tile.tw-clk', abrirCard);
clicavel('#resumo .cc-tile.tw-clk', abrirResumo);
clicavel('#forecast .cc-tile.tw-clk', abrirForecast);
textoMes();
dash.onData(() => {
  aplicarTema(); drawFilter(); fillMarks();
  fillTable('tbl-conc5', 'c_conc5', [['posicao', INT], ['negocio', null, 'l'], ['cliente', null, 'l'], ['dono', null, 'l'], ['tipo', null, 'l'], ['ponderado', BRL], ['participacao', PCT1], ['acumulado', PCT1]], {key: 'chave', filter: r => r.banker === atual(), empty: 'Nenhum negócio de captação com valor ponderado no período.'});
  barrasPct('tbl-conc5', 6);
  fillPipeline(); fillTime(); fillRevisao();
  mostrarSecao();
});
