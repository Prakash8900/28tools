(function () {
  'use strict';
  let img = null, origFile = null, resultBlob = null;
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
      <label class="form-label">Block Size <span id="blockVal">16</span>px</label>
      <input type="range" class="form-range" id="blockSize" min="2" max="80" value="16">
    </div>
    <div class="form-group">
      <label class="form-label">Quick Presets</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn--ghost btn--sm" data-block="4">Fine (4px)</button>
        <button class="btn btn--ghost btn--sm" data-block="12">Light (12px)</button>
        <button class="btn btn--ghost btn--sm" data-block="24">Medium (24px)</button>
        <button class="btn btn--ghost btn--sm" data-block="48">Heavy (48px)</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Output Format</label>
      <select class="form-select" id="outFmt">
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/webp">WebP</option>
      </select>
    </div>`;

  const blockRange = document.getElementById('blockSize');
  const blockVal   = document.getElementById('blockVal');
  blockRange.addEventListener('input', () => { blockVal.textContent = blockRange.value; });

  document.querySelectorAll('[data-block]').forEach(btn => {
    btn.addEventListener('click', () => {
      blockRange.value = btn.dataset.block;
      blockVal.textContent = btn.dataset.block;
    });
  });

  function pixelate() {
    if (!img) return;
    28tools.showStatus('statusArea', 'info', 'Pixelating…');
    setTimeout(() => {
      try {
        const blockSize = parseInt(blockRange.value);
        const w = img.naturalWidth, h = img.naturalHeight;

        // Small canvas for downsampled version
        const small = document.createElement('canvas');
        const sw = Math.max(1, Math.ceil(w / blockSize));
        const sh = Math.max(1, Math.ceil(h / blockSize));
        small.width = sw; small.height = sh;
        const sCtx = small.getContext('2d');
        sCtx.imageSmoothingEnabled = true;
        sCtx.drawImage(img, 0, 0, sw, sh);

        // Scale back up with pixelated rendering
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(small, 0, 0, sw, sh, 0, 0, w, h);

        const fmt = document.getElementById('outFmt').value;
        canvas.toBlob(blob => {
          resultBlob = blob;
          const url = URL.createObjectURL(blob);
          previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Pixelated">`;
          sizeInfo.textContent = `${w}×${h}px | Block: ${blockSize}px | ${28tools.formatBytes(blob.size)}`;
          downloadArea.style.display = '';
          28tools.showStatus('statusArea', 'success', 'Pixelation applied! Click Download to save.');
        }, fmt, 0.92);
      } catch (e) {
        28tools.showStatus('statusArea', 'error', 'Error: ' + e.message);
      }
    }, 10);
  }

  processBtn.addEventListener('click', pixelate);

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const ext = resultBlob.type.split('/')[1].replace('jpeg', 'jpg');
      const base = origFile ? origFile.name.replace(/\.[^.]+$/, '') : 'image';
      28tools.downloadBlob(resultBlob, `${base}-pixelated.${ext}`);
    }
  });

  function loadImage(file) {
    if (!file.type.startsWith('image/')) { 28tools.showStatus('statusArea', 'error', 'Please upload an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) { 28tools.showStatus('statusArea', 'error', 'File too large. Max 20MB.'); return; }
    origFile = file;
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Original">`;
      sizeInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} | ${28tools.formatBytes(file.size)}`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBlob = null;
      28tools.showStatus('statusArea', 'success', 'Image loaded. Set block size and click Apply.');
    };
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
