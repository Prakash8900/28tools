(function () {
  'use strict';
  const uploadZone = document.getElementById('uploadZone');
  const fileInput  = document.getElementById('fileInput');
  const workspace  = document.getElementById('workspace');
  const infoContent = document.getElementById('infoContent');

  function ptToMm(pt) { return (pt * 25.4 / 72).toFixed(1); }
  function ptToIn(pt) { return (pt / 72).toFixed(2); }

  function detectPageFormat(w, h) {
    const W = Math.round(w), H = Math.round(h);
    const landscape = W > H;
    const pw = landscape ? Math.min(W, H) : W;
    const ph = landscape ? Math.max(W, H) : H;
    if (Math.abs(pw - 595) < 3 && Math.abs(ph - 842) < 3) return 'A4' + (landscape ? ' Landscape' : '');
    if (Math.abs(pw - 612) < 3 && Math.abs(ph - 792) < 3) return 'US Letter' + (landscape ? ' Landscape' : '');
    if (Math.abs(pw - 420) < 3 && Math.abs(ph - 595) < 3) return 'A5' + (landscape ? ' Landscape' : '');
    if (Math.abs(pw - 842) < 3 && Math.abs(ph - 1191) < 3) return 'A3' + (landscape ? ' Landscape' : '');
    if (Math.abs(pw - 612) < 3 && Math.abs(ph - 1008) < 3) return 'US Legal' + (landscape ? ' Landscape' : '');
    return null;
  }

  async function analyzeFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      28tools.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    28tools.showStatus('statusArea', 'info', 'Analyzing PDF…');

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const bytes = new Uint8Array(e.target.result);

        // Extract PDF version from header (%PDF-x.x)
        const header = String.fromCharCode(...bytes.slice(0, 8));
        const verMatch = header.match(/%PDF-(\d+\.\d+)/);
        const pdfVersion = verMatch ? verMatch[1] : 'Unknown';

        if (typeof PDFLib === 'undefined') {
          28tools.showStatus('statusArea', 'error', 'PDF library not loaded yet. Please wait and try again.');
          return;
        }

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        // Metadata
        const title    = pdfDoc.getTitle()    || '—';
        const author   = pdfDoc.getAuthor()   || '—';
        const subject  = pdfDoc.getSubject()  || '—';
        const keywords = pdfDoc.getKeywords() || '—';
        const creator  = pdfDoc.getCreator()  || '—';
        const producer = pdfDoc.getProducer() || '—';
        let creationDate = '—', modDate = '—';
        try { const cd = pdfDoc.getCreationDate(); if (cd) creationDate = cd.toLocaleString(); } catch(_) {}
        try { const md = pdfDoc.getModificationDate(); if (md) modDate = md.toLocaleString(); } catch(_) {}

        // Per-page dimensions
        const pages = pdfDoc.getPages();
        const uniqueDims = [];
        const pageDimDetails = pages.map((page, i) => {
          const { width, height } = page.getSize();
          const fmt = detectPageFormat(width, height);
          return { page: i + 1, width, height, fmt };
        });

        // Summarize dimensions
        const dimMap = {};
        pageDimDetails.forEach(({ width, height }) => {
          const key = `${Math.round(width)}x${Math.round(height)}`;
          dimMap[key] = (dimMap[key] || 0) + 1;
        });
        const dimSummary = Object.entries(dimMap).map(([k, count]) => {
          const [w, h] = k.split('x').map(Number);
          return `${w}×${h} pt (${ptToMm(w)}×${ptToMm(h)} mm)${count < pageCount ? ` — ${count} page(s)` : ''}`;
        }).join('<br>');

        workspace.style.display = '';
        infoContent.innerHTML = `
          <h3 style="margin-bottom:12px;font-size:1rem">📄 File Details</h3>
          <table class="info-table">
            <tr><td>File Name</td><td>${file.name}</td></tr>
            <tr><td>File Size</td><td>${28tools.formatBytes(file.size)} (${file.size.toLocaleString()} bytes)</td></tr>
            <tr><td>PDF Version</td><td>${pdfVersion}</td></tr>
            <tr><td>Page Count</td><td>${pageCount}</td></tr>
            <tr><td>Page Dimensions</td><td>${dimSummary}</td></tr>
          </table>

          <h3 style="margin:20px 0 12px;font-size:1rem">🏷️ Metadata</h3>
          <table class="info-table">
            <tr><td>Title</td><td>${title}</td></tr>
            <tr><td>Author</td><td>${author}</td></tr>
            <tr><td>Subject</td><td>${subject}</td></tr>
            <tr><td>Keywords</td><td>${keywords}</td></tr>
            <tr><td>Creator App</td><td>${creator}</td></tr>
            <tr><td>Producer</td><td>${producer}</td></tr>
            <tr><td>Created</td><td>${creationDate}</td></tr>
            <tr><td>Modified</td><td>${modDate}</td></tr>
          </table>

          ${pageCount > 1 && Object.keys(dimMap).length > 1 ? `
          <h3 style="margin:20px 0 12px;font-size:1rem">📐 Per-Page Dimensions</h3>
          <div class="page-dims-grid">
            ${pageDimDetails.map(({ page, width, height, fmt }) => `
              <div class="page-dim-card">
                <strong>Page ${page}</strong><br>
                ${Math.round(width)}×${Math.round(height)} pt<br>
                ${ptToMm(width)}×${ptToMm(height)} mm<br>
                ${ptToIn(width)}×${ptToIn(height)} in
                ${fmt ? `<br><span style="color:var(--clr-primary);font-weight:600">${fmt}</span>` : ''}
              </div>`).join('')}
          </div>` : ''}`;

        28tools.showStatus('statusArea', 'success', `Analysis complete! ${pageCount} page(s) found.`);
      } catch (err) {
        28tools.showStatus('statusArea', 'error', 'Could not read PDF: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) analyzeFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) analyzeFile(fileInput.files[0]); });
})();
