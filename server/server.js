/* OneTab Lite Cloud Vault — Servidor Web Auto-Hospedado (Hostinger / Docker Ready)
   Dashboard moderno com 4 cartões KPI, Favicons reais, 6 Temas de Cores, Modo Cards/Lista e API de sincronização. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');
const VAULT_TOKEN = (process.env.VAULT_TOKEN || '').trim();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readVault() {
  try {
    if (!fs.existsSync(VAULT_FILE)) {
      return { app: 'onetab-lite', version: 3, updatedAt: null, folders: [], links: [] };
    }
    return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
  } catch {
    return { app: 'onetab-lite', version: 3, updatedAt: null, folders: [], links: [] };
  }
}

function writeVault(data) {
  const payload = {
    app: 'onetab-lite',
    version: 3,
    updatedAt: new Date().toISOString(),
    folders: Array.isArray(data.folders) ? data.folders : [],
    links: Array.isArray(data.links) ? data.links : []
  };
  fs.writeFileSync(VAULT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function isAuthorized(req) {
  if (!VAULT_TOKEN) return true;
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return token === VAULT_TOKEN;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, status, obj) {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const WEB_UI_HTML = `<!DOCTYPE html>
<html lang="pt-BR" data-color="green">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OneTab Lite — Cloud Vault</title>
  <style>
    :root, :root[data-color="green"] {
      --bg: #0b100e; --bg-soft: #111815; --card: #151e1a; --card-elevated: #192420;
      --card-hover: #1e2c27; --line: #23332c; --line-strong: #2e453b; --text: #eef5f1;
      --muted: #8ca196; --accent: #38b87c; --accent-strong: #23764f;
      --accent-soft: rgba(56, 184, 124, 0.14); --top-bg: rgba(15, 22, 19, 0.88);
    }
    :root[data-color="blue"] {
      --bg: #090e17; --bg-soft: #0f1726; --card: #131d31; --card-elevated: #17243c;
      --card-hover: #1c2c49; --line: #223556; --line-strong: #2e4773; --text: #eef4ff;
      --muted: #8da2c4; --accent: #3b82f6; --accent-strong: #1d4ed8;
      --accent-soft: rgba(59, 130, 246, 0.16); --top-bg: rgba(13, 20, 34, 0.88);
    }
    :root[data-color="black"] {
      --bg: #050506; --bg-soft: #0c0c0e; --card: #121215; --card-elevated: #17171b;
      --card-hover: #1f1f24; --line: #26262c; --line-strong: #383842; --text: #f4f4f6;
      --muted: #9494a1; --accent: #a1a1aa; --accent-strong: #3f3f46;
      --accent-soft: rgba(161, 161, 170, 0.14); --top-bg: rgba(10, 10, 12, 0.9);
    }
    :root[data-color="red"] {
      --bg: #12090b; --bg-soft: #1a0e11; --card: #221216; --card-elevated: #2a171c;
      --card-hover: #341d23; --line: #3d2229; --line-strong: #563039; --text: #fdf0f2;
      --muted: #b58d94; --accent: #ef4444; --accent-strong: #b91c1c;
      --accent-soft: rgba(239, 68, 68, 0.16); --top-bg: rgba(24, 12, 15, 0.88);
    }
    :root[data-color="yellow"] {
      --bg: #110e08; --bg-soft: #19150c; --card: #211c11; --card-elevated: #292315;
      --card-hover: #332b1a; --line: #3c331f; --line-strong: #54472b; --text: #fef9ec;
      --muted: #b5a481; --accent: #f59e0b; --accent-strong: #b45309;
      --accent-soft: rgba(245, 158, 11, 0.16); --top-bg: rgba(23, 19, 11, 0.88);
    }
    :root[data-color="white"] {
      --bg: #f4f6f8; --bg-soft: #e9eef2; --card: #ffffff; --card-elevated: #f8fafc;
      --card-hover: #f1f5f9; --line: #d8e0e8; --line-strong: #bcc8d4; --text: #0f172a;
      --muted: #55657a; --accent: #16a34a; --accent-strong: #15803d;
      --accent-soft: rgba(22, 163, 74, 0.11); --top-bg: rgba(255, 255, 255, 0.92);
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 13.5px/1.48 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    header { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; padding: 12px 24px; background: var(--top-bg); border-bottom: 1px solid var(--line); backdrop-filter: blur(12px); }
    .brand { display: flex; align-items: center; gap: 11px; }
    .logo { width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--accent-strong)); color: #fff; display: grid; place-items: center; }
    h1 { margin: 0; font-size: 16px; font-weight: 700; }
    .sub { margin: 2px 0 0; font-size: 11.5px; color: var(--muted); }
    .top-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    input { padding: 8.5px 12px; border-radius: 9px; border: 1px solid var(--line); background: var(--card); color: var(--text); font: inherit; }
    input:focus { outline: none; border-color: var(--accent); }
    .btn { appearance: none; border: 1px solid var(--line); background: var(--card); color: var(--text); padding: 8px 12px; border-radius: 9px; font: inherit; font-weight: 550; cursor: pointer; }
    .btn.primary { background: linear-gradient(135deg, var(--accent), var(--accent-strong)); border-color: var(--accent); color: #fff; font-weight: 600; }
    .color-palette { display: inline-flex; gap: 5px; padding: 4px 7px; background: var(--bg-soft); border: 1px solid var(--line); border-radius: 999px; }
    .color-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--dot); border: 2px solid rgba(255,255,255,.25); cursor: pointer; padding: 0; }
    .color-dot.active { box-shadow: 0 0 0 2px var(--card), 0 0 0 4px var(--accent); }
    .lang-switch { display: inline-flex; background: var(--bg-soft); border: 1px solid var(--line); border-radius: 9px; padding: 2px; gap: 2px; }
    .lang-btn { appearance: none; border: 0; background: transparent; color: var(--muted); font: inherit; font-size: 11.5px; font-weight: 700; padding: 4px 8px; border-radius: 6px; cursor: pointer; }
    .lang-btn.active { background: var(--card); color: var(--accent); }
    .layout { max-width: 1420px; margin: 0 auto; padding: 20px 24px 64px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 20px; align-items: start; }
    .sidebar { background: var(--card); border: 1px solid var(--line); border-radius: 13px; padding: 14px; }
    .folder-btn { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 8px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--text); cursor: pointer; text-align: left; font: inherit; margin-bottom: 2px; }
    .folder-btn:hover { background: var(--card-hover); }
    .folder-btn.active { background: linear-gradient(135deg, var(--accent), var(--accent-strong)); color: #fff; font-weight: 600; }
    .workspace { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .kpi-card { background: var(--card); border: 1px solid var(--line); border-radius: 13px; padding: 14px 16px; display: flex; flex-direction: column; gap: 2px; }
    .kpi-label { font-size: 11.5px; color: var(--muted); }
    .kpi-value { font-size: 21px; font-weight: 750; color: var(--accent); }
    .content-card { background: var(--card); border: 1px solid var(--line); border-radius: 13px; overflow: hidden; }
    .content-head { padding: 14px 20px; background: var(--bg-soft); border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    ul { list-style: none; margin: 0; padding: 0; }
    ul.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; padding: 18px; }
    li.link-row { padding: 10px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 12px; }
    ul.cards li.link-row { flex-direction: column; align-items: flex-start; background: var(--card-elevated); border: 1px solid var(--line); border-radius: 12px; padding: 15px; }
    .fav { width: 28px; height: 28px; border-radius: 7px; background: var(--bg-soft); border: 1px solid var(--line); display: grid; place-items: center; flex: 0 0 28px; overflow: hidden; }
    .fav img { width: 18px; height: 18px; object-fit: contain; }
    .link-info { flex: 1; min-width: 0; }
    .link-info a { color: var(--text); font-weight: 600; text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .link-info a:hover { color: var(--accent); }
    .meta { font-size: 11.5px; color: var(--muted); }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } .dashboard-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
      </div>
      <div>
        <h1>OneTab Lite — Cloud Vault</h1>
        <p class="sub" id="stats">Carregando biblioteca…</p>
      </div>
    </div>
    <div class="top-controls">
      <input id="q" type="search" placeholder="Buscar links, sites ou notas…" style="width:240px">
      <button class="btn" id="btn-mode">Cards / Lista</button>
      <button class="btn primary" id="btn-add">＋ Link</button>
      <div class="color-palette">
        <button class="color-dot active" data-color="green" style="--dot:#38b87c" title="Green"></button>
        <button class="color-dot" data-color="blue" style="--dot:#3b82f6" title="Blue"></button>
        <button class="color-dot" data-color="black" style="--dot:#18181b" title="Black"></button>
        <button class="color-dot" data-color="red" style="--dot:#ef4444" title="Red"></button>
        <button class="color-dot" data-color="yellow" style="--dot:#f59e0b" title="Yellow"></button>
        <button class="color-dot" data-color="white" style="--dot:#ffffff" title="White"></button>
      </div>
      <div class="lang-switch">
        <button class="lang-btn active" data-lang="pt">PT</button>
        <button class="lang-btn" data-lang="en">EN</button>
        <button class="lang-btn" data-lang="es">ES</button>
      </div>
      <input id="token" type="password" placeholder="Token" style="width:140px">
    </div>
  </header>

  <div class="layout">
    <aside class="sidebar" id="folders"></aside>
    <div class="workspace">
      <section class="dashboard-grid">
        <div class="kpi-card"><span class="kpi-label" id="lbl-k-links">Total de Links</span><strong class="kpi-value" id="k-links">0</strong></div>
        <div class="kpi-card"><span class="kpi-label" id="lbl-k-folders">Coleções</span><strong class="kpi-value" id="k-folders">0</strong></div>
        <div class="kpi-card"><span class="kpi-label" id="lbl-k-favs">Favoritos</span><strong class="kpi-value" id="k-favs">0</strong></div>
        <div class="kpi-card"><span class="kpi-label" id="lbl-k-domains">Sites Únicos</span><strong class="kpi-value" id="k-domains">0</strong></div>
      </section>
      <main class="content-card">
        <div class="content-head">
          <strong id="view-title">Todos os links</strong>
          <span class="meta" id="view-count">0 links</span>
        </div>
        <ul id="list"></ul>
      </main>
    </div>
  </div>

  <script>
    let vault = { folders: [], links: [] };
    let activeFolder = null;
    let isCards = false;
    const tokenEl = document.getElementById('token');
    const qEl = document.getElementById('q');

    const DICT = {
      pt: {
        search: 'Buscar links, sites ou notas…', mode: 'Cards / Lista', add: '＋ Link',
        kLinks: 'Total de Links', kFolders: 'Coleções', kFavs: 'Favoritos', kDomains: 'Sites Únicos',
        all: 'Todos os links', favs: 'Favoritos', collections: 'coleções',
        locked: 'Cofre protegido — informe seu VAULT_TOKEN no topo.',
        promptUrl: 'Endereço (URL) do novo link:', promptTitle: 'Título do link:'
      },
      en: {
        search: 'Search links, websites or notes…', mode: 'Cards / List', add: '＋ Link',
        kLinks: 'Total Links', kFolders: 'Collections', kFavs: 'Favorites', kDomains: 'Unique Sites',
        all: 'All links', favs: 'Favorites', collections: 'collections',
        locked: 'Protected vault — enter your VAULT_TOKEN at the top.',
        promptUrl: 'New link URL:', promptTitle: 'Link title:'
      },
      es: {
        search: 'Buscar enlaces, sitios o notas…', mode: 'Tarjetas / Lista', add: '＋ Enlace',
        kLinks: 'Total de Enlaces', kFolders: 'Colecciones', kFavs: 'Favoritos', kDomains: 'Sitios Únicos',
        all: 'Todos los enlaces', favs: 'Favoritos', collections: 'colecciones',
        locked: 'Bóveda protegida — ingresa tu VAULT_TOKEN arriba.',
        promptUrl: 'Dirección (URL) del enlace:', promptTitle: 'Título del enlace:'
      }
    };

    const detectLang = () => {
      const nav = (navigator.language || 'pt').toLowerCase();
      if (nav.startsWith('es')) return 'es';
      if (nav.startsWith('en')) return 'en';
      return 'pt';
    };
    let lang = localStorage.getItem('vault_lang') || detectLang();

    function applyLang() {
      const d = DICT[lang] || DICT.pt;
      qEl.placeholder = d.search;
      document.getElementById('btn-mode').textContent = d.mode;
      document.getElementById('btn-add').textContent = d.add;
      document.getElementById('lbl-k-links').textContent = d.kLinks;
      document.getElementById('lbl-k-folders').textContent = d.kFolders;
      document.getElementById('lbl-k-favs').textContent = d.kFavs;
      document.getElementById('lbl-k-domains').textContent = d.kDomains;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    }

    document.querySelectorAll('.lang-btn').forEach(b => {
      b.onclick = () => {
        lang = b.dataset.lang;
        localStorage.setItem('vault_lang', lang);
        applyLang();
        render();
      };
    });
    applyLang();

    const savedColor = localStorage.getItem('vault_color') || 'green';
    document.documentElement.setAttribute('data-color', savedColor);
    document.querySelectorAll('.color-dot').forEach(b => {
      b.classList.toggle('active', b.dataset.color === savedColor);
      b.onclick = () => {
        document.documentElement.setAttribute('data-color', b.dataset.color);
        localStorage.setItem('vault_color', b.dataset.color);
        document.querySelectorAll('.color-dot').forEach(x => x.classList.toggle('active', x === b));
      };
    });

    document.getElementById('btn-mode').onclick = () => {
      isCards = !isCards;
      document.getElementById('list').classList.toggle('cards', isCards);
    };

    document.getElementById('btn-add').onclick = async () => {
      const d = DICT[lang] || DICT.pt;
      const url = prompt(d.promptUrl, 'https://');
      if (!url || url === 'https://') return;
      const title = prompt(d.promptTitle, url) || url;
      vault.links = [{ id: 'l_' + Date.now(), url, title, addedAt: Date.now(), folderId: (activeFolder && activeFolder !== '__fav__') ? activeFolder : null }].concat(vault.links || []);
      const headers = { 'Content-Type': 'application/json', ...(tokenEl.value ? { 'Authorization': 'Bearer ' + tokenEl.value } : {}) };
      await fetch('/api/vault', { method: 'POST', headers, body: JSON.stringify(vault) });
      render();
    };

    tokenEl.value = localStorage.getItem('vault_token') || '';
    tokenEl.addEventListener('change', () => {
      localStorage.setItem('vault_token', tokenEl.value);
      load();
    });
    qEl.addEventListener('input', render);

    function hostOf(u) {
      try { return new URL(u).hostname.replace(/^www\\./, ''); } catch { return ''; }
    }

    async function load() {
      const d = DICT[lang] || DICT.pt;
      const headers = tokenEl.value ? { 'Authorization': 'Bearer ' + tokenEl.value } : {};
      const res = await fetch('/api/vault', { headers });
      if (!res.ok) {
        document.getElementById('stats').textContent = d.locked;
        return;
      }
      vault = await res.json();
      render();
    }

    function render() {
      const d = DICT[lang] || DICT.pt;
      const links = vault.links || [];
      const folders = vault.folders || [];
      const domains = new Set(links.map(l => hostOf(l.url)).filter(Boolean));
      document.getElementById('stats').textContent = links.length + ' links · ' + folders.length + ' ' + d.collections;
      document.getElementById('k-links').textContent = links.length;
      document.getElementById('k-folders').textContent = folders.length;
      document.getElementById('k-favs').textContent = links.filter(l => l.favorite).length;
      document.getElementById('k-domains').textContent = domains.size;

      const fWrap = document.getElementById('folders');
      fWrap.innerHTML = '';
      const addF = (id, name, count) => {
        const b = document.createElement('button');
        b.className = 'folder-btn' + (activeFolder === id ? ' active' : '');
        b.innerHTML = '<span>' + name + '</span><span>' + count + '</span>';
        b.onclick = () => { activeFolder = id; document.getElementById('view-title').textContent = name; render(); };
        fWrap.appendChild(b);
      };
      addF(null, d.all, links.length);
      addF('__fav__', d.favs, links.filter(l => l.favorite).length);
      for (const f of folders) {
        addF(f.id, f.name, links.filter(l => l.folderId === f.id).length);
      }
      if (!activeFolder) document.getElementById('view-title').textContent = d.all;
      else if (activeFolder === '__fav__') document.getElementById('view-title').textContent = d.favs;

      const q = qEl.value.trim().toLowerCase();
      const filtered = links.filter(l => {
        if (activeFolder === '__fav__' && !l.favorite) return false;
        if (activeFolder && activeFolder !== '__fav__' && l.folderId !== activeFolder) return false;
        if (q && !(l.title + ' ' + l.url + ' ' + (l.notes || '')).toLowerCase().includes(q)) return false;
        return true;
      });

      document.getElementById('view-count').textContent = filtered.length + ' links';
      const ul = document.getElementById('list');
      ul.innerHTML = '';
      for (const l of filtered) {
        const li = document.createElement('li');
        li.className = 'link-row';
        const fav = document.createElement('div');
        fav.className = 'fav';
        const h = hostOf(l.url);
        if (h) {
          const img = document.createElement('img');
          img.src = l.favIconUrl || ('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=64');
          img.onerror = () => { fav.textContent = (h[0] || '?').toUpperCase(); };
          fav.appendChild(img);
        } else {
          fav.textContent = '?';
        }
        const info = document.createElement('div');
        info.className = 'link-info';
        const a = document.createElement('a');
        a.href = l.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = (l.favorite ? '★ ' : '') + (l.title || l.url);
        const meta = document.createElement('span');
        meta.className = 'meta';
        meta.textContent = h + (l.notes ? ' · ' + l.notes : '');
        info.appendChild(a);
        info.appendChild(meta);
        li.appendChild(fav);
        li.appendChild(info);
        ul.appendChild(li);
      }
    }
    load();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'onetab-lite-vault', version: '3.0.0' });
  }

  if (url.pathname === '/api/vault') {
    if (!isAuthorized(req)) {
      return sendJson(res, 401, { ok: false, error: 'Não autorizado. Verifique seu VAULT_TOKEN.' });
    }
    if (req.method === 'GET') {
      return sendJson(res, 200, readVault());
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
        if (body.length > 15 * 1024 * 1024) req.destroy();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const saved = writeVault(parsed);
          return sendJson(res, 200, { ok: true, updatedAt: saved.updatedAt, links: saved.links.length });
        } catch (err) {
          return sendJson(res, 400, { ok: false, error: 'JSON inválido.' });
        }
      });
      return;
    }
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(WEB_UI_HTML);
  }

  sendJson(res, 404, { ok: false, error: 'Rota não encontrada.' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('[OneTab Lite Vault] Servidor rodando em http://localhost:' + PORT);
  });
}

module.exports = { server };
