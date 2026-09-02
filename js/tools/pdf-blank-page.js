(function () {
  'use strict';
  let pdfBytes = null, origFile = null, resultBytes = null, pageCount = 0;
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Insert after page(s) <span style="font-size:.8rem;opacity:.7">(comma-separated, 0 = start)</span></label>
      <input type="text" class="form-input" id="insertPositions" placeholder="e.g. 0, 2, 5" style="width:100%">
    </div>
    <div class="form-group">
      <label class="form-label">Number of blank pages at each position</label>
      <input type="number" class="form-input" id="blankCount" value="1" min="1" max="10" style="width:90px">
    </div>
    <div class="form-group">
      <label class="form-label">Page Size</label>
      <select class="form-select" id="pageSize">
        <option value="match">Match first page</option>
        <option value="a4">A4 (595×842 pt)</option>
        <option value="letter">Letter (612×792 pt)</option>
      </select>
    </div>
    <div id="pageInfo" style="font-size:.85rem;color:var(--clr-text-muted);margin-top:4px"></div>`;

  async function insertBlanks() {
    if (!pdfBytes) return;
    if (typeof PDFLib === 'undefined') { 28tools.showStatus('statusArea', 'error', 'PDF library not loaded yet. Please wait.'); return; }

    const posInput = document.getElementById('insertPositions').value.trim();
    if (!posInput) { 28tools.showStatus('statusArea', 'error', 'Enter at least one insertion position.'); return; }

    const blankCount = parseInt(document.getElementById('blankCount').value) || 1;

    // Parse and validate positions
    const positions = posInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!positions.length) { 28tools.showStatus('statusArea', 'error', 'Invalid positions. Use numbers separated by commas.'); return; }

    for (const p of positions) {
      if (p < 0 || p > pageCount) {
        28tools.showStatus('statusArea', 'error', `Position ${p} is out of range. PDF has ${pageCount} pages (0 to ${pageCount}).`);
        return;
      }
    }

    28tools.showStatus('statusArea', 'info', 'Inserting blank pages…');
    processBtn.disabled = true;

    try {
      const { PDFDocument, PageSizes } = PDFLib;
      const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      // Determine blank page dimensions
      let blankW, blankH;
      const pageSizeOpt = document.getElementById('pageSize').value;
      if (pageSizeOpt === 'a4') { blankW = 595; blankH = 842; }
      else if (pageSizeOpt === 'letter') { blankW = 612; blankH = 792; }
      else {
        const fp = srcDoc.getPage(0);
        const { width, height } = fp.getSize();
        blankW = width; blankH = height;
      }

      // Sort positions ascending then process insertions
      const sortedPos = [...new Set(positions)].sort((a, b) => a - b);

      // Build ordered list of page indices with insertion points
      // positions are "insert after page N" (0 = before all)
      const posSet = new Set(sortedPos);

      // Insert at start (position 0)
      if (posSet.has(0)) {
        for (let b = 0; b < blankCount; b++) newDoc.addPage([blankW, blankH]);
      }

      // Copy each original page, inserting blanks after if needed
      for (let i = 0; i < pageCount; i++) {
        const [copied] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(copied);
        if (posSet.has(i + 1)) {
          for (let b = 0; b < blankCount; b++) newDoc.addPage([blankW, blankH]);
        }
      }

      resultBytes = await newDoc.save();
      const newPageCount = newDoc.getPageCount();
      28tools.showStatus('statusArea', 'success', `Done! ${blankCount * positions.length} blank page(s) inserted. New total: ${newPageCount} pages.`);
      downloadArea.style.display = '';
    } catch (e) {
      28tools.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', insertBlanks);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const base = origFile ? origFile.name.replace(/\.pdf$/i, '') : 'document';
      28tools.downloadBlob(blob, `${base}-with-blanks.pdf`);
    }
  });

  function loadFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      28tools.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    if (file.size > 50 * 1024 * 1024) { 28tools.showStatus('statusArea', 'error', 'File too large. Max 50MB.'); return; }
    origFile = file;
    const reader = new FileReader();
    reader.onload = async e => {
      pdfBytes = new Uint8Array(e.target.result);
      try {
        const { PDFDocument } = PDFLib;
        const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
        document.getElementById('pageInfo').textContent = `PDF has ${pageCount} pages. Valid positions: 0 (before page 1) to ${pageCount} (after last page).`;
        previewBody.innerHTML = `
          <div style="display:grid;gap:8px">
            <div class="info-row"><span>File:</span><strong>${file.name}</strong></div>
            <div class="info-row"><span>Size:</span><strong>${28tools.formatBytes(file.size)}</strong></div>
            <div class="info-row"><span>Pages:</span><strong>${pageCount}</strong></div>
          </div>`;
      } catch (err) {
        previewBody.innerHTML = `<p>${file.name}</p>`;
        pageCount = 0;
      }
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBytes = null;
      28tools.showStatus('statusArea', 'success', 'PDF loaded. Set positions and click Insert.');
    };
    reader.readAsArrayBuffer(file);
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });
})();
