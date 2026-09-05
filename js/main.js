/**
 * main.js - Shared logic: theme toggle, navigation, search/filter
 * 28tools - Image & PDF Tools
 */

/* ============================================================
   THEME TOGGLE
   ============================================================ */
const THEME_KEY = '28tools-theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  // Update icon
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ============================================================
   NAVIGATION / HAMBURGER
   ============================================================ */
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('navDrawer');
  const themeBtn  = document.getElementById('themeToggle');

  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close drawer on outside click
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open') &&
          !drawer.contains(e.target) &&
          !hamburger.contains(e.target)) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Close on link click
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Highlight active nav link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });
}

/* ============================================================
   SEARCH & FILTER (Homepage)
   ============================================================ */
function initSearch() {
  const input    = document.getElementById('toolSearch');
  const clearBtn = document.getElementById('searchClear');
  const chips    = document.querySelectorAll('.chip[data-filter]');
  const cards    = document.querySelectorAll('.tool-card');
  const noResult = document.getElementById('noResults');
  const imgSection = document.getElementById('image-tools');
  const pdfSection = document.getElementById('pdf-tools');

  if (!input) return;

  let activeFilter = 'all';

  function filterTools() {
    const query = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', query.length > 0);

    let visible = 0;
    cards.forEach(card => {
      const title = card.querySelector('.tool-card__title')?.textContent.toLowerCase() || '';
      const desc  = card.querySelector('.tool-card__desc')?.textContent.toLowerCase() || '';
      const cat   = card.dataset.category || '';

      const matchesQuery  = !query || title.includes(query) || desc.includes(query);
      const matchesFilter = activeFilter === 'all' || cat === activeFilter;

      if (matchesQuery && matchesFilter) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    // Toggle section headings visibility
    if (imgSection) {
      imgSection.style.display = (activeFilter === 'pdf') ? 'none' : '';
    }
    if (pdfSection) {
      pdfSection.style.display = (activeFilter === 'image') ? 'none' : '';
    }

    if (noResult) noResult.classList.toggle('visible', visible === 0);
  }

  input.addEventListener('input', filterTools);

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    filterTools();
    input.focus();
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      filterTools();
    });
  });
}

/* ============================================================
   SCROLL REVEAL ANIMATION
   ============================================================ */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));
}

/* ============================================================
   FAQ ACCORDION (Tool Pages)
   ============================================================ */
function initFAQ() {
  document.querySelectorAll('.faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all
      document.querySelectorAll('.faq__q').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        b.nextElementSibling?.classList.remove('open');
      });
      // Open clicked if it was closed
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        btn.nextElementSibling?.classList.add('open');
      }
    });
  });
}

/* ============================================================
   LAZY LOADING IMAGES
   ============================================================ */
function initLazyLoad() {
  const imgs = document.querySelectorAll('img.lazy');
  if (!imgs.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  imgs.forEach(img => observer.observe(img));
}

/* ============================================================
   UTILITY: Format file size
   ============================================================ */
function formatBytes(bytes, decimals = 1) {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/* ============================================================
   UTILITY: Show status message
   ============================================================ */
function showStatus(containerId, type, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `
    <div class="status-msg status-msg--${type}" role="alert">
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    </div>`;
}

/* ============================================================
   UTILITY: Drag & Drop Upload Setup
   ============================================================ */
function setupDragDrop(zoneId, fileInputId, onFiles) {
  const zone  = document.getElementById(zoneId);
  const input = document.getElementById(fileInputId);
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length) onFiles(files);
  });
  input.addEventListener('change', () => {
    if (input.files.length) onFiles(input.files);
  });
}

/* ============================================================
   UTILITY: Download blob
   ============================================================ */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ============================================================
   UTILITY: Download canvas as image
   ============================================================ */
function downloadCanvas(canvas, filename, type = 'image/png', quality = 0.92) {
  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, filename);
  }, type, quality);
}

/* ============================================================
   ADS — Inject banners on tool pages
   ============================================================ */
function initAds() {
  const isToolPage = document.querySelector('.tool-page');
  if (!isToolPage) return; // homepage ads are in HTML directly

  // ── Helper: create an ad wrapper block ──────────────────────
  function makeAdBlock(slotClass, optionsKey, scriptSrc, width, height) {
    const wrap = document.createElement('div');
    wrap.className = 'ad-banner-wrap ' + slotClass;
    wrap.setAttribute('aria-label', 'Advertisement');
    wrap.setAttribute('role', 'complementary');

    const label = document.createElement('div');
    label.className = 'ad-label';
    label.textContent = 'Advertisement';
    wrap.appendChild(label);

    const slot = document.createElement('div');
    slot.className = 'ad-slot';
    wrap.appendChild(slot);

    // atOptions config script
    const cfgScript = document.createElement('script');
    cfgScript.textContent = `atOptions = { 'key': '${optionsKey}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };`;
    slot.appendChild(cfgScript);

    // invoke script
    const invScript = document.createElement('script');
    invScript.src = scriptSrc;
    slot.appendChild(invScript);

    return wrap;
  }

  // ── 728x90 Leaderboard — inject after tool title row ────────
  const titleRow = document.querySelector('.tool-title-row');
  if (titleRow) {
    const ad728 = makeAdBlock(
      'ad-banner-wrap--leaderboard',
      '62e8260ad2b87bfd6a49f118bdd20c20',
      'https://www.highrevenueformat.com/62e8260ad2b87bfd6a49f118bdd20c20/invoke.js',
      728, 90
    );
    titleRow.parentNode.insertBefore(ad728, titleRow.nextSibling);
  }

  // ── 300x250 Rectangle — inject before how-to-use section ────
  const howTo = document.querySelector('.how-to-section');
  if (howTo) {
    const ad300 = makeAdBlock(
      'ad-banner-wrap--rect',
      'd43519a99acdb54ea862896eccd220a1',
      'https://www.highrevenueformat.com/d43519a99acdb54ea862896eccd220a1/invoke.js',
      300, 250
    );
    howTo.parentNode.insertBefore(ad300, howTo);
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initSearch();
  initReveal();
  initFAQ();
  initLazyLoad();
  initAds();
});

// Expose utilities globally for tool scripts
const ToolsApp = {
  formatBytes,
  showStatus,
  setupDragDrop,
  downloadBlob,
  downloadCanvas,
  toggleTheme,
};

window.ToolsApp = ToolsApp;
window.OmniTools = ToolsApp;
window['28tools'] = ToolsApp;
