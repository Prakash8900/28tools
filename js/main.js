/* =========================================================
   28Tools – Core JavaScript & Tool Registry
   ========================================================= */

'use strict';

// ─── Central Site Configuration ───────────────────────────
const SITE_CONFIG = {
  name: '28Tools',
  baseUrl: 'https://prakash8900.github.io/28tools',
  customDomain: 'https://28tools.link',
  toolCount: 32,
};

// ─── Tool Registry (32 Working Tools) ──────────────────────
const TOOLS = [
  // Calculators & Finance
  { id:'gst-calculator',        title:'GST Calculator',             icon:'🧾', cat:'calculators', desc:'Calculate GST inclusive & exclusive amounts and tax split instantly.', href:'tools/gst-calculator.html',        popular:true,  keywords:['gst','tax','goods','service','cgst','sgst','igst','rates','finance','calculator'] },
  { id:'loan-emi-calculator',   title:'Loan EMI Calculator',        icon:'🏦', cat:'calculators', desc:'Calculate monthly EMI for home, car, or personal loans.',           href:'tools/loan-emi-calculator.html',   popular:true,  keywords:['emi','loan','interest','mortgage','car','home','personal','finance','calculator'] },
  { id:'sip-calculator',        title:'SIP Calculator',             icon:'📈', cat:'calculators', desc:'Project SIP investment returns with a detailed growth chart.',       href:'tools/sip-calculator.html',        popular:false, keywords:['sip','mutual fund','investment','wealth','returns','finance','calculator'] },
  { id:'compound-interest',     title:'Compound Interest',          icon:'💹', cat:'calculators', desc:'Compute compound interest with flexible compounding frequencies.',   href:'tools/compound-interest.html',     popular:false, keywords:['compound','interest','savings','investment','roi','finance','calculator'] },
  { id:'percentage-calculator', title:'Percentage Calculator',      icon:'%',  cat:'calculators', desc:'5-in-1: find %, increase/decrease, difference, and fractions.',      href:'tools/percentage-calculator.html', popular:false, keywords:['percent','percentage','increase','decrease','difference','math','calculator'] },
  { id:'discount-calculator',   title:'Discount Calculator',        icon:'🏷️', cat:'calculators', desc:'Calculate final price after discount, tax, or combined savings.',    href:'tools/discount-calculator.html',   popular:false, keywords:['discount','sale','price','savings','shopping','off','calculator'] },
  { id:'income-tax-calculator', title:'Income Tax Calculator',      icon:'📋', cat:'calculators', desc:'Estimate Indian income tax under old & new FY regimes.',              href:'tools/income-tax-calculator.html', popular:true,  keywords:['income tax','tax slab','new regime','old regime','deductions','80c','tds'] },
  { id:'loan-comparison',       title:'Loan Comparison',            icon:'⚖️', cat:'calculators', desc:'Compare home, car & personal loan offers side by side.',             href:'tools/loan-comparison.html',       popular:false, keywords:['compare','loan','bank','interest rate','tenure','emi','finance'] },

  // Generators & Design
  { id:'qr-generator',          title:'QR Code Generator',          icon:'▦',  cat:'generators',  desc:'Generate custom QR codes for URLs, text, email, phone and WiFi.',   href:'tools/qr-generator.html',          popular:true,  keywords:['qr','code','barcode','url','wifi','vcard','generator','download'] },
  { id:'password-generator',    title:'Password Generator',         icon:'🔐', cat:'generators',  desc:'Generate cryptographically secure passwords with custom rules.',     href:'tools/password-generator.html',    popular:true,  keywords:['password','random','secure','strong','generator','security','pin'] },
  { id:'color-converter',       title:'Color Converter & Contrast', icon:'🎨', cat:'generators',  desc:'Convert HEX↔RGB↔HSL and check WCAG contrast accessibility.',        href:'tools/color-converter.html',       popular:false, keywords:['color','hex','rgb','hsl','contrast','wcag','picker','palette','design'] },

  // Health & Utility
  { id:'age-calculator',        title:'Age Calculator',             icon:'🎂', cat:'health',      desc:'Find your exact age in years, months, days, hours and minutes.',    href:'tools/age-calculator.html',        popular:false, keywords:['age','birthday','birthdate','years','days','dob','calculator'] },
  { id:'bmi-calculator',        title:'BMI Calculator',             icon:'⚕️', cat:'health',      desc:'Calculate BMI and get healthy weight range guidance.',               href:'tools/bmi-calculator.html',        popular:false, keywords:['bmi','body mass index','weight','height','health','fitness'] },
  { id:'date-time-utilities',   title:'Date & Time Utilities',      icon:'📅', cat:'health',      desc:'Difference, countdown, add/subtract, and format dates easily.',     href:'tools/date-time-utilities.html',   popular:false, keywords:['date','time','calendar','countdown','duration','difference','timezone'] },

  // Text & Code
  { id:'word-counter',          title:'Word & Character Counter',   icon:'📝', cat:'text',        desc:'Count words, characters, sentences, paragraphs and reading time.',  href:'tools/word-counter.html',          popular:false, keywords:['word','character','count','letter','reading time','text','sentences'] },
  { id:'text-case-converter',   title:'Text Case Converter',        icon:'Aa', cat:'text',        desc:'Convert text between camelCase, UPPER, lower, Title, snake_case.',  href:'tools/text-case-converter.html',   popular:false, keywords:['case','upper','lower','title','camelcase','snake_case','kebab-case','text'] },
  { id:'json-formatter',        title:'JSON Formatter/Validator',   icon:'{}', cat:'text',        desc:'Format, validate, minify and compare JSON with syntax highlighting.', href:'tools/json-formatter.html',        popular:true,  keywords:['json','format','prettify','minify','validate','parse','developer','code'] },

  // Converters
  { id:'unit-converter',        title:'Universal Unit Converter',   icon:'📐', cat:'converters',  desc:'Convert length, weight, temperature, area, volume, speed & more.',  href:'tools/unit-converter.html',        popular:false, keywords:['unit','convert','length','weight','temperature','area','volume','speed','metric'] },
  { id:'currency-converter',    title:'Currency Converter',         icon:'💱', cat:'converters',  desc:'Real-time currency conversion with live exchange rates.',            href:'tools/currency-converter.html',    popular:true,  keywords:['currency','money','usd','inr','eur','gbp','forex','exchange rate'] },

  // PDF & Image
  { id:'image-compressor',      title:'Image Compressor',           icon:'🗜️', cat:'pdf',         desc:'Compress JPEG/PNG/WebP images locally — no upload, instant result.', href:'tools/image-compressor.html',      popular:true,  keywords:['compress','image','photo','reduce size','jpg','png','webp','optimize'] },
  { id:'image-resizer',         title:'Image Resizer',              icon:'↔️', cat:'pdf',         desc:'Resize images to exact dimensions while preserving aspect ratio.',   href:'tools/image-resizer.html',         popular:false, keywords:['resize','image','photo','dimensions','width','height','scale','pixels'] },
  { id:'image-to-pdf',          title:'Image to PDF',               icon:'📄', cat:'pdf',         desc:'Combine one or more images into a single PDF file, locally.',        href:'tools/image-to-pdf.html',          popular:true,  keywords:['image to pdf','jpg to pdf','png to pdf','photos to pdf','convert','combine'] },
  { id:'photo-crop',            title:'Photo Crop',                 icon:'✂️', cat:'pdf',         desc:'Crop photos with free-form, fixed-ratio, or custom dimensions.',     href:'tools/photo-crop.html',            popular:false, keywords:['crop','photo','image','cut','aspect ratio','square','avatar'] },
  { id:'passport-photo',        title:'Passport / Port-size Photo', icon:'🪪', cat:'pdf',         desc:'Resize any photo to standard passport or port-size dimensions.',     href:'tools/passport-photo.html',        popular:false, keywords:['passport','photo','visa','id','2x2','35x45','portrait','size'] },
  { id:'pdf-merge-split',       title:'PDF Merge & Split',          icon:'📑', cat:'pdf',         desc:'Merge multiple PDFs into one or split a PDF into separate pages.',   href:'tools/pdf-merge-split.html',       popular:true,  keywords:['pdf merge','pdf split','combine pdf','extract pages','join pdf'] },
  { id:'pdf-compressor',        title:'PDF Size Compressor',        icon:'📦', cat:'pdf',         desc:'Compress and reduce PDF file size while keeping good quality.',      href:'tools/pdf-compressor.html',        popular:false, keywords:['pdf compress','reduce pdf size','optimize pdf','shrink pdf'] },
  { id:'word-to-pdf',           title:'Word / Text to PDF',         icon:'📃', cat:'pdf',         desc:'Convert rich text or paste Word content to a clean printable PDF.',  href:'tools/word-to-pdf.html',           popular:false, keywords:['word to pdf','text to pdf','doc','document','convert to pdf','print'] },
  { id:'bg-remover',            title:'Background Remover',         icon:'🖼️', cat:'pdf',         desc:'Remove image backgrounds using magic-wand colour selection.',        href:'tools/bg-remover.html',            popular:false, keywords:['background remover','remove bg','transparent png','erase background'] },
  { id:'image-watermark',       title:'Image Watermark',            icon:'💧', cat:'pdf',         desc:'Add custom text or image watermarks to photos instantly in browser.', href:'tools/image-watermark.html',       popular:false, keywords:['watermark','logo','stamp','protect','branding','image watermark'] },
  { id:'image-format-converter',title:'Image Format Converter',     icon:'🔁', cat:'pdf',         desc:'Convert images between JPG, PNG, WebP, BMP, GIF formats locally.',  href:'tools/image-format-converter.html',popular:false, keywords:['format converter','jpg to png','png to webp','webp to jpg','convert image'] },
  { id:'pdf-to-image',          title:'PDF to Image',               icon:'🖼️', cat:'pdf',         desc:'Extract PDF pages as high-quality PNG or JPEG images locally.',     href:'tools/pdf-to-image.html',          popular:false, keywords:['pdf to image','pdf to jpg','pdf to png','extract images','pages'] },
  { id:'image-editor',          title:'Image Editor',               icon:'✏️', cat:'pdf',         desc:'Adjust brightness, contrast, saturation and apply filters to photos.', href:'tools/image-editor.html',          popular:false, keywords:['image editor','filters','brightness','contrast','adjust','photo edit'] },
];

// ─── Favorites ────────────────────────────────────────────
const FAV_KEY = 'zt_favs';
function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}
function saveFavs(arr) { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); }
function isFav(id) { return getFavs().includes(id); }
function toggleFav(id) {
  const favs = getFavs();
  const idx  = favs.indexOf(id);
  if (idx > -1) favs.splice(idx, 1); else favs.push(id);
  saveFavs(favs);
  return idx === -1; // true = added
}

// ─── Tool Card Builder ────────────────────────────────────
const CAT_CLASS = {
  calculators:'calc', pdf:'pdf', generators:'gen',
  health:'health', text:'text', converters:'conv',
};
const CAT_LABEL = {
  calculators:'Finance', pdf:'PDF & Image', generators:'Generators',
  health:'Health & Utility', text:'Text & Code', converters:'Converters',
};

function getToolHref(href) {
  const isToolsSubDir = window.location.pathname.includes('/tools/') || window.location.pathname.includes('\\tools\\') || window.location.href.includes('/tools/');
  if (isToolsSubDir) {
    return href.replace(/^tools\//, '');
  }
  return href;
}

function buildCard(tool, delay = 0) {
  const fav  = isFav(tool.id);
  const cc   = CAT_CLASS[tool.cat] || 'calc';
  const card = document.createElement('a');
  card.className = 'tool-card';
  card.href      = getToolHref(tool.href);
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', tool.title);
  card.style.animationDelay = delay + 'ms';
  card.innerHTML = `
    ${tool.popular ? '<span class="popular-badge" aria-label="Popular tool">🔥 Hot</span>' : ''}
    <button class="tool-card__fav${fav ? ' active' : ''}" aria-label="${fav ? 'Remove from' : 'Add to'} favourites" data-id="${tool.id}" title="Favourite">
      ${fav ? '★' : '☆'}
    </button>
    <div class="tool-card__icon icon-${cc}" aria-hidden="true">${tool.icon}</div>
    <span class="tool-card__cat-indicator badge-${cc}">${CAT_LABEL[tool.cat]}</span>
    <h3 class="tool-card__title">${tool.title}</h3>
    <p class="tool-card__desc">${tool.desc}</p>
    <div class="tool-card__footer">
      <span class="tool-card__privacy" title="Processed locally in your browser">🔒 Private</span>
      <span class="tool-card__cta">Open Tool →</span>
    </div>`;

  // Favourite toggle (stop card navigation)
  card.querySelector('.tool-card__fav').addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const btn   = e.currentTarget;
    const added = toggleFav(btn.dataset.id);
    btn.textContent  = added ? '★' : '☆';
    btn.classList.toggle('active', added);
    btn.setAttribute('aria-label', (added ? 'Remove from' : 'Add to') + ' favourites');
    if (window.renderFavSection) window.renderFavSection();
  });

  return card;
}

// ─── Render grid ─────────────────────────────────────────
function renderGrid(container, tools) {
  container.innerHTML = '';
  if (!tools.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state__icon">🔍</div>
      <p class="empty-state__title">No tools found</p>
      <p class="empty-state__desc">Try a different search term or category.</p>
    </div>`;
    return;
  }
  tools.forEach((t, i) => container.appendChild(buildCard(t, i * 40)));
}

// ─── Homepage Init ────────────────────────────────────────
function initHomepage() {
  const grid        = document.getElementById('tools-grid');
  const favGrid     = document.getElementById('fav-grid');
  const favSection  = document.getElementById('fav-section');
  const popSection  = document.getElementById('popular');
  const allSection  = document.querySelector('section[aria-labelledby="all-tools-title"]');
  const searchInp   = document.getElementById('search-input');
  const chipAll     = document.querySelectorAll('.chip');
  let activeCat     = 'all';

  function filtered() {
    const q = (searchInp?.value || '').toLowerCase().trim();
    return TOOLS.filter(t => {
      const matchCat = (activeCat === 'all' || t.cat === activeCat);
      if (!matchCat) return false;
      if (!q) return true;
      const titleMatch = t.title.toLowerCase().includes(q);
      const descMatch = t.desc.toLowerCase().includes(q);
      const kwMatch = t.keywords && t.keywords.some(k => k.toLowerCase().includes(q));
      return titleMatch || descMatch || kwMatch;
    });
  }

  function getallSectionTitle() {
    const CAT_DISPLAY = {
      all: '🛠️ All Tools',
      calculators: '💰 Finance Tools',
      pdf: '📄 PDF & Image Tools',
      generators: '✨ Generator Tools',
      health: '❤️ Health Tools',
      text: '📝 Text & Code Tools',
      converters: '🔄 Converter Tools',
    };
    return CAT_DISPLAY[activeCat] || '🛠️ All Tools';
  }

  function render() {
    const results = filtered();
    renderGrid(grid, results);

    // Update section heading dynamically
    const titleEl = document.getElementById('all-tools-title');
    if (titleEl) titleEl.textContent = getallSectionTitle();

    // Show/hide popular section: hide when a specific category is active or search is typed
    const isFiltered = activeCat !== 'all' || (searchInp?.value || '').trim();
    if (popSection) popSection.style.display = isFiltered ? 'none' : '';

    // Scroll to tools grid when a category chip is clicked (not on search)
    if (activeCat !== 'all') {
      const gridSection = allSection || grid;
      setTimeout(() => gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }

  window.renderFavSection = function() {
    const favIds = getFavs();
    const favTools = TOOLS.filter(t => favIds.includes(t.id));
    if (favSection) favSection.classList.toggle('hidden', !favTools.length);
    if (favGrid) renderGrid(favGrid, favTools);
  };

  // Category chips
  chipAll.forEach(chip => {
    chip.addEventListener('click', () => {
      chipAll.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-pressed','false'); });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed','true');
      activeCat = chip.dataset.cat;
      render();
    });
  });

  // Live search
  if (searchInp) {
    searchInp.addEventListener('input', () => {
      render();
      // Hide popular on search
      if (popSection) popSection.style.display = searchInp.value.trim() ? 'none' : '';
    });
  }

  render();
  window.renderFavSection();
}

// ─── Keyboard Search Overlay ──────────────────────────────
function initSearchOverlay() {
  const overlay   = document.getElementById('search-overlay');
  const input     = document.getElementById('overlay-search');
  const results   = document.getElementById('overlay-results');
  if (!overlay) return;

  let highlighted = -1;

  function open() {
    overlay.classList.add('open');
    input.value = '';
    input.focus();
    renderOverlayResults('');
    highlighted = -1;
  }
  function close() {
    overlay.classList.remove('open');
    highlighted = -1;
  }

  document.addEventListener('keydown', e => {
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
    if (e.key === 'Escape') close();
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  function renderOverlayResults(q) {
    const term = (q || '').trim();
    const matches = TOOLS.filter(t => {
      if (!term) return true;
      const titleMatch = t.title.toLowerCase().includes(term);
      const descMatch = t.desc.toLowerCase().includes(term);
      const kwMatch = t.keywords && t.keywords.some(k => k.toLowerCase().includes(term));
      return titleMatch || descMatch || kwMatch;
    }).slice(0, 8);

    results.innerHTML = matches.length ? matches.map((t, i) => {
      const cc = CAT_CLASS[t.cat] || 'calc';
      return `<a class="search-result-item" href="${getToolHref(t.href)}" data-idx="${i}">
        <div class="search-result-item__icon icon-${cc}">${t.icon}</div>
        <div>
          <div class="search-result-item__title">${t.title}</div>
          <div class="search-result-item__sub">${CAT_LABEL[t.cat]}</div>
        </div>
      </a>`;
    }).join('') : `<div class="empty-state" style="padding:2rem">
      <div class="empty-state__icon">🔍</div>
      <p class="empty-state__title">No results</p>
    </div>`;
  }

  if (input) {
    input.addEventListener('input', () => { renderOverlayResults(input.value.toLowerCase()); highlighted = -1; });
    input.addEventListener('keydown', e => {
      const items = results.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); highlighted = Math.min(highlighted + 1, items.length - 1); updateHighlight(items); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); highlighted = Math.max(highlighted - 1, 0); updateHighlight(items); }
      if (e.key === 'Enter' && highlighted >= 0 && items[highlighted]) items[highlighted].click();
    });
  }
  function updateHighlight(items) {
    items.forEach((el, i) => el.classList.toggle('highlighted', i === highlighted));
    if (highlighted >= 0) items[highlighted]?.scrollIntoView({ block:'nearest' });
  }

  // Search button
  document.querySelectorAll('[data-open-search]').forEach(btn => {
    btn.addEventListener('click', open);
  });
}

// ─── Copy to Clipboard Helper ─────────────────────────────
window.copyText = async function(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
    }
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
    }
  }
};

// ─── Download Helper ──────────────────────────────────────
window.downloadBlob = function(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
window.downloadDataURL = function(dataURL, filename) {
  const a = document.createElement('a');
  a.href  = dataURL;
  a.download = filename;
  a.click();
};

// ─── Format Numbers ───────────────────────────────────────
window.fmtINR = n => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n);
window.fmtNum = (n, d=2) => new Intl.NumberFormat('en-IN', { maximumFractionDigits:d }).format(n);
window.fmtPct = n => n.toFixed(2) + '%';

// ─── Input Sanitiser ──────────────────────────────────────
window.sanitise = str => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'`]/g, c => ({ '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;", '`':'&#96;' }[c]));
};

// ─── Validate Number ──────────────────────────────────────
window.validNum = (val, min = 0, max = Infinity) => {
  const n = parseFloat(val);
  return !isNaN(n) && n >= min && n <= max ? n : null;
};

// ─── File helpers ─────────────────────────────────────────
window.MAX_FILE_MB = 50;
window.validateFile = (file, types = ['image/jpeg','image/png','image/webp','image/gif']) => {
  if (!types.includes(file.type)) return `Unsupported file type: ${file.type}`;
  if (file.size > window.MAX_FILE_MB * 1024 * 1024) return `File too large (max ${window.MAX_FILE_MB} MB)`;
  return null;
};

// ─── Canvas image loader ──────────────────────────────────
window.loadImageOnCanvas = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
  img.src = url;
});

// ─── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSearchOverlay();
  if (document.getElementById('tools-grid')) initHomepage();
});
