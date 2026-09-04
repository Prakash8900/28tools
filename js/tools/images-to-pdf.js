(function () {
  'use strict';
  let imageFiles = []; // Array of {file, url, name}
  let resultBytes = null;
  let dragSrcIdx = null;

  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const imgList     = document.getElementById('imgList');
  const imgCount    = document.getElementById('imgCount');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Page Size</label>
      <select class="form-select" id="pageSize">
        <option value="fit">Fit to image</option>
        <option value="a4">A4 (595×842 pt)</option>
        <option value="letter">Letter (612×792 pt)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Image Fit</label>
      <select class="form-select" id="imageFit">
        <option value="contain">Fit (keep aspect ratio)</option>
        <option value="fill">Stretch to fill page</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">JPEG Quality <span id="qualVal">90</span>%</label>
      <input type="range" class="form-range" id="quality" min="50" max="100" value="90">
    </div>
    <div class="form-group">
      <label class="form-label">Page Margin (pt)</label>
      <input type="number" class="form-input" id="margin" value="0" min="0" max="72" style="width:90px">
    </div>`;

  document.getElementById('quality').addEventListener('input', e => {
    document.getElementById('qualVal').textContent = e.target.value;
  });

  function renderList() {
    imgCount.textContent = imageFiles.length;
    if (!imageFiles.length) { imgList.innerHTML = ''; return; }

    imgList.innerHTML = imageFiles.map((f, i) => `
      <div class="img-item" draggable="true" data-idx="${i}" id="imgitem-${i}">
        <div class="img-item__num">${i + 1}</div>
        <img src="${f.url}" alt="${f.name}" loading="lazy">
        <div class="img-item__footer">
          <span title="${f.name}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:70px">${f.name}</span>
          <button class="img-item__del" data-del="${i}" title="Remove">✕</button>
        </div>
      </div>`).join('');

    // Drag-to-reorder
    imgList.querySelectorAll('.img-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrcIdx = parseInt(item.dataset.idx);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        imgList.querySelectorAll('.img-item').forEach(i2 => i2.classList.remove('drag-over-item'));
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        imgList.querySelectorAll('.img-item').forEach(i2 => i2.classList.remove('drag-over-item'));
        item.classList.add('drag-over-item');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        const targetIdx = parseInt(item.dataset.idx);
        if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
        const moved = imageFiles.splice(dragSrcIdx, 1)[0];
        imageFiles.splice(targetIdx, 0, moved);
        dragSrcIdx = null;
        renderList();
      });
    });

    // Delete buttons
    imgList.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.del);
        imageFiles.splice(idx, 1);
        renderList();
        if (!imageFiles.length) { workspace.style.display = 'none'; }
      });
    });
  }

  function addFiles(files) {
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        ToolsApp.showStatus('statusArea', 'error', `${file.name} is too large (max 10MB). Skipped.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      imageFiles.push({ file, url, name: file.name.replace(/\.[^.]+$/, '') });
      added++;
    }
    if (added > 0) {
      workspace.style.display = '';
      renderList();
      ToolsApp.showStatus('statusArea', 'success', `${added} image(s) added. Total: ${imageFiles.length}. Reorder if needed, then Convert.`);
    }
  }

  async function convertToPDF() {
    if (!imageFiles.length) { ToolsApp.showStatus('statusArea', 'error', 'Add at least one image.'); return; }
    if (typeof PDFLib === 'undefined') { ToolsApp.showStatus('statusArea', 'error', 'PDF library not loaded yet. Please wait.'); return; }

    ToolsApp.showStatus('statusArea', 'info', 'Converting…');
    processBtn.disabled = true;

    try {
      const { PDFDocument } = PDFLib;
      const pdfDoc  = await PDFDocument.create();
      const pageOpt = document.getElementById('pageSize').value;
      const fitOpt  = document.getElementById('imageFit').value;
      const quality = parseInt(document.getElementById('quality').value) / 100;
      const margin  = parseInt(document.getElementById('margin').value) || 0;

      for (let i = 0; i < imageFiles.length; i++) {
        ToolsApp.showStatus('statusArea', 'info', `Processing image ${i + 1}/${imageFiles.length}…`);
        const { file, url } = imageFiles[i];

        // Draw to canvas to get jpeg bytes
        const img = await new Promise((res, rej) => {
          const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const jpegUrl   = canvas.toDataURL('image/jpeg', quality);
        const jpegBuf   = await fetch(jpegUrl).then(r => r.arrayBuffer());
        const jpegImg   = await pdfDoc.embedJpg(new Uint8Array(jpegBuf));

        let pw, ph;
        if (pageOpt === 'fit')    { pw = img.naturalWidth; ph = img.naturalHeight; }
        else if (pageOpt === 'a4') { pw = 595; ph = 842; }
        else { pw = 612; ph = 792; }

        const page = pdfDoc.addPage([pw, ph]);
        const avW = pw - margin * 2, avH = ph - margin * 2;

        let dw, dh, dx = margin, dy = margin;
        if (fitOpt === 'fill') { dw = avW; dh = avH; }
        else {
          const scale = Math.min(avW / img.naturalWidth, avH / img.naturalHeight);
          dw = img.naturalWidth * scale; dh = img.naturalHeight * scale;
          dx = margin + (avW - dw) / 2; dy = margin + (avH - dh) / 2;
        }
        // pdf-lib y is from bottom
        page.drawImage(jpegImg, { x: dx, y: ph - dy - dh, width: dw, height: dh });
      }

      resultBytes = await pdfDoc.save();
      ToolsApp.showStatus('statusArea', 'success', `PDF created with ${imageFiles.length} pages! Size: ${ToolsApp.formatBytes(resultBytes.byteLength)}`);
      downloadArea.style.display = '';
    } catch (e) {
      ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
    }
    processBtn.disabled = false;
  }

  processBtn.addEventListener('click', convertToPDF);

  downloadBtn.addEventListener('click', () => {
    if (resultBytes) {
      const blob = new Blob([resultBytes], { type: 'application/pdf' });
      ToolsApp.downloadBlob(blob, 'images-converted.pdf');
    }
  });

  document.getElementById('clearAllBtn').addEventListener('click', () => {
    imageFiles = []; renderList(); workspace.style.display = 'none';
    ToolsApp.showStatus('statusArea', 'info', 'All images cleared.');
  });

  document.getElementById('addMoreBtn').addEventListener('click', () => {
    document.getElementById('addMoreInput').click();
  });
  document.getElementById('addMoreInput').addEventListener('change', e => {
    if (e.target.files.length) addFiles(e.target.files);
  });

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) addFiles(fileInput.files); });
})();
