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
      <label class="form-label">Header Text <span style="font-size:.8rem;opacity:.7">(leave blank to skip)</span></label>
      <input type="text" class="form-input" id="headerText" placeholder="e.g. CONFIDENTIAL or My Document" style="width:100%">
    </div>
    <div class="form-group">
      <label class="form-label">Header Alignment</label>
      <select class="form-select" id="headerAlign">
        <option value="center">Center</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>
    </div>
    <div class="form-group" style="border-top:1px solid var(--clr-border);padding-top:12px;margin-top:4px">
      <label class="form-label">Footer Text <span style="font-size:.8rem;opacity:.7">({page} = page num, {total} = total)</span></label>
      <input type="text" class="form-input" id="footerText" placeholder="e.g. Page {page} of {total}" style="width:100%">
    </div>
    <div class="form-group">
      <label class="form-label">Footer Alignment</label>
      <select class="form-select" id="footerAlign">
        <option value="center">Center</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>
    </div>
    <div class="form-group" style="border-top:1px solid var(--clr-border);padding-top:12px;margin-top:4px">
      <label class="form-label">Font Size (pt)</label>
      <input type="number" class="form-input" id="fontSize" value="10" min="6" max="36" style="width:90px">
    </div>
    <div class="form-group">
      <label class="form-label">Margin from Edge (pt)</label>
      <input type="number" class="form-input" id="margin" value="20" min="8" max="100" style="width:90px">
    </div>`;

  async function addHeaderFooter() {
    if (!pdfBytes) return;
    if (typeof PDFLib === 'undefined') { ToolsApp.showStatus('statusArea', 'error', 'PDF library not loaded yet. Please wait.'); return; }

    const headerText = document.getElementById('headerText').value.trim();
    const footerText = document.getElementById('footerText').value.trim();
    if (!headerText && !footerText) {
      ToolsApp.showStatus('statusArea', 'error', 'Please enter at least a header or footer text.'); return;
    }

    ToolsApp.showStatus('statusArea', 'info', 'Processing…');
    processBtn.disabled = true;

    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages  = pdfDoc.getPages();
      const total  = pages.length;
      const fontSize = parseInt(document.getElementById('fontSize').value) || 10;
      const margin   = parseInt(document.getElementById('margin').value) || 20;
      const headerAlign = document.getElementById('headerAlign').value;
      const footerAlign = document.getElementById('footerAlign').value;

      const color = rgb(0.2, 0.2, 0.2);

      function resolveText(tmpl, pageNum) {
        return tmpl.replace('{page}', pageNum).replace('{total}', total);
      }

      function getX(text, pageWidth, align) {
        const tw = font.widthOfTextAtSize(text, fontSize);
        if (align === 'left')  return margin;
        if (align === 'right') return pageWidth - tw - margin;
        return (pageWidth - tw) / 2;
      }

      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const pageNum = i + 1;

        if (headerText) {
          const resolved = resolveText(headerText, pageNum);
          page.drawText(resolved, {
            x: getX(resolved, width, headerAlign),
            y: height - margin - fontSize,
            size: fontSize, font, color
          });
        }
        if (footerText) {
          const resolved = resolveText(footerText, pageNum);
          page.drawText(resolved, {
            x: getX(resolved, width, footerAlign),
            y: margin,
            size: fontSize, font, color
          });
        }
      });

      resultBytes = await pdfDoc.save();
      ToolsApp.showStatus('statusArea', 'success', `Header/Footer added to all ${total} pages!`);
      downloadArea.style.display = '';
    } catch (e) {
      ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', addHeaderFooter);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      const base = origFile ? origFile.name.replace(/\.pdf$/i, '') : 'document';
      ToolsApp.downloadBlob(blob, `${base}-with-header-footer.pdf`);
    }
  });

  function loadFile(file) {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      ToolsApp.showStatus('statusArea', 'error', 'Please upload a PDF file.'); return;
    }
    if (file.size > 50 * 1024 * 1024) { ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 50MB.'); return; }
    origFile = file;
    const reader = new FileReader();
    reader.onload = async e => {
      pdfBytes = new Uint8Array(e.target.result);
      previewBody.innerHTML = `
        <div style="display:grid;gap:8px">
          <div class="info-row"><span>File:</span><strong>${file.name}</strong></div>
          <div class="info-row"><span>Size:</span><strong>${ToolsApp.formatBytes(file.size)}</strong></div>
        </div>`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBytes = null;
      ToolsApp.showStatus('statusArea', 'success', 'PDF loaded. Enter header/footer text and click Add.');
    };
    reader.readAsArrayBuffer(file);
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); });
})();
