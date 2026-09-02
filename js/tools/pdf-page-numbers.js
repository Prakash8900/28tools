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
      <label class="form-label">Position</label>
      <select class="form-select" id="position">
        <option value="bottom-center">Bottom Center</option>
        <option value="bottom-left">Bottom Left</option>
        <option value="bottom-right">Bottom Right</option>
        <option value="top-center">Top Center</option>
        <option value="top-left">Top Left</option>
        <option value="top-right">Top Right</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Format</label>
      <select class="form-select" id="numFormat">
        <option value="plain">1, 2, 3 …</option>
        <option value="page-of">Page 1 of N</option>
        <option value="page">Page 1</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Start Number</label>
      <input type="number" class="form-input" id="startNum" value="1" min="0" max="9999" style="width:90px">
    </div>
    <div class="form-group">
      <label class="form-label">Font Size (pt)</label>
      <input type="number" class="form-input" id="fontSize" value="11" min="6" max="36" style="width:90px">
    </div>
    <div class="form-group">
      <label class="form-label">Margin from Edge (pt)</label>
      <input type="number" class="form-input" id="margin" value="24" min="8" max="100" style="width:90px">
    </div>`;

  async function addPageNumbers() {
    if (!pdfBytes) return;
    if (typeof PDFLib === 'undefined') { 28tools.showStatus('statusArea', 'error', 'PDF library not loaded yet. Please wait a moment.'); return; }

    28tools.showStatus('statusArea', 'info', 'Adding page numbers…');
    processBtn.disabled = true;

    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages  = pdfDoc.getPages();
      const total  = pages.length;

      const position  = document.getElementById('position').value;
      const numFormat = document.getElementById('numFormat').value;
      const startNum  = parseInt(document.getElementById('startNum').value) || 1;
      const fontSize  = parseInt(document.getElementById('fontSize').value) || 11;
      const margin    = parseInt(document.getElementById('margin').value) || 24;

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const num = startNum + i;
        let text;
        if (numFormat === 'plain')   text = String(num);
        else if (numFormat === 'page-of') text = `Page ${num} of ${total}`;
        else text = `Page ${num}`;

        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x, y;
        const isBottom = position.startsWith('bottom');
        const isTop    = position.startsWith('top');
        const isCenter = position.endsWith('center');
        const isLeft   = position.endsWith('left');
        const isRight  = position.endsWith('right');

        if (isCenter) x = (width - textWidth) / 2;
        else if (isLeft) x = margin;
        else x = width - textWidth - margin;

        if (isBottom) y = margin;
        else y = height - margin - fontSize;

        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
      });

      resultBytes = await pdfDoc.save();
      28tools.showStatus('statusArea', 'success', `Page numbers added to all ${total} pages!`);
      downloadArea.style.display = '';
    } catch (e) {
      28tools.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', addPageNumbers);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const base = origFile ? origFile.name.replace(/\.pdf$/i, '') : 'document';
      28tools.downloadBlob(blob, `${base}-numbered.pdf`);
    }
  });

  function loadFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      28tools.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    if (file.size > 50 * 1024 * 1024) {
      28tools.showStatus('statusArea', 'error', 'File too large. Max 50MB.'); return;
    }
    origFile = file;
    const reader = new FileReader();
    reader.onload = async e => {
      pdfBytes = new Uint8Array(e.target.result);
      if (typeof PDFLib !== 'undefined') {
        try {
          const { PDFDocument } = PDFLib;
          const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
          const pageCount = doc.getPageCount();
          previewBody.innerHTML = `
            <div style="display:grid;gap:8px">
              <div class="info-row"><span>File:</span><strong>${file.name}</strong></div>
              <div class="info-row"><span>Size:</span><strong>${28tools.formatBytes(file.size)}</strong></div>
              <div class="info-row"><span>Pages:</span><strong>${pageCount}</strong></div>
            </div>`;
          28tools.showStatus('statusArea', 'success', `PDF loaded: ${pageCount} pages. Configure settings and click Add Page Numbers.`);
        } catch (err) {
          previewBody.innerHTML = `<p>${file.name} — ${28tools.formatBytes(file.size)}</p>`;
          28tools.showStatus('statusArea', 'info', 'PDF loaded. Configure settings and click Add Page Numbers.');
        }
      } else {
        previewBody.innerHTML = `<p>${file.name} — ${28tools.formatBytes(file.size)}</p>`;
        28tools.showStatus('statusArea', 'info', 'PDF loaded. Configure settings and click Add Page Numbers.');
      }
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBytes = null;
    };
    reader.readAsArrayBuffer(file);
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });
})();
