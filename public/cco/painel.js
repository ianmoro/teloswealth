// Painel CCO · lógica do painel (a mesma do painel no Claude)
const BRL = v => {
  v = Number(v) || 0; const a = Math.abs(v);
  if (a >= 1e6) return 'R$ ' + (v / 1e6).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + ' mi';
  if (a >= 1e3) return 'R$ ' + Math.round(v / 1e3).toLocaleString('pt-BR') + ' mil';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
};
const INT = v => Number(v || 0).toLocaleString('pt-BR');
const PCT = v => Math.round(Number(v) * 100) + '%';
const DIAS = v => v == null ? '—' : INT(v) + ' d';
const DATA = v => { if (!v) return 'Sem data'; const [y, m, d] = String(v).slice(0, 10).split('-'); return d + '/' + m + '/' + y.slice(2); };
const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESLBL = v => /^\d{4}-\d{2}$/.test(v) ? MES[+v.slice(5) - 1] + '/' + v.slice(2, 4) : v;
const FMT = {dbrl: v => (Number(v) > 0 ? '+' : Number(v) < 0 ? '−' : '') + BRL(Math.abs(Number(v) || 0)), brl: BRL, int: INT, pct: PCT, data: DATA, dec: v => Number(v).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1})};
const PCTN = v => v == null ? '—' : PCT(v);
const PCT1 = v => v == null ? '—' : (Number(v) * 100).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%';

const BANKERS = ['Tax', 'Fernando', 'Gabe', 'Ian', 'Renato', 'Rodrigo'];
dash.calc('ritmo_bp', {
  inputs: ['bp_additional'],
  title: 'Ritmo mensal do BP por banker',
  description: 'Additional esperado no BP 2027, dividido por 12 meses, em reais, para cada banker do painel e a soma deles (Todos).',
  fn: (bp_additional) => {
    const rows = BANKERS.map(b => {
      const r = bp_additional.find(x => x.banker === b);
      return {banker: b, ritmo_mensal: r ? Math.round(Number(r.esperado_mi) * 1e6 / 12) : null};
    });
    const completo = rows.every(r => r.ritmo_mensal != null);
    return [{banker: 'Todos', ritmo_mensal: completo ? rows.reduce((t, r) => t + r.ritmo_mensal, 0) : null}, ...rows];
  }
});

const sel = document.getElementById('sel-banker');
let bankerSel = null;
sel.addEventListener('change', () => { bankerSel = sel.value; dash.setParams({banker: sel.value}); });
const atual = () => dash.params().banker || bankerSel || 'Todos';
function drawFilter() {
  const d = dash.data('pipe_kpi');
  const names = d.status === 'ok' ? d.data.map(r => r.banker) : ['Todos', ...BANKERS];
  if (sel.options.length !== names.length) {
    sel.replaceChildren(...names.map(n => { const o = document.createElement('option'); o.value = n; o.textContent = n === 'Todos' ? 'Todos (consolidado)' : n; return o; }));
  }
  sel.value = atual();
  document.getElementById('titulo-pagina').textContent = 'Painel comercial · ' + atual();
  document.querySelectorAll('#tw [data-fcf]').forEach(el => { el.dataset.field = FC_CAMPOS[el.dataset.fcf][periodoFc]; });
  if (typeof opcoesRev === 'function') opcoesRev();
  document.querySelectorAll('#tw [data-fmt]').forEach(el => { el.dataset.where = el.hasAttribute('data-fc') ? 'chave=' + atual() + '|' + baseFc : el.hasAttribute('data-rev') ? 'chave=' + atual() + '|' + (window.perRev || '') : 'banker=' + atual(); });
}

const BAD = ['error', 'connect', 'declined', 'missing'];
function state(el, ids) {
  const sts = ids.map(id => dash.data(id).status);
  if (sts.every(s => s === 'ok')) { el.classList.remove('dash-skeleton'); return 'ok'; }
  el.replaceChildren();
  if (sts.some(s => BAD.includes(s))) {
    el.classList.remove('dash-skeleton');
    const f = document.createElement('div'); f.className = 'cc-fail'; f.textContent = 'Não carregou'; el.appendChild(f);
    return 'fail';
  }
  el.classList.add('dash-skeleton');
  return 'loading';
}
function valueOf(el) {
  const d = dash.data(el.dataset.source);
  if (d.status !== 'ok') return null;
  const rows = d.data || [];
  let row = null;
  if (el.dataset.where) { const i = el.dataset.where.indexOf('='); const k = el.dataset.where.slice(0, i), v = el.dataset.where.slice(i + 1); row = rows.find(r => String(r[k]) === v); }
  return row && row[el.dataset.field] != null ? row[el.dataset.field] : null;
}
function fillMarks() {
  document.querySelectorAll('#tw [data-fmt]').forEach(el => {
    const v = valueOf(el);
    if (v == null) { el.textContent = '—'; return; }
    el.classList.remove('dash-skeleton');
    el.textContent = FMT[el.dataset.fmt](v);
  });
}
function fillTable(tableId, src, cols, opts = {}) {
  const tbl = document.getElementById(tableId);
  const tb = tbl.querySelector('tbody');
  tb.replaceChildren();
  const d = dash.data(src);
  const old = tbl.parentNode.querySelector('.cc-empty'); if (old) old.remove();
  if (d.status !== 'ok') return;
  const data = opts.filter ? d.data.filter(opts.filter) : d.data;
  if (!data.length) {
    const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = opts.empty || 'Nada por aqui ainda.';
    tbl.parentNode.appendChild(p); return;
  }
  data.forEach(r => {
    const tr = document.createElement('tr');
    if (opts.key) tr.dataset.key = r[opts.key];
    cols.forEach(([f, fmt, cls]) => {
      const td = document.createElement('td');
      td.textContent = fmt ? fmt(r[f]) : String(r[f] ?? '—');
      const c = typeof cls === 'function' ? cls(r) : cls;
      if (c) td.className = c;
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
}
function makeTip(el) { const t = document.createElement('div'); t.className = 'cc-tip'; el.appendChild(t); return t; }
function showTip(el, tip, ev, title, lines) {
  tip.replaceChildren();
  const h = document.createElement('div'); h.className = 't'; h.textContent = title; tip.appendChild(h);
  lines.forEach(([c, n, v]) => {
    const l = document.createElement('div');
    if (c) { const i = document.createElement('i'); i.style.cssText = 'display:inline-block;width:.5rem;height:.5rem;border-radius:2px;margin-right:.35rem;background:' + c; l.appendChild(i); }
    l.appendChild(document.createTextNode(n + ': ' + v));
    tip.appendChild(l);
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

let modoMes = 'cap', baseMes = 'pond';
const btnCap = document.getElementById('btn-cap'), btnRec = document.getElementById('btn-rec');
function textoMes() {
  const pond = baseMes === 'pond';
  document.getElementById('titulo-mes').textContent = modoMes === 'cap'
    ? (pond ? 'Captação e saída por mês: realizado e esperado' : 'Captação e saída por mês: realizado e cadastrado')
    : (pond ? 'Receita por mês: realizada e esperada' : 'Receita por mês: realizada e cadastrada');
  const base = pond ? 'Valores ponderados pela Temperatura (Quente 90%, Morno 60%, Frio 10%).' : 'Valores absolutos: o total cadastrado, sem aplicar a Temperatura.';
  document.getElementById('nota-mes').textContent = modoMes === 'cap'
    ? base + ' No mês atual, a parte cheia é o já realizado e a clara é o previsto. Captação acima do zero, saída abaixo; a linha é o líquido.'
    : base + ' Receita para a Telos dos negócios de seguro, crédito, câmbio, tributário, sucessório e outros.';
}
function setModo(m) {
  modoMes = m;
  btnCap.setAttribute('aria-pressed', m === 'cap'); btnRec.setAttribute('aria-pressed', m === 'rec');
  textoMes(); drawMes();
}
const btnPond = document.getElementById('btn-pond'), btnAbs = document.getElementById('btn-abs');
function setBase(b) {
  baseMes = b; baseFc = b;
  btnPond.setAttribute('aria-pressed', b === 'pond'); btnAbs.setAttribute('aria-pressed', b === 'abs');
  btnFcPond.setAttribute('aria-pressed', b === 'pond'); btnFcAbs.setAttribute('aria-pressed', b === 'abs');
  textoMes(); drawFilter(); fillMarks(); drawMes(); drawForecast();
}
btnPond.addEventListener('click', () => setBase('pond'));
btnAbs.addEventListener('click', () => setBase('abs'));
btnCap.addEventListener('click', () => setModo('cap'));
btnRec.addEventListener('click', () => setModo('rec'));

function legend(items) {
  const lg = document.getElementById('lg-mes'); lg.replaceChildren();
  items.forEach(([c, n, line, op]) => {
    const s = document.createElement('span'); const i = document.createElement('i');
    i.style.background = c; if (op) i.style.opacity = op; if (line) { i.style.height = '2px'; i.style.width = '.9rem'; i.style.borderRadius = '0'; }
    s.appendChild(i); s.appendChild(document.createTextNode(n)); lg.appendChild(s);
  });
}

function drawMes() {
  const el = document.getElementById('chart-mes');
  const cCap = 'var(--tw-cap)', cSai = 'var(--tw-sai)', cNet = 'var(--tw-net)', cRec = 'var(--tw-cap)';
  const cap = modoMes === 'cap';
  legend(cap
    ? [[cCap, 'Captado'], [cCap, 'Captação prevista', false, .4], [cSai, 'Saída realizada'], [cSai, 'Saída prevista', false, .4], [cNet, 'Líquido', true]]
    : [[cRec, 'Receita realizada'], [cRec, 'Receita prevista', false, .4]]);
  if (state(el, ['pipe_mes']) !== 'ok') return;
  const abs = baseMes === 'abs';
  let rows = dash.data('pipe_mes').data.filter(r => r.banker === atual()).map(r => ({
    mes: r.mes,
    capReal: +r.captado || 0, capPrev: +(abs ? r.captacao_bruta : r.captacao) || 0,
    saiReal: +r.saida_realizada || 0, saiPrev: +(abs ? r.saida_bruta : r.saida) || 0,
    recReal: +r.receita_realizada || 0, recPrev: +(abs ? r.receita_bruta : r.receita) || 0
  }));
  rows.forEach(r => { r.cap = r.capReal + r.capPrev; r.sai = r.saiReal + r.saiPrev; r.rec = r.recReal + r.recPrev; r.net = r.cap - r.sai; });
  rows = cap ? rows.filter(r => r.cap || r.sai) : rows.filter(r => r.rec);
  el.replaceChildren();
  if (!rows.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = cap ? 'Nenhuma captação ou saída no período.' : 'Nenhum negócio de receita no período.'; el.appendChild(p); return; }
  const tip = makeTip(el);
  const W = el.clientWidth || 600, H = 300, mt = 24, mb = 24;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const lo = cap ? Math.min(0, d3.min(rows, r => Math.min(-r.sai, r.net))) : 0;
  const hi = cap ? Math.max(0, d3.max(rows, r => Math.max(r.cap, r.net))) : d3.max(rows, r => r.rec);
  const pad = (hi - lo || 1) * 0.12;
  const y = d3.scaleLinear([lo < 0 ? lo - pad : 0, (hi || 1) + pad], [H - mb, mt]).nice();
  const yt = y.ticks(5);
  const ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10;
  const x = d3.scaleBand(rows.map(r => r.mes), [ml, W - 8]).paddingInner(0.35).paddingOuter(0.2);
  const bw = Math.min(x.bandwidth(), 40), bx = r => x(r.mes) + (x.bandwidth() - bw) / 2;
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', d => d === 0 ? 'var(--tw-axis)' : 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  svg.append('g').selectAll('text').data(rows).join('text').attr('x', r => x(r.mes) + x.bandwidth() / 2).attr('y', H - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(r => MESLBL(r.mes));
  const seg = (from, to, color, op) => svg.append('g').selectAll('rect').data(rows).join('rect')
    .attr('x', bx).attr('width', bw)
    .attr('y', r => Math.min(y(from(r)), y(to(r)))).attr('height', r => Math.abs(y(from(r)) - y(to(r))))
    .attr('rx', 3).style('fill', color).style('opacity', op);
  if (cap) {
    seg(r => 0, r => r.capReal, cCap, 1);
    seg(r => r.capReal, r => r.cap, cCap, .4);
    seg(r => 0, r => -r.saiReal, cSai, 1);
    seg(r => -r.saiReal, r => -r.sai, cSai, .4);
    const line = d3.line().x(r => x(r.mes) + x.bandwidth() / 2).y(r => y(r.net));
    svg.append('path').datum(rows).attr('fill', 'none').attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').style('stroke', cNet).attr('d', line);
    svg.append('g').selectAll('circle').data(rows).join('circle').attr('cx', r => x(r.mes) + x.bandwidth() / 2).attr('cy', r => y(r.net)).attr('r', 4).style('fill', cNet);
    const lab = svg.append('g');
    rows.forEach(r => {
      const g = lab.append('g');
      const t = g.append('text').attr('dy', '0.35em').style('font-weight', '600').style('fill', r.net < 0 ? 'var(--tw-sai)' : cNet).text(BRL(r.net));
      const tw = t.node().getComputedTextLength(), cx = x(r.mes) + x.bandwidth() / 2;
      let tx = cx + bw / 2 + 10;
      if (tx + tw + 6 > W) tx = cx - bw / 2 - 10 - tw;
      const ty = Math.min(Math.max(y(r.net), mt), H - mb - 8);
      t.attr('x', tx).attr('y', ty);
      g.insert('rect', 'text').attr('x', tx - 5).attr('y', ty - 10).attr('width', tw + 10).attr('height', 20).attr('rx', 4)
        .style('fill', 'var(--tw-card)').style('stroke', 'var(--tw-line)');
    });
  } else {
    seg(r => 0, r => r.recReal, cRec, 1);
    seg(r => r.recReal, r => r.rec, cRec, .4);
    svg.append('g').selectAll('text').data(rows).join('text').attr('x', r => x(r.mes) + x.bandwidth() / 2).attr('y', r => y(r.rec) - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(r => BRL(r.rec));
  }
  svg.append('g').selectAll('rect').data(rows).join('rect')
    .attr('x', r => x(r.mes) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(el, tip, ev, MESLBL(r.mes), cap
      ? [[cCap, 'Captado', BRL(r.capReal)], [cCap, 'Captação prevista', BRL(r.capPrev)], [cSai, 'Saída realizada', BRL(r.saiReal)], [cSai, abs ? 'Saída em risco' : 'Saída prevista', BRL(r.saiPrev)], [cNet, 'Líquido', BRL(r.net)]]
      : [[cRec, 'Receita realizada', BRL(r.recReal)], [cRec, 'Receita prevista', BRL(r.recPrev)]]))
    .on('mouseleave', () => { tip.style.display = 'none'; });
}


/* ===== Forecast ===== */
const FIM_HORIZONTE = '2027-12';
function proxMes(m) { let [y, mm] = m.split('-').map(Number); mm++; if (mm > 12) { mm = 1; y++; } return y + '-' + String(mm).padStart(2, '0'); }
function projetar(params, pipe_mes, metas) {
  const telos = params.find(p => p.tipo === 'Telos');
  const ref = (telos && telos.data_ref) ? String(telos.data_ref).slice(0, 10) : null;
  if (!ref) return {rows: [], resumo: []};
  const inicio = ref.slice(0, 7);
  const meses = []; for (let m = inicio; m <= FIM_HORIZONTE; m = proxMes(m)) meses.push(m);
  const ganho = {}; params.filter(p => p.tipo === 'Mercado').forEach(p => { ganho[String(p.ano)] = Number(p.ganho_aa) || 0; });
  const meta = {}; metas.forEach(r => { meta[r.mes] = Number(r.meta); });
  const rows = [], resumo = [];
  ['Todos', ...BANKERS].forEach(b => {
    const pr = b === 'Todos' ? telos : params.find(p => p.tipo === 'Banker' && p.linha === b);
    if (!pr || pr.aua_inicial == null) return;
    const aua0 = Number(pr.aua_inicial), dref = String(pr.data_ref || ref).slice(0, 10);
    ['pond', 'abs'].forEach(base => {
      const fluxo = {}; meses.forEach(m => { fluxo[m] = {cap: 0, sai: 0}; });
      let semPrev = 0;
      pipe_mes.filter(r => r.banker === b).forEach(r => {
        const cap = Number(base === 'pond' ? r.captacao : r.captacao_bruta) || 0;
        const sai = Number(base === 'pond' ? r.saida : r.saida_bruta) || 0;
        const capR = Number(r.captado) || 0, saiR = Number(r.saida_realizada) || 0;
        if (r.mes === 'Sem previsão') { semPrev += Number(r.captacao_bruta) || 0; return; }
        let m = r.mes === 'Atrasado' || r.mes < inicio ? inicio : r.mes;
        if (!fluxo[m]) return;
        fluxo[m].cap += cap + capR; fluxo[m].sai += sai + saiR;
      });
      const idx = {}; meses.forEach((m, i) => { idx[m] = i; });
      const ancoras = [[-1, aua0]];
      if (b === 'Todos') Object.keys(meta).sort().forEach(m => { if (idx[m] != null) ancoras.push([idx[m], meta[m]]); });
      const traj = i => {
        if (ancoras.length < 2) return null;
        for (let k = 1; k < ancoras.length; k++) {
          const [i0, v0] = ancoras[k - 1], [i1, v1] = ancoras[k];
          if (i <= i1) return Math.round(v0 + (v1 - v0) * (i - i0) / (i1 - i0));
        }
        return null;
      };
      let aua = aua0, mkt = aua0, capLiq = 0; const capAno = {};
      rows.push({chave: `${b}|${base}|inicio`, banker: b, base, mes: 'inicio', data: dref, aua: aua0, so_mercado: aua0, captacao: 0, saida: 0, meta_traj: b === 'Todos' ? aua0 : null});
      meses.forEach((m, i) => {
        const taxa = Math.pow(1 + (ganho[m.slice(0, 4)] || 0), 1 / 12) - 1;
        const f = fluxo[m];
        aua = aua * (1 + taxa) + f.cap - f.sai; mkt = mkt * (1 + taxa); capLiq += f.cap - f.sai; capAno[m.slice(0, 4)] = (capAno[m.slice(0, 4)] || 0) + f.cap - f.sai;
        rows.push({chave: `${b}|${base}|${m}`, banker: b, base, mes: m, data: null, aua: Math.round(aua), so_mercado: Math.round(mkt), captacao: Math.round(f.cap), saida: Math.round(f.sai), meta_traj: b === 'Todos' ? traj(i) : null});
      });
      const p26 = rows.find(r => r.chave === `${b}|${base}|2026-12`), p27 = rows.find(r => r.chave === `${b}|${base}|2027-12`);
      const m26 = b === 'Todos' ? (meta['2026-12'] ?? null) : null, m27 = b === 'Todos' ? (meta['2027-12'] ?? null) : null;
      resumo.push({chave: `${b}|${base}`, banker: b, base, aua_inicial: aua0, data_ref: dref,
        proj_2026: p26 ? p26.aua : null, proj_2027: p27 ? p27.aua : null,
        meta_2026: m26, meta_2027: m27,
        gap_2026: m26 != null && p26 ? m26 - p26.aua : null, gap_2027: m27 != null && p27 ? m27 - p27.aua : null,
        capt_liquida: Math.round(capLiq), mercado: p27 ? Math.round(p27.aua - aua0 - capLiq) : null,
        capt_liq_2026: Math.round(capAno['2026'] || 0), capt_liq_2027: Math.round(capAno['2027'] || 0),
        mercado_2026: p26 ? Math.round(p26.aua - aua0 - (capAno['2026'] || 0)) : null,
        mercado_2027: p26 && p27 ? Math.round(p27.aua - p26.aua - (capAno['2027'] || 0)) : null,
        sem_previsao: Math.round(semPrev), ganho_2026: ganho['2026'] ?? null, ganho_2027: ganho['2027'] ?? null});
    });
  });
  return {rows, resumo};
}
dash.calc('forecast', {
  inputs: ['params', 'pipe_mes', 'metas'],
  fn: (params, pipe_mes, metas) => projetar(params, pipe_mes, metas).rows
});
dash.calc('forecast_resumo', {
  inputs: ['params', 'pipe_mes', 'metas'],
  fn: (params, pipe_mes, metas) => projetar(params, pipe_mes, metas).resumo
});

dash.calc('aua_atual', {
  inputs: ['params', 'negocios_vivo'],
  fn: (params, negocios_vivo) => ['Todos', ...BANKERS].map(b => {
    const p = b === 'Todos' ? params.find(x => x.tipo === 'Telos') : params.find(x => x.tipo === 'Banker' && x.linha === b);
    if (!p || p.aua_inicial == null) return null;
    const ref = String(p.data_ref || '').slice(0, 10);
    const d = negocios_vivo.filter(r => (b === 'Todos' || r.banker === b) && r.concluido && (!ref || String(r.concluido).slice(0, 10) >= ref));
    const soma = l => l.reduce((t, r) => t + (Number(r.valor) || 0), 0);
    const captado = soma(d.filter(r => r.etapa === 'Ganho' && ['Conta nova', 'Aporte adicional', 'Previdência'].includes(r.tipo)));
    const resgatado = soma(d.filter(r => r.etapa === 'Perdido' && r.tipo === 'Resgate'));
    const aua0 = Number(p.aua_inicial);
    return {banker: b, aua_inicial: aua0, data_ref: ref || null, captado, resgatado, aua_atual: aua0 + captado - resgatado};
  }).filter(Boolean)
});
let baseFc = 'pond', simAua = null;
const btnFcPond = document.getElementById('btn-fc-pond'), btnFcAbs = document.getElementById('btn-fc-abs');
function setBaseFc(b) { setBase(b); }
btnFcPond.addEventListener('click', () => setBaseFc('pond'));
btnFcAbs.addEventListener('click', () => setBaseFc('abs'));
const inpSim = document.getElementById('sim-aua'), btnSim = document.getElementById('sim-limpar');
inpSim.addEventListener('input', () => { const v = parseFloat(String(inpSim.value).replace(',', '.')); simAua = isFinite(v) && v > 0 ? v * 1e6 : null; drawForecast(); });
btnSim.addEventListener('click', () => { inpSim.value = ''; simAua = null; drawForecast(); });

const FC_CAMPOS = {
  ini: {all: 'aua_inicial', '2026': 'aua_inicial', '2027': 'proj_2026'},
  fim: {all: 'proj_2027', '2026': 'proj_2026', '2027': 'proj_2027'},
  meta: {all: 'meta_2027', '2026': 'meta_2026', '2027': 'meta_2027'},
  gap: {all: 'gap_2027', '2026': 'gap_2026', '2027': 'gap_2027'},
  cap: {all: 'capt_liquida', '2026': 'capt_liq_2026', '2027': 'capt_liq_2027'},
  mkt: {all: 'mercado', '2026': 'mercado_2026', '2027': 'mercado_2027'}
};
let periodoFc = '2026';
function rotulosPeriodo(p) {
  document.querySelectorAll('[data-per]').forEach(b => b.setAttribute('aria-pressed', b.dataset.per === p));
  const fim = p === '2026' ? 'dez/2026' : 'dez/2027', desde = p === '2027' ? 'em 2027' : 'até ' + fim;
  document.getElementById('lbl-fc-ini').textContent = p === '2027' ? 'AuA no início de 2027' : 'AuA inicial';
  document.getElementById('sub-fc-ref').hidden = p === '2027';
  document.getElementById('sub-fc-proj').hidden = p !== '2027';
  document.getElementById('lbl-fc-fim').textContent = 'Projetado · ' + fim;
  document.getElementById('lbl-fc-cap').textContent = 'Captação líquida esperada · ' + desde;
  document.getElementById('lbl-fc-mkt').textContent = 'Ganho de capital · ' + desde;
  document.getElementById('titulo-fc').textContent = p === 'all' ? 'Curva de AuA projetada' : 'Curva de AuA projetada · ' + p;
}
function setPeriodo(p) { periodoFc = p; rotulosPeriodo(p); drawFilter(); fillMarks(); drawForecast(); }
rotulosPeriodo(periodoFc);
document.querySelectorAll('[data-per]').forEach(b => b.addEventListener('click', () => setPeriodo(b.dataset.per)));

function drawForecast() {
  const el = document.getElementById('chart-fc');
  const cProj = 'var(--tw-cap)', cMkt = 'var(--tw-muted)', cMeta = 'var(--tw-net)', cSim = 'var(--tw-accent)';
  const ehTodos = atual() === 'Todos';
  document.querySelectorAll('.tw-so-telos').forEach(n => { n.hidden = !ehTodos; });
  const itens = [[cProj, 'AuA projetado'], [cMkt, 'Só mercado, sem captação', true]];
  if (ehTodos) itens.push([cMeta, 'Trajetória até as metas', true]);
  if (simAua) itens.push([cSim, 'Simulado', true]);
  const lg = document.getElementById('lg-fc'); lg.replaceChildren();
  itens.forEach(([c, n, line]) => { const s = document.createElement('span'); const i = document.createElement('i'); i.style.background = c; if (line) { i.style.height = '2px'; i.style.width = '.9rem'; i.style.borderRadius = '0'; } s.appendChild(i); s.appendChild(document.createTextNode(n)); lg.appendChild(s); });
  if (state(el, ['forecast']) !== 'ok') return;
  const rows = dash.data('forecast').data.filter(r => r.banker === atual() && r.base === baseFc && (periodoFc === 'all' || (periodoFc === '2026' ? (r.mes === 'inicio' || r.mes <= '2026-12') : (r.mes !== 'inicio' && r.mes >= '2026-12'))));
  el.replaceChildren();
  if (!rows.length) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = 'Sem AuA inicial para este banker nos Parâmetros do painel.'; el.appendChild(p); return; }
  const ini = dash.data('forecast').data.find(r => r.banker === atual() && r.base === baseFc && r.mes === 'inicio');
  const aua0 = ini ? ini.aua : rows[0].aua;
  rows.forEach(r => { r.sim = simAua ? Math.round(r.aua + (simAua - aua0) * (r.so_mercado / aua0)) : null; });
  const tip = makeTip(el);
  const W = el.clientWidth || 700, H = 340, mt = 28, mb = 28;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const vals = rows.flatMap(r => [r.aua, r.so_mercado, r.meta_traj, r.sim]).filter(v => v != null);
  const lo = d3.min(vals), hi = d3.max(vals), pad = (hi - lo || hi) * 0.08;
  const y = d3.scaleLinear([Math.max(0, lo - pad), hi + pad], [H - mb, mt]).nice();
  const yt = y.ticks(5);
  const ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10;
  const ultimo = rows[rows.length - 1];
  const mr = d3.max([BRL(ultimo.aua), BRL(ultimo.so_mercado)], s => textWidth(svg, s)) + 18;
  const x = d3.scalePoint(rows.map(r => r.mes), [ml + 6, W - mr]);
  const lblX = r => r.mes === 'inicio' ? 'início' : MESLBL(r.mes);
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - mr + 6).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  const passo = Math.ceil(rows.length / Math.max(2, Math.floor((W - ml - mr) / 52)));
  svg.append('g').selectAll('text').data(rows.filter((r, i) => i % passo === 0 || r.mes.endsWith('-12'))).join('text')
    .attr('x', r => x(r.mes)).attr('y', H - 8).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(lblX);
  const linha = (k, cor, w, dash) => {
    const d = rows.filter(r => r[k] != null);
    if (d.length < 2) return;
    svg.append('path').datum(d).attr('fill', 'none').attr('stroke-width', w).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
      .style('stroke', cor).attr('stroke-dasharray', dash || null).attr('d', d3.line().x(r => x(r.mes)).y(r => y(r[k])));
  };
  linha('so_mercado', cMkt, 1.5, '5 4');
  if (ehTodos) linha('meta_traj', cMeta, 1.5, '2 4');
  if (simAua) linha('sim', cSim, 2, '7 4');
  linha('aua', cProj, 3);
  if (ehTodos) rows.filter(r => (r.mes === '2026-12' && periodoFc !== '2027') || r.mes === '2027-12').forEach(r => {
    const cx = x(r.mes), cy = y(r.meta_traj);
    svg.append('path').attr('d', d3.symbol(d3.symbolDiamond, 70)()).attr('transform', `translate(${cx},${cy})`).style('fill', cMeta);
    svg.append('text').attr('x', cx).attr('y', cy - 12).attr('text-anchor', 'middle').style('fill', cMeta).style('font-weight', 600).text('Meta ' + BRL(r.meta_traj));
  });
  [['aua', cProj], ['so_mercado', cMkt]].forEach(([k, c], j) => {
    svg.append('text').attr('x', x(ultimo.mes) + 8).attr('y', y(ultimo[k])).attr('dy', j ? '1em' : '0.35em').style('fill', c).style('font-weight', j ? 400 : 700).text(BRL(ultimo[k]));
  });
  const rule = svg.append('line').attr('y1', mt).attr('y2', H - mb).attr('stroke', 'var(--tw-axis)').attr('stroke-dasharray', '2 3').style('display', 'none');
  svg.append('rect').attr('x', ml).attr('y', mt).attr('width', Math.max(0, W - ml - mr + 6)).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', ev => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => Math.abs(x(b.mes) - px) < Math.abs(x(a.mes) - px) ? b : a);
      rule.attr('x1', x(r.mes)).attr('x2', x(r.mes)).style('display', null);
      const l = [[cProj, 'AuA projetado', BRL(r.aua)], [cMkt, 'Só mercado', BRL(r.so_mercado)]];
      if (r.mes !== 'inicio') l.push([null, 'Captação no mês', BRL(r.captacao)], [null, 'Saída no mês', BRL(r.saida)]);
      if (ehTodos && r.meta_traj != null) l.push([cMeta, 'Trajetória da meta', BRL(r.meta_traj)]);
      if (simAua) l.push([cSim, 'Simulado', BRL(r.sim)]);
      showTip(el, tip, ev, r.mes === 'inicio' ? 'Início · ' + DATA(r.data) : MESLBL(r.mes), l);
    })
    .on('mouseleave', () => { tip.style.display = 'none'; rule.style('display', 'none'); });
}

function barrasConc() {
  document.querySelectorAll('#tbl-conc5 tbody tr').forEach(tr => {
    const td = tr.children[6]; if (!td) return;
    const v = parseFloat(td.textContent.replace('%', '').replace(',', '.')) || 0;
    td.style.background = `linear-gradient(to left, var(--tw-soft) ${Math.min(100, v)}%, transparent ${Math.min(100, v)}%)`;
  });
}
/* ===== Time ===== */
dash.calc('comparativo', {
  inputs: ['time_resumo', 'reun_resumo', 'params'],
  fn: (time_resumo, reun_resumo, params) => time_resumo.map(t => {
    const p = t.banker === 'Todos' ? params.find(x => x.tipo === 'Telos') : params.find(x => x.tipo === 'Banker' && x.linha === t.banker);
    const r = reun_resumo.find(x => x.banker === t.banker);
    const aua = p && p.aua_inicial != null ? Number(p.aua_inicial) : null;
    const cp = Number(t.captacao_ponderada) || 0;
    return {banker: t.banker, ordem: t.ordem, aua_inicial: aua, captacao_ponderada: cp, pipeline_sobre_aua: aua ? Math.round(cp / aua * 10000) / 10000 : null,
      receita_ponderada: Number(t.receita_ponderada) || 0, saida_esperada: Number(t.saida_esperada) || 0, abertos: t.abertos, vencidas: t.vencidas, sem_valor: t.sem_valor,
      ganhos: t.ganhos, taxa_ganho: t.taxa_ganho, ciclo_medio_dias: t.ciclo_medio_dias, reunioes_30d: r ? r.ultimos_30d : 0};
  })
});
function fillComparativo() {
  fillTable('tbl-comp', 'comparativo', [['banker'], ['aua_inicial', v => v == null ? '—' : BRL(v)], ['captacao_ponderada', BRL], ['pipeline_sobre_aua', PCT1], ['receita_ponderada', BRL], ['saida_esperada', BRL], ['abertos', INT], ['vencidas', INT], ['sem_valor', INT], ['ganhos', INT], ['taxa_ganho', PCTN], ['ciclo_medio_dias', DIAS], ['reunioes_30d', INT]], {key: 'banker', empty: 'Sem dados.'});
  document.querySelectorAll('#tbl-comp tbody tr').forEach(tr => {
    tr.classList.toggle('tw-sel', tr.dataset.key === atual() && atual() !== 'Todos');
    tr.classList.toggle('tw-total', tr.dataset.key === 'Todos');
  });
}
function drawReunioes() {
  const el = document.getElementById('chart-reun');
  const nomes = atual() === 'Todos' ? BANKERS : [atual()];
  const cor = b => 'var(--tw-b' + (BANKERS.indexOf(b) + 1) + ')';
  const lg = document.getElementById('lg-reun'); lg.replaceChildren();
  if (nomes.length > 1) nomes.forEach(b => { const s = document.createElement('span'); const i = document.createElement('i'); i.style.background = cor(b); s.appendChild(i); s.appendChild(document.createTextNode(b)); lg.appendChild(s); });
  document.getElementById('titulo-reun').textContent = 'Reuniões por semana' + (atual() === 'Todos' ? ', por banker' : ' · ' + atual());
  if (state(el, ['reun_semana']) !== 'ok') return;
  const dados = dash.data('reun_semana').data;
  const hoje = new Date(); const dia = (hoje.getDay() + 6) % 7; const seg = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - dia));
  const semanas = []; for (let k = -11; k <= 1; k++) { const d = new Date(seg); d.setUTCDate(d.getUTCDate() + 7 * k); semanas.push(d.toISOString().slice(0, 10)); }
  const atualSem = seg.toISOString().slice(0, 10);
  const rows = semanas.map(w => { const o = {semana: w}; let t = 0; nomes.forEach(b => { const r = dados.find(x => x.banker === b && x.semana === w); o[b] = r ? Number(r.reunioes) : 0; t += o[b]; }); o.total = t; return o; });
  el.replaceChildren();
  const tip = makeTip(el);
  const W = el.clientWidth || 700, H = 260, mt = 18, mb = 26;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  const y = d3.scaleLinear([0, Math.max(1, d3.max(rows, r => r.total))], [H - mb, mt]).nice();
  const yt = y.ticks(4).filter(t => Number.isInteger(t));
  const ml = d3.max(yt, t => textWidth(svg, INT(t))) + 10;
  const x = d3.scaleBand(semanas, [ml, W - 8]).paddingInner(0.3).paddingOuter(0.1);
  const bw = Math.min(x.bandwidth(), 34), bx = w => x(w) + (x.bandwidth() - bw) / 2;
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => INT(d));
  const lbl = w => { const [yy, mm, dd] = w.split('-'); return dd + '/' + mm; };
  const passo = Math.ceil(semanas.length / Math.max(2, Math.floor((W - ml) / 56)));
  svg.append('g').selectAll('text').data(semanas.filter((w, i) => i % passo === 0 || w === atualSem)).join('text').attr('x', w => x(w) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle')
    .attr('fill', w => w === atualSem ? 'var(--tw-ink)' : 'var(--tw-muted)').style('font-weight', w => w === atualSem ? 700 : 400).text(w => w === atualSem ? 'esta semana' : lbl(w));
  rows.forEach(r => {
    let acc = 0;
    nomes.forEach(b => {
      if (!r[b]) return;
      svg.append('rect').attr('x', bx(r.semana)).attr('width', bw).attr('y', y(acc + r[b])).attr('height', Math.max(0, y(acc) - y(acc + r[b]))).style('fill', cor(b)).style('opacity', r.semana > atualSem ? 0.45 : 1);
      acc += r[b];
    });
    if (r.total) svg.append('text').attr('x', x(r.semana) + x.bandwidth() / 2).attr('y', y(r.total) - 5).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').text(INT(r.total));
  });
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', r => x(r.semana) - x.step() * x.paddingInner() / 2).attr('width', x.step()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(el, tip, ev, 'Semana de ' + lbl(r.semana), [...nomes.filter(b => r[b]).map(b => [cor(b), b, INT(r[b])]), [null, 'Total', INT(r.total)]]))
    .on('mouseleave', () => { tip.style.display = 'none'; });
}

dash.calc('originacao_resumo', {
  inputs: ['originacao'],
  fn: (originacao) => ['Todos', ...BANKERS].map(b => {
    const r = originacao.filter(x => b === 'Todos' || x.banker === b);
    const g = r.filter(x => x.etapa === 'Ganho'), p = r.filter(x => x.etapa === 'Perdido'), a = r.filter(x => x.etapa !== 'Ganho' && x.etapa !== 'Perdido');
    const soma = l => l.reduce((t, x) => t + (Number(x.valor) || 0), 0);
    return {banker: b, abertas: a.length, ganhas: g.length, perdidas: p.length, conversao: g.length + p.length ? Math.round(g.length / (g.length + p.length) * 100) / 100 : null, volume_aberto: soma(a), volume_ganho: soma(g)};
  })
});
function fillOriginacao() {
  fillTable('tbl-orig-res', 'originacao_resumo', [['banker'], ['abertas', INT], ['ganhas', INT], ['perdidas', INT], ['conversao', PCTN], ['volume_aberto', BRL], ['volume_ganho', BRL]], {key: 'banker', empty: 'Nenhuma originação cadastrada.'});
  document.querySelectorAll('#tbl-orig-res tbody tr').forEach(tr => { tr.classList.toggle('tw-sel', tr.dataset.key === atual() && atual() !== 'Todos'); tr.classList.toggle('tw-total', tr.dataset.key === 'Todos'); });
  fillTable('tbl-orig-lista', 'originacao', [['negocio'], ['banker', null, 'l'], ['etapa', null, 'l'], ['temperatura', null, 'l'], ['valor', BRL], ['previsao', DATA], ['concluido', v => v ? DATA(v) : '—']], {key: 'id', filter: r => atual() === 'Todos' || r.banker === atual(), empty: 'Nenhuma originação para este banker.'});
}
/* ===== Revisão semanal ===== */
dash.calc('rev_bankers', {
  inputs: ['rev_kpis'],
  fn: (rev_kpis) => rev_kpis.map(r => {
    const tot = rev_kpis.find(x => x.banker === 'Todos' && x.periodo === r.periodo);
    return {chave: r.chave, banker: r.banker, periodo: r.periodo, captado: r.cap_realizada, participacao: tot && tot.cap_realizada ? Math.round(r.cap_realizada / tot.cap_realizada * 1000) / 1000 : null, liquido: r.cap_liquida, a_captar: r.cap_aberta, a_captar_pond: r.cap_aberta_pond, resg_risco: r.resg_risco, receita: r.rec_realizada, receita_a_realizar: r.rec_aberta};
  })
});
function fillRevBankers() {
  const per = window.perRev;
  document.getElementById('titulo-rev-bk').textContent = 'Por banker · ' + PERLBL(per);
  const d = dash.data('rev_bankers'); const ordem = {};
  if (d.status === 'ok') d.data.filter(r => r.periodo === per).forEach(r => { ordem[r.banker] = r.banker === 'Todos' ? -1 : r.captado + r.a_captar / 1e6; });
  fillTable('tbl-rev-bk', 'rev_bankers', [['banker'], ['captado', BRL], ['participacao', PCT1], ['liquido', BRL, r => r.liquido < 0 ? 'bad' : ''], ['a_captar', BRL], ['a_captar_pond', BRL], ['resg_risco', BRL], ['receita', BRL], ['receita_a_realizar', BRL]], {key: 'chave', filter: r => r.periodo === per, empty: 'Sem dados para o período.'});
  const tb = document.querySelector('#tbl-rev-bk tbody');
  [...tb.children].sort((a, b) => (ordem[b.dataset.key.split('|')[0]] ?? 0) - (ordem[a.dataset.key.split('|')[0]] ?? 0)).forEach(tr => tb.appendChild(tr));
  tb.querySelectorAll('tr').forEach(tr => {
    const b = tr.dataset.key.split('|')[0];
    tr.classList.toggle('tw-sel', b === atual() && atual() !== 'Todos'); tr.classList.toggle('tw-total', b === 'Todos');
    const td = tr.children[2]; if (!td) return;
    const v = parseFloat(td.textContent.replace('%', '').replace(',', '.')) || 0;
    td.style.background = b === 'Todos' ? '' : `linear-gradient(to left, var(--tw-soft) ${Math.min(100, v)}%, transparent ${Math.min(100, v)}%)`;
  });
}
const LINHA_CAP = t => t === 'Conta nova' || t === 'Aporte adicional' || t === 'Previdência';
const PROB = (etapa, temp) => etapa === 'Ganho' ? 1 : etapa === 'Perdido' ? 0 : temp === 'Quente' ? 0.9 : temp === 'Morno' ? 0.6 : temp === 'Frio' ? 0.1 : 0;
const ABERTO = e => e !== 'Ganho' && e !== 'Perdido';
const hojeISO = () => new Date().toISOString().slice(0, 10);
const ultimaSemana = h => h.reduce((m, r) => (r.semana && r.semana > m ? r.semana : m), '');
const doB = b => r => b === 'Todos' || r.banker === b;

dash.calc('saude', {
  inputs: ['negocios_vivo', 'tarefas_abertas'],
  fn: (vivo, tarefas) => {
    const comTarefa = new Set(tarefas.map(t => t.negocio_id)); const hoje = hojeISO();
    return vivo.filter(r => Number(r.aberto) === 1).map(r => {
      const p = [];
      if (r.previsao && r.previsao < hoje) p.push('Previsão vencida');
      if (!Number(r.valor)) p.push('Sem valor');
      if (!r.previsao) p.push('Sem previsão');
      if (!r.temperatura) p.push('Sem temperatura');
      if (!comTarefa.has(r.id)) p.push('Sem próximo passo');
      return {id: r.id, banker: r.banker, negocio: r.negocio, tipo: r.tipo, etapa: r.etapa, valor: Number(r.valor) || 0, previsao: r.previsao, idade_dias: r.idade_dias, pendencias: p.join(' · '), n_pendencias: p.length};
    }).filter(r => r.n_pendencias > 0).sort((a, b) => b.n_pendencias - a.n_pendencias || b.valor - a.valor);
  }
});
dash.calc('saude_resumo', {
  inputs: ['negocios_vivo', 'tarefas_abertas'],
  fn: (vivo, tarefas) => {
    const comTarefa = new Set(tarefas.map(t => t.negocio_id)); const hoje = hojeISO();
    return ['Todos', ...BANKERS].map(b => {
      const a = vivo.filter(r => Number(r.aberto) === 1 && doB(b)(r));
      return {banker: b, abertos: a.length,
        vencida: a.filter(r => r.previsao && r.previsao < hoje).length,
        sem_valor: a.filter(r => !Number(r.valor)).length,
        sem_previsao: a.filter(r => !r.previsao).length,
        sem_temperatura: a.filter(r => !r.temperatura).length,
        sem_tarefa: a.filter(r => !comTarefa.has(r.id)).length};
    });
  }
});
/* Originação fica fora de captação e receita: o dinheiro já entra pelo negócio de quem fechou. */
const LINHA_REV = t => LINHA_CAP(t) || t === 'Resgate' ? 'cap' : (!t || t === 'Indicação' || t === 'Originação' ? null : 'rec');
const REV = {
  mes: d => d.slice(0, 7),
  efet: (r, refMes) => ABERTO(r.etapa) ? (r.previsao ? (r.previsao.slice(0, 7) < refMes ? refMes + '-01' : r.previsao) : null) : (r.concluido || r.previsao || null),
  peso: (r, base) => r.tipo === 'Resgate' ? -(base === 'abs' ? 1 : 1 - PROB(r.etapa, r.temperatura)) : (base === 'abs' ? 1 : PROB(r.etapa, r.temperatura)),
  noPer: (d, p) => !!d && d.slice(0, p.length) === p,
  pers: d => d ? [d.slice(0, 4), d.slice(0, 7)] : []
};
dash.calc('cascata_itens', {
  inputs: ['historico', 'negocios_vivo'],
  fn: (historico, negocios_vivo) => {
    const S = ultimaSemana(historico); if (!S) return [];
    const foto = historico.filter(r => r.semana === S && LINHA_REV(r.tipo)), vivo = negocios_vivo.filter(r => LINHA_REV(r.tipo));
    const fMes = REV.mes(foto.reduce((m, r) => (r.data_foto && r.data_foto > m ? r.data_foto : m), '') || S), hMes = REV.mes(hojeISO());
    const fMap = new Map(foto.map(r => [r.id, r])), vMap = new Map(vivo.map(r => [r.id, r]));
    const dt = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(2, 4) : 'sem data';
    const desc = r => [r.tipo === 'Resgate' ? 'Resgate' : r.tipo, r.etapa || 'sem etapa', r.temperatura || 'sem temperatura', 'previsão ' + dt(r.previsao)].join(' · ');
    const out = [];
    const add = (r, p, passo, detalhe, va, vp) => { if (passo !== 'inicio' && passo !== 'atual' && Math.round(va) === 0 && Math.round(vp) === 0) return; out.push({chave: `${r.id}|${p}|${passo}`, banker: r.banker, linha: LINHA_REV(r.tipo), resgate: r.tipo === 'Resgate' ? 'Sim' : 'Não', periodo: p, passo, negocio: r.negocio, detalhe, valor_abs: Math.round(va), valor_pond: Math.round(vp)}); };
    new Set([...fMap.keys(), ...vMap.keys()]).forEach(id => {
      const f = fMap.get(id), a = vMap.get(id);
      const fE = f && ABERTO(f.etapa) ? REV.efet(f, fMes) : null, aE = a && ABERTO(a.etapa) ? REV.efet(a, hMes) : null;
      new Set([...REV.pers(fE), ...REV.pers(aE)]).forEach(p => {
        const fIn = REV.noPer(fE, p), aIn = REV.noPer(aE, p);
        const vf = f ? Number(f.valor) || 0 : 0, va = a ? Number(a.valor) || 0 : 0;
        const pf = b => fIn ? vf * REV.peso(f, b) : 0, pa = b => aIn ? va * REV.peso(a, b) : 0;
        if (fIn) add(f, p, 'inicio', desc(f), pf('abs'), pf('pond'));
        if (aIn) add(a, p, 'atual', desc(a), pa('abs'), pa('pond'));
        if (!f) add(a, p, 'novos', 'Novo · ' + desc(a), pa('abs'), pa('pond'));
        else if (fIn && !a) add(f, p, 'removidos', 'Não existe mais no Notion (estava em ' + (f.etapa || 'sem etapa') + ')', -pf('abs'), -pf('pond'));
        else if (fIn && !ABERTO(a.etapa)) {
          const res = a.tipo === 'Resgate' ? (a.etapa === 'Ganho' ? ' (resgate retido)' : ' (resgate efetivado)') : '';
          if (a.etapa === 'Perdido') add(a, p, 'perdidos', f.etapa + ' → Perdido' + res, -pf('abs'), -pf('pond'));
          else {
            add(a, p, 'ganhos', f.etapa + ' → Ganho' + res + ' · ' + BRL(va), -va * REV.peso(f, 'abs'), -va * REV.peso(f, 'pond'));
            if (va !== vf) add(a, p, 'variacao', 'Ganho com valor diferente: ' + BRL(vf) + ' → ' + BRL(va), (va - vf) * REV.peso(f, 'abs'), (va - vf) * REV.peso(f, 'pond'));
          }
        }
        else if (fIn && !aIn) add(a, p, 'sairam', 'Previsão ' + dt(f.previsao) + ' → ' + dt(a.previsao), -pf('abs'), -pf('pond'));
        else if (!fIn && aIn) add(a, p, 'vieram', ABERTO(f.etapa) ? 'Previsão ' + dt(f.previsao) + ' → ' + dt(a.previsao) : 'Reaberto (' + f.etapa + ' → ' + a.etapa + ')', pa('abs'), pa('pond'));
        else if (fIn && aIn) {
          const m = []; if (va !== vf) m.push('Valor ' + BRL(vf) + ' → ' + BRL(va));
          if ((a.temperatura || '') !== (f.temperatura || '')) m.push((f.temperatura || 'Sem temperatura') + ' → ' + (a.temperatura || 'sem temperatura'));
          add(a, p, 'variacao', m.join(' · ') || 'Mudança de etapa', pa('abs') - pf('abs'), pa('pond') - pf('pond'));
        }
      });
    });
    return out;
  }
});
dash.calc('cascata_periodo', {
  inputs: ['cascata_itens'],
  fn: (cascata_itens) => {
    const g = {};
    cascata_itens.forEach(r => ['Todos', r.banker].forEach(b => ['pond', 'abs'].forEach(base => {
      const k = `${b}|${r.linha}|${r.periodo}|${base}`;
      const o = g[k] = g[k] || {chave: k, banker: b, linha: r.linha, periodo: r.periodo, base, inicio_resgate: 0, atual_resgate: 0, inicio: 0, novos: 0, novos_resgate: 0, vieram: 0, ganhos: 0, perdidos: 0, removidos: 0, sairam: 0, variacao: 0, atual: 0, n_novos: 0, n_novos_resgate: 0, n_vieram: 0, n_ganhos: 0, n_perdidos: 0, n_removidos: 0, n_sairam: 0, n_variacao: 0};
      const v = base === 'pond' ? r.valor_pond : r.valor_abs;
      o[r.passo] += v; if (r.passo !== 'inicio' && r.passo !== 'atual') o['n_' + r.passo]++;
      if (r.passo === 'novos' && r.resgate === 'Sim') { o.novos_resgate += v; o.n_novos_resgate++; }
      if ((r.passo === 'inicio' || r.passo === 'atual') && r.resgate === 'Sim') o[r.passo + '_resgate'] += v;
    })));
    return Object.values(g);
  }
});
dash.calc('rev_itens', {
  inputs: ['historico', 'negocios_vivo'],
  fn: (historico, negocios_vivo) => {
    const S = ultimaSemana(historico); if (!S) return [];
    const foto = historico.filter(r => r.semana === S && LINHA_REV(r.tipo)), vivo = negocios_vivo.filter(r => LINHA_REV(r.tipo));
    const dataFoto = foto.reduce((m, r) => (r.data_foto && r.data_foto > m ? r.data_foto : m), '') || S;
    const dt = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(2, 4) : 'sem data';
    const out = [];
    const linhas = (rows, refMes, momento) => rows.forEach(r => {
      const e = REV.efet(r, refMes); if (!e) return;
      const v = Number(r.valor) || 0, p = PROB(r.etapa, r.temperatura), res = r.tipo === 'Resgate', cap = LINHA_REV(r.tipo) === 'cap';
      let medida = null, pond = v;
      if (r.etapa === 'Ganho' && !res) medida = cap ? 'cap_realizada' : 'rec_realizada';
      else if (r.etapa === 'Perdido' && res) medida = 'resg_efetivado';
      else if (ABERTO(r.etapa)) { if (res) { medida = 'resg_risco'; pond = v * (1 - p); } else { medida = cap ? 'cap_aberta' : 'rec_aberta'; pond = v * p; } }
      if (!medida) return;
      const detalhe = [r.tipo, r.etapa, ...(ABERTO(r.etapa) ? [r.temperatura || 'sem temperatura', 'previsão ' + dt(r.previsao)] : ['concluído em ' + dt(r.concluido)])].join(' · ');
      REV.pers(e).forEach(per => out.push({chave: `${momento}|${r.id}|${per}|${medida}`, momento, id: r.id, banker: r.banker, periodo: per, medida, negocio: r.negocio, detalhe, valor: Math.round(v), ponderado: Math.round(pond), semana: S, data_foto: dataFoto}));
    });
    linhas(vivo, hojeISO().slice(0, 7), 'agora');
    linhas(foto, dataFoto.slice(0, 7), 'foto');
    return out;
  }
});
dash.calc('rev_kpis', {
  inputs: ['rev_itens'],
  fn: (rev_itens) => {
    if (!rev_itens.length) return [];
    const S = rev_itens[0].semana, dataFoto = rev_itens[0].data_foto, hoje = hojeISO();
    const CAMPOS = ['cap_realizada', 'resg_efetivado', 'cap_liquida', 'cap_aberta', 'cap_aberta_pond', 'resg_risco', 'resg_esperado', 'rec_realizada', 'rec_aberta', 'rec_aberta_pond'];
    const g = {}; const pers = new Set([hoje.slice(0, 4), hoje.slice(0, 7)]);
    rev_itens.forEach(r => {
      pers.add(r.periodo);
      ['Todos', r.banker].forEach(b => {
        const o = g[r.momento + '|' + b + '|' + r.periodo] = g[r.momento + '|' + b + '|' + r.periodo] || {};
        const add = (k, x) => { o[k] = (o[k] || 0) + x; };
        add(r.medida, r.valor);
        if (r.medida === 'cap_aberta') add('cap_aberta_pond', r.ponderado);
        if (r.medida === 'rec_aberta') add('rec_aberta_pond', r.ponderado);
        if (r.medida === 'resg_risco') add('resg_esperado', r.ponderado);
      });
    });
    const out = [];
    ['Todos', ...BANKERS].forEach(b => [...pers].sort().forEach(per => {
      const a = g['agora|' + b + '|' + per] || {}, f = g['foto|' + b + '|' + per] || {};
      a.cap_liquida = (a.cap_realizada || 0) - (a.resg_efetivado || 0); f.cap_liquida = (f.cap_realizada || 0) - (f.resg_efetivado || 0);
      const o = {chave: b + '|' + per, banker: b, periodo: per, semana: S, data_foto: dataFoto};
      CAMPOS.forEach(k => { o[k] = Math.round(a[k] || 0); o['d_' + k] = Math.round((a[k] || 0) - (f[k] || 0)); });
      out.push(o);
    }));
    return out;
  }
});
dash.calc('precisao', {
  inputs: ['historico', 'negocios_vivo'],
  fn: (hist, vivo) => {
    const semanas = [...new Set(hist.map(r => r.semana).filter(Boolean))].sort(); if (!semanas.length) return [];
    const hoje = hojeISO().slice(0, 7); const out = [];
    for (let m = proxMes(semanas[0].slice(0, 7)); m <= hoje; m = proxMes(m)) {
      const S = semanas.filter(s => s < m + '-01').pop(); if (!S) continue;
      ['Todos', ...BANKERS].forEach(b => {
        const f = hist.filter(r => r.semana === S && LINHA_CAP(r.tipo) && ABERTO(r.etapa) && r.previsao && r.previsao.slice(0, 7) <= m && doB(b)(r));
        const prevP = f.reduce((t, r) => t + (Number(r.valor) || 0) * PROB(r.etapa, r.temperatura), 0);
        const prevB = f.reduce((t, r) => t + (Number(r.valor) || 0), 0);
        const real = vivo.filter(r => LINHA_CAP(r.tipo) && r.etapa === 'Ganho' && r.concluido && r.concluido.slice(0, 7) === m && doB(b)(r)).reduce((t, r) => t + (Number(r.valor) || 0), 0);
        out.push({chave: `${b}|${m}`, banker: b, mes: m, foto: S, previsto_ponderado: Math.round(prevP), previsto_bruto: Math.round(prevB), realizado: Math.round(real), aderencia: prevP ? Math.round(real / prevP * 100) / 100 : null, em_andamento: m === hoje ? 'Sim' : 'Não'});
      });
    }
    return out;
  }
});

let baseCasc = 'abs', linhaRev = 'cap'; window.perRev = null;
const btnCascPond = document.getElementById('btn-casc-pond'), btnCascAbs = document.getElementById('btn-casc-abs'), selRev = document.getElementById('sel-rev-per');
const btnRevCap = document.getElementById('btn-rev-cap'), btnRevRec = document.getElementById('btn-rev-rec');
function setBaseCasc(b) { baseCasc = b; btnCascPond.setAttribute('aria-pressed', b === 'pond'); btnCascAbs.setAttribute('aria-pressed', b === 'abs'); drawCascata(); }
function setLinhaRev(l) { linhaRev = l; btnRevCap.setAttribute('aria-pressed', l === 'cap'); btnRevRec.setAttribute('aria-pressed', l === 'rec'); drawCascata(); }
btnCascPond.addEventListener('click', () => setBaseCasc('pond'));
btnCascAbs.addEventListener('click', () => setBaseCasc('abs'));
btnRevCap.addEventListener('click', () => setLinhaRev('cap'));
btnRevRec.addEventListener('click', () => setLinhaRev('rec'));
selRev.addEventListener('change', () => { window.perRev = selRev.value; drawFilter(); fillMarks(); drawCascata(); fillRevBankers(); });
const PERLBL = p => !p ? '—' : p.length === 4 ? p : MESLBL(p);
function opcoesRev() {
  const d = dash.data('rev_kpis'); if (d.status !== 'ok') return;
  const pers = [...new Set(d.data.map(r => r.periodo))].sort();
  const chave = pers.join(',');
  if (selRev.dataset.pers !== chave) {
    selRev.dataset.pers = chave; selRev.replaceChildren();
    const add = (pai, v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; pai.appendChild(o); };
    [['Mês', pers.filter(p => p.length === 7)], ['Ano', pers.filter(p => p.length === 4)]].forEach(([rot, lst]) => {
      if (!lst.length) return; const g = document.createElement('optgroup'); g.label = rot; lst.forEach(p => add(g, p, PERLBL(p))); selRev.appendChild(g);
    });
  }
  if (!window.perRev || !pers.includes(window.perRev)) { const m = hojeISO().slice(0, 7); window.perRev = pers.includes(m) ? m : pers[pers.length - 1] || null; }
  if (window.perRev) selRev.value = window.perRev;
}
function drawCascata() {
  const el = document.getElementById('chart-cascata');
  const pond = baseCasc === 'pond', cap = linhaRev === 'cap', per = window.perRev;
  document.getElementById('titulo-casc').textContent = cap ? 'Cascata do pipe de captação' : 'Cascata do pipe de receita';
  document.getElementById('nota-casc').textContent = 'Tudo o que está previsto para fechar em ' + PERLBL(per) + ', da foto até agora. O objetivo é zerar o pipe: cada ganho, perda ou adiamento tira valor dele. ' + (cap ? 'Conta nova, Aporte adicional e Previdência somam; Resgate desconta, como capital em risco de sair. Retido ou efetivado, o resgate sai do pipe. ' : 'Crédito, câmbio, seguro e demais negócios de receita. ') + (pond ? 'Ponderado pela Temperatura (resgate: × 1 − chance de retenção).' : 'Valor bruto.') + ' Atrasados contam no mês corrente; negócios sem previsão ficam fora.';
  if (state(el, ['cascata_periodo']) !== 'ok') return;
  const c = dash.data('cascata_periodo').data.find(r => r.banker === atual() && r.linha === linhaRev && r.periodo === per && r.base === baseCasc);
  el.replaceChildren();
  if (!c) { const p = document.createElement('div'); p.className = 'cc-empty'; p.textContent = 'Nenhum negócio previsto para ' + PERLBL(per) + '.'; el.appendChild(p); return; }
  const cor = v => v >= 0 ? 'var(--tw-cap)' : 'var(--tw-sai)';
  const passos = [
    {id: 'inicio', k: 'Na foto', v: c.inicio, total: true, n: null, seg: cap && c.inicio_resgate ? [[c.inicio - c.inicio_resgate, 'var(--tw-ink)', 'Captação'], [c.inicio_resgate, 'var(--tw-b4)', 'Resgates']] : null},
    {id: 'novos', k: 'Novos', v: c.novos, n: c.n_novos, cor: 'var(--tw-cap)', seg: cap && c.novos_resgate ? [[c.novos - c.novos_resgate, 'var(--tw-cap)', 'Captação'], [c.novos_resgate, 'var(--tw-b4)', 'Resgates']] : null},
    {id: 'vieram', k: 'Veio de outro período', v: c.vieram, n: c.n_vieram, cor: cor(c.vieram)},
    {id: 'ganhos', k: 'Ganhos', v: c.ganhos, n: c.n_ganhos, cor: 'var(--tw-accent)'},
    {id: 'perdidos', k: 'Perdidos', v: c.perdidos, n: c.n_perdidos, cor: 'var(--tw-sai)'},
    {id: 'removidos', k: 'Removidos', v: c.removidos, n: c.n_removidos, cor: 'var(--tw-sai)'},
    {id: 'sairam', k: 'Adiados', v: c.sairam, n: c.n_sairam, cor: 'var(--tw-sai)'},
    {id: 'variacao', k: pond ? 'Mudou de valor ou temperatura' : 'Mudou de valor', v: c.variacao, n: c.n_variacao, cor: cor(c.variacao)},
    {id: 'atual', k: 'Agora', v: c.atual, total: true, n: null, seg: cap && c.atual_resgate ? [[c.atual - c.atual_resgate, 'var(--tw-ink)', 'Captação'], [c.atual_resgate, 'var(--tw-b4)', 'Resgates']] : null}];
  let acc = 0; passos.forEach(p => { if (p.total) { p.a = 0; p.b = p.v; acc = p.v; } else { p.a = acc; p.b = acc + p.v; acc = p.b; } });
  const tip = makeTip(el);
  const W = el.clientWidth || 700, H = 320, mt = 44, mb = 42;
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
  passos.forEach(p => { p.pk = [p.a, p.b]; if (p.seg) { let b0 = p.a; p.seg.forEach(([v]) => { b0 += v; p.pk.push(b0); }); } });
  const hi = d3.max(passos, p => Math.max(...p.pk, 0)) || 1, lo = d3.min(passos, p => Math.min(...p.pk, 0));
  const y = d3.scaleLinear([lo * 1.12, hi * 1.12], [H - mb, mt]).nice();
  const yt = y.ticks(4); const ml = d3.max(yt, t => textWidth(svg, BRL(t))) + 10;
  const x = d3.scaleBand(passos.map(p => p.k), [ml, W - 8]).paddingInner(0.3).paddingOuter(0.1);
  const bw = Math.min(x.bandwidth(), 56);
  svg.append('g').selectAll('line').data(yt).join('line').attr('x1', ml).attr('x2', W - 8).attr('y1', d => y(d)).attr('y2', d => y(d)).attr('stroke', 'var(--tw-line)');
  svg.append('g').selectAll('text').data(yt).join('text').attr('x', ml - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').attr('fill', 'var(--tw-muted)').text(d => BRL(d));
  passos.forEach((p, i) => {
    const xx = x(p.k) + (x.bandwidth() - bw) / 2, y0 = y(Math.max(...p.pk)), h = Math.max(p.v ? 1 : 0, Math.abs(y(p.a) - y(p.b)));
    svg.append('rect').attr('x', xx).attr('width', bw).attr('y', y0).attr('height', h).attr('rx', 3).style('fill', p.total ? 'var(--tw-ink)' : p.cor).style('opacity', p.seg ? 0 : p.total ? 0.85 : 1);
    if (p.seg) { let b0 = p.a; p.seg.forEach(([v, c2]) => { if (!v) return; svg.append('rect').attr('x', xx).attr('width', bw).attr('y', y(Math.max(b0, b0 + v))).attr('height', Math.abs(y(b0) - y(b0 + v))).style('fill', c2); b0 += v; }); }
    if (p.total && p.seg) {
      svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 20).attr('text-anchor', 'middle').attr('fill', 'var(--tw-ink)').style('font-weight', 600).text((p.v < 0 ? '−' : '') + BRL(Math.abs(p.v)));
      svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').style('font-size', '11px').text(BRL(p.seg[0][0]) + ' − ' + BRL(Math.abs(p.seg[1][0])) + ' resg.');
    } else svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', y0 - 6).attr('text-anchor', 'middle').attr('fill', 'var(--tw-ink)').style('font-weight', 600).text(p.total ? (p.v < 0 ? '−' : '') + BRL(Math.abs(p.v)) : (p.v > 0 ? '+' : p.v < 0 ? '−' : '') + BRL(Math.abs(p.v)));
    if (i < passos.length - 1) { const nx = passos[i + 1]; svg.append('line').attr('x1', xx + bw).attr('x2', x(nx.k) + (x.bandwidth() - bw) / 2).attr('y1', y(p.b)).attr('y2', y(p.b)).attr('stroke', 'var(--tw-axis)').attr('stroke-dasharray', '2 3'); }
    const rot = svg.append('text').attr('x', x(p.k) + x.bandwidth() / 2).attr('y', H - 18).attr('text-anchor', 'middle').attr('fill', 'var(--tw-muted)').style('font-size', '12px');
    const pal = (p.k + (p.n ? ` (${p.n})` : '')).split(' '); const meio = Math.ceil(pal.length / 2);
    (x.bandwidth() < textWidth(svg, pal.join(' ')) && pal.length > 1 ? [pal.slice(0, meio).join(' '), pal.slice(meio).join(' ')] : [pal.join(' ')]).forEach((ln, j) => rot.append('tspan').attr('x', x(p.k) + x.bandwidth() / 2).attr('dy', j ? '1.15em' : 0).text(ln));
  });
  svg.append('g').selectAll('rect').data(passos).join('rect').attr('x', p => x(p.k)).attr('width', x.bandwidth()).attr('y', mt).attr('height', H - mt - mb).attr('fill', 'transparent').attr('class', 'tw-clk')
    .on('click', (ev, p) => { tip.style.display = 'none'; abrirItens(p); })
    .on('mousemove', (ev, p) => showTip(el, tip, ev, p.k, [[null, 'Valor', (p.total ? '' : p.v > 0 ? '+' : p.v < 0 ? '−' : '') + BRL(Math.abs(p.v))], ...(p.n != null ? [[null, 'Negócios', INT(p.n)]] : []), ...(p.seg ? p.seg.filter(x => x[0]).map(([v, c2, n]) => [c2, n, (v < 0 ? '−' : '') + BRL(Math.abs(v))]) : []), [null, 'Clique', 'ver os negócios']]))
    .on('mouseleave', () => { tip.style.display = 'none'; });
}
const cascModal = document.getElementById('casc-modal');
document.getElementById('tw').appendChild(cascModal);
function fecharItens() { cascModal.hidden = true; }
document.getElementById('casc-modal-x').addEventListener('click', fecharItens);
cascModal.addEventListener('click', ev => { if (ev.target === cascModal) fecharItens(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !cascModal.hidden) fecharItens(); });
function mostrarModal({fonte, titulo, nota, rows, campo, pond, ancora, vazio}) {
  const tbl = document.getElementById('tbl-casc-itens'); tbl.dataset.source = fonte;
  const th = document.getElementById('th-casc-valor'), thp = document.getElementById('th-casc-pond');
  th.dataset.field = campo.f; th.textContent = campo.t;
  thp.classList.toggle('vazio', !pond);
  document.getElementById('casc-modal-tit').textContent = titulo;
  document.getElementById('casc-modal-nota').textContent = nota;
  const tb = tbl.querySelector('tbody'); tb.replaceChildren();
  const wrap = tbl.parentNode; const old = wrap.querySelector('.cc-empty'); if (old) old.remove();
  if (!rows.length) { const e = document.createElement('div'); e.className = 'cc-empty'; e.textContent = vazio; wrap.appendChild(e); }
  rows.forEach(r => {
    const tr = document.createElement('tr'); tr.dataset.key = r.chave;
    const cel = [[r.negocio, ''], [r.banker, 'l'], [r.detalhe, 'l'], [BRL(r[campo.f]), r[campo.f] < 0 ? 'bad' : '']];
    if (pond) cel.push([BRL(r.ponderado), '']);
    cel.forEach(([t, c]) => { const td = document.createElement('td'); td.textContent = t; if (c) td.className = c; tr.appendChild(td); });
    tb.appendChild(tr);
  });
  cascModal.hidden = false;
  const tw = document.getElementById('tw'), box = cascModal.querySelector('.tw-modal-box');
  const topo = ancora.getBoundingClientRect().top - tw.getBoundingClientRect().top;
  box.style.top = Math.max(16, Math.min(topo, tw.scrollHeight - box.offsetHeight - 16)) + 'px';
  if (box.scrollIntoView) box.scrollIntoView({block: 'nearest', behavior: 'smooth'});
}
function abrirItens(p) {
  const d = dash.data('cascata_itens'); const pond = baseCasc === 'pond', campo = pond ? 'valor_pond' : 'valor_abs';
  const perTxt = 'pipe de ' + (linhaRev === 'cap' ? 'captação' : 'receita') + ' previsto para ' + PERLBL(window.perRev);
  const rows = d.status === 'ok' ? d.data.filter(r => r.passo === p.id && r.linha === linhaRev && r.periodo === window.perRev && (atual() === 'Todos' || r.banker === atual()) && (p.total || r[campo] !== 0)).sort((a, b) => Math.abs(b[campo]) - Math.abs(a[campo])) : [];
  mostrarModal({fonte: 'cascata_itens', titulo: p.k + (atual() === 'Todos' ? '' : ' · ' + atual()), nota: 'Comparação com a foto do Histórico, ' + perTxt + ', ' + (pond ? 'valores ponderados pela Temperatura.' : 'valores absolutos.') + (p.total ? '' : ' Valor = efeito no pipe.'),
    rows, campo: {f: campo, t: pond ? 'Valor ponderado' : 'Valor'}, pond: false, ancora: document.getElementById('chart-cascata'), vazio: d.status === 'ok' ? 'Nenhum negócio nesta barra.' : 'Carregando…'});
}
const MEDIDAS = {
  cap_realizada: {t: 'Captação realizada', m: ['cap_realizada', 'resg_efetivado'], nota: 'Captação ganha no período. Resgates efetivados aparecem em vermelho e entram só no valor líquido.'},
  cap_aberta: {t: 'Captação a realizar', m: ['cap_aberta'], pond: true, nota: 'Captação em aberto com previsão no período; atrasados contam no mês corrente.'},
  resg_risco: {t: 'Resgates em risco', m: ['resg_risco'], pond: true, nota: 'Resgates em aberto com previsão no período. Ponderado = saída esperada (valor × 1 − chance de retenção).'},
  rec_realizada: {t: 'Receita realizada', m: ['rec_realizada'], nota: 'Receita ganha no período.'},
  rec_aberta: {t: 'Receita a realizar', m: ['rec_aberta'], pond: true, nota: 'Receita em aberto com previsão no período; atrasados contam no mês corrente.'}
};
function abrirCard(card) {
  const M = MEDIDAS[card.dataset.medida]; if (!M) return;
  const d = dash.data('rev_itens'), per = window.perRev, doBk = r => atual() === 'Todos' || r.banker === atual();
  const todos = d.status === 'ok' ? d.data.filter(r => r.periodo === per && doBk(r) && M.m.includes(r.medida)) : [];
  const naFoto = new Set(todos.filter(r => r.momento === 'foto').map(r => r.id + '|' + r.medida));
  const rows = todos.filter(r => r.momento === 'agora').map(r => ({...r, valor: r.medida === 'resg_efetivado' ? -r.valor : r.valor, detalhe: (naFoto.has(r.id + '|' + r.medida) ? '' : 'Novo desde a foto · ') + (r.medida === 'resg_efetivado' ? 'Resgate efetivado · ' : '') + r.detalhe}))
    .sort((a, b) => (a.valor < 0) - (b.valor < 0) || b.valor - a.valor);
  mostrarModal({fonte: 'rev_itens', titulo: M.t + ' · ' + PERLBL(per) + (atual() === 'Todos' ? '' : ' · ' + atual()), nota: M.nota + ' "Novo desde a foto" marca o que não estava neste número na foto da semana passada.',
    rows, campo: {f: 'valor', t: 'Valor'}, pond: !!M.pond, ancora: card, vazio: d.status === 'ok' ? 'Nenhum negócio neste número.' : 'Carregando…'});
}
document.querySelectorAll('#revisao .cc-tile.tw-clk').forEach(c => {
  c.addEventListener('click', () => abrirCard(c));
  c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirCard(c); } });
});
function fillRevisao() {
  fillRevBankers();
  const doBanker = r => r.banker === atual();
  fillTable('tbl-saude', 'saude', [['negocio'], ['banker', null, 'l'], ['etapa', null, 'l'], ['valor', BRL], ['previsao', DATA], ['pendencias', null, 'l']], {key: 'id', filter: r => atual() === 'Todos' || r.banker === atual(), empty: 'Nenhuma pendência. Pipeline em ordem.'});
  fillTable('tbl-prec', 'precisao', [['mes', MESLBL], ['foto', DATA], ['previsto_ponderado', BRL], ['previsto_bruto', BRL], ['realizado', BRL], ['aderencia', PCTN], ['em_andamento', null, 'l']], {key: 'chave', filter: doBanker, empty: 'A precisão aparece a partir do primeiro mês que começar depois de uma foto.'});
}

/* Navegação lateral */
const SECOES = ['resumo', 'forecast', 'pipeline', 'time', 'revisao'];
let secaoSel = (() => { const h = (location.hash || '').slice(1); return SECOES.includes(h) ? h : 'resumo'; })();
function secaoAtual() { return secaoSel; }
function mostrarSecao() {
  if (bankerSel && dash.params().banker !== bankerSel) dash.setParams({banker: bankerSel});
  drawFilter(); fillMarks();
  const s = secaoAtual();
  document.querySelectorAll('.tw-sec').forEach(el => { el.hidden = el.id !== s; });
  document.querySelectorAll('.tw-nav a').forEach(a => a.setAttribute('aria-current', a.dataset.sec === s ? 'page' : 'false'));
  if (s === 'resumo') drawMes();
  if (s === 'forecast') drawForecast();
  if (s === 'time') drawReunioes();
  if (s === 'revisao') drawCascata();
}
document.querySelectorAll('.tw-nav a').forEach(a => a.addEventListener('click', ev => {
  ev.preventDefault(); secaoSel = a.dataset.sec; try { dash.setLink(secaoSel); } catch (e) {} mostrarSecao();
}));
window.addEventListener('hashchange', () => { const h = (location.hash || '').slice(1); if (SECOES.includes(h)) { secaoSel = h; mostrarSecao(); } });

/* Tema: segue o claro/escuro do sistema */
function aplicarTema() {
  const p = document.createElement('div'); p.style.cssText = 'position:absolute;visibility:hidden;background:var(--color-bg)';
  document.body.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove();
  const m = c.match(/\d+(\.\d+)?/g); if (!m) return;
  const lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
  document.getElementById('tw').classList.toggle('tw-dark', lum < 0.5);
}

/* Lista de negócios em aberto: a chavinha esconde os de valor zero */
const chkSemZero = document.getElementById('chk-sem-zero');
let semZero = false;
function fillLista() {
  fillTable('tbl-lista', 'pipe_lista', [['negocio'], ['banker', null, 'l'], ['tipo', null, 'l'], ['etapa', null, 'l'], ['temperatura', null, 'l'], ['valor', BRL], ['ponderado', BRL], ['previsao', DATA, r => r.vencida === 'Sim' ? 'bad' : ''], ['idade_dias', DIAS]], {key: 'url', filter: r => (atual() === 'Todos' || r.banker === atual()) && (!semZero || Number(r.valor) !== 0), empty: semZero ? 'Nenhum negócio em aberto com valor.' : 'Nenhum negócio em aberto.'});
}
if (chkSemZero) chkSemZero.addEventListener('change', () => { semZero = chkSemZero.checked; fillLista(); });
dash.onData(() => {
  aplicarTema();
  drawFilter();
  fillMarks();
  const doBanker = r => r.banker === atual();
  fillTable('tbl-conc5', 'concentracao', [['posicao', INT], ['negocio', null, 'l'], ['cliente', null, 'l'], ['dono', null, 'l'], ['tipo', null, 'l'], ['ponderado', BRL], ['participacao', PCT1], ['acumulado', PCT1]], {key: 'chave', filter: doBanker, empty: 'Nenhum negócio de captação com valor ponderado.'});
  barrasConc();
  fillComparativo();
  fillOriginacao();
  fillRevisao();
  fillTable('tbl-origem', 'origem', [['origem'], ['abertos', INT], ['captacao_ponderada', BRL], ['receita_ponderada', BRL], ['ganhos', INT], ['perdidos', INT], ['taxa_ganho', PCTN], ['captado', BRL]], {key: 'chave', filter: doBanker, empty: 'Nenhum negócio.'});
  fillTable('tbl-perdas', 'perdas', [['motivo'], ['negocios', INT], ['valor', BRL]], {key: 'chave', filter: doBanker, empty: 'Nenhum negócio perdido ainda.'});
  fillTable('tbl-tipo', 'pipe_tipo', [['tipo'], ['negocios', INT], ['valor', BRL], ['ponderado', BRL], ['idade_media_dias', DIAS]], {key: 'chave', filter: doBanker, empty: 'Nenhum negócio em aberto.'});
  fillTable('tbl-conc', 'conc_tipo', [['tipo'], ['ganhos', INT], ['perdidos', INT], ['taxa_ganho', PCT], ['ciclo_medio_dias', DIAS], ['realizado', BRL]], {key: 'chave', filter: doBanker, empty: 'Nenhum negócio concluído ainda.'});
  fillLista();
  mostrarSecao();
});
