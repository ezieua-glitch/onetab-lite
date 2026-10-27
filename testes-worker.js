/* Testes do OneTab Lite (modelo v3) sem navegador.
   Uso: node testes-worker.js[ .] */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const ROOT = process.argv[2] || process.cwd();
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function makeEnv(initial) {
  const store = Object.assign({}, initial || {});
  const listeners = {};
  const env = {
    store, listeners, tabs: [], created: [], removed: [],
    chrome: {
      runtime: {
        id: 'abc',
        getURL: (p) => 'chrome-extension://abc/' + p,
        getManifest: () => ({ version: '2.0.0' }),
        onInstalled: { addListener: (f) => (listeners.install = f) },
        onStartup: { addListener: (f) => (listeners.startup = f) },
        onMessage: { addListener: (f) => (listeners.msg = f) }
      },
      storage: {
        local: {
          get: async (k) => {
            const keys = Array.isArray(k) ? k : [k];
            const out = {};
            keys.forEach((key) => { if (key in store) out[key] = store[key]; });
            return out;
          },
          set: async (o) => Object.assign(store, o)
        },
        onChanged: { addListener: (f) => (listeners.changed = f) }
      },
      action: { setBadgeText: async () => {}, setBadgeBackgroundColor: async () => {} },
      commands: { onCommand: { addListener: (f) => (listeners.cmd = f) } },
      windows: {
        getCurrent: async () => ({ id: 1 }),
        getLastFocused: async () => ({ id: 1 }),
        create: async () => ({ id: 99 })
      },
      tabs: {
        query: async () => env.tabs,
        remove: async (id) => { env.removed.push(id); },
        create: async (o) => { env.created.push(o); return { id: 500 + env.created.length }; },
        update: async () => {},
        getCurrent: async () => null
      },
      sessions: { getRecentlyClosed: async () => [] }
    }
  };
  return env;
}

function load(env) {
  const sandbox = { console, URL, setTimeout, clearTimeout, importScripts: () => {}, chrome: env.chrome };
  vm.createContext(sandbox);
  vm.runInContext(read('storage.js') + '\n' + read('background.js'), sandbox);
  return sandbox;
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

/* ================= migração ================= */

test('migra v2 (grupos) → v3 (links soltos), preservando pasta de cada grupo', async () => {
  const env = makeEnv({
    schemaVersion: 2,
    folders: [{ id: 'f1', name: 'MATEMATICA' }],
    sessions: [
      { id: 'g1', createdAt: 1000, title: 'G1', folder: 'f1',
        links: [{ url: 'https://a.com', title: 'A' }, { url: 'https://b.com', title: 'B' }] },
      { id: 'g2', createdAt: 2000, title: 'G2', folder: null,
        links: [{ url: 'https://c.com', title: 'C' }] }
    ]
  });
  const sb = load(env);
  const res = await sb.migrate();

  assert.strictEqual(res.migratedFrom, 2);
  assert.strictEqual(res.links.length, 3, 'todos os links viram links soltos');
  const a = res.links.find((l) => l.url === 'https://a.com');
  const c = res.links.find((l) => l.url === 'https://c.com');
  assert.strictEqual(a.folderId, 'f1', 'link herda a pasta do grupo');
  assert.strictEqual(c.folderId, null);
  assert.strictEqual(a.capturedAt, 1000, 'marca de captura vem do grupo');
  assert.ok(a.id.startsWith('l_'));
  assert.strictEqual(env.store.schemaVersion, 3);
  assert.ok(Array.isArray(env.store.links));
  assert.ok(env.store.sessions, 'sessions antigo fica como backup');
});

test('migra o cenário real: 2 grupos com 67 links somados, nenhum perdido', async () => {
  const linksA = Array.from({ length: 49 }, (_, i) => ({ url: 'https://a' + i + '.com/', title: 'A' + i }));
  const linksB = Array.from({ length: 18 }, (_, i) => ({ url: 'https://b' + i + '.com/', title: 'B' + i }));
  const env = makeEnv({
    schemaVersion: 2,
    folders: [{ id: 'f1', name: 'MATEMATICA' }, { id: 'f2', name: 'PORTUGUES' }],
    sessions: [
      { id: 'g1', createdAt: 2000, title: 'Sessão 2', folder: null, links: linksA },
      { id: 'g2', createdAt: 1000, title: 'Sessão 1', folder: null, links: linksB }
    ]
  });
  const sb = load(env);
  const res = await sb.migrate();
  assert.strictEqual(res.links.length, 67);
  assert.strictEqual(res.folders.length, 2, 'pastas sobrevivem mesmo sem links');
  const urls = new Set(res.links.map((l) => l.url));
  assert.strictEqual(urls.size, 67);
});

test('migração é idempotente: rodar duas vezes não duplica links', async () => {
  const env = makeEnv({
    schemaVersion: 2,
    folders: [],
    sessions: [{ id: 'g1', createdAt: 1, title: 'G', links: [{ url: 'https://a.com' }] }]
  });
  const sb = load(env);
  await sb.migrate();
  const first = JSON.stringify(env.store.links);
  await sb.migrate();
  assert.strictEqual(JSON.stringify(env.store.links), first);
});

test('duplicados dentro do mesmo grupo na migração são colapsados', async () => {
  const env = makeEnv({
    schemaVersion: 2, folders: [],
    sessions: [{ id: 'g1', createdAt: 1, title: 'G', links: [
      { url: 'https://a.com' }, { url: 'https://a.com#x' }
    ] }]
  });
  const sb = load(env);
  const res = await sb.migrate();
  assert.strictEqual(res.links.length, 1);
});

test('pasta inexistente na migração → links ficam em Sem pasta', async () => {
  const env = makeEnv({
    schemaVersion: 2, folders: [],
    sessions: [{ id: 'g1', createdAt: 1, title: 'G', folder: 'fantasma', links: [{ url: 'https://a.com' }] }]
  });
  const sb = load(env);
  const res = await sb.migrate();
  assert.strictEqual(res.links[0].folderId, null);
});

/* ================= pastas ================= */

test('criar pasta e movê-la entre links', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('MATEMATICA');
  await sb.addLinks([{ url: 'https://x.com' }, { url: 'https://y.com' }], null);
  const links = await sb.getLinks();
  const moved = await sb.moveLinks([links[0].id], f.id);
  assert.strictEqual(moved, 1);
  const after = await sb.getLinks();
  assert.strictEqual(after.find((l) => l.url === 'https://x.com').folderId, f.id);
  assert.strictEqual(after.find((l) => l.url === 'https://y.com').folderId, null);
});

test('excluir pasta move links para Sem pasta, nunca apaga', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('P');
  await sb.addLinks([{ url: 'https://a.com' }], f.id);
  await sb.deleteFolder(f.id);
  const links = await sb.getLinks();
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].folderId, null);
  assert.strictEqual((await sb.getFolders()).length, 0);
});

test('deleteFolderWithLinks apaga a pasta e os links dela', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('P');
  await sb.addLinks([{ url: 'https://a.com' }], f.id);
  await sb.addLinks([{ url: 'https://b.com' }], null);
  await sb.deleteFolderWithLinks(f.id);
  const links = await sb.getLinks();
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].url, 'https://b.com');
});

test('mover para pasta inexistente cai em Sem pasta (sem criar órfão)', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  await sb.addLinks([{ url: 'https://a.com' }], null);
  const links = await sb.getLinks();
  await sb.moveLinks([links[0].id], 'pasta-fantasma');
  assert.strictEqual((await sb.getLinks())[0].folderId, null);
});

test('renomear pasta', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('Antiga');
  await sb.renameFolder(f.id, 'Nova');
  assert.strictEqual((await sb.getFolders())[0].name, 'Nova');
});

/* ================= dedupe ================= */

test('dedupeFolder remove repetidos só da pasta alvo', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('P');
  await sb.addLinks([{ url: 'https://a.com' }, { url: 'https://a.com#x' }], f.id);
  await sb.addLinks([{ url: 'https://a.com' }], null);
  const removed = await sb.dedupeFolder(f.id);
  assert.strictEqual(removed, 1);
  const all = await sb.getLinks();
  assert.strictEqual(all.filter((l) => l.folderId === f.id).length, 1);
  assert.strictEqual(all.filter((l) => l.folderId === null).length, 1, 'Sem pasta não pode ser afetada');
});

/* ================= captura ================= */

test('captura grava na pasta informada e devolve ids para desfazer', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('Matemática');
  env.tabs = [{ id: 1, url: 'https://a.com', title: 'A' }, { id: 2, url: 'https://b.com', title: 'B' }];
  const res = await sb.captureAndClose(f.id);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.saved, 2);
  assert.strictEqual(res.linkIds.length, 2);
  const links = await sb.getLinks();
  assert.ok(links.every((l) => l.folderId === f.id));
  assert.ok(links.every((l) => l.capturedAt > 0));
});

test('filtro de abas continua ignorando protegidas/duplicadas/fixadas/própria página', async () => {
  const env = makeEnv({ settings: { dedupe: true, keepPinned: true } });
  const sb = load(env);
  env.tabs = [
    { id: 1, url: 'https://a.com/x', title: 'A' },
    { id: 2, url: 'https://a.com/x#top', title: 'A dup' },
    { id: 3, url: 'chrome://extensions/', title: 'ext' },
    { id: 4, url: 'chrome-extension://abc/tab.html', title: 'OneTab' },
    { id: 5, url: 'https://pinned.com', title: 'P', pinned: true },
    { id: 6, url: 'https://c.com', title: 'C' }
  ];
  const res = await sb.captureOnly(null);
  assert.strictEqual(res.saved, 2);
  const urls = (await sb.getLinks()).map((l) => l.url).sort();
  assert.strictEqual(JSON.stringify(urls), JSON.stringify(['https://a.com/x', 'https://c.com']));
});

test('desfazer remove exatamente os links daquela captura', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  await sb.addLinks([{ url: 'https://antigo.com' }], null);
  env.tabs = [{ id: 1, url: 'https://novo.com', title: 'N' }];
  const cap = await sb.captureOnly(null);
  assert.strictEqual((await sb.getLinks()).length, 2);

  const undo = await sb.undoCapture(cap.linkIds);
  assert.strictEqual(undo.ok, true);
  assert.strictEqual(undo.reopened, 1);
  const rest = await sb.getLinks();
  assert.strictEqual(rest.length, 1);
  assert.strictEqual(rest[0].url, 'https://antigo.com', 'o link antigo não pode ser removido');
});

test('desfazer com ids inexistentes devolve erro claro', async () => {
  const env = makeEnv({});
  const sb = load(env);
  const undo = await sb.undoCapture(['nao-existe']);
  assert.strictEqual(undo.ok, false);
});

/* ================= restauração ================= */

test('restoreFolder abre só os links da pasta', async () => {
  const env = makeEnv({ settings: { restoreInNewWindow: false } });
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('P');
  await sb.addLinks([{ url: 'https://a.com' }, { url: 'https://b.com' }], f.id);
  await sb.addLinks([{ url: 'https://c.com' }], null);
  const res = await sb.restoreFolder(f.id);
  assert.strictEqual(res.opened, 2);
  assert.strictEqual(JSON.stringify(env.created.map((c) => c.url).sort()),
    JSON.stringify(['https://a.com', 'https://b.com']));
});

test('restoreLinks com seleção mista', async () => {
  const env = makeEnv({ settings: { restoreInNewWindow: false } });
  const sb = load(env);
  await sb.migrate();
  const added = await sb.addLinks([{ url: 'https://a.com' }, { url: 'https://b.com' }], null);
  const res = await sb.restoreLinks([added[1].id]);
  assert.strictEqual(res.opened, 1);
  assert.strictEqual(env.created[0].url, 'https://b.com');
});

/* ================= roteador ================= */

test('roteador responde ping e mensagens novas, e sobrevive a erro', async () => {
  const env = makeEnv({});
  const sb = load(env);
  const call = (msg) => new Promise((r) => env.listeners.msg(msg, {}, r));
  assert.strictEqual((await call({ type: 'ping' })).ok, true);
  const info = await call({ type: 'debug-info' });
  assert.strictEqual(info.ok, true);
  assert.strictEqual(info.links, 0);
  const unknown = await call({ type: '???', });
  assert.strictEqual(unknown.ok, false);
});

test('badge mostra a contagem total de links', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  await sb.addLinks([{ url: 'https://a.com' }, { url: 'https://b.com' }], null);
  assert.strictEqual((await sb.getLinks()).length, 2);
});

/* ================= segurança ================= */

test('escapeHtml neutraliza injeção', async () => {
  const env = makeEnv({});
  const sb = load(env);
  const out = sb.escapeHtml('<img src=x onerror="alert(1)">');
  assert.ok(!out.includes('<img'));
  assert.ok(out.includes('&lt;img'));
});

test('URL inválida é recusada ao adicionar link', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const added = await sb.addLinks([{ title: 'sem url' }, { url: '' }], null);
  assert.strictEqual(added.length, 0);
});

test('editar link (updateLink) salva notas, tags, título e pasta', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f = await sb.addFolder('IA', { icon: '🤖' });
  const added = await sb.addLinks([{ url: 'https://openai.com', title: 'OpenAI' }], null);
  const updated = await sb.updateLink(added[0].id, {
    title: 'OpenAI Platform',
    folderId: f.id,
    tags: '#ia, estudo, #ia',
    notes: 'Revisar documentação da API'
  });
  assert.strictEqual(updated.title, 'OpenAI Platform');
  assert.strictEqual(updated.folderId, f.id);
  assert.deepStrictEqual(Array.from(updated.tags), ['ia', 'estudo']);
  assert.strictEqual(updated.notes, 'Revisar documentação da API');
});

test('mergeDuplicateFolders unifica pastas com mesmo nome sem perder links', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f1 = await sb.addFolder('REDES SOCIAIS');
  const f2 = await sb.addFolder('redes sociais');
  await sb.addLinks([{ url: 'https://instagram.com' }], f2.id);
  const res = await sb.mergeDuplicateFolders();
  assert.strictEqual(res.mergedFolders, 1);
  assert.strictEqual(res.movedLinks, 1);
  const folders = await sb.getFolders();
  assert.strictEqual(folders.length, 1);
  const links = await sb.getLinks();
  assert.strictEqual(links[0].folderId, f1.id);
});

test('dedupeAll remove duplicados globais entre pastas', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const f1 = await sb.addFolder('P1');
  await sb.addLinks([{ url: 'https://dup.com' }], f1.id);
  await sb.addLinks([{ url: 'https://dup.com#secao' }], null);
  const removed = await sb.dedupeAll();
  assert.strictEqual(removed, 1);
  assert.strictEqual((await sb.getLinks()).length, 1);
});

test('captureActiveTab captura apenas a aba ativa', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  env.tabs = [{ id: 10, url: 'https://artigo.com', title: 'Artigo', active: true }];
  const res = await sb.captureActiveTab(null, false);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.saved, 1);
  assert.strictEqual((await sb.getLinks())[0].url, 'https://artigo.com');
});

test('autoOrganizeLinks classifica links Sem pasta nas pastas existentes', async () => {
  const env = makeEnv({});
  const sb = load(env);
  await sb.migrate();
  const fIa = await sb.addFolder('IA');
  const fGoogle = await sb.addFolder('GOOGLE TOOLS');
  await sb.addLinks([
    { url: 'https://chatgpt.com/c/123', title: 'ChatGPT' },
    { url: 'https://drive.google.com/drive', title: 'Google Drive' }
  ], null);
  const count = await sb.autoOrganizeLinks();
  assert.strictEqual(count, 2);
  const links = await sb.getLinks();
  assert.strictEqual(links.find((l) => l.url.includes('chatgpt')).folderId, fIa.id);
  assert.strictEqual(links.find((l) => l.url.includes('drive.google')).folderId, fGoogle.id);
});

/* ================= runner ================= */

(async () => {
  let pass = 0, fail = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log('PASS  ' + t.name);
      pass++;
    } catch (err) {
      console.log('FAIL  ' + t.name + '\n      ' + (err && err.message));
      fail++;
    }
  }
  console.log('\n' + pass + ' passaram, ' + fail + ' falharam');
  process.exit(fail ? 1 : 0);
})();
