/* OneTab Lite — service worker (Manifest V3)
   Arquivos clássicos (não módulos) para máxima compatibilidade:
   o background usa importScripts(), as páginas usam <script> normal.
   Premissa: 100% local, sem telemetria, sem conexões de terceiros. */

importScripts('storage.js');

/* Chaves vindas de storage.js (importScripts compartilha o escopo global).
   Repetidas aqui de propósito, para o worker não depender da ordem de carga. */
var LINKS_KEY = 'links';
var FOLDERS_KEY = 'folders';

/* ================= captura ================= */

async function collectTabs() {
  const settings = await getSettings();
  const win = await chrome.windows.getCurrent();
  const all = await chrome.tabs.query({ windowId: win.id });

  const kept = [];
  const seen = new Set();
  let skipped = 0;

  for (const tab of all) {
    if (!isCapturable(tab)) { skipped++; continue; }
    if (settings.keepPinned && tab.pinned) { skipped++; continue; }

    const url = tab.url || tab.pendingUrl;
    if (settings.dedupe) {
      const key = normalizeUrl(url);
      if (seen.has(key)) { skipped++; continue; }
      seen.add(key);
    }

    kept.push({ url, title: tab.title || url, favIconUrl: tab.favIconUrl || '' });
  }

  return { kept, skipped };
}

/** Grava os links ANTES de fechar qualquer aba. */
async function captureAndClose(folderId) {
  const { kept, skipped } = await collectTabs();
  if (!kept.length) {
    return { ok: false, reason: 'Nenhuma aba capturável nesta janela.', saved: 0, closed: 0, skipped };
  }

  const now = Date.now();
  const capturedAt = now;
  const added = await addLinks(kept.map(function (l) {
    return { url: l.url, title: l.title, favIconUrl: l.favIconUrl, capturedAt: capturedAt };
  }), folderId);

  const savedUrls = new Set(added.map(function (l) { return l.url; }));
  const all = await chrome.tabs.query({});
  const toClose = all.filter(function (t) { return savedUrls.has(t.url) && isCapturable(t); });

  let closed = 0;
  for (const tab of toClose) {
    try { await chrome.tabs.remove(tab.id); closed++; } catch { /* já fechada */ }
  }

  await openList();
  return { ok: true, linkIds: added.map(function (l) { return l.id; }),
    saved: added.length, closed: closed, skipped: skipped, folderId: folderId || null };
}

/** Salva sem fechar nada. */
async function captureOnly(folderId) {
  const { kept, skipped } = await collectTabs();
  if (!kept.length) return { ok: false, reason: 'Nenhuma aba capturável nesta janela.', saved: 0, skipped };
  const added = await addLinks(kept, folderId);
  return { ok: true, linkIds: added.map(function (l) { return l.id; }),
    saved: added.length, skipped: skipped, folderId: folderId || null };
}

/** Salva apenas a aba ativa da janela atual (opcionalmente fechando-a). */
async function captureActiveTab(folderId, closeAfter) {
  const win = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id, active: true });
  const tab = tabs && tabs[0];
  if (!tab || !isCapturable(tab)) {
    return { ok: false, reason: 'A aba atual é uma página interna do navegador e não pode ser capturada.', saved: 0 };
  }
  const url = tab.url || tab.pendingUrl;
  const added = await addLinks([{
    url: url,
    title: tab.title || url,
    favIconUrl: tab.favIconUrl || '',
    capturedAt: Date.now()
  }], folderId);

  let closed = 0;
  if (closeAfter && tab.id != null) {
    try { await chrome.tabs.remove(tab.id); closed = 1; } catch { /* ignorado */ }
  }
  return {
    ok: true,
    linkIds: added.map(function (l) { return l.id; }),
    saved: added.length,
    closed: closed,
    folderId: folderId || null
  };
}

/** Desfaz uma captura: reabre as abas e remove os links que ela criou. */
async function undoCapture(linkIds) {
  const links = await getLinks();
  const set = new Set(linkIds || []);
  const target = links.filter(function (l) { return set.has(l.id); });
  if (!target.length) return { ok: false, reason: 'Nada para desfazer.', reopened: 0 };

  let reopened = 0;
  for (const link of target) {
    try { await chrome.tabs.create({ url: link.url, active: false }); reopened++; } catch { /* ignorado */ }
  }
  await deleteLinks(linkIds);
  return { ok: true, reopened: reopened };
}

/** RoughTab: captura e deixa apenas a lista aberta. */
async function roughTab(folderId) {
  return captureAndClose(folderId);
}

/* ================= restauração ================= */

async function openUrls(urls) {
  const settings = await getSettings();
  let opened = 0;

  if (!urls.length) return 0;

  if (settings.restoreInNewWindow) {
    try {
      await chrome.windows.create({ url: urls, focused: true });
      return urls.length;
    } catch {
      /* cai para o modo aba a aba */
    }
  }
  for (const url of urls) {
    try { await chrome.tabs.create({ url: url, active: false }); opened++; } catch { /* URL inválida */ }
  }
  return opened;
}

async function restoreLinks(ids) {
  const links = await getLinks();
  const set = new Set(ids || []);
  const urls = links.filter(function (l) { return set.has(l.id); }).map(function (l) { return l.url; });
  if (!urls.length) return { ok: false, reason: 'Nenhum link selecionado.', opened: 0 };
  const opened = await openUrls(urls);
  return { ok: true, opened: opened };
}

async function restoreFolder(folderId) {
  const links = await getLinks();
  const urls = links
    .filter(function (l) { return (l.folderId || null) === (folderId || null); })
    .map(function (l) { return l.url; });
  if (!urls.length) return { ok: false, reason: 'Esta pasta está vazia.', opened: 0 };
  const opened = await openUrls(urls);
  return { ok: true, opened: opened };
}

async function restoreLink(url) {
  try {
    await chrome.tabs.create({ url: url, active: false });
    return { ok: true };
  } catch {
    return { ok: false, reason: 'URL inválida.' };
  }
}

/** Emergência: restaura as abas fechadas recentemente pelo próprio Chrome. */
async function restoreClosedFromBrowser() {
  const recently = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
  const tabs = recently.filter(function (s) { return s.tab; });
  if (!tabs.length) {
    return { ok: false, reason: 'O Chrome não tem abas fechadas recentemente.', opened: 0 };
  }
  let opened = 0;
  for (const s of tabs) {
    try { await chrome.sessions.restore(s.tab.sessionId); opened++; } catch { /* ignorado */ }
  }
  return { ok: true, opened: opened };
}

async function openList() {
  const url = chrome.runtime.getURL('tab.html');
  const existing = await chrome.tabs.query({ url: url });
  if (existing.length) await chrome.tabs.update(existing[0].id, { active: true });
  else await chrome.tabs.create({ url: url });
}

/* ================= badge ================= */

async function updateBadge() {
  const links = await getLinks();
  const count = links.length;
  await chrome.action.setBadgeBackgroundColor({ color: '#2f6f4f' });
  await chrome.action.setBadgeText({ text: count ? String(count) : '' });
}

/* ================= listeners ================= */

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await setSettings({});
    await migrate();
    await updateBadge();
  } catch (err) {
    console.error('[OneTab Lite] onInstalled falhou:', err);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try { await updateBadge(); } catch (err) { console.error('[OneTab Lite] onStartup falhou:', err); }
});

chrome.commands.onCommand.addListener(async (command) => {
  try {
    if (command === 'capture-tabs') await captureAndClose(null);
  } catch (err) {
    console.error('[OneTab Lite] atalho "' + command + '" falhou:', err);
  }
});

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === 'local' && (changes[LINKS_KEY] || changes[FOLDERS_KEY])) {
    updateBadge().catch(function (err) { console.error('[OneTab Lite] updateBadge falhou:', err); });
  }
});

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
  (async function () {
    switch (msg && msg.type) {
      case 'capture': return captureAndClose(msg.folderId);
      case 'capture-only': return captureOnly(msg.folderId);
      case 'capture-active': return captureActiveTab(msg.folderId, !!msg.closeAfter);
      case 'rough-tab': return roughTab(msg.folderId);
      case 'undo-capture': return undoCapture(msg.linkIds);
      case 'restore-folder': return restoreFolder(msg.folderId);
      case 'restore-links': return restoreLinks(msg.ids);
      case 'restore-link': return restoreLink(msg.url);
      case 'restore-closed': return restoreClosedFromBrowser();
      case 'open-list': await openList(); return { ok: true };
      case 'update-badge': await updateBadge(); return { ok: true };
      case 'ping': return { ok: true, pong: 'v' + chrome.runtime.getManifest().version };
      case 'debug-info': {
        const links = await getLinks();
        const folders = await getFolders();
        return { ok: true, links: links.length, folders: folders.length,
          foldersList: folders.map(function (f) { return f.name; }) };
      }
      default: return { ok: false, reason: 'Mensagem desconhecida: ' + (msg && msg.type) };
    }
  })()
    .then(sendResponse)
    .catch(function (err) {
      console.error('[OneTab Lite] falha ao tratar "' + (msg && msg.type) + '":', err);
      sendResponse({ ok: false, reason: String((err && err.message) || err) });
    });

  return true; // resposta assíncrona
});
