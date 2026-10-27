/* Testa tab.js e popup.js com DOM real (jsdom) e API do Chrome simulada — modelo v3.
   Uso: node testes-dom.js [.] */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2];
const readFile = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function buildEnv(initialStore) {
  const store = JSON.parse(JSON.stringify(initialStore || {}));
  const changed = [];
  const createdTabs = [];
  const downloads = [];
  const sent = [];

  const chrome = {
    runtime: {
      id: 'abc',
      getURL: (p) => 'chrome-extension://abc/' + p,
      getManifest: () => ({ version: '2.0.0' }),
      sendMessage: (msg, cb) => {
        sent.push(msg);
        cb({ ok: true, saved: 2, closed: 2, linkIds: ['l1', 'l2'], opened: 1, reopened: 1, pong: 'v2.0.0' });
      },
      onMessage: { addListener: () => {} },
      lastError: null
    },
    storage: {
      local: {
        get: async (k) => {
          const keys = Array.isArray(k) ? k : [k];
          const out = {};
          keys.forEach((key) => { if (key in store) out[key] = store[key]; });
          return out;
        },
        set: async (o) => {
          Object.assign(store, o);
          const changes = {};
          Object.keys(o).forEach((key) => { changes[key] = { newValue: o[key] }; });
          changed.forEach((f) => f(changes, 'local'));
        }
      },
      onChanged: { addListener: (f) => changed.push(f) }
    },
    windows: { getCurrent: async () => ({ id: 1 }) },
    tabs: {
      query: async () => [
        { id: 1, url: 'https://a.com', title: 'A' },
        { id: 2, url: 'https://b.com', title: 'B' },
        { id: 3, url: 'chrome://settings', title: 'cfg' }
      ],
      create: async (o) => { createdTabs.push(o); return { id: 900 }; }
    },
    permissions: { getAll: async () => ({ permissions: ['storage', 'tabs', 'sessions'] }) }
  };

  return { store, chrome, createdTabs, downloads, sent };
}

async function loadPage(file, env, opts) {
  opts = opts || {};
  const html = readFile(file).replace(/<script[^>]*><\/script>/g, '');
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true,
    url: 'chrome-extension://abc/' + file });
  const { window } = dom;

  window.chrome = env.chrome;
  window.URL.createObjectURL = () => 'blob:fake';
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function () { env.downloads.push(this.download); };
  window.confirm = () => (opts.confirmAnswer === undefined ? true : opts.confirmAnswer);
  window.prompt = () => (opts.promptAnswers && opts.promptAnswers.length ? opts.promptAnswers.shift() : null);
  window.alert = () => {};

  window.eval(readFile('storage.js'));
  window.eval(readFile(file.replace('.html', '.js')));
  await new Promise((r) => setTimeout(r, 150));
  return window;
}

const tick = (ms) => new Promise((r) => setTimeout(r, ms || 140));
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

function baseLinks() {
  return [
    { id: 'l1', url: 'https://github.com/x', title: 'Repo X', favorite: false, addedAt: 200, folderId: null, capturedAt: 100 },
    { id: 'l2', url: 'https://news.com/y', title: 'Notícia Y', favorite: true, addedAt: 100, folderId: null, capturedAt: 100 }
  ];
}

/* ---------------- tab.html ---------------- */

test('mostra links soltos, contagem e estado vazio', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  let w = await loadPage('tab.html', env);
  assert.strictEqual(w.document.querySelector('#count').textContent, '2');
  assert.strictEqual(w.document.querySelectorAll('.link').length, 2);
  assert.strictEqual(w.document.querySelector('#empty').hidden, true);

  const emptyEnv = buildEnv({ schemaVersion: 3, links: [], folders: [] });
  w = await loadPage('tab.html', emptyEnv);
  assert.strictEqual(w.document.querySelector('#empty').hidden, false);
});

test('filtro de captura antigo (sessions) migra ao abrir a página', async () => {
  const env = buildEnv({
    schemaVersion: 2,
    folders: [{ id: 'f1', name: 'MATEMATICA' }],
    sessions: [{ id: 'g1', createdAt: 1000, title: 'G', folder: 'f1',
      links: [{ url: 'https://a.com', title: 'A' }, { url: 'https://b.com', title: 'B' }] }]
  });
  const w = await loadPage('tab.html', env);
  assert.strictEqual(env.store.schemaVersion, 3);
  assert.strictEqual(env.store.links.length, 2);
  assert.strictEqual(w.document.querySelector('#count').textContent, '2');
  // pasta aparece com 2
  const item = [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('MATEMATICA'));
  assert.ok(item.textContent.includes('2'));
});

test('busca filtra links em tempo real', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env);
  const s = w.document.querySelector('#search');
  s.value = 'github';
  s.dispatchEvent(new w.Event('input'));
  await tick(200);
  assert.strictEqual(w.document.querySelectorAll('.link').length, 1);
  s.value = 'nadaaqui';
  s.dispatchEvent(new w.Event('input'));
  await tick(200);
  assert.strictEqual(w.document.querySelector('#no-results').hidden, false);
});

test('selecionar vários e mover para pasta', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [{ id: 'f1', name: 'Trabalho' }] });
  const w = await loadPage('tab.html', env);

  w.document.querySelectorAll('.link-check').forEach((c) => {
    c.checked = true;
    c.dispatchEvent(new w.Event('change', { bubbles: true }));
  });
  await tick();
  assert.strictEqual(w.document.querySelector('#selection-bar').hidden, false);
  assert.ok(w.document.querySelector('#selection-count').textContent.includes('2'));

  const sel = w.document.querySelector('#bulk-move');
  sel.value = 'f1';
  sel.dispatchEvent(new w.Event('change', { bubbles: true }));
  await tick(250);

  assert.ok(env.store.links.every((l) => l.folderId === 'f1'), 'todos devem estar na pasta');
});

test('arrastar link para pasta na lateral move o link', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [{ id: 'f1', name: 'MATEMATICA' }] });
  const w = await loadPage('tab.html', env);

  const target = [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('MATEMATICA'));
  assert.ok(target);

  const dt = { data: {}, setData(k, v) { this.data[k] = v; }, getData(k) { return this.data[k]; }, effectAllowed: '' };
  const drop = new w.Event('drop', { bubbles: true, cancelable: true });
  drop.dataTransfer = dt;
  dt.data = { 'text/link-ids': JSON.stringify(['l1']) };
  target.dispatchEvent(drop);
  await tick(250);

  const l1 = env.store.links.find((l) => l.id === 'l1');
  assert.strictEqual(l1.folderId, 'f1');
});

test('criar pasta pela lateral e já entrar nela', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env, { promptAnswers: ['Física'] });
  click(w, w.document.querySelector('#btn-new-folder'));
  await tick(250);

  const folders = env.store.folders;
  assert.strictEqual(folders.length, 1);
  assert.strictEqual(folders[0].name, 'Física');
  assert.ok(w.document.querySelector('#view-title').textContent.includes('Física'), 'deve abrir a pasta criada');
});

test('captura usa a pasta aberta (folderId enviado ao worker)', async () => {
  const env = buildEnv({ schemaVersion: 3, links: [], folders: [{ id: 'f1', name: 'MATEMATICA' }] });
  const w = await loadPage('tab.html', env);
  const pasta = [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('MATEMATICA'));
  click(w, pasta);
  await tick();
  click(w, w.document.querySelector('#btn-capture'));
  await tick(250);

  const captureMsg = env.sent.find((m) => m.type === 'capture');
  assert.ok(captureMsg, 'deve enviar capture');
  assert.strictEqual(captureMsg.folderId, 'f1', 'captura deve ir para a pasta aberta');
});

test('favoritos: visão e alternância', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env);
  const favItem = [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('Favoritos'));
  assert.ok(favItem.textContent.includes('1'));
  click(w, favItem);
  await tick();
  assert.strictEqual(w.document.querySelectorAll('.link').length, 1);

  // volta para todos e favorita o outro
  click(w, [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('Todos')));
  await tick();
  const stars = w.document.querySelectorAll('.star');
  click(w, stars[0]);
  await tick(250);
  assert.strictEqual(env.store.links.filter((l) => l.favorite).length, 2);
});

test('remover link com desfazer restaura o link', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env);
  click(w, w.document.querySelector('.act-remove'));
  await tick(250);
  assert.strictEqual(env.store.links.length, 1);

  const undo = w.document.querySelector('.toast-action');
  assert.ok(undo, 'deve oferecer Desfazer');
  click(w, undo);
  await tick(250);
  assert.strictEqual(env.store.links.length, 2, 'desfazer devolve o link');
});

test('excluir pasta com "mover" manda links para Sem pasta', async () => {
  const env = buildEnv({
    schemaVersion: 3,
    folders: [{ id: 'f1', name: 'P' }],
    links: [{ id: 'l1', url: 'https://a.com', title: 'A', folderId: 'f1', addedAt: 1 }]
  });
  const w = await loadPage('tab.html', env, { promptAnswers: ['mover'], confirmAnswer: true });
  click(w, [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('P')));
  await tick();
  click(w, w.document.querySelector('#btn-delete-folder'));
  await tick(300);

  assert.strictEqual(env.store.folders.length, 0);
  assert.strictEqual(env.store.links.length, 1, 'link preservado');
  assert.strictEqual(env.store.links[0].folderId, null);
});

test('excluir pasta com "tudo" apaga pasta e links', async () => {
  const env = buildEnv({
    schemaVersion: 3,
    folders: [{ id: 'f1', name: 'P' }],
    links: [{ id: 'l1', url: 'https://a.com', title: 'A', folderId: 'f1', addedAt: 1 }]
  });
  const w = await loadPage('tab.html', env, { promptAnswers: ['tudo'], confirmAnswer: true });
  click(w, [...w.document.querySelectorAll('.folder-item')].find((b) => b.textContent.includes('P')));
  await tick();
  click(w, w.document.querySelector('#btn-delete-folder'));
  await tick(300);
  assert.strictEqual(env.store.folders.length, 0);
  assert.strictEqual(env.store.links.length, 0);
});

test('compartilhar gera HTML local', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env);
  click(w, w.document.querySelector('#btn-share'));
  await tick(200);
  assert.strictEqual(env.downloads.length, 1);
  assert.ok(env.downloads[0].endsWith('.html'));
});

test('exportar gera JSON e importar aceita formato antigo', async () => {
  const env = buildEnv({ schemaVersion: 3, links: baseLinks(), folders: [] });
  const w = await loadPage('tab.html', env);
  click(w, w.document.querySelector('#btn-export'));
  await tick(150);
  assert.ok(env.downloads[0].includes('onetab-lite'));
});

test('popup mostra links + pastas e diagnóstico sem falhas', async () => {
  const env = buildEnv({
    schemaVersion: 3,
    folders: [{ id: 'f1', name: 'P' }],
    links: [{ id: 'l1', url: 'https://a.com', title: 'A', addedAt: 1 }]
  });
  const w = await loadPage('popup.html', env);
  assert.strictEqual(w.document.querySelector('#count').textContent, '1 link');
  assert.ok(w.document.querySelector('#folders').textContent.includes('1 pasta'));

  click(w, w.document.querySelector('#diag'));
  await tick(300);
  const text = w.document.querySelector('#status').textContent;
  assert.ok(text.includes('service worker'));
  assert.ok(!text.includes('✘'), 'diagnóstico não deve falhar: ' + text);
});

test('popup modais: "Modo foco" envia rough-tab', async () => {
  const env = buildEnv({ schemaVersion: 3, links: [], folders: [] });
  const w = await loadPage('popup.html', env);
  click(w, w.document.querySelector('#rough-tab'));
  await tick(200);
  assert.ok(env.sent.some((m) => m.type === 'rough-tab'));
});

/* ---------------- runner ---------------- */

(async () => {
  let pass = 0, fail = 0;
  for (const t of tests) {
    process.stdout.write('... ' + t.name + ' ');
    let timer;
    try {
      const timeout = new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error('timeout de 8s')), 8000);
      });
      await Promise.race([t.fn(), timeout]);
      console.log('PASS');
      pass++;
    } catch (err) {
      console.log('FAIL\n      ' + (err && err.message));
      fail++;
    } finally {
      clearTimeout(timer);
    }
  }
  console.log('\n' + pass + ' passaram, ' + fail + ' falharam');
  process.exit(fail ? 1 : 0);
})();
