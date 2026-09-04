(function () {
  'use strict';
  let pdfBytes = null, origFile = null, resultBytes = null;
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const sizeInfo    = document.getElementById('sizeInfo');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Render Quality</label>
      <select class="form-select" id="renderScale">
        <option value="1">Standard (96 DPI)</option>
        <option value="1.5" selected>Good (144 DPI)</option>
        <option value="2">High (192 DPI)</option>
        <option value="2.5">Very High (240 DPI)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">JPEG Quality <span id="jpegQualVal">85</span>%</label>
      <input type="range" class="form-range" id="jpegQual" min="50" max="100" value="85">
    </div>
    <div style="background:var(--clr-surface-alt,#f3f4f6);border-radius:8px;padding:10px 12px;font-size:.82rem;color:var(--clr-text-muted)">
      ℹ️ Pages are rasterized and embedded as grayscale images. Text will not be selectable in the output.
    </div>`;

  document.getElementById('jpegQual').addEventListener('input', e => {
    document.getElementById('jpegQualVal').textContent = e.target.value;
  });

  function makeGrayscale(ctx, w, h) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]);
      d[i] = gray; d[i+1] = gray; d[i+2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  async function convert() {
    if (!pdfBytes) return;
    if (typeof PDFLib === 'undefined') { ToolsApp.showStatus('statusArea', 'error', 'PDF library not loaded. Please wait.'); return; }
    if (!window.pdfjsLib) { ToolsApp.showStatus('statusArea', 'error', 'PDF.js not loaded. Please refresh.'); return; }

    ToolsApp.showStatus('statusArea', 'info', 'Loading PDF…');
    processBtn.disabled = true;

    try {
      const scale    = parseFloat(document.getElementById('renderScale').value);
      const jpegQ    = parseInt(document.getElementById('jpegQual').value) / 100;
      const { PDFDocument } = PDFLib;

      const pdfJsDoc = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const pageCount = pdfJsDoc.numPages;
      const newDoc    = await PDFDocument.create();

      for (let i = 1; i <= pageCount; i++) {
        ToolsApp.showStatus('statusArea', 'info', `Converting page ${i}/${pageCount}…`);
        const page = await pdfJsDoc.getPage(i);
        const vp   = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;

        // Convert to grayscale
        makeGrayscale(ctx, canvas.width, canvas.height);

        // Embed as JPEG image in new PDF page
        const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQ);
        const jpegBytes   = await fetch(jpegDataUrl).then(r => r.arrayBuffer());
        const jpegImage   = await newDoc.embedJpg(new Uint8Array(jpegBytes));
        const pdfPage     = newDoc.addPage([canvas.width, canvas.height]);
        pdfPage.drawImage(jpegImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });

        // Show first page preview
        if (i === 1) {
          previewBody.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', jpegQ)}" class="preview-img" alt="Preview">`;
          sizeInfo.textContent = `${canvas.width}×${canvas.height}px`;
        }
      }

      resultBytes = await newDoc.save();
      ToolsApp.showStatus('statusArea', 'success', `Converted ${pageCount} pages to grayscale! Size: ${ToolsApp.formatBytes(resultBytes.byteLength)}`);
      downloadArea.style.display = '';
    } catch (e) {
      ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', convert);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const base = origFile ? origFile.name.replace(/\.pdf$/i, '') : 'document';
      ToolsApp.downloadBlob(blob, `${base}-grayscale.pdf`);
    }
  });

  function loadFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      ToolsApp.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    if (file.size > 30 * 1024 * 1024) { ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 30MB.'); return; }
    origFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      pdfBytes = new Uint8Array(e.target.result);
      previewBody.innerHTML = `<p style="color:var(--clr-text-muted)">${file.name} — ${ToolsApp.formatBytes(file.size)}</p>`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBytes = null;
      ToolsApp.showStatus('statusArea', 'success', 'PDF loaded. Select quality and click Convert.');
    };
    reader.readAsArrayBuffer(file);
  }

  // Init pdf.js worker
  function initPdfJs() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs';
    }
  }
  setTimeout(initPdfJs, 800);

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });
})();
