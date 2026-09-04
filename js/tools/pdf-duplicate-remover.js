(function () {
  'use strict';
  let pdfBytes = null, origFile = null, resultBytes = null;
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Similarity Threshold <span id="threshVal">95</span>%</label>
      <input type="range" class="form-range" id="threshold" min="50" max="100" value="95">
      <div style="display:flex;justify-content:space-between;font-size:.78rem;opacity:.7;margin-top:2px">
        <span>More aggressive</span><span>Exact only</span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="dryRun" checked> Preview only (don't remove yet)
      </label>
    </div>`;

  document.getElementById('threshold').addEventListener('input', e => {
    document.getElementById('threshVal').textContent = e.target.value;
  });

  /* Compute a simple 8x8 average hash from canvas ImageData */
  function computeHash(ctx, w, h) {
    const SIZE = 8;
    // Draw small version
    const small = document.createElement('canvas');
    small.width = SIZE; small.height = SIZE;
    const sCtx = small.getContext('2d');
    sCtx.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, SIZE, SIZE);
    const data = sCtx.getImageData(0, 0, SIZE, SIZE).data;
    // Convert to grayscale
    const grays = [];
    for (let i = 0; i < data.length; i += 4) {
      grays.push(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }
    const mean = grays.reduce((a, b) => a + b, 0) / grays.length;
    return grays.map(g => g >= mean ? 1 : 0);
  }

  function hammingDistance(h1, h2) {
    let diff = 0;
    for (let i = 0; i < h1.length; i++) if (h1[i] !== h2[i]) diff++;
    return diff;
  }

  function similarity(h1, h2) {
    return (1 - hammingDistance(h1, h2) / h1.length) * 100;
  }

  async function detectAndRemove() {
    if (!pdfBytes) return;
    const threshold = parseInt(document.getElementById('threshold').value);
    const dryRun    = document.getElementById('dryRun').checked;

    // Check for pdf.js
    if (typeof pdfjsLib === 'undefined' && !window.pdfjsLib) {
      // Try loading it dynamically
      ToolsApp.showStatus('statusArea', 'info', 'Loading PDF rendering engine…');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    ToolsApp.showStatus('statusArea', 'info', 'Rendering pages for comparison… (may take a moment)');
    processBtn.disabled = true;

    try {
      const { PDFDocument } = PDFLib;
      const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pageCount = srcDoc.getPageCount();

      // Render pages using pdf.js
      let pdfjsLibRef = window.pdfjsLib;
      if (!pdfjsLibRef) throw new Error('PDF.js not loaded. Please refresh the page.');

      const loadingTask = pdfjsLibRef.getDocument({ data: pdfBytes });
      const pdfJsDoc = await loadingTask.promise;

      const hashes = [];
      for (let i = 1; i <= pageCount; i++) {
        ToolsApp.showStatus('statusArea', 'info', `Analyzing page ${i}/${pageCount}…`);
        const page    = await pdfJsDoc.getPage(i);
        const vp      = page.getViewport({ scale: 0.2 }); // small render for speed
        const canvas  = document.createElement('canvas');
        canvas.width  = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx     = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        hashes.push(computeHash(ctx, canvas.width, canvas.height));
      }

      // Find duplicates
      const keep = new Array(pageCount).fill(true);
      const duplicateOf = new Array(pageCount).fill(null);
      for (let i = 0; i < pageCount; i++) {
        if (!keep[i]) continue;
        for (let j = i + 1; j < pageCount; j++) {
          if (!keep[j]) continue;
          const sim = similarity(hashes[i], hashes[j]);
          if (sim >= threshold) {
            keep[j] = false;
            duplicateOf[j] = i;
          }
        }
      }

      const removedPages = keep.map((k, i) => !k ? i + 1 : null).filter(Boolean);
      const keptPages    = keep.map((k, i) =>  k ? i + 1 : null).filter(Boolean);

      let html = `<div style="display:grid;gap:8px">
        <div class="info-row"><span>Original pages:</span><strong>${pageCount}</strong></div>
        <div class="info-row"><span>Duplicates found:</span><strong style="color:${removedPages.length > 0 ? 'var(--clr-error,#e53e3e)' : 'inherit'}">${removedPages.length}</strong></div>
        <div class="info-row"><span>Pages kept:</span><strong>${keptPages.length}</strong></div>`;
      if (removedPages.length > 0) {
        html += `<div class="info-row"><span>Removed pages:</span><strong>${removedPages.join(', ')}</strong></div>`;
      }
      html += '</div>';

      if (removedPages.length === 0) {
        html += '<p style="margin-top:12px;font-size:.9rem;color:var(--clr-text-muted)">✅ No duplicate pages detected at this threshold.</p>';
        previewBody.innerHTML = html;
        ToolsApp.showStatus('statusArea', 'success', 'No duplicates found!');
        processBtn.disabled = false;
        return;
      }

      previewBody.innerHTML = html;

      if (!dryRun) {
        // Remove duplicates
        const newDoc = await PDFDocument.create();
        const indicesToCopy = keep.map((k, i) => k ? i : null).filter(i => i !== null);
        const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy);
        copiedPages.forEach(p => newDoc.addPage(p));
        resultBytes = await newDoc.save();
        downloadArea.style.display = '';
        ToolsApp.showStatus('statusArea', 'success', `Removed ${removedPages.length} duplicate page(s). Download ready!`);
      } else {
        ToolsApp.showStatus('statusArea', 'success', `Found ${removedPages.length} duplicate(s). Uncheck "Preview only" and click again to remove them.`);
      }
    } catch (e) {
      ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', detectAndRemove);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const base = origFile ? origFile.name.replace(/\.pdf$/i, '') : 'document';
      ToolsApp.downloadBlob(blob, `${base}-deduped.pdf`);
    }
  });

  function loadFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      ToolsApp.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    if (file.size > 50 * 1024 * 1024) { ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 50MB.'); return; }
    origFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      pdfBytes = new Uint8Array(e.target.result);
      previewBody.innerHTML = `
        <div style="display:grid;gap:8px">
          <div class="info-row"><span>File:</span><strong>${file.name}</strong></div>
          <div class="info-row"><span>Size:</span><strong>${ToolsApp.formatBytes(file.size)}</strong></div>
        </div>`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBytes = null;
      ToolsApp.showStatus('statusArea', 'success', 'PDF loaded. Click Detect & Remove Duplicates.');
    };
    reader.readAsArrayBuffer(file);
  }

  // Try to initialize pdf.js
  function tryInitPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';
    }
  }
  setTimeout(tryInitPdfJs, 1000);

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });
})();
