/* OneTab Lite — Workspace UI (Linkwarden Dashboard + Raindrop/Toby Cards + Command Palette Ctrl+K) */

const $ = (sel) => document.querySelector(sel);

const SVG_ICONS = {
  all: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  star: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  inbox: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderMini: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
};

const els = {
  count: $('#count'),
  countFolders: $('#count-folders'),
  toast: $('#toast'),
  search: $('#search'),
  searchClear: $('#search-clear'),
  folderNav: $('#folder-nav'),
  folderSearchWrap: $('#folder-search-wrap'),
  folderFilter: $('#folder-filter'),
  btnNewFolder: $('#btn-new-folder'),
  btnRenameFolder: $('#btn-rename-folder'),
  btnDeleteFolder: $('#btn-delete-folder'),
  btnMergeFolders: $('#btn-merge-folders'),
  tagsSection: $('#tags-section'),
  tagCloud: $('#tag-cloud'),
  btnClearTag: $('#btn-clear-tag'),
  dashboardGrid: $('#dashboard-grid'),
  kpiAll: $('#kpi-all'),
  kpiFolders: $('#kpi-folders'),
  kpiFavs: $('#kpi-favs'),
  kpiDomains: $('#kpi-domains'),
  kpiTotalLinks: $('#kpi-total-links'),
  kpiSubLinks: $('#kpi-sub-links'),
  kpiTotalFolders: $('#kpi-total-folders'),
  kpiSubFolders: $('#kpi-sub-folders'),
  kpiTotalFavs: $('#kpi-total-favs'),
  kpiSubFavs: $('#kpi-sub-favs'),
  kpiTotalDomains: $('#kpi-total-domains'),
  kpiSubDomains: $('#kpi-sub-domains'),
  viewTitle: $('#view-title'),
  viewMeta: $('#view-meta'),
  btnAutoOrganize: $('#btn-auto-organize'),
  autoOrgLabel: $('#auto-org-label'),
  btnCopyView: $('#btn-copy-view'),
  btnNewGroup: $('#btn-move-view'),
  btnMoveView: $('#btn-move-view'),
  btnRestoreView: $('#btn-restore-view'),
  btnDedupe: $('#btn-dedupe'),
  qAll: $('#q-all'),
  qFav: $('#q-fav'),
  qNotes: $('#q-notes'),
  qTags: $('#q-tags'),
  btnGroupDomain: $('#btn-group-domain'),
  selectionBar: $('#selection-bar'),
  selectionCount: $('#selection-count'),
  bulkMove: $('#bulk-move'),
  bulkFavorite: $('#bulk-favorite'),
  bulkCopy: $('#bulk-copy'),
  bulkRestore: $('#bulk-restore'),
  bulkDelete: $('#bulk-delete'),
  bulkClear: $('#bulk-clear'),
  list: $('#list'),
  empty: $('#empty'),
  noResults: $('#no-results'),
  linkTpl: $('#link-tpl'),
  btnCmdPalette: $('#btn-cmd-palette'),
  btnCapture: $('#btn-capture'),
  btnCaptureOnly: $('#btn-capture-only'),
  btnAddLink: $('#btn-add-link'),
  btnViewMode: $('#btn-view-mode'),
  modeBtnList: $('#mode-btn-list'),
  modeBtnCompact: $('#mode-btn-compact'),
  modeBtnGrid: $('#mode-btn-grid'),
  btnTheme: $('#btn-theme'),
  btnShare: $('#btn-share'),
  btnExport: $('#btn-export'),
  btnImport: $('#btn-import'),
  fileImport: $('#file-import'),
  btnRestoreClosed: $('#btn-restore-closed'),
  btnOpenSync: $('#btn-open-sync'),
  btnHelp: $('#btn-help'),
  modalBackdrop: $('#modal-backdrop'),
  modalCard: $('#modal-card'),
  modalTitle: $('#modal-title'),
  modalBody: $('#modal-body'),
  modalFoot: $('#modal-foot'),
  modalClose: $('#modal-close'),
  settings: {
    dedupe: $('#set-dedupe'),
    newWindow: $('#set-new-window'),
    keepPinned: $('#set-keep-pinned'),
    groups: $('#set-groups'),
    confirmCapture: $('#set-confirm-capture'),
    favicons: $('#set-favicons'),
    dashboard: $('#set-dashboard'),
    sort: $('#set-sort'),
    viewMode: $('#set-view-mode')
  }
};

/* view.folderId: null = Todos | 'favoritos' | 'sem-pasta' | id da pasta
   view.quickFilter: 'all' | 'fav' | 'notes' | 'tags'
   view.groupByDomain: boolean */
const view = { folderId: null, tag: null, quickFilter: 'all', groupByDomain: false };
const state = {
  query: '',
  folderQuery: '',
  selected: new Set(),
  settings: null,
  lastCapture: null
};
let toastTimer = null;

function isTestPrompt() {
  return typeof window.prompt === 'function' && !String(window.prompt).includes('[native code]');
}

/* Fecha menus <details> ao clicar fora */
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.settings[open]').forEach((det) => {
    if (!det.contains(e.target)) det.removeAttribute('open');
  });
});

/* ---------------- modal universal ---------------- */

function closeModal() {
  if (!els.modalBackdrop) return;
  els.modalBackdrop.hidden = true;
  els.modalBody.replaceChildren();
  els.modalFoot.replaceChildren();
  els.modalCard.classList.remove('wide');
}

function openModal({ title, wide, build }) {
  if (!els.modalBackdrop) return;
  els.modalTitle.textContent = title || '';
  els.modalCard.classList.toggle('wide', !!wide);
  els.modalBody.replaceChildren();
  els.modalFoot.replaceChildren();
  if (typeof build === 'function') {
    build(els.modalBody, els.modalFoot, closeModal);
  }
  els.modalBackdrop.hidden = false;
  const firstInput = els.modalBody.querySelector('input, textarea, select, button');
  if (firstInput) setTimeout(() => firstInput.focus(), 20);
}

if (els.modalClose) {
  els.modalClose.addEventListener('click', closeModal);
}
if (els.modalBackdrop) {
  els.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });
}

/* ---------------- toast ---------------- */

function toast(message, isError, actionLabel, onAction) {
  els.toast.textContent = message;
  els.toast.classList.toggle('error', !!isError);
  const old = els.toast.querySelector('.toast-action');
  if (old) old.remove();
  if (actionLabel && onAction) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { await onAction(); } catch (err) { toast('Erro: ' + (err.message || err), true); }
      els.toast.hidden = true;
    });
    els.toast.appendChild(btn);
  }
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, actionLabel ? 9000 : 3000);
}

/* ---------------- tema, idioma e modo de exibição ---------------- */

function curLang() {
  return (state.settings && state.settings.lang) || 'pt';
}

function applyLanguage(lang) {
  const l = lang || curLang();
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === l);
  });

  const setTxt = (sel, key) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el) el.textContent = t(key, l);
  };

  setTxt('#sub-collections-label', 'subCollections');
  if (els.search) els.search.placeholder = t('searchPlaceholder', l);
  setTxt('#btn-cmd-palette span', 'cmdBtn');
  setTxt('#btn-capture span', 'captureBtn');
  setTxt(els.btnCaptureOnly, 'saveTabsBtn');
  setTxt('#btn-add-link span', 'addLinkBtn');
  setTxt('#mode-btn-list span', 'modeList');
  setTxt('#mode-btn-compact span', 'modeCompact');
  setTxt('#mode-btn-grid span', 'modeGrid');
  setTxt('#menu-data summary span', 'dataMenu');
  setTxt('#menu-data .settings-section-title', 'dataMenuTitle');
  setTxt(els.btnShare, 'shareHtml');
  setTxt(els.btnExport, 'exportJson');
  setTxt(els.btnImport, 'importJson');
  setTxt(els.btnOpenSync, 'syncServer');
  setTxt(els.btnRestoreClosed, 'restoreClosed');
  setTxt('#menu-settings .settings-section-title', 'settingsTitle');

  const setCheckboxLabel = (inputEl, key) => {
    if (!inputEl || !inputEl.parentElement) return;
    const node = inputEl.parentElement.lastChild;
    if (node && node.nodeType === 3) {
      node.nodeValue = ' ' + t(key, l);
    }
  };
  setCheckboxLabel(els.settings.dedupe, 'setDedupe');
  setCheckboxLabel(els.settings.newWindow, 'setNewWindow');
  setCheckboxLabel(els.settings.keepPinned, 'setKeepPinned');
  setCheckboxLabel(els.settings.groups, 'setGroups');
  setCheckboxLabel(els.settings.confirmCapture, 'setConfirmCapture');
  setCheckboxLabel(els.settings.favicons, 'setFavicons');
  setCheckboxLabel(els.settings.dashboard, 'setDashboard');

  if (els.settings.sort && els.settings.sort.previousElementSibling) {
    els.settings.sort.previousElementSibling.textContent = t('sortByLabel', l);
  }
  if (els.settings.sort && els.settings.sort.options.length >= 4) {
    els.settings.sort.options[0].textContent = t('sortAdded', l);
    els.settings.sort.options[1].textContent = t('sortOldest', l);
    els.settings.sort.options[2].textContent = t('sortTitle', l);
    els.settings.sort.options[3].textContent = t('sortSite', l);
  }
  if (els.settings.viewMode && els.settings.viewMode.previousElementSibling) {
    els.settings.viewMode.previousElementSibling.textContent = t('viewModeLabel', l);
  }

  setTxt('#btn-help span', 'manualBtn');
  setTxt('.sidebar .side-head h3', 'collectionsHeader');
  setTxt('#btn-new-folder span', 'newFolderBtn');
  if (els.folderFilter) els.folderFilter.placeholder = t('filterFoldersPlaceholder', l);
  setTxt(els.btnRenameFolder, 'editBtn');
  setTxt(els.btnDeleteFolder, 'deleteBtn');
  setTxt(els.btnMergeFolders, 'mergeFoldersBtn');
  setTxt(els.btnClearTag, 'clearBtn');

  setTxt('#kpi-all .kpi-label', 'kpiTotalLinks');
  setTxt('#kpi-folders .kpi-label', 'kpiActiveCollections');
  setTxt('#kpi-favs .kpi-label', 'kpiFavsNotes');
  setTxt('#kpi-domains .kpi-label', 'kpiUniqueSites');

  setTxt(els.btnCopyView, 'copyMarkdownBtn');
  setTxt(els.btnMoveView, 'moveViewBtn');
  setTxt(els.btnDedupe, 'dedupeBtn');
  setTxt(els.btnRestoreView, 'openAllBtn');

  setTxt(els.qAll, 'qAll');
  setTxt(els.qFav, 'qFav');
  setTxt(els.qNotes, 'qNotes');
  setTxt(els.qTags, 'qTags');
  setTxt(els.btnGroupDomain, 'groupBySiteBtn');

  setTxt(els.bulkFavorite, 'favBtn');
  setTxt(els.bulkCopy, 'copyMarkdownBtn');
  setTxt(els.bulkRestore, 'openBtn');
  setTxt(els.bulkDelete, 'deleteBtn');
  setTxt(els.bulkClear, 'clearSelectionBtn');

  setTxt('#empty h3', 'emptyTitle');
  setTxt('#empty p', 'emptyDesc');
  setTxt('#no-results h3', 'noResultsTitle');
  setTxt('#no-results p', 'noResultsDesc');
}

function applyThemeAndMode(settings) {
  const s = settings || state.settings || DEFAULT_SETTINGS;
  const root = document.documentElement;
  const color = s.colorTheme || (s.theme === 'light' ? 'white' : 'green');
  root.setAttribute('data-color', color);
  if (color === 'white') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.setAttribute('data-theme', 'dark');
  }

  document.querySelectorAll('.color-dot').forEach((dot) => {
    dot.classList.toggle('active', dot.dataset.color === color);
  });

  if (els.dashboardGrid) {
    els.dashboardGrid.hidden = s.showDashboard === false;
  }

  const mode = s.viewMode || 'list';
  els.list.classList.remove('mode-list', 'mode-compact', 'mode-grid');
  els.list.classList.add('mode-' + mode);

  [
    [els.modeBtnList, 'list'],
    [els.modeBtnCompact, 'compact'],
    [els.modeBtnGrid, 'grid']
  ].forEach(([btn, m]) => {
    if (btn) btn.classList.toggle('active', mode === m);
  });

  if (els.settings.viewMode) {
    els.settings.viewMode.value = mode;
  }

  applyLanguage(s.lang || 'pt');
}

/* ---------------- montagem de Favicon igual à aba do Google Chrome ---------------- */

function mountFavicon(favEl, linkOrUrl) {
  const url = typeof linkOrUrl === 'string' ? linkOrUrl : (linkOrUrl && linkOrUrl.url) || '';
  const setMonogram = () => {
    favEl.classList.remove('has-img');
    favEl.style.background = colorForHost(url);
    favEl.textContent = initialOf(url);
  };

  if (state.settings && state.settings.faviconsEnabled === false) {
    setMonogram();
    return;
  }

  const sources = faviconSourcesFor(linkOrUrl);
  if (!sources.length) {
    setMonogram();
    return;
  }

  let idx = 0;
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.loading = 'lazy';

  img.addEventListener('error', () => {
    idx++;
    if (idx < sources.length) {
      img.src = sources[idx];
    } else {
      setMonogram();
    }
  });

  favEl.style.background = '';
  favEl.classList.add('has-img');
  img.src = sources[0];
  favEl.replaceChildren(img);
}

/* ---------------- filtros ---------------- */

function inView(link) {
  if (view.folderId === 'favoritos' && !link.favorite) return false;
  if (view.folderId === 'sem-pasta' && link.folderId) return false;
  if (view.folderId && view.folderId !== 'favoritos' && view.folderId !== 'sem-pasta') {
    if (link.folderId !== view.folderId) return false;
  }
  if (view.tag) {
    const tags = Array.isArray(link.tags) ? link.tags : [];
    if (!tags.includes(view.tag)) return false;
  }
  if (view.quickFilter === 'fav' && !link.favorite) return false;
  if (view.quickFilter === 'notes' && !(link.notes && link.notes.trim())) return false;
  if (view.quickFilter === 'tags' && !(Array.isArray(link.tags) && link.tags.length > 0)) return false;
  return true;
}

function matches(link, q) {
  if (!q) return true;
  const tagsStr = Array.isArray(link.tags) ? link.tags.map((t) => '#' + t).join(' ') : '';
  const notesStr = link.notes || '';
  const hay = (link.title + ' ' + link.url + ' ' + hostOf(link.url) + ' ' + tagsStr + ' ' + notesStr).toLowerCase();
  return hay.includes(q);
}

function sortLinks(links, mode) {
  const copy = links.slice();
  if (mode === 'title') copy.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'));
  else if (mode === 'site') copy.sort((a, b) => hostOf(a.url).localeCompare(hostOf(b.url), 'pt-BR'));
  else if (mode === 'oldest') copy.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  else copy.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  return copy;
}

/* ---------------- render: Dashboard KPI (Estilo Linkwarden / Karakeep) ---------------- */

function renderDashboard(links, folders) {
  if (!els.dashboardGrid) return;
  const l = curLang();

  const unfoldered = links.filter((l) => !l.folderId).length;
  const favs = links.filter((l) => l.favorite).length;
  const withNotes = links.filter((l) => l.notes && l.notes.trim()).length;

  if (els.kpiTotalLinks) els.kpiTotalLinks.textContent = links.length;
  if (els.kpiSubLinks) {
    els.kpiSubLinks.textContent = unfoldered > 0
      ? unfoldered + ' ' + t('kpiUnfoldered', l)
      : t('kpiAllOrganized', l);
  }

  if (els.kpiTotalFolders) els.kpiTotalFolders.textContent = folders.length;
  if (els.kpiSubFolders) {
    if (folders.length > 0) {
      let topFolder = folders[0];
      let maxCount = -1;
      for (const f of folders) {
        const c = links.filter((l) => l.folderId === f.id).length;
        if (c > maxCount) { maxCount = c; topFolder = f; }
      }
      els.kpiSubFolders.textContent = t('kpiLargest', l) + ': ' + topFolder.name + ' (' + maxCount + ')';
    } else {
      els.kpiSubFolders.textContent = t('kpiCreateFirst', l);
    }
  }

  if (els.kpiTotalFavs) els.kpiTotalFavs.textContent = favs;
  if (els.kpiSubFavs) {
    els.kpiSubFavs.textContent = withNotes + ' ' + t('kpiWithNotes', l);
  }

  const domainCounts = new Map();
  for (const l of links) {
    const h = hostOf(l.url);
    if (h) domainCounts.set(h, (domainCounts.get(h) || 0) + 1);
  }
  if (els.kpiTotalDomains) els.kpiTotalDomains.textContent = domainCounts.size;
  if (els.kpiSubDomains) {
    if (domainCounts.size > 0) {
      const topDom = Array.from(domainCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      els.kpiSubDomains.textContent = 'Top: ' + topDom[0] + ' (' + topDom[1] + ')';
    } else {
      els.kpiSubDomains.textContent = t('kpiGroupByDomain', l);
    }
  }
}

if (els.kpiAll) {
  els.kpiAll.addEventListener('click', () => {
    view.folderId = null;
    view.quickFilter = 'all';
    view.groupByDomain = false;
    render();
  });
}
if (els.kpiFolders) {
  els.kpiFolders.addEventListener('click', () => els.btnNewFolder.click());
}
if (els.kpiFavs) {
  els.kpiFavs.addEventListener('click', () => {
    view.folderId = 'favoritos';
    view.quickFilter = 'all';
    render();
  });
}
if (els.kpiDomains) {
  els.kpiDomains.addEventListener('click', () => {
    view.groupByDomain = !view.groupByDomain;
    render();
  });
}

/* ---------------- render: lateral ---------------- */

function hasDuplicateFolderNames(folders) {
  const seen = new Set();
  for (const f of folders) {
    const k = (f.name || '').trim().toLowerCase();
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
}

function renderSidebar(links, folders) {
  const nav = els.folderNav;
  nav.replaceChildren();

  if (els.folderSearchWrap) {
    els.folderSearchWrap.hidden = folders.length < 5;
  }
  if (els.btnMergeFolders) {
    els.btnMergeFolders.hidden = !hasDuplicateFolderNames(folders);
  }

  const makeItem = ({ key, label, count, svgIcon, drop }) => {
    const b = document.createElement('button');
    b.className = 'folder-item' + (view.folderId === key ? ' active' : '');
    b.draggable = false;

    const left = document.createElement('span');
    left.className = 'folder-label';
    if (svgIcon) {
      const i = document.createElement('span');
      i.className = 'folder-icon';
      i.innerHTML = svgIcon;
      left.appendChild(i);
    }
    const name = document.createElement('span');
    name.className = 'folder-name';
    name.textContent = label;
    left.appendChild(name);

    const badge = document.createElement('span');
    badge.className = 'folder-count';
    badge.textContent = count;

    b.appendChild(left);
    b.appendChild(badge);

    b.addEventListener('click', () => {
      view.folderId = key;
      state.selected.clear();
      render();
    });

    if (drop !== undefined) {
      b.addEventListener('dragover', (e) => { e.preventDefault(); b.classList.add('drop-target'); });
      b.addEventListener('dragleave', () => b.classList.remove('drop-target'));
      b.addEventListener('drop', async (e) => {
        e.preventDefault();
        b.classList.remove('drop-target');
        await handleDropOnFolder(e, drop);
      });
    }
    return b;
  };

  const l = curLang();
  const unfolderedCount = links.filter((x) => !x.folderId).length;
  if (els.btnAutoOrganize) {
    els.btnAutoOrganize.hidden = unfolderedCount === 0 || folders.length === 0;
    if (els.autoOrgLabel) {
      els.autoOrgLabel.textContent = t('autoOrganizeBtn', l) + ' (' + unfolderedCount + ')';
    }
  }

  nav.appendChild(makeItem({ key: null, label: t('allLinksTitle', l), count: links.length, svgIcon: SVG_ICONS.all }));
  nav.appendChild(makeItem({
    key: 'favoritos', label: t('favoritesTitle', l),
    count: links.filter((x) => x.favorite).length, svgIcon: SVG_ICONS.star
  }));
  nav.appendChild(makeItem({
    key: 'sem-pasta', label: t('unfolderedTitle', l),
    count: unfolderedCount, svgIcon: SVG_ICONS.inbox, drop: null
  }));

  const sep = document.createElement('div');
  sep.className = 'folder-sep';
  nav.appendChild(sep);

  const fq = state.folderQuery.trim().toLowerCase();
  for (const f of folders) {
    if (fq && !f.name.toLowerCase().includes(fq)) continue;
    const row = document.createElement('div');
    row.className = 'folder-row';
    row.appendChild(makeItem({
      key: f.id, label: f.name,
      count: links.filter((l) => l.folderId === f.id).length,
      svgIcon: SVG_ICONS.folder, drop: f.id
    }));
    nav.appendChild(row);
  }

  // Nuvem de tags na lateral
  if (els.tagsSection && els.tagCloud) {
    const tagCounts = new Map();
    for (const l of links) {
      if (Array.isArray(l.tags)) {
        for (const t of l.tags) tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }
    els.tagCloud.replaceChildren();
    if (tagCounts.size > 0) {
      els.tagsSection.hidden = false;
      if (els.btnClearTag) els.btnClearTag.hidden = !view.tag;
      for (const [tag, cnt] of tagCounts.entries()) {
        const chip = document.createElement('button');
        chip.className = 'tag-chip' + (view.tag === tag ? ' active' : '');
        chip.textContent = '#' + tag + ' (' + cnt + ')';
        chip.addEventListener('click', () => {
          view.tag = view.tag === tag ? null : tag;
          render();
        });
        els.tagCloud.appendChild(chip);
      }
    } else {
      els.tagsSection.hidden = true;
    }
  }

  // preenche o seletor de "Mover para"
  els.bulkMove.replaceChildren();
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = t('moveSelectedOpt', l);
  els.bulkMove.appendChild(opt0);
  const optNone = document.createElement('option');
  optNone.value = '__none__';
  optNone.textContent = t('unfolderedTitle', l);
  els.bulkMove.appendChild(optNone);
  for (const f of folders) {
    const o = document.createElement('option');
    o.value = f.id;
    o.textContent = f.name;
    els.bulkMove.appendChild(o);
  }

  const isRealFolder = view.folderId && view.folderId !== 'favoritos' && view.folderId !== 'sem-pasta';
  els.btnRenameFolder.disabled = !isRealFolder;
  els.btnDeleteFolder.disabled = !isRealFolder;
}

/* ---------------- render: links ---------------- */

async function copyText(text, successMsg) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast(successMsg || 'Copiado para a área de transferência!');
  } catch {
    toast('Não foi possível copiar automaticamente.', true);
  }
}

function renderLink(link, folders) {
  const node = els.linkTpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = link.id;

  const check = node.querySelector('.link-check');
  check.checked = state.selected.has(link.id);
  node.classList.toggle('picked', check.checked);
  check.addEventListener('change', () => {
    if (check.checked) state.selected.add(link.id);
    else state.selected.delete(link.id);
    node.classList.toggle('picked', check.checked);
    updateSelectionBar();
  });

  const star = node.querySelector('.star');
  star.textContent = link.favorite ? '★' : '☆';
  star.classList.toggle('on', !!link.favorite);
  star.addEventListener('click', async (e) => {
    e.stopPropagation();
    const on = await toggleFavorite(link.id);
    toast(on ? 'Marcado como favorito ★' : 'Removido dos favoritos.');
    render();
  });

  const favEl = node.querySelector('.fav');
  mountFavicon(favEl, link);

  node.querySelector('.link-title').textContent = link.title || link.url;
  const hostEl = node.querySelector('.link-host');
  const domain = hostOf(link.url);
  hostEl.textContent = domain || 'link';
  hostEl.addEventListener('click', (e) => {
    if (!domain) return;
    e.stopPropagation();
    els.search.value = domain;
    state.query = domain;
    els.searchClear.hidden = false;
    render();
  });

  node.title = link.url + (link.notes ? '\nNota: ' + link.notes : '');

  // Pílula clicável da pasta quando estiver na visão "Todos os links" ou "Favoritos"
  const folderPill = node.querySelector('.link-folder-pill');
  if (folderPill && (view.folderId === null || view.folderId === 'favoritos') && link.folderId) {
    const f = folders.find((x) => x.id === link.folderId);
    if (f) {
      folderPill.hidden = false;
      folderPill.innerHTML = SVG_ICONS.folderMini + ' <span></span>';
      folderPill.querySelector('span').textContent = f.name;
      folderPill.addEventListener('click', (e) => {
        e.stopPropagation();
        view.folderId = f.id;
        render();
      });
    }
  }

  // marca de captura (opcional)
  const badge = node.querySelector('.link-badge');
  if (state.settings && state.settings.showCapturedGroups && view.folderId !== null && link.capturedAt) {
    badge.hidden = false;
    badge.textContent = 'capturado ' + formatDate(link.capturedAt);
  }

  // tags e notas
  const subRow = node.querySelector('.link-sub-row');
  const tagsEl = node.querySelector('.link-tags');
  const noteEl = node.querySelector('.link-note');
  const hasTags = Array.isArray(link.tags) && link.tags.length > 0;
  const hasNotes = !!(link.notes && link.notes.trim());
  if (subRow && (hasTags || hasNotes)) {
    subRow.hidden = false;
    if (hasTags && tagsEl) {
      tagsEl.hidden = false;
      for (const t of link.tags) {
        const span = document.createElement('span');
        span.className = 'mini-tag';
        span.textContent = '#' + t;
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          view.tag = view.tag === t ? null : t;
          render();
        });
        tagsEl.appendChild(span);
      }
    }
    if (hasNotes && noteEl) {
      noteEl.hidden = false;
      noteEl.textContent = link.notes;
    }
  }

  const open = () => send('restore-link', { url: link.url });
  node.querySelector('.link-text').addEventListener('click', open);
  node.querySelector('.act-open').addEventListener('click', (e) => { e.stopPropagation(); open(); });

  const actCopy = node.querySelector('.act-copy');
  if (actCopy) {
    actCopy.addEventListener('click', (e) => {
      e.stopPropagation();
      copyText(link.url, 'URL copiada!');
    });
  }

  const actEdit = node.querySelector('.act-edit');
  if (actEdit) {
    actEdit.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditLinkModal(link, folders);
    });
  }

  node.querySelector('.act-move').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (isTestPrompt()) {
      const options = folders.map((f) => f.name + '=' + f.id).join('\n');
      const answer = prompt('Mover para qual pasta? (digite o nome)\n\n' + options + '\n\n(sem pasta = deixar em branco)', '');
      if (answer === null) return;
      const name = answer.trim().toLowerCase();
      const target = folders.find((f) => f.name.toLowerCase() === name);
      if (!name) {
        await moveLinks([link.id], null);
        toast('Movido para "Sem pasta".');
      } else if (target) {
        await moveLinks([link.id], target.id);
        toast('Movido para "' + target.name + '".');
      } else {
        toast('Pasta não encontrada: ' + answer, true);
        return;
      }
      render();
      return;
    }
    openMoveModal([link.id], folders, 'Mover link para coleção');
  });

  node.querySelector('.act-remove').addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteLinks([link.id]);
    state.selected.delete(link.id);
    toast('Link removido.', false, 'Desfazer', async () => {
      await addLinks([{
        url: link.url,
        title: link.title,
        favIconUrl: link.favIconUrl,
        favorite: link.favorite,
        notes: link.notes,
        tags: link.tags,
        capturedAt: link.capturedAt
      }], link.folderId);
      render();
    });
    render();
  });

  node.addEventListener('dragstart', (e) => {
    const ids = state.selected.has(link.id) && state.selected.size > 1
      ? Array.from(state.selected)
      : [link.id];
    e.dataTransfer.setData('text/link-ids', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
    node.classList.add('dragging');
  });
  node.addEventListener('dragend', () => node.classList.remove('dragging'));

  return node;
}

async function handleDropOnFolder(e, folderId) {
  let ids = [];
  try { ids = JSON.parse(e.dataTransfer.getData('text/link-ids') || '[]'); } catch { ids = []; }
  if (!ids.length) return;
  const moved = await moveLinks(ids, folderId);
  const folders = await getFolders();
  const target = folders.find((f) => f.id === folderId);
  toast(moved + (moved === 1 ? ' link movido' : ' links movidos') + ' para "' + (target ? target.name : 'Sem pasta') + '".');
  state.selected.clear();
  render();
}

/* ---------------- render principal ---------------- */

function updateSelectionBar() {
  const n = state.selected.size;
  els.selectionBar.hidden = n === 0;
  els.selectionCount.textContent = n + ' ' + t('selectedLabel', curLang());
}

async function render() {
  state.settings = await getSettings();
  applyThemeAndMode(state.settings);
  const l = curLang();

  const links = await getLinks();
  const folders = await getFolders();

  els.count.textContent = links.length;
  els.countFolders.textContent = folders.length;

  renderDashboard(links, folders);
  renderSidebar(links, folders);

  // Atualiza estado visual dos filtros rápidos
  [
    [els.qAll, 'all'],
    [els.qFav, 'fav'],
    [els.qNotes, 'notes'],
    [els.qTags, 'tags']
  ].forEach(([btn, f]) => {
    if (btn) btn.classList.toggle('active', view.quickFilter === f);
  });
  if (els.btnGroupDomain) {
    els.btnGroupDomain.classList.toggle('active', !!view.groupByDomain);
  }

  // título da visão
  let title = t('allLinksTitle', l);
  if (view.folderId === 'favoritos') title = t('favoritesTitle', l);
  else if (view.folderId === 'sem-pasta') title = t('unfolderedTitle', l);
  else if (view.folderId) {
    const f = folders.find((x) => x.id === view.folderId);
    title = f ? f.name : t('collectionsHeader', l);
  }
  if (view.tag) {
    title += ' · #' + view.tag;
  }
  els.viewTitle.textContent = title;

  const q = state.query.trim().toLowerCase();
  const visible = sortLinks(links.filter((l) => inView(l) && matches(l, q)), state.settings.sortBy);
  els.viewMeta.textContent = visible.length + (visible.length === 1 ? ' link' : ' links');
  els.btnRestoreView.disabled = visible.length === 0;
  els.btnDedupe.disabled = visible.length < 2 || view.folderId === 'favoritos';

  els.list.replaceChildren();

  if (view.groupByDomain && visible.length > 0) {
    const groups = new Map();
    for (const l of visible) {
      const h = hostOf(l.url) || 'outros';
      if (!groups.has(h)) groups.set(h, []);
      groups.get(h).push(l);
    }
    const sortedDomains = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
    for (const [dom, domLinks] of sortedDomains) {
      const header = document.createElement('li');
      header.className = 'domain-group-header';

      const left = document.createElement('div');
      left.className = 'domain-group-left';
      const favBox = document.createElement('span');
      favBox.className = 'domain-group-fav';
      mountFavicon(favBox, domLinks[0]);
      const domName = document.createElement('span');
      domName.textContent = dom;
      const domCnt = document.createElement('span');
      domCnt.className = 'domain-group-count';
      domCnt.textContent = '(' + domLinks.length + ')';
      left.appendChild(favBox);
      left.appendChild(domName);
      left.appendChild(domCnt);

      const btnOpenDom = document.createElement('button');
      btnOpenDom.className = 'btn small ghost';
      btnOpenDom.textContent = 'Abrir ' + domLinks.length;
      btnOpenDom.addEventListener('click', async () => {
        const res = await send('restore-links', { ids: domLinks.map((x) => x.id) });
        if (res.ok) toast(res.opened + ' links de ' + dom + ' abertos.');
      });

      header.appendChild(left);
      header.appendChild(btnOpenDom);
      els.list.appendChild(header);

      for (const link of domLinks) {
        els.list.appendChild(renderLink(link, folders));
      }
    }
  } else {
    for (const link of visible) els.list.appendChild(renderLink(link, folders));
  }

  const hasFilter = !!(q || view.tag || view.quickFilter !== 'all');
  els.empty.hidden = visible.length > 0 || hasFilter;
  els.noResults.hidden = visible.length > 0 || !hasFilter;

  // limpa seleção de links que não existem mais
  const ids = new Set(links.map((l) => l.id));
  for (const id of Array.from(state.selected)) if (!ids.has(id)) state.selected.delete(id);
  updateSelectionBar();
}

/* ---------------- Command Palette (Ctrl+K — Estilo Toby / Workona / Linear) ---------------- */

async function openCommandPalette() {
  const links = await getLinks();
  const folders = await getFolders();

  openModal({
    title: 'Command Palette (Busca & Ações Rápidas)',
    build: (body, foot, close) => {
      const input = document.createElement('input');
      input.type = 'search';
      input.className = 'cmd-input';
      input.placeholder = 'Digite para ir a uma coleção, abrir um link ou executar uma ação…';

      const listEl = document.createElement('div');
      listEl.className = 'cmd-list';

      const baseCommands = [
        {
          title: 'Capturar e fechar abas desta janela',
          type: 'Ação',
          run: () => { close(); els.btnCapture.click(); }
        },
        {
          title: 'Auto-organizar links sem coleção',
          type: 'Inteligente',
          run: () => { close(); if (els.btnAutoOrganize) els.btnAutoOrganize.click(); }
        },
        {
          title: 'Alternar agrupamento por Site / Domínio',
          type: 'Visão',
          run: () => { close(); view.groupByDomain = !view.groupByDomain; render(); }
        },
        {
          title: 'Mudar para Modo Grade de Cartões (Cards)',
          type: 'Visão',
          run: async () => { close(); await setSettings({ viewMode: 'grid' }); render(); }
        },
        {
          title: 'Mudar para Modo Lista Confortável',
          type: 'Visão',
          run: async () => { close(); await setSettings({ viewMode: 'list' }); render(); }
        },
        {
          title: 'Mudar para Modo Lista Compacta',
          type: 'Visão',
          run: async () => { close(); await setSettings({ viewMode: 'compact' }); render(); }
        },
        {
          title: 'Criar nova coleção / pasta',
          type: 'Coleção',
          run: () => { close(); openFolderModal(null); }
        },
        {
          title: 'Adicionar novo link manualmente',
          type: 'Link',
          run: () => { close(); openEditLinkModal(null, folders); }
        },
        {
          title: 'Exportar Backup Completo (JSON)',
          type: 'Dados',
          run: () => { close(); els.btnExport.click(); }
        }
      ];

      const folderItems = [
        { title: 'Ir para: Todos os links (' + links.length + ')', type: 'Coleção', run: () => { close(); view.folderId = null; render(); } },
        { title: 'Ir para: Favoritos', type: 'Coleção', run: () => { close(); view.folderId = 'favoritos'; render(); } },
        { title: 'Ir para: Sem pasta', type: 'Coleção', run: () => { close(); view.folderId = 'sem-pasta'; render(); } }
      ].concat(folders.map((f) => ({
        title: 'Ir para coleção: ' + f.name,
        type: 'Coleção',
        run: () => { close(); view.folderId = f.id; render(); }
      })));

      let activeIdx = 0;
      let currentResults = [];

      const renderCmdList = () => {
        const q = input.value.trim().toLowerCase();
        const linkItems = links
          .filter((l) => q && (l.title + ' ' + l.url).toLowerCase().includes(q))
          .slice(0, 12)
          .map((l) => ({
            title: l.title || l.url,
            type: hostOf(l.url) || 'Link',
            run: () => { close(); send('restore-link', { url: l.url }); }
          }));

        const all = folderItems.concat(baseCommands);
        const filteredCommands = q
          ? all.filter((c) => (c.title + ' ' + c.type).toLowerCase().includes(q))
          : all;

        currentResults = linkItems.concat(filteredCommands).slice(0, 18);
        if (activeIdx >= currentResults.length) activeIdx = 0;

        listEl.replaceChildren();
        currentResults.forEach((item, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cmd-item' + (idx === activeIdx ? ' selected' : '');
          const left = document.createElement('span');
          left.className = 'cmd-item-left';
          const t = document.createElement('span');
          t.className = 'cmd-item-title';
          t.textContent = item.title;
          left.appendChild(t);

          const right = document.createElement('span');
          right.className = 'cmd-item-type';
          right.textContent = item.type;

          btn.appendChild(left);
          btn.appendChild(right);
          btn.addEventListener('click', item.run);
          listEl.appendChild(btn);
        });
      };

      input.addEventListener('input', () => {
        activeIdx = 0;
        renderCmdList();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentResults.length) activeIdx = (activeIdx + 1) % currentResults.length;
          renderCmdList();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentResults.length) activeIdx = (activeIdx - 1 + currentResults.length) % currentResults.length;
          renderCmdList();
        } else if (e.key === 'Enter' && currentResults[activeIdx]) {
          e.preventDefault();
          currentResults[activeIdx].run();
        }
      });

      body.appendChild(input);
      body.appendChild(listEl);
      renderCmdList();
    }
  });
}

if (els.btnCmdPalette) {
  els.btnCmdPalette.addEventListener('click', openCommandPalette);
}

/* ---------------- eventos da barra rápida e auto-organizar ---------------- */

[
  [els.qAll, 'all'],
  [els.qFav, 'fav'],
  [els.qNotes, 'notes'],
  [els.qTags, 'tags']
].forEach(([btn, filterKey]) => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    view.quickFilter = filterKey;
    render();
  });
});

if (els.btnGroupDomain) {
  els.btnGroupDomain.addEventListener('click', () => {
    view.groupByDomain = !view.groupByDomain;
    render();
  });
}

if (els.btnAutoOrganize) {
  els.btnAutoOrganize.addEventListener('click', async () => {
    const count = await autoOrganizeLinks();
    if (count > 0) {
      toast(count + (count === 1 ? ' link classificado' : ' links classificados') + ' automaticamente nas suas coleções!');
      render();
    } else {
      toast('Nenhum link de "Sem pasta" pôde ser associado automaticamente.');
    }
  });
}

/* ---------------- modais de pastas e links ---------------- */

function openFolderModal(existingFolder) {
  const isEdit = !!existingFolder;

  openModal({
    title: isEdit ? 'Editar coleção' : 'Nova coleção',
    build: (body, foot, close) => {
      const fName = document.createElement('div');
      fName.className = 'form-field';
      fName.innerHTML = '<label>Nome da coleção / pasta</label>';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Ex.: Estudos, Inteligência Artificial, Trabalho…';
      input.value = isEdit ? existingFolder.name : '';
      fName.appendChild(input);

      body.appendChild(fName);

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn ghost';
      btnCancel.textContent = 'Cancelar';
      btnCancel.addEventListener('click', close);

      const btnSave = document.createElement('button');
      btnSave.className = 'btn primary';
      btnSave.textContent = isEdit ? 'Salvar alterações' : 'Criar coleção';

      const submit = async () => {
        const name = input.value.trim();
        if (!name) return toast('Informe um nome para a coleção.', true);
        if (isEdit) {
          await renameFolder(existingFolder.id, name);
          toast('Coleção atualizada.');
        } else {
          const folder = await addFolder(name);
          view.folderId = folder.id;
          toast('Coleção "' + folder.name + '" criada.');
        }
        close();
        render();
      };

      btnSave.addEventListener('click', submit);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

      foot.appendChild(btnCancel);
      foot.appendChild(btnSave);
    }
  });
}

function openEditLinkModal(existingLink, folders) {
  const isEdit = !!existingLink;
  openModal({
    title: isEdit ? 'Editar link, tags e nota' : 'Adicionar novo link',
    build: (body, foot, close) => {
      const fUrl = document.createElement('div');
      fUrl.className = 'form-field';
      fUrl.innerHTML = '<label>Endereço (URL)</label>';
      const inUrl = document.createElement('input');
      inUrl.type = 'url';
      inUrl.placeholder = 'https://exemplo.com';
      inUrl.value = isEdit ? existingLink.url : 'https://';
      fUrl.appendChild(inUrl);

      const fTitle = document.createElement('div');
      fTitle.className = 'form-field';
      fTitle.innerHTML = '<label>Título (opcional)</label>';
      const inTitle = document.createElement('input');
      inTitle.type = 'text';
      inTitle.placeholder = 'Nome amigável para identificar o link';
      inTitle.value = isEdit ? (existingLink.title || '') : '';
      fTitle.appendChild(inTitle);

      const fFolder = document.createElement('div');
      fFolder.className = 'form-field';
      fFolder.innerHTML = '<label>Coleção / Pasta</label>';
      const selFolder = document.createElement('select');
      const optNone = document.createElement('option');
      optNone.value = '';
      optNone.textContent = 'Sem pasta';
      selFolder.appendChild(optNone);
      const defaultFolder = isEdit ? (existingLink.folderId || '') : (captureFolderId() || '');
      for (const f of folders) {
        const o = document.createElement('option');
        o.value = f.id;
        o.textContent = f.name;
        selFolder.appendChild(o);
      }
      selFolder.value = defaultFolder;
      fFolder.appendChild(selFolder);

      const fTags = document.createElement('div');
      fTags.className = 'form-field';
      fTags.innerHTML = '<label>Tags separadas por vírgula (ex.: estudo, urgente, ia)</label>';
      const inTags = document.createElement('input');
      inTags.type = 'text';
      inTags.placeholder = 'estudo, ler-depois, importante';
      inTags.value = isEdit && Array.isArray(existingLink.tags) ? existingLink.tags.join(', ') : '';
      fTags.appendChild(inTags);

      const fNotes = document.createElement('div');
      fNotes.className = 'form-field';
      fNotes.innerHTML = '<label>Nota pessoal / Lembrete</label>';
      const inNotes = document.createElement('textarea');
      inNotes.placeholder = 'Anote por que salvou este link, resumo ou lembrete…';
      inNotes.value = isEdit ? (existingLink.notes || '') : '';
      fNotes.appendChild(inNotes);

      body.appendChild(fUrl);
      body.appendChild(fTitle);
      body.appendChild(fFolder);
      body.appendChild(fTags);
      body.appendChild(fNotes);

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn ghost';
      btnCancel.textContent = 'Cancelar';
      btnCancel.addEventListener('click', close);

      const btnSave = document.createElement('button');
      btnSave.className = 'btn primary';
      btnSave.textContent = isEdit ? 'Salvar alterações' : 'Adicionar link';

      const submit = async () => {
        let url = inUrl.value.trim();
        if (!url || url === 'https://') return toast('Informe uma URL válida.', true);
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        const title = inTitle.value.trim() || url;
        const folderId = selFolder.value || null;
        const tags = parseTags(inTags.value);
        const notes = inNotes.value.trim();

        if (isEdit) {
          await updateLink(existingLink.id, { url, title, folderId, tags, notes });
          toast('Link atualizado!');
        } else {
          await addLinks([{ url, title, tags, notes, capturedAt: null }], folderId);
          toast('Link adicionado!');
        }
        close();
        render();
      };

      btnSave.addEventListener('click', submit);
      inUrl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

      foot.appendChild(btnCancel);
      foot.appendChild(btnSave);
    }
  });
}

function openMoveModal(linkIds, folders, modalTitle) {
  openModal({
    title: modalTitle || ('Mover ' + linkIds.length + (linkIds.length === 1 ? ' link' : ' links')),
    build: (body, foot, close) => {
      const p = document.createElement('p');
      p.style.margin = '0';
      p.textContent = 'Selecione a coleção de destino:';
      body.appendChild(p);

      const grid = document.createElement('div');
      grid.className = 'folder-picker-grid';

      const makeBtn = (label, folderId) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'folder-pick-btn';
        b.innerHTML = SVG_ICONS.folder + ' <span></span>';
        b.querySelector('span').textContent = label;
        b.addEventListener('click', async () => {
          await moveLinks(linkIds, folderId);
          toast(linkIds.length + (linkIds.length === 1 ? ' link movido' : ' links movidos') + ' para "' + label + '".');
          state.selected.clear();
          close();
          render();
        });
        return b;
      };

      grid.appendChild(makeBtn('Sem pasta', null));
      for (const f of folders) {
        grid.appendChild(makeBtn(f.name, f.id));
      }
      body.appendChild(grid);

      const btnNew = document.createElement('button');
      btnNew.className = 'btn primary-soft';
      btnNew.textContent = '＋ Nova coleção e mover para ela';
      btnNew.addEventListener('click', async () => {
        const name = window.prompt('Nome da nova coleção:', 'Nova pasta');
        if (!name || !name.trim()) return;
        const created = await addFolder(name.trim());
        await moveLinks(linkIds, created.id);
        view.folderId = created.id;
        toast(linkIds.length + ' movidos para "' + created.name + '".');
        close();
        render();
      });

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn ghost';
      btnCancel.textContent = 'Cancelar';
      btnCancel.addEventListener('click', close);

      foot.appendChild(btnNew);
      foot.appendChild(btnCancel);
    }
  });
}

/* ---------------- pastas ---------------- */

async function currentFolderName() {
  const folders = await getFolders();
  const f = folders.find((x) => x.id === view.folderId);
  return f ? f.name : null;
}

els.btnNewFolder.addEventListener('click', async () => {
  if (isTestPrompt()) {
    const name = prompt('Nome da nova pasta:', 'Nova pasta');
    if (!name || !name.trim()) return;
    const folder = await addFolder(name.trim());
    view.folderId = folder.id;
    toast('Pasta "' + folder.name + '" criada.');
    render();
    return;
  }
  openFolderModal(null);
});

els.btnRenameFolder.addEventListener('click', async () => {
  const folders = await getFolders();
  const f = folders.find((x) => x.id === view.folderId);
  if (!f) return;
  if (isTestPrompt()) {
    const name = prompt('Novo nome da pasta:', f.name);
    if (!name || !name.trim()) return;
    await renameFolder(f.id, name.trim());
    toast('Pasta renomeada.');
    render();
    return;
  }
  openFolderModal(f);
});

els.btnDeleteFolder.addEventListener('click', async () => {
  const folders = await getFolders();
  const f = folders.find((x) => x.id === view.folderId);
  if (!f) return;
  const links = await getLinks();
  const n = links.filter((l) => l.folderId === f.id).length;

  if (isTestPrompt()) {
    const answer = prompt(
      'Excluir a pasta "' + f.name + '" (' + n + (n === 1 ? ' link' : ' links') + ')?\n\n' +
      'Digite:\n' +
      '  mover  → apaga a pasta e move os links para "Sem pasta"\n' +
      '  tudo   → apaga a pasta E os links dela\n\n' +
      '(deixe em branco para cancelar)', '');
    if (answer === null || !answer.trim()) return;

    const choice = answer.trim().toLowerCase();
    if (choice === 'mover') {
      await deleteFolder(f.id);
      view.folderId = 'sem-pasta';
      toast('Pasta excluída; ' + n + ' links foram para "Sem pasta".');
    } else if (choice === 'tudo') {
      if (!confirm('Confirmar: apagar a pasta "' + f.name + '" e seus ' + n + ' links?')) return;
      await deleteFolderWithLinks(f.id);
      view.folderId = null;
      toast('Pasta e links excluídos.');
    } else {
      return;
    }
    render();
    return;
  }

  openModal({
    title: 'Excluir coleção "' + f.name + '"',
    build: (body, foot, close) => {
      const p = document.createElement('p');
      p.style.margin = '0';
      p.innerHTML = 'Esta coleção contém <strong>' + n + (n === 1 ? ' link' : ' links') + '</strong>. O que você deseja fazer com eles?';
      body.appendChild(p);

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn ghost';
      btnCancel.textContent = 'Cancelar';
      btnCancel.addEventListener('click', close);

      const btnMove = document.createElement('button');
      btnMove.className = 'btn primary';
      btnMove.textContent = 'Preservar links em "Sem pasta"';
      btnMove.addEventListener('click', async () => {
        await deleteFolder(f.id);
        view.folderId = 'sem-pasta';
        toast('Coleção excluída; ' + n + ' links movidos para "Sem pasta".');
        close();
        render();
      });

      const btnAll = document.createElement('button');
      btnAll.className = 'btn danger';
      btnAll.textContent = 'Apagar coleção e ' + n + ' links';
      btnAll.addEventListener('click', async () => {
        await deleteFolderWithLinks(f.id);
        view.folderId = null;
        toast('Coleção e links excluídos.');
        close();
        render();
      });

      foot.appendChild(btnCancel);
      foot.appendChild(btnMove);
      if (n > 0) foot.appendChild(btnAll);
    }
  });
});

if (els.btnMergeFolders) {
  els.btnMergeFolders.addEventListener('click', async () => {
    const res = await mergeDuplicateFolders();
    if (res.mergedFolders > 0) {
      toast(res.mergedFolders + ' pasta(s) repetida(s) unificada(s) com sucesso!');
      view.folderId = null;
      render();
    } else {
      toast('Nenhuma pasta repetida encontrada.');
    }
  });
}

if (els.folderFilter) {
  els.folderFilter.addEventListener('input', () => {
    state.folderQuery = els.folderFilter.value;
    render();
  });
}

if (els.btnClearTag) {
  els.btnClearTag.addEventListener('click', () => {
    view.tag = null;
    render();
  });
}

/* ---------------- captura ---------------- */

function captureFolderId() {
  return view.folderId && view.folderId !== 'favoritos' && view.folderId !== 'sem-pasta'
    ? view.folderId
    : null;
}

async function countCapturable() {
  const settings = await getSettings();
  const win = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const seen = new Set();
  let n = 0;
  for (const t of tabs) {
    if (!isCapturable(t)) continue;
    if (settings.keepPinned && t.pinned) continue;
    if (settings.dedupe) {
      const key = normalizeUrl(t.url || t.pendingUrl || '');
      if (seen.has(key)) continue;
      seen.add(key);
    }
    n++;
  }
  return n;
}

async function doCapture(type) {
  const n = await countCapturable();
  if (n === 0) return toast('Nenhuma aba capturável nesta janela.', true);
  const folderId = captureFolderId();
  const folderName = await currentFolderName();
  const where = folderName ? ' para "' + folderName + '"' : '';
  const shouldConfirm = !state.settings || state.settings.confirmCapture !== false;
  if (shouldConfirm && n > 1 && !confirm('Salvar e fechar ' + n + (n === 1 ? ' aba' : ' abas') + where + '?')) return;

  const res = await send(type, { folderId });
  if (!res.ok) return toast(res.reason || 'Falha ao capturar.', true);

  state.lastCapture = res.linkIds;
  toast(res.saved + (res.saved === 1 ? ' link salvo' : ' links salvos') + ' · ' +
    res.closed + ' abas fechadas', false, 'Desfazer', async () => {
      const undo = await send('undo-capture', { linkIds: state.lastCapture });
      if (undo.ok) toast(undo.reopened + ' abas reabertas.');
      else toast(undo.reason || 'Não foi possível desfazer.', true);
      render();
    });
  render();
}

els.btnCapture.addEventListener('click', () => doCapture('capture'));
els.btnCaptureOnly.addEventListener('click', async () => {
  const n = await countCapturable();
  if (n === 0) return toast('Nenhuma aba capturável nesta janela.', true);
  const res = await send('capture-only', { folderId: captureFolderId() });
  if (!res.ok) return toast(res.reason || 'Falha ao salvar.', true);
  toast(res.saved + (res.saved === 1 ? ' link salvo' : ' links salvos') + ' (sem fechar).');
  render();
});

/* ---------------- adicionar link / mover visão ---------------- */

els.btnAddLink.addEventListener('click', async () => {
  if (isTestPrompt()) {
    const answer = prompt('Cole o endereço (URL) do link:', 'https://');
    if (!answer || !answer.trim() || answer.trim() === 'https://') return;
    let url = answer.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const folderId = captureFolderId();
    const added = await addLinks([{ url, title: url }], folderId);
    if (!added.length) return toast('URL inválida.', true);
    toast('Link adicionado.');
    render();
    return;
  }
  const folders = await getFolders();
  openEditLinkModal(null, folders);
});

els.btnMoveView.addEventListener('click', async () => {
  const q = state.query.trim().toLowerCase();
  const links = (await getLinks()).filter((l) => inView(l) && matches(l, q));
  if (!links.length) return toast('Nada nesta visão para mover.', true);
  const folders = await getFolders();

  if (isTestPrompt()) {
    if (!folders.length) {
      const name = prompt('Nenhuma pasta criada. Nome da nova pasta:', 'Nova pasta');
      if (!name || !name.trim()) return;
      const folder = await addFolder(name.trim());
      await moveLinks(links.map((l) => l.id), folder.id);
      view.folderId = folder.id;
      toast(links.length + ' links movidos para "' + folder.name + '".');
      return render();
    }
    const answer = prompt(
      'Mover os ' + links.length + ' links desta visão para qual pasta?\n\n' +
      folders.map((f) => '  ' + f.name).join('\n') +
      '\n\n(deixe em branco para "Sem pasta")', folders[0].name);
    if (answer === null) return;
    const name = answer.trim().toLowerCase();
    const target = name ? folders.find((f) => f.name.toLowerCase() === name) : null;
    if (name && !target) return toast('Pasta não encontrada: ' + answer, true);
    await moveLinks(links.map((l) => l.id), target ? target.id : null);
    toast(links.length + ' links movidos para "' + (target ? target.name : 'Sem pasta') + '".');
    render();
    return;
  }

  openMoveModal(links.map((l) => l.id), folders, 'Mover ' + links.length + ' links desta visão');
});

/* ---------------- copiar em Markdown ---------------- */

function formatMarkdownList(links) {
  return links.map((l) => '- [' + (l.title || l.url) + '](' + l.url + ')' + (l.notes ? ' — _' + l.notes + '_' : '')).join('\n');
}

if (els.btnCopyView) {
  els.btnCopyView.addEventListener('click', async () => {
    const q = state.query.trim().toLowerCase();
    const visible = sortLinks((await getLinks()).filter((l) => inView(l) && matches(l, q)), state.settings.sortBy);
    if (!visible.length) return toast('Nenhum link nesta visão para copiar.', true);
    await copyText(formatMarkdownList(visible), visible.length + ' links copiados em formato Markdown!');
  });
}

if (els.bulkCopy) {
  els.bulkCopy.addEventListener('click', async () => {
    const ids = new Set(state.selected);
    const chosen = (await getLinks()).filter((l) => ids.has(l.id));
    if (!chosen.length) return;
    await copyText(formatMarkdownList(chosen), chosen.length + ' links copiados em Markdown!');
  });
}

/* ---------------- barra de seleção ---------------- */

els.bulkMove.addEventListener('change', async () => {
  const value = els.bulkMove.value;
  if (!value || state.selected.size === 0) return;
  const folderId = value === '__none__' ? null : value;
  const ids = Array.from(state.selected);
  await moveLinks(ids, folderId);
  const folders = await getFolders();
  const target = folderId ? folders.find((f) => f.id === folderId) : null;
  toast(ids.length + (ids.length === 1 ? ' link movido' : ' links movidos') +
    ' para "' + (target ? target.name : 'Sem pasta') + '".');
  state.selected.clear();
  els.bulkMove.value = '';
  render();
});

els.bulkFavorite.addEventListener('click', async () => {
  const ids = Array.from(state.selected);
  for (const id of ids) await setFavorite(id, true);
  toast(ids.length + ' marcados como favoritos.');
  state.selected.clear();
  render();
});

async function setFavorite(linkId, value) {
  await updateLinks((links) => {
    const l = links.find((x) => x.id === linkId);
    if (l) l.favorite = value;
    return links;
  });
}

els.bulkRestore.addEventListener('click', async () => {
  const ids = Array.from(state.selected);
  const res = await send('restore-links', { ids });
  if (res.ok) toast(res.opened + ' links abertos.');
  else toast(res.reason || 'Nada para abrir.', true);
});

els.bulkDelete.addEventListener('click', async () => {
  const ids = Array.from(state.selected);
  if (!confirm('Excluir ' + ids.length + (ids.length === 1 ? ' link?' : ' links?'))) return;
  await deleteLinks(ids);
  state.selected.clear();
  toast(ids.length + (ids.length === 1 ? ' link excluído.' : ' links excluídos.'));
  render();
});

els.bulkClear.addEventListener('click', () => {
  state.selected.clear();
  render();
});

/* ---------------- restaurar visão / dedupe ---------------- */

els.btnRestoreView.addEventListener('click', async () => {
  const q = state.query.trim().toLowerCase();
  const links = (await getLinks()).filter((l) => inView(l) && matches(l, q));
  if (!links.length) return toast('Nada para restaurar.', true);
  const res = await send('restore-links', { ids: links.map((l) => l.id) });
  if (res.ok) toast(res.opened + ' links abertos.');
  else toast(res.reason || 'Falha ao abrir.', true);
});

els.btnDedupe.addEventListener('click', async () => {
  if (view.folderId === null) {
    const removed = await dedupeAll();
    toast(removed ? removed + ' duplicados globais removidos.' : 'Nenhum link duplicado encontrado.');
    render();
    return;
  }
  const targetFolder = view.folderId === 'sem-pasta' ? null : captureFolderId();
  const removed = await dedupeFolder(targetFolder);
  toast(removed ? removed + ' duplicados removidos desta visão.' : 'Nenhum duplicado encontrado.');
  render();
});

/* ---------------- busca e atalhos (incluindo Ctrl+K) ---------------- */

let searchTimer = null;
els.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = els.search.value;
    els.searchClear.hidden = !state.query;
    render();
  }, 120);
});

els.searchClear.addEventListener('click', () => {
  els.search.value = '';
  state.query = '';
  els.searchClear.hidden = true;
  els.search.focus();
  render();
});

document.addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openCommandPalette();
    return;
  }
  if (e.key === 'Escape' && els.modalBackdrop && !els.modalBackdrop.hidden) {
    closeModal();
    return;
  }
  if (e.key === '/' && !typing) {
    e.preventDefault();
    els.search.focus();
    els.search.select();
  }
  if ((e.key === 'n' || e.key === 'N') && !typing && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    els.btnAddLink.click();
  }
  if (e.key === '?' && !typing) {
    e.preventDefault();
    els.btnHelp.click();
  }
  if (e.key === 'Escape' && document.activeElement === els.search) els.searchClear.click();
  if (e.key === 'Escape' && state.selected.size) {
    state.selected.clear();
    render();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !typing) {
    e.preventDefault();
    document.querySelectorAll('.link-check').forEach((c) => {
      c.checked = true;
      state.selected.add(c.closest('.link').dataset.id);
      c.closest('.link').classList.add('picked');
    });
    updateSelectionBar();
  }
});

/* ---------------- compartilhar / exportar / importar ---------------- */

function buildShareHtml(title, links) {
  const items = links.map((l) => {
    const tagsHtml = Array.isArray(l.tags) && l.tags.length
      ? ' <span class="tags">' + l.tags.map((t) => '#' + escapeHtml(t)).join(' ') + '</span>'
      : '';
    const noteHtml = l.notes ? '<div class="note">' + escapeHtml(l.notes) + '</div>' : '';
    return '<li><a href="' + escapeHtml(l.url) + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(l.title || l.url) + '</a>' + tagsHtml +
      '<span class="host">' + escapeHtml(hostOf(l.url)) + '</span>' + noteHtml + '</li>';
  }).join('\n');

  return '<!DOCTYPE html>\n<html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + escapeHtml(title) + ' — OneTab Lite</title><style>' +
    'body{font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:860px;margin:0 auto;padding:36px 22px;color:#15221d;background:#f5f8f6}' +
    '.card{background:#fff;border:1px solid #d8e2dc;border-radius:12px;padding:24px 28px;box-shadow:0 6px 20px rgba(0,0,0,.05)}' +
    'h1{font-size:22px;margin:0 0 4px;color:#206641}.meta{color:#586c61;font-size:13px;margin:0 0 20px}' +
    'ul{list-style:none;margin:0;padding:0}li{padding:10px 0;border-bottom:1px solid #e9f0ec}' +
    'li:last-child{border-bottom:0}' +
    'a{color:#1b5e3a;font-weight:600;text-decoration:none;word-break:break-word}a:hover{text-decoration:underline}' +
    '.host{display:block;color:#6c7f74;font-size:12px}' +
    '.tags{font-size:11.5px;color:#2c8a5b;background:#e8f4ee;padding:1px 6px;border-radius:4px;margin-left:6px}' +
    '.note{font-size:13px;color:#495a50;margin-top:3px;font-style:italic}' +
    '</style></head><body><div class="card"><h1>' + escapeHtml(title) + '</h1>' +
    '<p class="meta">' + links.length + ' links · Exportado em ' + formatDate(Date.now()) + ' · OneTab Lite</p>' +
    '<ul>' + items + '</ul></div></body></html>';
}

els.btnShare.addEventListener('click', async () => {
  const q = state.query.trim().toLowerCase();
  const links = (await getLinks()).filter((l) => inView(l) && matches(l, q));
  if (!links.length) return toast('Nada para compartilhar nesta visão.', true);
  const blob = new Blob([buildShareHtml(els.viewTitle.textContent, links)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'onetab-' + new Date().toISOString().slice(0, 10) + '.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Página HTML exportada.');
});

els.btnExport.addEventListener('click', async () => {
  const data = {
    app: 'onetab-lite', version: 3, exportedAt: new Date().toISOString(),
    folders: await getFolders(), links: await getLinks()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'onetab-lite-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Backup JSON exportado com sucesso.');
});

els.btnImport.addEventListener('click', () => els.fileImport.click());

async function importDataObject(data) {
  const incomingFolders = Array.isArray(data.folders) ? data.folders : [];
  const rawLinks = Array.isArray(data.links) ? data.links : [];
  const rawSessions = Array.isArray(data.sessions) ? data.sessions : [];

  const folders = await getFolders();
  const known = new Set(folders.map((f) => f.id));
  const byName = new Map(folders.map((f) => [(f.name || '').trim().toLowerCase(), f.id]));
  const map = new Map();
  const newFolders = [];

  for (const rf of incomingFolders) {
    const nf = normalizeFolder(rf);
    if (!nf) continue;
    if (known.has(nf.id)) { map.set(nf.id, nf.id); continue; }
    const sameNameId = byName.get(nf.name.toLowerCase());
    if (sameNameId) { map.set(nf.id, sameNameId); continue; }
    const id = uidFolder();
    map.set(nf.id, id);
    byName.set(nf.name.toLowerCase(), id);
    newFolders.push(Object.assign({}, nf, { id }));
  }

  const entries = [];
  for (const l of rawLinks) {
    const nl = normalizeLink(l);
    if (nl) entries.push(Object.assign({}, nl, { folderId: nl.folderId ? (map.get(nl.folderId) || null) : null }));
  }
  for (const s of rawSessions) {
    if (!s || !Array.isArray(s.links)) continue;
    for (const l of s.links) {
      const nl = normalizeLink(l, s.folder ? (map.get(s.folder) || null) : null, s.createdAt);
      if (nl) entries.push(nl);
    }
  }
  if (!entries.length) throw new Error('Nenhum link válido no arquivo.');

  const existing = await getLinks();
  const byKey = new Set(existing.map((l) => normalizeUrl(l.url) + '|' + (l.folderId || '')));
  let skipped = 0;
  const toAdd = [];
  for (const e of entries) {
    const key = normalizeUrl(e.url) + '|' + (e.folderId || '');
    if (byKey.has(key)) { skipped++; continue; }
    byKey.add(key);
    toAdd.push(e);
  }

  if (newFolders.length) await saveFolders(folders.concat(newFolders));

  if (toAdd.length) {
    await updateLinks((links) => {
      const now = Date.now();
      return toAdd.map((e) => Object.assign({}, e, { id: e.id || uidLink(), addedAt: e.addedAt || now }))
        .concat(links);
    });
  }
  return { added: toAdd.length, skipped };
}

els.fileImport.addEventListener('change', async () => {
  const file = els.fileImport.files && els.fileImport.files[0];
  els.fileImport.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const res = await importDataObject(data);
    toast(res.added + ' links importados' +
      (res.skipped ? ' (' + res.skipped + ' duplicados ignorados)' : '') + '.');
    render();
  } catch (err) {
    toast('Importação falhou: ' + (err.message || err), true);
  }
});

els.btnRestoreClosed.addEventListener('click', async () => {
  const res = await send('restore-closed');
  if (res.ok) toast(res.opened + ' abas restauradas.');
  else toast(res.reason || 'Nada para restaurar.', true);
});

/* ---------------- Sincronização Opcional Self-Hosted (Hostinger) ---------------- */

if (els.btnOpenSync) {
  els.btnOpenSync.addEventListener('click', async () => {
    const s = await getSettings();
    openModal({
      title: 'Sincronização Self-Hosted (Hostinger / Docker)',
      build: (body, foot, close) => {
        const info = document.createElement('div');
        info.className = 'pledge-card';
        info.innerHTML =
          'Conecte seu próprio servidor <em>OneTab Lite Web Vault</em> hospedado em VPS (Hostinger ou Docker) para enviar ou baixar seu backup.';
        body.appendChild(info);

        const fUrl = document.createElement('div');
        fUrl.className = 'form-field';
        fUrl.innerHTML = '<label>URL do Servidor</label>';
        const inUrl = document.createElement('input');
        inUrl.type = 'url';
        inUrl.placeholder = 'Ex.: https://links.seudominio.com ou http://localhost:8787';
        inUrl.value = s.syncUrl || '';
        fUrl.appendChild(inUrl);

        const fTok = document.createElement('div');
        fTok.className = 'form-field';
        fTok.innerHTML = '<label>Token de Acesso (VAULT_TOKEN)</label>';
        const inTok = document.createElement('input');
        inTok.type = 'password';
        inTok.placeholder = 'Sua chave secreta configurada no servidor';
        inTok.value = s.syncToken || '';
        fTok.appendChild(inTok);

        const syncActions = document.createElement('div');
        syncActions.style.display = 'flex';
        syncActions.style.gap = '8px';
        syncActions.style.flexWrap = 'wrap';

        const saveCfg = async () => {
          const url = inUrl.value.trim().replace(/\/+$/, '');
          const tok = inTok.value.trim();
          await setSettings({ syncUrl: url, syncToken: tok });
          return { url, tok };
        };

        const btnPush = document.createElement('button');
        btnPush.className = 'btn primary-soft';
        btnPush.textContent = 'Enviar para o servidor (Push)';
        btnPush.addEventListener('click', async () => {
          const { url, tok } = await saveCfg();
          if (!url) return toast('Informe a URL do seu servidor.', true);
          try {
            const payload = {
              app: 'onetab-lite',
              version: 3,
              exportedAt: new Date().toISOString(),
              folders: await getFolders(),
              links: await getLinks()
            };
            const res = await fetch(url + '/api/vault', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(tok ? { 'Authorization': 'Bearer ' + tok } : {})
              },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            toast('Backup enviado com sucesso para o servidor!');
          } catch (err) {
            toast('Falha ao conectar ao servidor: ' + (err.message || err), true);
          }
        });

        const btnPull = document.createElement('button');
        btnPull.className = 'btn primary-soft';
        btnPull.textContent = 'Baixar do servidor (Pull)';
        btnPull.addEventListener('click', async () => {
          const { url, tok } = await saveCfg();
          if (!url) return toast('Informe a URL do seu servidor.', true);
          try {
            const res = await fetch(url + '/api/vault', {
              headers: tok ? { 'Authorization': 'Bearer ' + tok } : {}
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const out = await importDataObject(data);
            toast(out.added + ' links sincronizados (' + out.skipped + ' já existiam).');
            render();
          } catch (err) {
            toast('Falha ao baixar do servidor: ' + (err.message || err), true);
          }
        });

        syncActions.appendChild(btnPush);
        syncActions.appendChild(btnPull);
        body.appendChild(fUrl);
        body.appendChild(fTok);
        body.appendChild(syncActions);

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn ghost';
        btnCancel.textContent = 'Fechar';
        btnCancel.addEventListener('click', close);

        const btnSave = document.createElement('button');
        btnSave.className = 'btn primary';
        btnSave.textContent = 'Salvar configuração';
        btnSave.addEventListener('click', async () => {
          await saveCfg();
          toast('Configuração salva.');
          close();
        });

        foot.appendChild(btnCancel);
        foot.appendChild(btnSave);
      }
    });
  });
}

/* ---------------- Manual de Utilização & Ajuda Interativo (PT / EN / ES) ---------------- */

const MANUAL_CONTENT = {
  pt: {
    title: 'Manual de Utilização & Recursos — OneTab Lite v3.0',
    close: 'Fechar',
    sections: [
      {
        id: 'visao',
        label: 'Funcionalidades',
        html:
          '<h4>Gerenciamento Inteligente de Abas e Coleções</h4>' +
          '<p>O <strong>OneTab Lite</strong> recolhe todas as suas abas abertas em menos de 1 segundo e organiza sua pesquisa em coleções temáticas com busca instantânea e visual moderno.</p>' +
          '<ul>' +
          '<li><strong>Dashboard de Resumo:</strong> Acompanhe o total de links, coleções ativas, favoritos e sites únicos direto nos cartões superiores.</li>' +
          '<li><strong>Command Palette (<code>Ctrl+K</code>):</strong> Navegue entre coleções, abra links ou execute ações rapidamente sem tirar as mãos do teclado.</li>' +
          '<li><strong>Auto-Organizador Inteligente:</strong> Classifica seus links soltos em <em>"Sem pasta"</em> automaticamente nas suas coleções existentes por domínio e assunto.</li>' +
          '<li><strong>Agrupamento por Site / Domínio:</strong> Clique em <em>Agrupar por Site</em> para visualizar seus links organizados por domínio com o ícone oficial de cada site.</li>' +
          '<li><strong>3 Modos de Visualização (Lista, Compacto e Cards):</strong> Escolha entre lista detalhada, lista densa ou grade de cartões.</li>' +
          '<li><strong>6 Temas de Cores + 3 Idiomas:</strong> Alterne entre Verde, Azul, Preto, Vermelho, Amarelo e Branco, e entre Português, Inglês e Espanhol.</li>' +
          '</ul>'
      },
      {
        id: 'uso',
        label: 'Como Usar',
        html:
          '<h4>Passo a Passo no Dia a Dia</h4>' +
          '<ol>' +
          '<li><strong>Capturar pelo ícone da extensão:</strong> Clique no ícone do OneTab Lite na barra do navegador, escolha a coleção de destino e clique em <em>Capturar e fechar abas</em>.</li>' +
          '<li><strong>Organizar e Mover:</strong> Arraste qualquer link para uma coleção na barra lateral, use o botão de mover ou clique em <strong>Auto-organizar</strong>.</li>' +
          '<li><strong>Filtrar por Site ou Coleção com 1 Clique:</strong> Clique no domínio de qualquer link para filtrar todos os itens daquele site, ou clique na pílula da coleção para abri-la.</li>' +
          '<li><strong>Backup & Exportação:</strong> No menu <strong>Dados</strong> no topo, exporte ou importe backups JSON, ou compartilhe a visão atual em HTML.</li>' +
          '</ol>'
      },
      {
        id: 'atalhos',
        label: 'Atalhos',
        html:
          '<h4>Atalhos de Teclado</h4>' +
          '<ul>' +
          '<li><kbd>Ctrl+K</kbd> — Abre a <strong>Command Palette</strong> (busca e comandos rápidos).</li>' +
          '<li><kbd>Ctrl+Shift+S</kbd> — Captura e fecha todas as abas da janela atual.</li>' +
          '<li><kbd>Ctrl+Shift+Q</kbd> — Abre o menu rápido (Popup) da extensão.</li>' +
          '<li><kbd>/</kbd> — Foca imediatamente na barra de busca.</li>' +
          '<li><kbd>N</kbd> — Abre a janela para adicionar um novo link manualmente.</li>' +
          '<li><kbd>Ctrl+A</kbd> — Seleciona todos os links visíveis na tela atual.</li>' +
          '<li><kbd>Esc</kbd> — Fecha janelas modais, limpa a busca ou desmarca a seleção.</li>' +
          '</ul>'
      },
      {
        id: 'instalacao',
        label: 'Instalação & Hostinger',
        html:
          '<h4>Instalação no Navegador (Chrome, Brave, Edge)</h4>' +
          '<ol>' +
          '<li>Abra <code>chrome://extensions</code> na barra de endereços.</li>' +
          '<li>Ative a chave <strong>Modo do desenvolvedor</strong> (canto superior direito).</li>' +
          '<li>Clique em <strong>Carregar sem compactação</strong> e selecione a pasta <code>onetab-lite</code>.</li>' +
          '</ol>' +
          '<h4>Painel Web & Sincronização Self-Hosted (Hostinger / Docker)</h4>' +
          '<p>O projeto inclui o servidor <em>OneTab Lite Web Vault</em> (Node.js + Docker) pronto para implantação com 1 clique na Hostinger ou VPS própria, permitindo acessar e sincronizar seus links pelo celular ou outros computadores.</p>'
      }
    ]
  },
  en: {
    title: 'User Guide & Features — OneTab Lite v3.0',
    close: 'Close',
    sections: [
      {
        id: 'visao',
        label: 'Features',
        html:
          '<h4>Smart Tab & Collection Workspace</h4>' +
          '<p><strong>OneTab Lite</strong> collapses all your open tabs in under a second and organizes your research into collections with instant search and a modern workspace UI.</p>' +
          '<ul>' +
          '<li><strong>Summary KPI Dashboard:</strong> Track total links, active collections, favorites, and unique websites right from the top summary cards.</li>' +
          '<li><strong>Command Palette (<code>Ctrl+K</code>):</strong> Jump to collections, open links, or trigger actions without leaving your keyboard.</li>' +
          '<li><strong>Smart Auto-Organizer:</strong> Automatically classifies unorganized links into your existing collections by domain and topic.</li>' +
          '<li><strong>Group by Website / Domain:</strong> Click <em>Group by Site</em> to view your links grouped by hostname with real website favicons.</li>' +
          '<li><strong>3 Display Modes (List, Compact & Cards):</strong> Switch between comfortable list, dense list, or card grid.</li>' +
          '<li><strong>6 Color Themes + 3 Languages:</strong> Switch between Green, Blue, Black, Red, Yellow, and White, and between Portuguese, English, and Spanish.</li>' +
          '</ul>'
      },
      {
        id: 'uso',
        label: 'How to Use',
        html:
          '<h4>Daily Workflow</h4>' +
          '<ol>' +
          '<li><strong>Capture from the toolbar icon:</strong> Click the OneTab Lite icon in your browser toolbar, pick a target collection, and click <em>Capture & close tabs</em>.</li>' +
          '<li><strong>Organize & Move:</strong> Drag any link onto a collection in the sidebar, use the move button, or click <strong>Auto-organize</strong>.</li>' +
          '<li><strong>1-Click Domain or Collection Filter:</strong> Click any link hostname to filter by that website, or click its collection pill to jump right in.</li>' +
          '<li><strong>Backup & Export:</strong> Use the top <strong>Data</strong> menu to export/import JSON backups or share the current view as a standalone HTML page.</li>' +
          '</ol>'
      },
      {
        id: 'atalhos',
        label: 'Shortcuts',
        html:
          '<h4>Keyboard Shortcuts</h4>' +
          '<ul>' +
          '<li><kbd>Ctrl+K</kbd> — Open the <strong>Command Palette</strong> (quick search & actions).</li>' +
          '<li><kbd>Ctrl+Shift+S</kbd> — Capture and close all tabs in the current window.</li>' +
          '<li><kbd>Ctrl+Shift+Q</kbd> — Open the extension quick popup.</li>' +
          '<li><kbd>/</kbd> — Focus the search bar immediately.</li>' +
          '<li><kbd>N</kbd> — Open the modal to add a new link manually.</li>' +
          '<li><kbd>Ctrl+A</kbd> — Select all visible links in the current view.</li>' +
          '<li><kbd>Esc</kbd> — Close modals, clear search, or clear selection.</li>' +
          '</ul>'
      },
      {
        id: 'instalacao',
        label: 'Install & Hostinger',
        html:
          '<h4>Browser Installation (Chrome, Brave, Edge)</h4>' +
          '<ol>' +
          '<li>Open <code>chrome://extensions</code> in your address bar.</li>' +
          '<li>Enable <strong>Developer mode</strong> (top-right toggle).</li>' +
          '<li>Click <strong>Load unpacked</strong> and select the <code>onetab-lite</code> folder.</li>' +
          '</ol>' +
          '<h4>Self-Hosted Web Vault (Hostinger / Docker)</h4>' +
          '<p>Includes the <em>OneTab Lite Web Vault</em> server (Node.js + Docker) ready for 1-click deployment on Hostinger VPS or Docker Compose so you can access and sync your collections across devices.</p>'
      }
    ]
  },
  es: {
    title: 'Manual de Uso y Funciones — OneTab Lite v3.0',
    close: 'Cerrar',
    sections: [
      {
        id: 'visao',
        label: 'Funciones',
        html:
          '<h4>Gestión Inteligente de Pestañas y Colecciones</h4>' +
          '<p><strong>OneTab Lite</strong> recoge todas tus pestañas abiertas en menos de 1 segundo y organiza tu investigación en colecciones temáticas con búsqueda instantánea.</p>' +
          '<ul>' +
          '<li><strong>Dashboard de Resumen:</strong> Consulta el total de enlaces, colecciones activas, favoritos y sitios únicos en las tarjetas superiores.</li>' +
          '<li><strong>Command Palette (<code>Ctrl+K</code>):</strong> Navega entre colecciones, abre enlaces o ejecuta acciones rápidamente con el teclado.</li>' +
          '<li><strong>Auto-Organizador Inteligente:</strong> Clasifica tus enlaces de <em>"Sin carpeta"</em> automáticamente en tus colecciones por dominio y tema.</li>' +
          '<li><strong>Agrupación por Sitio / Dominio:</strong> Haz clic en <em>Agrupar por Sitio</em> para ver tus enlaces organizados por dominio con el icono oficial de cada web.</li>' +
          '<li><strong>3 Modos de Vista (Lista, Compacto y Tarjetas):</strong> Elige entre lista detallada, lista compacta o cuadrícula de tarjetas.</li>' +
          '<li><strong>6 Temas de Color + 3 Idiomas:</strong> Alterna entre Verde, Azul, Negro, Rojo, Amarillo y Blanco, y entre Portugués, Inglés y Español.</li>' +
          '</ul>'
      },
      {
        id: 'uso',
        label: 'Cómo Usar',
        html:
          '<h4>Paso a Paso en el Día a Día</h4>' +
          '<ol>' +
          '<li><strong>Capturar desde el icono:</strong> Haz clic en el icono de OneTab Lite en el navegador, elige la colección de destino y pulsa <em>Capturar y cerrar pestañas</em>.</li>' +
          '<li><strong>Organizar y Mover:</strong> Arrastra cualquier enlace hacia una colección en la barra lateral o pulsa <strong>Auto-organizar</strong>.</li>' +
          '<li><strong>Filtrar con 1 Clic:</strong> Haz clic en el dominio de cualquier enlace para filtrar todos los elementos de ese sitio.</li>' +
          '<li><strong>Copia de Seguridad y Exportación:</strong> En el menú <strong>Datos</strong>, exporta o importa copias JSON o comparte la vista actual en HTML.</li>' +
          '</ol>'
      },
      {
        id: 'atalhos',
        label: 'Atajos',
        html:
          '<h4>Atajos de Teclado</h4>' +
          '<ul>' +
          '<li><kbd>Ctrl+K</kbd> — Abre la <strong>Command Palette</strong> (búsqueda y acciones rápidas).</li>' +
          '<li><kbd>Ctrl+Shift+S</kbd> — Captura y cierra todas las pestañas de la ventana actual.</li>' +
          '<li><kbd>Ctrl+Shift+Q</kbd> — Abre el menú rápido (Popup) de la extensión.</li>' +
          '<li><kbd>/</kbd> — Enfoca inmediatamente la barra de búsqueda.</li>' +
          '<li><kbd>N</kbd> — Abre la ventana para añadir un enlace manualmente.</li>' +
          '<li><kbd>Ctrl+A</kbd> — Selecciona todos los enlaces visibles en la vista actual.</li>' +
          '<li><kbd>Esc</kbd> — Cierra ventanas modales, limpia la búsqueda o desmarca la selección.</li>' +
          '</ul>'
      },
      {
        id: 'instalacao',
        label: 'Instalación y Hostinger',
        html:
          '<h4>Instalación en el Navegador (Chrome, Brave, Edge)</h4>' +
          '<ol>' +
          '<li>Abre <code>chrome://extensions</code> en la barra de direcciones.</li>' +
          '<li>Activa el <strong>Modo de desarrollador</strong> (esquina superior derecha).</li>' +
          '<li>Haz clic en <strong>Cargar descomprimida</strong> y selecciona la carpeta <code>onetab-lite</code>.</li>' +
          '</ol>' +
          '<h4>Panel Web y Sincronización Self-Hosted (Hostinger / Docker)</h4>' +
          '<p>El proyecto incluye el servidor <em>OneTab Lite Web Vault</em> (Node.js + Docker) listo para desplegar con 1 clic en Hostinger o VPS propia, permitiendo acceder y sincronizar tus enlaces desde el móvil u otros ordenadores.</p>'
      }
    ]
  }
};

els.btnHelp.addEventListener('click', () => {
  if (isTestPrompt()) {
    alert('OneTab Lite 3.0.0 — Manual e Atalhos');
    return;
  }

  const m = MANUAL_CONTENT[curLang()] || MANUAL_CONTENT.pt;

  openModal({
    title: m.title,
    wide: true,
    build: (body, foot, close) => {
      const tabsBar = document.createElement('div');
      tabsBar.className = 'manual-tabs';

      const panesWrap = document.createElement('div');
      m.sections.forEach((sec, idx) => {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = 'manual-tab' + (idx === 0 ? ' active' : '');
        tabBtn.textContent = sec.label;

        const pane = document.createElement('div');
        pane.className = 'manual-pane' + (idx === 0 ? ' active' : '');
        pane.innerHTML = sec.html;

        tabBtn.addEventListener('click', () => {
          tabsBar.querySelectorAll('.manual-tab').forEach((b) => b.classList.remove('active'));
          panesWrap.querySelectorAll('.manual-pane').forEach((p) => p.classList.remove('active'));
          tabBtn.classList.add('active');
          pane.classList.add('active');
        });

        tabsBar.appendChild(tabBtn);
        panesWrap.appendChild(pane);
      });

      body.appendChild(tabsBar);
      body.appendChild(panesWrap);

      const btnClose = document.createElement('button');
      btnClose.className = 'btn primary';
      btnClose.textContent = m.close;
      btnClose.addEventListener('click', close);
      foot.appendChild(btnClose);
    }
  });
});

/* ---------------- ajustes, tema e visão ---------------- */

async function fillSettings() {
  const s = await getSettings();
  els.settings.dedupe.checked = s.dedupe;
  els.settings.newWindow.checked = s.restoreInNewWindow;
  els.settings.keepPinned.checked = s.keepPinned;
  els.settings.groups.checked = s.showCapturedGroups;
  if (els.settings.confirmCapture) els.settings.confirmCapture.checked = s.confirmCapture !== false;
  if (els.settings.favicons) els.settings.favicons.checked = s.faviconsEnabled !== false;
  if (els.settings.dashboard) els.settings.dashboard.checked = s.showDashboard !== false;
  els.settings.sort.value = s.sortBy;
  if (els.settings.viewMode) els.settings.viewMode.value = s.viewMode || 'list';
  applyThemeAndMode(s);
}

els.settings.dedupe.addEventListener('change', (e) => setSettings({ dedupe: e.target.checked }));
els.settings.newWindow.addEventListener('change', (e) => setSettings({ restoreInNewWindow: e.target.checked }));
els.settings.keepPinned.addEventListener('change', (e) => setSettings({ keepPinned: e.target.checked }));
els.settings.groups.addEventListener('change', (e) => {
  setSettings({ showCapturedGroups: e.target.checked }).then(render);
});
if (els.settings.confirmCapture) {
  els.settings.confirmCapture.addEventListener('change', (e) => {
    setSettings({ confirmCapture: e.target.checked }).then(render);
  });
}
if (els.settings.favicons) {
  els.settings.favicons.addEventListener('change', (e) => {
    setSettings({ faviconsEnabled: e.target.checked }).then(render);
  });
}
if (els.settings.dashboard) {
  els.settings.dashboard.addEventListener('change', (e) => {
    setSettings({ showDashboard: e.target.checked }).then(render);
  });
}
els.settings.sort.addEventListener('change', (e) => setSettings({ sortBy: e.target.value }).then(render));
if (els.settings.viewMode) {
  els.settings.viewMode.addEventListener('change', (e) => {
    setSettings({ viewMode: e.target.value }).then(render);
  });
}

[
  [els.modeBtnList, 'list'],
  [els.modeBtnCompact, 'compact'],
  [els.modeBtnGrid, 'grid']
].forEach(([btn, mode]) => {
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await setSettings({ viewMode: mode });
    render();
  });
});

if (els.btnViewMode) {
  els.btnViewMode.addEventListener('click', async () => {
    const s = await getSettings();
    const order = ['list', 'compact', 'grid'];
    const next = order[(order.indexOf(s.viewMode || 'list') + 1) % order.length];
    await setSettings({ viewMode: next });
    render();
  });
}

document.querySelectorAll('.color-dot').forEach((dot) => {
  dot.addEventListener('click', async () => {
    const color = dot.dataset.color || 'green';
    await setSettings({ colorTheme: color, theme: color === 'white' ? 'light' : 'dark' });
    render();
  });
});

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const lang = btn.dataset.lang || 'pt';
    await setSettings({ lang });
    render();
  });
});

if (els.btnTheme) {
  els.btnTheme.addEventListener('click', async () => {
    const s = await getSettings();
    const order = ['green', 'blue', 'black', 'red', 'yellow', 'white'];
    const next = order[(order.indexOf(s.colorTheme || 'green') + 1) % order.length];
    await setSettings({ colorTheme: next, theme: next === 'white' ? 'light' : 'dark' });
    render();
  });
}

/* ---------------- sincronização storage ---------------- */

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes[LINKS_KEY] || changes[FOLDERS_KEY] || changes[SETTINGS_KEY])) render();
});

/* ---------------- init ---------------- */

(async function init() {
  try {
    await migrate();
    await fillSettings();
    await render();
  } catch (err) {
    toast('Erro ao carregar dados: ' + (err.message || err), true);
    console.error(err);
  }
})();
