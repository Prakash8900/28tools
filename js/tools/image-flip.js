(function () {
  'use strict';
  let img = null, origFile = null, resultBlob = null, flipH = false, flipV = false;
  const uploadZone = document.getElementById('uploadZone');
  const fileInput  = document.getElementById('fileInput');
  const workspace  = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const sizeInfo   = document.getElementById('sizeInfo');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Flip Direction</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" id="btnFlipH">↔ Horizontal</button>
        <button class="btn btn--ghost btn--sm" id="btnFlipV">↕ Vertical</button>
        <button class="btn btn--ghost btn--sm" id="btnFlipBoth">⤡ Both</button>
        <button class="btn btn--ghost btn--sm" id="btnReset">↺ Reset</button>
      </div>
    </div>
    <div class="form-group" style="background:var(--clr-surface-alt,#f3f4f6);border-radius:8px;padding:10px 12px">
      <p style="margin:0;font-size:.85rem;color:var(--clr-text-muted)">
        State: <strong id="flipState">No flip</strong>
      </p>
    </div>
    <div class="form-group">
      <label class="form-label">Output Format</label>
      <select class="form-select" id="outFmt">
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/webp">WebP</option>
      </select>
    </div>`;

  function updateState() {
    const parts = [];
    if (flipH) parts.push('Horizontal');
    if (flipV) parts.push('Vertical');
    document.getElementById('flipState').textContent = parts.length ? parts.join(' + ') : 'No flip';
  }

  document.getElementById('btnFlipH').addEventListener('click', () => { flipH = !flipH; updateState(); applyFlip(); });
  document.getElementById('btnFlipV').addEventListener('click', () => { flipV = !flipV; updateState(); applyFlip(); });
  document.getElementById('btnFlipBoth').addEventListener('click', () => { flipH = !flipH || true; flipV = !flipV || true; updateState(); applyFlip(); });
  document.getElementById('btnReset').addEventListener('click', () => { flipH = false; flipV = false; updateState(); applyFlip(); });

  function applyFlip() {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(flipH ? canvas.width : 0, flipV ? canvas.height : 0);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

    const fmt = document.getElementById('outFmt').value;
    canvas.toBlob(blob => {
      resultBlob = blob;
      const url = URL.createObjectURL(blob);
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Flipped">`;
      sizeInfo.textContent = `${canvas.width}×${canvas.height} | ${ToolsApp.formatBytes(blob.size)}`;
      downloadArea.style.display = '';
    }, fmt, 0.92);
  }

  processBtn.addEventListener('click', applyFlip);

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const ext = resultBlob.type.split('/')[1].replace('jpeg', 'jpg');
      const dir = (flipH && flipV) ? 'both' : flipH ? 'horizontal' : flipV ? 'vertical' : 'flipped';
      const base = origFile ? origFile.name.replace(/\.[^.]+$/, '') : 'image';
      ToolsApp.downloadBlob(resultBlob, `${base}-flip-${dir}.${ext}`);
    }
  });

  function loadImage(file) {
    if (!file.type.startsWith('image/')) { ToolsApp.showStatus('statusArea', 'error', 'Please upload an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) { ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 20MB.'); return; }
    origFile = file; flipH = false; flipV = false;
    updateState();
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Original">`;
      sizeInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(file.size)}`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBlob = null;
      ToolsApp.showStatus('statusArea', 'success', 'Image loaded. Choose a flip direction.');
    };
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
