// Painel CCO · runtime
// Login Google, leitura dos dados pelo servidor, consultas em SQLite no navegador
// e a mesma interface "dash" que o painel usa no Claude.
(function () {
  const CFG = window.CCO_CONFIG;
  const Q = window.CCO_QUERIES;
  const TOKEN_KEY = 'cco_id_token';

  /* ---------- dash ---------- */
  const fontes = {};           // id -> {status, data}
  const calcs = {};            // id -> {inputs, fn}
  const ouvintes = [];
  let params = {};
  try { params = JSON.parse(localStorage.getItem('cco_params') || '{}'); } catch (e) { params = {}; }

  Object.keys(Q).forEach(id => { fontes[id] = {status: 'loading', data: []}; });
  fontes.metas = {status: 'ok', data: CFG.METAS || []};
  fontes.bp_additional = {status: 'ok', data: (CFG.BP_ADDITIONAL || []).filter(r => r.esperado_mi != null && r.esperado_mi !== '')};

  function avisar() {
    ouvintes.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  }

  window.dash = {
    calc(id, def) { calcs[id] = def; fontes[id] = {status: 'loading', data: []}; },
    loader() {},
    data(id) { return fontes[id] || {status: 'missing', data: []}; },
    onData(fn) { ouvintes.push(fn); },
    params() { return params; },
    setParams(p) {
      params = Object.assign({}, params, p);
      try { localStorage.setItem('cco_params', JSON.stringify(params)); } catch (e) {}
      avisar();
    },
    setLink(sec) { try { history.replaceState(null, '', '#' + sec); } catch (e) {} }
  };

  function rodarCalcs() {
    Object.keys(calcs).forEach(id => { fontes[id] = {status: 'loading', data: []}; });
    let faltam = Object.keys(calcs);
    for (let volta = 0; volta < 20 && faltam.length; volta++) {
      faltam = faltam.filter(id => {
        const def = calcs[id];
        const ins = def.inputs.map(i => fontes[i]);
        if (ins.some(x => !x || x.status === 'loading')) return true;
        if (ins.some(x => x.status !== 'ok')) { fontes[id] = {status: 'error', data: []}; return false; }
        try { fontes[id] = {status: 'ok', data: def.fn(...ins.map(x => x.data)) || []}; }
        catch (e) { console.error('calc ' + id, e); fontes[id] = {status: 'error', data: []}; }
        return false;
      });
    }
    faltam.forEach(id => { fontes[id] = {status: 'error', data: []}; });
  }

  /* ---------- SQLite ---------- */
  let SQL = null;
  async function sqlite() {
    if (!SQL) SQL = await window.initSqlJs({locateFile: f => 'https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/' + f});
    return SQL;
  }
  const qi = s => '"' + String(s).replace(/"/g, '""') + '"';

  async function processar(tables) {
    const S = await sqlite();
    const db = new S.Database();
    try {
      for (const [nome, t] of Object.entries(tables)) {
        const cols = t.columns.length ? t.columns : ['url'];
        db.run(`CREATE TABLE ${qi(nome)} (${cols.map(qi).join(', ')})`);
        const st = db.prepare(`INSERT INTO ${qi(nome)} VALUES (${cols.map(() => '?').join(', ')})`);
        db.run('BEGIN');
        t.rows.forEach(r => st.run(r.map(v => (typeof v === 'boolean' ? (v ? 1 : 0) : v))));
        db.run('COMMIT');
        st.free();
      }
      for (const [id, sql] of Object.entries(Q)) {
        try {
          const res = db.exec(sql);
          const out = [];
          if (res.length) {
            const {columns, values} = res[0];
            values.forEach(v => { const o = {}; columns.forEach((c, i) => { o[c] = v[i]; }); out.push(o); });
          }
          fontes[id] = {status: 'ok', data: out};
        } catch (e) {
          console.error('consulta ' + id, e);
          fontes[id] = {status: 'error', data: []};
        }
      }
    } finally { db.close(); }
    rodarCalcs();
  }

  /* ---------- tela ---------- */
  const $ = id => document.getElementById(id);
  function tela(qual, msg) {
    $('login').hidden = qual !== 'login';
    $('app').hidden = qual !== 'app';
    if (qual === 'login') $('login-msg').textContent = msg || 'Entre com seu e-mail da Telos.';
  }
  function status(txt) { const el = $('sess-status'); if (el) el.textContent = txt; }
  const hora = iso => { const d = new Date(iso); return d.toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}); };

  /* ---------- dados ---------- */
  let carregando = false, timer = null;
  async function carregar() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) { tela('login'); return; }
    if (carregando) return;
    carregando = true;
    status('Atualizando…');
    try {
      const r = await fetch(CFG.API_URL, {headers: {Authorization: 'Bearer ' + token}, cache: 'no-store'});
      const b = await r.json().catch(() => ({}));
      if (r.status === 401 || r.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        tela('login', b.erro || 'Sessão expirada. Entre de novo.');
        return;
      }
      if (!r.ok) throw new Error(b.detalhe || b.erro || ('HTTP ' + r.status));
      tela('app');
      $('sess-email').textContent = b.email || '';
      await processar(b.tables);
      avisar();
      status('Atualizado em ' + hora(b.at));
    } catch (e) {
      console.error(e);
      Object.keys(Q).forEach(id => { if (fontes[id].status === 'loading') fontes[id] = {status: 'error', data: []}; });
      rodarCalcs(); avisar();
      status('Não consegui atualizar: ' + (e.message || e));
    } finally {
      carregando = false;
      clearTimeout(timer);
      timer = setTimeout(carregar, CFG.REFRESH_MS || 300000);
    }
  }

  function entrar(resp) {
    sessionStorage.setItem(TOKEN_KEY, resp.credential);
    carregar();
  }
  function sair() {
    sessionStorage.removeItem(TOKEN_KEY);
    try { google.accounts.id.disableAutoSelect(); } catch (e) {}
    tela('login', 'Você saiu.');
  }

  function iniciarGoogle() {
    if (!window.google || !google.accounts || !google.accounts.id) { setTimeout(iniciarGoogle, 150); return; }
    google.accounts.id.initialize({client_id: CFG.GOOGLE_CLIENT_ID, callback: entrar, auto_select: true, hd: 'teloswealth.com.br'});
    google.accounts.id.renderButton($('login-btn'), {theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', locale: 'pt-BR'});
    if (!sessionStorage.getItem(TOKEN_KEY)) google.accounts.id.prompt();
  }

  window.CCO = {carregar, sair};
  document.addEventListener('DOMContentLoaded', () => {
    $('sess-atualizar').addEventListener('click', carregar);
    $('sess-sair').addEventListener('click', sair);
    iniciarGoogle();
    if (sessionStorage.getItem(TOKEN_KEY)) carregar(); else tela('login');
  });
})();
