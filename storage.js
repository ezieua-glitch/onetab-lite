/* OneTab Lite — camada de dados compartilhada.
   Carregada pelo service worker via importScripts('storage.js') e
   pelas páginas via <script src="storage.js">. Usa var/function
   (escopo global) para funcionar nos dois contextos sem build.

   PREMISSA DE PRIVACIDADE (JOGO LIMPO):
   - 100% local (chrome.storage.local).
   - Zero telemetria, zero analytics, zero conexões ocultas.

   MODELO v3 — pastas contêm LINKS soltos.
     folders: [{ id, name, icon, color, createdAt, collapsed }]
     links:   [{ id, url, title, favIconUrl, favorite, notes, tags, addedAt, folderId, capturedAt }]
       folderId: null = "Sem pasta"
       capturedAt: origem — marca de uma captura de abas (agrupamento exibido opcional)
*/

var LINKS_KEY = 'links';
var FOLDERS_KEY = 'folders';
var SETTINGS_KEY = 'settings';
var MIGRATED_KEY = 'schemaVersion';
var SCHEMA_VERSION = 3;

/* chaves antigas, usadas só pela migração */
var LEGACY_SESSIONS_KEY = 'sessions';

function detectDefaultLang() {
  try {
    const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) || 'pt';
    const low = String(nav).toLowerCase();
    if (low.startsWith('es')) return 'es';
    if (low.startsWith('en')) return 'en';
    return 'pt';
  } catch {
    return 'pt';
  }
}

var DEFAULT_SETTINGS = {
  dedupe: true,             // ignorar URLs repetidas na captura
  restoreInNewWindow: true, // abrir em janela nova
  keepPinned: true,         // não fechar abas fixadas
  showCapturedGroups: true, // agrupar visualmente links vindos da mesma captura
  sortBy: 'added',          // 'added' | 'oldest' | 'title' | 'site'
  theme: 'auto',            // legado
  colorTheme: 'green',      // 'green' | 'blue' | 'black' | 'red' | 'yellow' | 'white'
  lang: detectDefaultLang(),// 'pt' | 'en' | 'es'
  viewMode: 'list',         // 'list' | 'compact' | 'grid'
  faviconsEnabled: true,    // true = exibe o favicon real do site igual à aba do Chrome
  showDashboard: true,      // exibir os cartões de estatísticas no topo (estilo Linkwarden)
  confirmCapture: true,     // pedir confirmação ao fechar várias abas
  syncUrl: '',              // opcional: URL do servidor self-hosted (Hostinger/Docker)
  syncToken: ''             // opcional: token de acesso do servidor self-hosted
};

var I18N = {
  pt: {
    subCollections: 'coleções',
    searchPlaceholder: 'Filtrar links por título, site, nota ou #tag…',
    cmdBtn: 'Comandos',
    captureBtn: 'Capturar e fechar',
    saveTabsBtn: 'Salvar abas',
    addLinkBtn: 'Link',
    modeList: 'Lista',
    modeCompact: 'Compacto',
    modeGrid: 'Cards',
    dataMenu: 'Dados',
    dataMenuTitle: 'Exportar, Importar e Sincronizar',
    shareHtml: 'Compartilhar visão como HTML',
    exportJson: 'Exportar Backup (JSON)',
    importJson: 'Importar Backup (JSON)',
    syncServer: 'Sincronização Self-Hosted (Hostinger)',
    restoreClosed: 'Restaurar abas fechadas pelo Chrome',
    settingsTitle: 'Preferências do Workspace',
    setDedupe: 'Ignorar URLs duplicadas na captura',
    setNewWindow: 'Abrir em janela nova ao restaurar',
    setKeepPinned: 'Não fechar abas fixadas (pinned)',
    setGroups: 'Mostrar data de captura nos links',
    setConfirmCapture: 'Confirmar antes de fechar várias abas',
    setFavicons: 'Mostrar ícones (favicons) dos sites',
    setDashboard: 'Mostrar cartões de resumo no topo',
    sortByLabel: 'Ordenar links por',
    sortAdded: 'Mais recentes',
    sortOldest: 'Mais antigos',
    sortTitle: 'Título (A–Z)',
    sortSite: 'Site / Domínio (A–Z)',
    viewModeLabel: 'Modo de exibição',
    manualBtn: 'Manual',
    collectionsHeader: 'Coleções',
    newFolderBtn: 'Nova',
    filterFoldersPlaceholder: 'Filtrar coleções…',
    editBtn: 'Editar',
    deleteBtn: 'Excluir',
    mergeFoldersBtn: 'Unificar pastas repetidas',
    clearBtn: 'Limpar',
    kpiTotalLinks: 'Total de Links',
    kpiActiveCollections: 'Coleções Ativas',
    kpiFavsNotes: 'Favoritos & Notas',
    kpiUniqueSites: 'Sites Únicos',
    kpiAllOrganized: 'Todos organizados',
    kpiUnfoldered: 'sem coleção',
    kpiLargest: 'Maior',
    kpiCreateFirst: 'Crie sua primeira coleção',
    kpiWithNotes: 'com anotações',
    kpiGroupByDomain: 'Agrupar por site',
    allLinksTitle: 'Todos os links',
    favoritesTitle: 'Favoritos',
    unfolderedTitle: 'Sem pasta',
    autoOrganizeBtn: 'Auto-organizar',
    copyMarkdownBtn: 'Copiar Markdown',
    moveViewBtn: 'Mover visão…',
    dedupeBtn: 'Limpar duplicados',
    openAllBtn: 'Abrir todos',
    qAll: 'Todos',
    qFav: 'Favoritos',
    qNotes: 'Com Notas',
    qTags: 'Com Tags',
    groupBySiteBtn: 'Agrupar por Site',
    selectedLabel: 'selecionados',
    moveSelectedOpt: 'Mover selecionados para…',
    favBtn: 'Favoritar',
    openBtn: 'Abrir',
    clearSelectionBtn: 'Limpar seleção',
    emptyTitle: 'Nenhum link nesta coleção',
    emptyDesc: 'Use Capturar e fechar no topo para recolher as abas abertas desta janela, ou clique em + Link.',
    noResultsTitle: 'Nenhum resultado encontrado',
    noResultsDesc: 'Tente outro termo ou pressione Esc para limpar o filtro.',
    popupSaveIn: 'Salvar em:',
    popupCaptureClose: 'Capturar e fechar abas',
    popupCaptureSub: 'Salva as abas desta janela em',
    popupSaveOnly: 'Salvar todas sem fechar',
    popupSaveOnlySub: 'Adiciona as abas da janela à coleção escolhida',
    popupSaveActive: 'Salvar apenas a aba atual',
    popupSaveActiveSub: 'Guarda só a página que você está lendo agora',
    popupRoughTab: 'Modo foco (RoughTab)',
    popupRoughTabSub: 'Recolhe tudo e deixa só o painel aberto',
    popupOpenPanel: 'Abrir painel completo',
    popupOpenPanelSub: 'Dashboard, coleções, busca rápida (Ctrl+K) e exportar',
    popupClosedTabs: 'Abas fechadas',
    popupDiag: 'Diagnóstico',
    popupReady: 'Pronto.'
  },
  en: {
    subCollections: 'collections',
    searchPlaceholder: 'Filter links by title, domain, note or #tag…',
    cmdBtn: 'Commands',
    captureBtn: 'Capture & close',
    saveTabsBtn: 'Save tabs',
    addLinkBtn: 'Link',
    modeList: 'List',
    modeCompact: 'Compact',
    modeGrid: 'Cards',
    dataMenu: 'Data',
    dataMenuTitle: 'Export, Import & Cloud Sync',
    shareHtml: 'Share view as HTML page',
    exportJson: 'Export Backup (JSON)',
    importJson: 'Import Backup (JSON)',
    syncServer: 'Self-Hosted Sync (Hostinger)',
    restoreClosed: 'Restore recently closed Chrome tabs',
    settingsTitle: 'Workspace Preferences',
    setDedupe: 'Ignore duplicate URLs when capturing',
    setNewWindow: 'Open in a new window when restoring',
    setKeepPinned: 'Keep pinned tabs open',
    setGroups: 'Show capture timestamp on links',
    setConfirmCapture: 'Ask confirmation before closing multiple tabs',
    setFavicons: 'Show website favicons',
    setDashboard: 'Show top summary KPI cards',
    sortByLabel: 'Sort links by',
    sortAdded: 'Newest first',
    sortOldest: 'Oldest first',
    sortTitle: 'Title (A–Z)',
    sortSite: 'Website / Domain (A–Z)',
    viewModeLabel: 'Display mode',
    manualBtn: 'Guide',
    collectionsHeader: 'Collections',
    newFolderBtn: 'New',
    filterFoldersPlaceholder: 'Filter collections…',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    mergeFoldersBtn: 'Merge duplicate folders',
    clearBtn: 'Clear',
    kpiTotalLinks: 'Total Links',
    kpiActiveCollections: 'Active Collections',
    kpiFavsNotes: 'Favorites & Notes',
    kpiUniqueSites: 'Unique Websites',
    kpiAllOrganized: 'All organized',
    kpiUnfoldered: 'unorganized',
    kpiLargest: 'Largest',
    kpiCreateFirst: 'Create your first collection',
    kpiWithNotes: 'with notes',
    kpiGroupByDomain: 'Group by domain',
    allLinksTitle: 'All links',
    favoritesTitle: 'Favorites',
    unfolderedTitle: 'Unorganized',
    autoOrganizeBtn: 'Auto-organize',
    copyMarkdownBtn: 'Copy Markdown',
    moveViewBtn: 'Move view…',
    dedupeBtn: 'Remove duplicates',
    openAllBtn: 'Open all',
    qAll: 'All',
    qFav: 'Favorites',
    qNotes: 'With Notes',
    qTags: 'With Tags',
    groupBySiteBtn: 'Group by Site',
    selectedLabel: 'selected',
    moveSelectedOpt: 'Move selected to…',
    favBtn: 'Favorite',
    openBtn: 'Open',
    clearSelectionBtn: 'Clear selection',
    emptyTitle: 'No links in this collection',
    emptyDesc: 'Click Capture & close at the top to save open tabs from this window, or click + Link.',
    noResultsTitle: 'No matching results',
    noResultsDesc: 'Try another search term or press Esc to clear filters.',
    popupSaveIn: 'Save in:',
    popupCaptureClose: 'Capture & close tabs',
    popupCaptureSub: 'Saves tabs from this window in',
    popupSaveOnly: 'Save all without closing',
    popupSaveOnlySub: 'Adds window tabs to the selected collection',
    popupSaveActive: 'Save current tab only',
    popupSaveActiveSub: 'Saves only the page you are reading right now',
    popupRoughTab: 'Focus mode (RoughTab)',
    popupRoughTabSub: 'Collapses everything and leaves only the workspace',
    popupOpenPanel: 'Open full workspace',
    popupOpenPanelSub: 'Dashboard, collections, Command Palette (Ctrl+K) & export',
    popupClosedTabs: 'Closed tabs',
    popupDiag: 'Diagnostics',
    popupReady: 'Ready.'
  },
  es: {
    subCollections: 'colecciones',
    searchPlaceholder: 'Filtrar enlaces por título, sitio, nota o #etiqueta…',
    cmdBtn: 'Comandos',
    captureBtn: 'Capturar y cerrar',
    saveTabsBtn: 'Guardar pestañas',
    addLinkBtn: 'Enlace',
    modeList: 'Lista',
    modeCompact: 'Compacto',
    modeGrid: 'Tarjetas',
    dataMenu: 'Datos',
    dataMenuTitle: 'Exportar, Importar y Sincronizar',
    shareHtml: 'Compartir vista como página HTML',
    exportJson: 'Exportar Copia (JSON)',
    importJson: 'Importar Copia (JSON)',
    syncServer: 'Sincronización Self-Hosted (Hostinger)',
    restoreClosed: 'Restaurar pestañas cerradas de Chrome',
    settingsTitle: 'Preferencias del Workspace',
    setDedupe: 'Ignorar URLs duplicadas al capturar',
    setNewWindow: 'Abrir en ventana nueva al restaurar',
    setKeepPinned: 'No cerrar pestañas fijadas (pinned)',
    setGroups: 'Mostrar fecha de captura en los enlaces',
    setConfirmCapture: 'Confirmar antes de cerrar varias pestañas',
    setFavicons: 'Mostrar iconos (favicons) de los sitios',
    setDashboard: 'Mostrar tarjetas de resumen arriba',
    sortByLabel: 'Ordenar enlaces por',
    sortAdded: 'Más recientes',
    sortOldest: 'Más antiguos',
    sortTitle: 'Título (A–Z)',
    sortSite: 'Sitio / Dominio (A–Z)',
    viewModeLabel: 'Modo de vista',
    manualBtn: 'Manual',
    collectionsHeader: 'Colecciones',
    newFolderBtn: 'Nueva',
    filterFoldersPlaceholder: 'Filtrar colecciones…',
    editBtn: 'Editar',
    deleteBtn: 'Eliminar',
    mergeFoldersBtn: 'Unificar carpetas repetidas',
    clearBtn: 'Limpiar',
    kpiTotalLinks: 'Total de Enlaces',
    kpiActiveCollections: 'Colecciones Activas',
    kpiFavsNotes: 'Favoritos y Notas',
    kpiUniqueSites: 'Sitios Únicos',
    kpiAllOrganized: 'Todos organizados',
    kpiUnfoldered: 'sin colección',
    kpiLargest: 'Mayor',
    kpiCreateFirst: 'Crea tu primera colección',
    kpiWithNotes: 'con notas',
    kpiGroupByDomain: 'Agrupar por sitio',
    allLinksTitle: 'Todos los enlaces',
    favoritesTitle: 'Favoritos',
    unfolderedTitle: 'Sin carpeta',
    autoOrganizeBtn: 'Auto-organizar',
    copyMarkdownBtn: 'Copiar Markdown',
    moveViewBtn: 'Mover vista…',
    dedupeBtn: 'Limpiar duplicados',
    openAllBtn: 'Abrir todos',
    qAll: 'Todos',
    qFav: 'Favoritos',
    qNotes: 'Con Notas',
    qTags: 'Con Etiquetas',
    groupBySiteBtn: 'Agrupar por Sitio',
    selectedLabel: 'seleccionados',
    moveSelectedOpt: 'Mover seleccionados a…',
    favBtn: 'Favorito',
    openBtn: 'Abrir',
    clearSelectionBtn: 'Limpiar selección',
    emptyTitle: 'Ningún enlace en esta colección',
    emptyDesc: 'Usa Capturar y cerrar arriba para guardar las pestañas abiertas, o haz clic en + Enlace.',
    noResultsTitle: 'No se encontraron resultados',
    noResultsDesc: 'Prueba con otro término o presiona Esc para limpiar el filtro.',
    popupSaveIn: 'Guardar en:',
    popupCaptureClose: 'Capturar y cerrar pestañas',
    popupCaptureSub: 'Guarda las pestañas de esta ventana en',
    popupSaveOnly: 'Guardar todas sin cerrar',
    popupSaveOnlySub: 'Añade las pestañas a la colección elegida',
    popupSaveActive: 'Guardar solo la pestaña actual',
    popupSaveActiveSub: 'Guarda únicamente la página que estás leyendo ahora',
    popupRoughTab: 'Modo enfoque (RoughTab)',
    popupRoughTabSub: 'Recoge todo y deja solo el panel abierto',
    popupOpenPanel: 'Abrir panel completo',
    popupOpenPanelSub: 'Dashboard, colecciones, búsqueda rápida (Ctrl+K) y exportar',
    popupClosedTabs: 'Pestañas cerradas',
    popupDiag: 'Diagnóstico',
    popupReady: 'Listo.'
  }
};

function t(key, lang) {
  const dict = I18N[lang] || I18N.pt;
  return dict[key] || I18N.pt[key] || key;
}

/* ---------- utils ---------- */

function uid(prefix) {
  return (prefix || 'l_') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function uidLink() { return uid('l_'); }
function uidFolder() { return uid('f_'); }

/** Remove apenas o hash, para deduplicar a mesma página com âncoras diferentes. */
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString();
  } catch {
    return url;
  }
}

function isOwnPage(url) {
  return (url || '').startsWith(chrome.runtime.getURL(''));
}

/** Abas que o Chrome não permite fechar ou que não faz sentido salvar. */
function isCapturable(tab) {
  if (!tab || tab.id == null) return false;
  const url = tab.url || tab.pendingUrl || '';
  if (!url) return false;
  if (isOwnPage(url)) return false;
  if (/^(chrome|edge|about|devtools|chrome-search|chrome-untrusted|brave|opera|vivaldi):\/\//.test(url)) return false;
  if (url.startsWith('view-source:chrome')) return false;
  if (url.startsWith('https://chromewebstore.google.com')) return false;
  if (url.startsWith('https://chrome.google.com/webstore')) return false;
  return true;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function initialOf(url) {
  const match = hostOf(url).match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : '?';
}

/** Gera uma cor HSL consistente e legível a partir do nome do domínio (100% offline). */
function colorForHost(url) {
  const h = hostOf(url) || String(url || '');
  let hash = 0;
  for (let i = 0; i < h.length; i++) {
    hash = ((hash << 5) - hash) + h.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return 'hsl(' + hue + ', 48%, 36%)';
}

/** Retorna a lista ordenada de URLs de favicon para exibir o ícone real do site igual à aba do Chrome. */
function faviconSourcesFor(linkOrUrl) {
  const url = typeof linkOrUrl === 'string' ? linkOrUrl : (linkOrUrl && linkOrUrl.url) || '';
  const savedFav = typeof linkOrUrl === 'object' && linkOrUrl ? (linkOrUrl.favIconUrl || '') : '';
  const host = hostOf(url);
  const sources = [];
  if (savedFav && /^(https?:|data:)/i.test(savedFav)) {
    sources.push(savedFav);
  }
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function' && url) {
      sources.push(chrome.runtime.getURL('_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=32'));
    }
  } catch { /* ignorado */ }
  if (host && !/^(localhost|127\.0\.0\.1)$/i.test(host)) {
    sources.push('https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=64');
  }
  return sources;
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseTags(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,;]+/);
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    const clean = String(item || '').trim().replace(/^#+/, '').toLowerCase();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

/* ---------- normalização ---------- */

function normalizeLink(link, fallbackFolder, capturedAt) {
  if (!link || typeof link.url !== 'string' || !link.url.trim()) return null;
  const out = {
    id: link.id || uidLink(),
    url: link.url.trim(),
    title: (link.title && String(link.title).trim()) || link.url.trim(),
    favIconUrl: link.favIconUrl || '',
    favorite: !!link.favorite,
    addedAt: link.addedAt || Date.now(),
    folderId: link.folderId !== undefined ? (link.folderId || null) : (fallbackFolder || null),
    capturedAt: link.capturedAt !== undefined ? (link.capturedAt || null) : (capturedAt || null)
  };
  if (link.notes && String(link.notes).trim()) {
    out.notes = String(link.notes).trim();
  }
  const tags = parseTags(link.tags);
  if (tags.length) {
    out.tags = tags;
  }
  return out;
}

function normalizeFolder(folder) {
  if (!folder || typeof folder.id !== 'string') return null;
  const out = {
    id: folder.id,
    name: (folder.name && String(folder.name).trim()) || 'Pasta',
    createdAt: folder.createdAt || Date.now(),
    collapsed: !!folder.collapsed
  };
  if (folder.icon) out.icon = String(folder.icon);
  if (folder.color) out.color = String(folder.color);
  return out;
}

/** Garante que o que sai de getFolders() está normalizado e salvo. */
async function ensureFoldersNormalized() {
  const stored = await chrome.storage.local.get(FOLDERS_KEY);
  const raw = Array.isArray(stored[FOLDERS_KEY]) ? stored[FOLDERS_KEY] : [];
  const normalized = raw.map(function (f) { return normalizeFolder(f); }).filter(Boolean);
  if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
    await chrome.storage.local.set({ [FOLDERS_KEY]: normalized });
  }
  return normalized;
}

/** Só aceita como destino um id de pasta que exista de fato. */
function validFolderOrNull(folderId, folders) {
  if (!folderId) return null;
  return folders.some(function (f) { return f.id === folderId; }) ? folderId : null;
}

/* ---------- migração ----------
   v1/v2 (grupos "sessions")  →  v3 (links soltos dentro de pastas)
   Cada link de cada grupo vira um link individual. O grupo vira apenas
   a marca capturedAt (data da captura), que pode ser exibida ou ignorada. */

async function migrate() {
  const stored = await chrome.storage.local.get([
    LINKS_KEY, FOLDERS_KEY, LEGACY_SESSIONS_KEY, MIGRATED_KEY
  ]);

  const version = stored[MIGRATED_KEY] || 1;
  const rawFolders = Array.isArray(stored[FOLDERS_KEY]) ? stored[FOLDERS_KEY] : [];
  const folders = rawFolders.map(function (f) { return normalizeFolder(f); }).filter(Boolean);

  if (version >= SCHEMA_VERSION && Array.isArray(stored[LINKS_KEY])) {
    // já no formato atual: só repara referências órfãs
    const folderIds = new Set(folders.map(function (f) { return f.id; }));
    let orphanFixed = 0;
    const links = stored[LINKS_KEY]
      .map(function (l) { return normalizeLink(l); })
      .filter(Boolean)
      .map(function (l) {
        if (l.folderId && !folderIds.has(l.folderId)) { l.folderId = null; orphanFixed++; }
        return l;
      });
    if (orphanFixed > 0) {
      await chrome.storage.local.set({ [LINKS_KEY]: links });
    }
    return { links, folders, migratedFrom: version, orphanFixed };
  }

  // migração de v1/v2
  const legacySessions = Array.isArray(stored[LEGACY_SESSIONS_KEY]) ? stored[LEGACY_SESSIONS_KEY] : [];
  const folderIds = new Set(folders.map(function (f) { return f.id; }));
  const links = [];
  const seen = new Set();

  for (const session of legacySessions) {
    if (!session || !Array.isArray(session.links)) continue;
    let folderId = session.folder || null;
    if (folderId && !folderIds.has(folderId)) folderId = null; // grupo órfão → Sem pasta
    const capturedAt = session.createdAt || Date.now();

    for (const raw of session.links) {
      const link = normalizeLink(raw, folderId, capturedAt);
      if (!link) continue;
      const key = normalizeUrl(link.url) + '|' + (link.folderId || '');
      if (seen.has(key)) continue; // evita duplicar o mesmo link duas vezes na mesma pasta
      seen.add(key);
      links.push(link);
    }
  }

  await chrome.storage.local.set({
    [LINKS_KEY]: links,
    [FOLDERS_KEY]: folders,
    [MIGRATED_KEY]: SCHEMA_VERSION
  });
  // não apagamos "sessions": fica como backup caso algo precise ser reconferido
  return { links, folders, migratedFrom: version, orphanFixed: 0 };
}

/* ---------- settings ---------- */

async function getSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return Object.assign({}, DEFAULT_SETTINGS, stored[SETTINGS_KEY] || {});
}

async function setSettings(patch) {
  const next = Object.assign({}, await getSettings(), patch);
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

/* ---------- links ---------- */

async function getLinks() {
  return (await migrate()).links;
}

async function saveLinks(links) {
  await chrome.storage.local.set({ [LINKS_KEY]: links });
}

async function addLinks(entries, folderId) {
  const created = [];
  await mutateState(function (links, folders) {
    const target = validFolderOrNull(folderId, folders);
    const now = Date.now();
    for (const entry of entries) {
      const link = normalizeLink(entry, target, entry.capturedAt !== undefined ? entry.capturedAt : now);
      if (!link) continue;
      link.folderId = target;
      created.push(link);
    }
    return { links: created.concat(links), folders: folders };
  });
  return created; // mesma ordem de `entries`
}

async function updateLinks(mutator) {
  const out = await mutateState(function (links) { return { links: mutator(links) || links }; });
  return out.links;
}

/** Atualiza campos de um único link (title, url, folderId, notes, tags, favorite). */
async function updateLink(id, patch) {
  let updated = null;
  await mutateState(function (links, folders) {
    const next = links.map(function (l) {
      if (l.id !== id) return l;
      const merged = Object.assign({}, l, patch || {});
      if ('folderId' in (patch || {})) {
        merged.folderId = validFolderOrNull(patch.folderId, folders);
      }
      if ('tags' in (patch || {})) {
        const parsed = parseTags(patch.tags);
        if (parsed.length) merged.tags = parsed;
        else delete merged.tags;
      }
      if ('notes' in (patch || {})) {
        const cleanNotes = String(patch.notes || '').trim();
        if (cleanNotes) merged.notes = cleanNotes;
        else delete merged.notes;
      }
      updated = normalizeLink(merged, merged.folderId, merged.capturedAt);
      return updated || l;
    });
    return { links: next, folders: folders };
  });
  return updated;
}

async function deleteLinks(ids) {
  const set = new Set(ids);
  return updateLinks(function (links) {
    return links.filter(function (l) { return !set.has(l.id); });
  });
}

/** Move links para uma pasta (ou null = Sem pasta). Retorna quantos mudaram. */
async function moveLinks(ids, folderId) {
  const set = new Set(ids);
  let moved = 0;
  await mutateState(function (links, folders) {
    const target = validFolderOrNull(folderId, folders);
    const next = links.map(function (l) {
      if (!set.has(l.id)) return l;
      moved++;
      return Object.assign({}, l, { folderId: target });
    });
    return { links: next, folders: folders };
  });
  return moved;
}

async function toggleFavorite(linkId) {
  let state = false;
  await updateLinks(function (links) {
    const l = links.find(function (x) { return x.id === linkId; });
    if (!l) return links;
    l.favorite = !l.favorite;
    state = l.favorite;
    return links;
  });
  return state;
}

/** Remove duplicados dentro de uma pasta (ou 'sem-pasta' quando folderId === null), mantendo o primeiro. */
async function dedupeFolder(folderId) {
  const links = await getLinks();
  const seen = new Set();
  let removed = 0;
  const next = links.filter(function (l) {
    if ((l.folderId || null) !== (folderId || null)) return true;
    const key = normalizeUrl(l.url);
    if (seen.has(key)) { removed++; return false; }
    seen.add(key);
    return true;
  });
  if (removed) await saveLinks(next);
  return removed;
}

/** Remove URLs duplicadas em toda a extensão (independente da pasta), mantendo a ocorrência favorita ou mais antiga. */
async function dedupeAll() {
  const links = await getLinks();
  const seen = new Set();
  let removed = 0;
  const next = links.filter(function (l) {
    const key = normalizeUrl(l.url);
    if (seen.has(key)) { removed++; return false; }
    seen.add(key);
    return true;
  });
  if (removed) await saveLinks(next);
  return removed;
}

/* ---------- pastas ---------- */

async function getFolders() {
  await migrate();
  return ensureFoldersNormalized();
}

async function saveFolders(folders) {
  await chrome.storage.local.set({ [FOLDERS_KEY]: folders });
}

async function addFolder(name, opts) {
  opts = opts || {};
  let created = null;
  await mutateState(function (links, folders) {
    created = normalizeFolder({
      id: uidFolder(),
      name: name || 'Nova pasta',
      icon: opts.icon || '',
      color: opts.color || '',
      createdAt: Date.now(),
      collapsed: false
    });
    return { folders: folders.concat([created]) };
  });
  return created;
}

async function updateFolders(mutator) {
  const folders = await getFolders();
  const next = mutator(folders) || folders;
  await saveFolders(next);
  return next;
}

/** Unifica pastas que tenham exatamente o mesmo nome (ignorando maiúsculas/minúsculas). */
async function mergeDuplicateFolders() {
  let mergedFolders = 0;
  let movedLinks = 0;
  await mutateState(function (links, folders) {
    const byName = new Map();
    const remap = new Map();
    const keptFolders = [];

    for (const f of folders) {
      const key = (f.name || '').trim().toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, f.id);
        keptFolders.push(f);
      } else {
        remap.set(f.id, byName.get(key));
        mergedFolders++;
      }
    }

    if (!mergedFolders) return { links, folders };

    const nextLinks = links.map(function (l) {
      if (l.folderId && remap.has(l.folderId)) {
        movedLinks++;
        return Object.assign({}, l, { folderId: remap.get(l.folderId) });
      }
      return l;
    });

    return { links: nextLinks, folders: keptFolders };
  });
  return { mergedFolders, movedLinks };
}

/** Auto-organiza links que estão "Sem pasta" (folderId === null) associando-os a pastas já existentes
    (pelo histórico do mesmo domínio ou por palavras-chave inteligentes), 100% local e offline. */
async function autoOrganizeLinks() {
  let organized = 0;
  await mutateState(function (links, folders) {
    if (!folders.length) return { links, folders };

    // 1. Aprende quais domínios o usuário já guarda em cada pasta
    const domainToFolder = new Map();
    for (const l of links) {
      if (l.folderId) {
        const h = hostOf(l.url);
        if (h && !domainToFolder.has(h)) {
          domainToFolder.set(h, l.folderId);
        }
      }
    }

    // 2. Mapeia pastas existentes por palavras-chave conhecidas
    const findFolderByRegex = (regex, icon) => {
      return folders.find((f) => regex.test((f.name || '').toLowerCase()));
    };

    const rules = [
      { folder: findFolderByRegex(/\b(ia|ai|intelig[eê]ncia|gpt|claude)\b/), rx: /(openai|chatgpt|claude\.ai|gemini\.google|perplexity|huggingface|midjourney|deepseek|talkpal|elevenlabs|runway|comfy|replicate|poe\.com)/i },
      { folder: findFolderByRegex(/google/), rx: /(google\.com|gmail\.com|drive\.google|docs\.google|classroom\.google|translate\.google)/i },
      { folder: findFolderByRegex(/(rede|social|sociais)/), rx: /(facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|threads\.net|reddit\.com|pinterest\.com)/i },
      { folder: findFolderByRegex(/(automa[cç][aã]o|zapier|make|n8n)/), rx: /(zapier\.com|make\.com|n8n\.io|ifttt\.com|typebot|manychat)/i },
      { folder: findFolderByRegex(/(programa[cç][aã]o|dev|c[oó]digo|git)/), rx: /(github\.com|gitlab\.com|stackoverflow\.com|npmjs\.com|vercel\.com|netlify\.com|developer\.mozilla|docker\.com)/i },
      { folder: findFolderByRegex(/(localhost|local)/), rx: /^(https?:\/\/)?(localhost|127\.0\.0\.1|192\.168\.)/i },
      { folder: findFolderByRegex(/(v[ií]deo|youtube|edi[cç][aã]o)/), rx: /(youtube\.com|youtu\.be|vimeo\.com|wondershare|filmora|capcut|twitch\.tv)/i },
      { folder: findFolderByRegex(/(ingl[eê]s|english|idioma)/), rx: /(duolingo|cambridge|oxford|alison\.com|bbc\.co\.uk\/learningenglish|engvid)/i },
      { folder: findFolderByRegex(/(faculdade|universidade|university|ead|estudo|study|escola|curso|course)/), rx: /(moodle|ava\.|coursera|udemy|alura|edx\.org|khanacademy|canvas)/i },
      { folder: findFolderByRegex(/(seo|site|host|cloud|dominio|domain)/), rx: /(hostinger|cloudflare|semrush|ahrefs|wordpress|wix\.com|digitalocean|aws\.amazon)/i }
    ];

    const nextLinks = links.map(function (l) {
      if (l.folderId) return l; // só organiza links que estão "Sem pasta"
      const h = hostOf(l.url);
      if (h && domainToFolder.has(h)) {
        organized++;
        return Object.assign({}, l, { folderId: domainToFolder.get(h) });
      }
      const hay = (l.url + ' ' + (l.title || '')).toLowerCase();
      for (const r of rules) {
        if (r.folder && r.rx.test(hay)) {
          organized++;
          return Object.assign({}, l, { folderId: r.folder.id });
        }
      }
      return l;
    });

    return { links: nextLinks, folders };
  });
  return organized;
}

/* ---------- mutação atômica de estado ----------
   Lê links + pastas, aplica a função e grava os bancos que mudaram.
   Evita que uma escritura parcial (ex.: só as pastas) seja desfeita por
   uma releitura que ainda enxerga dados antigos. */

async function mutateState(fn) {
  await migrate();
  const stored = await chrome.storage.local.get([LINKS_KEY, FOLDERS_KEY]);
  const links = Array.isArray(stored[LINKS_KEY]) ? stored[LINKS_KEY] : [];
  const rawFolders = Array.isArray(stored[FOLDERS_KEY]) ? stored[FOLDERS_KEY] : [];
  const folders = rawFolders.map(function (f) { return normalizeFolder(f); }).filter(Boolean);
  const beforeLinks = JSON.stringify(links);
  const beforeFolders = JSON.stringify(rawFolders);

  const out = fn(links, folders) || {};
  const nextLinks = out.links || links;
  const nextFolders = out.folders || folders;

  const patch = {};
  if (JSON.stringify(nextLinks) !== beforeLinks) patch[LINKS_KEY] = nextLinks;
  if (JSON.stringify(nextFolders) !== beforeFolders) patch[FOLDERS_KEY] = nextFolders;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);

  return { links: nextLinks, folders: nextFolders };
}

async function renameFolder(id, name, opts) {
  opts = opts || {};
  await updateFolders(function (folders) {
    const f = folders.find(function (x) { return x.id === id; });
    if (f) {
      if (name) f.name = name;
      if (opts.icon !== undefined) f.icon = opts.icon;
      if (opts.color !== undefined) f.color = opts.color;
    }
    return folders;
  });
}

/** Exclui a pasta. Os links dela vão para "Sem pasta" (nunca são apagados). */
async function deleteFolder(id) {
  await mutateState(function (links, folders) {
    return {
      links: links.map(function (l) {
        return l.folderId === id ? Object.assign({}, l, { folderId: null }) : l;
      }),
      folders: folders.filter(function (f) { return f.id !== id; })
    };
  });
}

/** Exclui a pasta E todos os links dela. */
async function deleteFolderWithLinks(id) {
  await mutateState(function (links, folders) {
    return {
      links: links.filter(function (l) { return l.folderId !== id; }),
      folders: folders.filter(function (f) { return f.id !== id; })
    };
  });
}

/* ---------- comunicação com o service worker ---------- */

function send(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(Object.assign({ type: type }, payload || {}), (res) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, reason: chrome.runtime.lastError.message });
      } else {
        resolve(res || { ok: false, reason: 'Sem resposta do service worker.' });
      }
    });
  });
}
