/* OneTab Lite — lógica do popup.
   Regra: NUNCA falhar em silêncio. Todo passo mostra estado na tela. */

const $ = (id) => document.getElementById(id);
let currentLang = 'pt';

function applyPopupLanguage(lang) {
  currentLang = lang || 'pt';
  document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : currentLang;
  document.querySelectorAll('.pop-lang').forEach((b) => {
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });

  const setTxt = (id, key) => {
    const el = $(id);
    if (el) el.textContent = t(key, currentLang);
  };
  setTxt('lbl-save-in', 'popupSaveIn');
  setTxt('lbl-capture', 'popupCaptureClose');
  setTxt('lbl-capture-only', 'popupSaveOnly');
  setTxt('lbl-capture-only-sub', 'popupSaveOnlySub');
  setTxt('lbl-capture-active', 'popupSaveActive');
  setTxt('lbl-capture-active-sub', 'popupSaveActiveSub');
  setTxt('lbl-rough-tab', 'popupRoughTab');
  setTxt('lbl-rough-tab-sub', 'popupRoughTabSub');
  setTxt('lbl-open-list', 'popupOpenPanel');
  setTxt('lbl-open-list-sub', 'popupOpenPanelSub');
  setTxt('restore-closed', 'popupClosedTabs');
  setTxt('diag', 'popupDiag');
  setTxt('status', 'popupReady');
}

function setStatus(msg, kind) {
  const el = $('status');
  if (!el) return;
  el.className = 'status' + (kind ? ' ' + kind : '');
  el.textContent = msg;
}

function selectedFolderId() {
  const sel = $('target-folder');
  return sel && sel.value ? sel.value : null;
}

function updateCaptureSub() {
  const sel = $('target-folder');
  const sub = $('capture-sub');
  if (!sel || !sub) return;
  const opt = sel.options[sel.selectedIndex];
  const name = opt && sel.value ? opt.textContent : t('unfolderedTitle', currentLang);
  sub.textContent = t('popupCaptureSub', currentLang) + ' "' + name + '"';
}

async function run(label, fn) {
  document.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  setStatus(label + '…', 'info');
  try {
    return await fn();
  } catch (err) {
    setStatus('ERRO: ' + (err && (err.message || err)), 'error');
    console.error(err);
    return null;
  } finally {
    document.querySelectorAll('button').forEach((b) => { b.disabled = false; });
  }
}

async function readCount() {
  const links = await getLinks();
  const folders = await getFolders();
  $('count').textContent = links.length + (links.length === 1 ? ' link' : ' links');
  $('folders').textContent = folders.length + ' ' + t('subCollections', currentLang);

  const sel = $('target-folder');
  if (sel) {
    const prev = sel.value;
    sel.replaceChildren();
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = t('unfolderedTitle', currentLang);
    sel.appendChild(opt0);
    for (const f of folders) {
      const o = document.createElement('option');
      o.value = f.id;
      o.textContent = (f.icon ? f.icon + ' ' : '') + f.name;
      sel.appendChild(o);
    }
    if (prev && folders.some((f) => f.id === prev)) {
      sel.value = prev;
    }
    updateCaptureSub();
  }
  return links.length;
}

const targetSelect = $('target-folder');
if (targetSelect) {
  targetSelect.addEventListener('change', updateCaptureSub);
}

/* ---------- ações ---------- */

$('capture').addEventListener('click', () =>
  run('Capturando', async () => {
    const res = await send('capture', { folderId: selectedFolderId() });
    if (!res || !res.ok) {
      setStatus('FALHOU: ' + ((res && res.reason) || 'sem resposta do service worker.'), 'error');
      return;
    }
    setStatus(res.saved + (res.saved === 1 ? ' link salvo' : ' links salvos') + ', ' + res.closed + ' fechadas.', 'info');
    await readCount();
    setTimeout(() => window.close(), 900);
  })
);

$('capture-only').addEventListener('click', () =>
  run('Salvando', async () => {
    const res = await send('capture-only', { folderId: selectedFolderId() });
    if (!res || !res.ok) {
      setStatus('FALHOU: ' + ((res && res.reason) || 'sem resposta do service worker.'), 'error');
      return;
    }
    setStatus(res.saved + (res.saved === 1 ? ' link salvo' : ' links salvos') + ' (sem fechar).', 'info');
    await readCount();
  })
);

const btnCaptureActive = $('capture-active');
if (btnCaptureActive) {
  btnCaptureActive.addEventListener('click', () =>
    run('Salvando aba atual', async () => {
      const res = await send('capture-active', { folderId: selectedFolderId(), closeAfter: false });
      if (!res || !res.ok) {
        setStatus('FALHOU: ' + ((res && res.reason) || 'aba não capturável.'), 'warn');
        return;
      }
      setStatus('Aba atual salva com sucesso!', 'info');
      await readCount();
    })
  );
}

$('rough-tab').addEventListener('click', () =>
  run('Recolhendo', async () => {
    const res = await send('rough-tab', { folderId: selectedFolderId() });
    if (!res || !res.ok) {
      setStatus('FALHOU: ' + ((res && res.reason) || 'sem resposta do service worker.'), 'error');
      return;
    }
    setStatus(res.saved + (res.saved === 1 ? ' link recolhido' : ' links recolhidos') + '.', 'info');
    await readCount();
    setTimeout(() => window.close(), 900);
  })
);

$('open-list').addEventListener('click', () =>
  run('Abrindo lista', async () => {
    await chrome.tabs.create({ url: chrome.runtime.getURL('tab.html') });
    window.close();
  })
);

$('restore-closed').addEventListener('click', () =>
  run('Restaurando', async () => {
    const res = await send('restore-closed');
    if (!res || !res.ok) {
      setStatus((res && res.reason) || 'Nada para restaurar.', 'warn');
      return;
    }
    setStatus(res.opened + ' abas restauradas.', 'info');
  })
);

/* ---------- diagnóstico ---------- */

async function diagnose() {
  const lines = [];

  lines.push('ID da extensão: ' + chrome.runtime.id);

  const perms = await chrome.permissions.getAll();
  lines.push((perms.permissions.includes('tabs') ? '✔ ' : '✘ ') +
    'permissões: ' + (perms.permissions || []).join(', '));

  try {
    const links = await getLinks();
    const folders = await getFolders();
    const favs = links.filter((l) => l.favorite).length;
    lines.push('✔ storage.local — ' + links.length + ' links, ' + folders.length +
      ' pastas, ' + favs + ' favoritos');
    const orfas = links.filter((l) => l.folderId && !folders.some((f) => f.id === l.folderId)).length;
    if (orfas) lines.push('✘ ' + orfas + ' links apontam para pastas inexistentes');
  } catch (e) {
    lines.push('✘ storage.local: ' + (e.message || e));
  }

  try {
    const tabs = await chrome.tabs.query({});
    const capturable = tabs.filter((t) => isCapturable(t));
    lines.push((capturable.length > 0 ? '✔ ' : '✘ ') +
      'abas visíveis: ' + tabs.length + ' (capturáveis: ' + capturable.length + ')');
  } catch (e) {
    lines.push('✘ chrome.tabs.query: ' + (e.message || e));
  }

  let swOk = false;
  try {
    const res = await send('ping');
    swOk = !!(res && res.ok);
    lines.push((swOk ? '✔ ' : '✘ ') + 'service worker: ' +
      (swOk ? 'respondendo (' + res.pong + ')' : 'SEM RESPOSTA — ' + ((res && res.reason) || '?')));
  } catch (e) {
    lines.push('✘ service worker: ' + (e.message || e));
  }

  return lines.join('\n') + (swOk ? '' : '\n\nO service worker não respondeu: capturar/restaurar não vai funcionar.');
}

$('diag').addEventListener('click', () =>
  run('Verificando', async () => {
    const text = await diagnose();
    const el = $('status');
    el.className = 'status ' + (text.includes('✘') ? 'error' : 'info');
    el.textContent = '';
    const pre = document.createElement('pre');
    pre.className = 'diag';
    pre.textContent = text;
    el.appendChild(pre);
  })
);

/* ---------- init ---------- */

document.querySelectorAll('.pop-lang').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const lang = btn.dataset.lang || 'pt';
    await setSettings({ lang });
    applyPopupLanguage(lang);
    await readCount();
  });
});

(async function init() {
  try {
    const s = await getSettings();
    if (s && s.colorTheme) {
      document.documentElement.setAttribute('data-color', s.colorTheme);
    }
    applyPopupLanguage((s && s.lang) || 'pt');
    await readCount();
    const res = await send('ping');
    if (!res || !res.ok) {
      setStatus('Atenção: o service worker não respondeu. Clique em "Diagnóstico".', 'warn');
    }
  } catch (err) {
    setStatus('ERRO ao iniciar: ' + (err.message || err), 'error');
  }
})();
