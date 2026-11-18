// Painel CCO · servidor
// 1. Confere o login Google (só e-mails @teloswealth.com.br).
// 2. Lê as bases centrais do Telos CRM no Notion (só leitura).
// 3. Devolve as linhas no mesmo formato de colunas da consulta SQL do Notion,
//    para a página rodar as mesmas consultas do painel.

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';

// Bases centrais do Telos CRM (data sources do Notion)
export const SOURCES = {
  negocios: '64185fc0-0f6d-4a37-97d8-a7bdbd02bbf8',
  clientes: 'cd7bb274-6af0-4108-9038-2615e798d3ac',
  historico: '55a1ec62-4aee-4f77-9387-dafc210a3f4b',
  reunioes: '9c525742-03e2-4f75-9a00-34701e5092f2',
  tarefas: '0948b0bf-d9ba-4573-b8df-c6648f62714a',
  parametros: 'e4461531-ec61-4a8d-b7df-ef3a77a14103'
};

const CACHE_MS = 60 * 1000;
let cache = null;

const json = (status, body) => [status, body];

function bearer(h) {
  const m = /^Bearer\s+(.+)$/i.exec(h || '');
  return m ? m[1].trim() : null;
}

async function verificarGoogle(token, env, fetchImpl) {
  const dominio = (env.ALLOWED_DOMAIN || 'teloswealth.com.br').toLowerCase();
  const r = await fetchImpl('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
  if (!r.ok) return null;
  const t = await r.json();
  const email = String(t.email || '').toLowerCase();
  // O token precisa ter sido emitido para o app da Telos (sem isso, qualquer
  // site com login Google poderia gerar um token aceito aqui).
  if (t.aud !== env.GOOGLE_CLIENT_ID) return null;
  if (t.iss !== 'accounts.google.com' && t.iss !== 'https://accounts.google.com') return null;
  if (String(t.email_verified) !== 'true') return null;
  if (Number(t.exp) * 1000 < Date.now()) return null;
  if (!email.endsWith('@' + dominio)) return null;
  if (t.hd && String(t.hd).toLowerCase() !== dominio) return null;
  return email;
}

const semTraco = id => String(id || '').replace(/-/g, '');
const pageUrl = id => 'https://app.notion.com/' + semTraco(id);
const dataHora = s => (s ? String(s).replace('T', ' ').replace(/\.\d+Z$/, 'Z') : null);
const texto = arr => (arr || []).map(x => x.plain_text || '').join('');

// Converte uma página da API no formato de colunas da consulta SQL do Notion
export function linha(page) {
  const row = { id: page.id, url: pageUrl(page.id), createdTime: dataHora(page.created_time) };
  for (const [nome, p] of Object.entries(page.properties || {})) {
    switch (p.type) {
      case 'title': row[nome] = texto(p.title) || null; break;
      case 'rich_text': row[nome] = texto(p.rich_text) || null; break;
      case 'number': row[nome] = p.number; break;
      case 'select': row[nome] = p.select ? p.select.name : null; break;
      case 'status': row[nome] = p.status ? p.status.name : null; break;
      case 'multi_select': row[nome] = JSON.stringify((p.multi_select || []).map(o => o.name)); break;
      case 'date':
        row['date:' + nome + ':start'] = p.date ? p.date.start : null;
        row['date:' + nome + ':end'] = p.date ? p.date.end : null;
        row['date:' + nome + ':is_datetime'] = p.date ? (String(p.date.start).includes('T') ? 1 : 0) : null;
        break;
      case 'people': row[nome] = JSON.stringify((p.people || []).map(u => 'user://' + u.id)); break;
      case 'relation': row[nome] = JSON.stringify((p.relation || []).map(r => pageUrl(r.id))); break;
      case 'created_time': row[nome] = dataHora(p.created_time); break;
      case 'last_edited_time': row[nome] = dataHora(p.last_edited_time); break;
      case 'url': row[nome] = p.url; break;
      case 'email': row[nome] = p.email; break;
      case 'phone_number': row[nome] = p.phone_number; break;
      case 'checkbox': row[nome] = p.checkbox ? '__YES__' : '__NO__'; break;
      case 'unique_id': row[nome] = p.unique_id ? (p.unique_id.prefix ? p.unique_id.prefix + '-' : '') + p.unique_id.number : null; break;
      case 'formula': {
        const f = p.formula || {};
        row[nome] = f.type === 'date' ? (f.date ? f.date.start : null) : f.type === 'boolean' ? (f.boolean ? '__YES__' : '__NO__') : (f[f.type] ?? null);
        break;
      }
      default: row[nome] = null;
    }
  }
  return row;
}

async function lerBase(id, env, fetchImpl) {
  const rows = [];
  let cursor;
  for (let i = 0; i < 100; i++) {
    const r = await fetchImpl(`${NOTION_API}/data_sources/${id}/query`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.NOTION_TOKEN,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cursor ? { page_size: 100, start_cursor: cursor } : { page_size: 100 })
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Notion ${r.status} na base ${id}: ${txt.slice(0, 300)}`);
    }
    const b = await r.json();
    for (const p of b.results || []) if (!p.in_trash && !p.archived) rows.push(linha(p));
    if (!b.has_more) break;
    cursor = b.next_cursor;
  }
  return rows;
}

function tabela(rows) {
  const cols = [];
  const vistos = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => { if (!vistos.has(k)) { vistos.add(k); cols.push(k); } }));
  return { columns: cols, rows: rows.map(r => cols.map(c => (r[c] === undefined ? null : r[c]))) };
}

export async function handle(authHeader, env = {}, fetchImpl = fetch) {
  try {
    if (!env.NOTION_TOKEN) return json(500, { erro: 'NOTION_TOKEN não configurado no servidor.' });
    if (!env.GOOGLE_CLIENT_ID) return json(500, { erro: 'GOOGLE_CLIENT_ID não configurado no servidor.' });
    const token = bearer(authHeader);
    if (!token) return json(401, { erro: 'Faça login com o Google.' });
    const email = await verificarGoogle(token, env, fetchImpl);
    if (!email) return json(403, { erro: 'Acesso restrito a e-mails @teloswealth.com.br.' });

    if (!cache || Date.now() - cache.t > CACHE_MS) {
      const ids = Object.values(SOURCES);
      const bases = await Promise.all(ids.map(id => lerBase(id, env, fetchImpl)));
      const tables = {};
      ids.forEach((id, i) => { tables['collection://' + id] = tabela(bases[i]); });
      cache = { t: Date.now(), tables, at: new Date().toISOString() };
    }
    return json(200, { at: cache.at, email, tables: cache.tables });
  } catch (e) {
    return json(502, { erro: 'Não consegui ler o Notion.', detalhe: String(e && e.message || e) });
  }
}

export function _limparCache() { cache = null; }
