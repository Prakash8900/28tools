(function () {
  'use strict';

  // Standard passport photo sizes (width x height in mm at 300 DPI)
  const SIZES = {
    'us':    { label: 'US Passport (51×51mm)', w: 600, h: 600 },
    'eu':    { label: 'EU / UK (35×45mm)',     w: 413, h: 531 },
    'au':    { label: 'Australia (35×45mm)',   w: 413, h: 531 },
    'in':    { label: 'India (35×45mm)',       w: 413, h: 531 },
    'cn':    { label: 'China (33×48mm)',       w: 390, h: 567 },
    'ca':    { label: 'Canada (50×70mm)',      w: 591, h: 827 },
    'id2x2': { label: 'US ID (2×2 in)',        w: 600, h: 600 },
  };

  let img = null, origFile = null, resultBlob = null;
  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const sizeInfo    = document.getElementById('sizeInfo');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn  = document.getElementById('downloadBtn');
  const processBtn   = document.getElementById('processBtn');

  const sizeOptions = Object.entries(SIZES)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Photo Size</label>
      <select class="form-select" id="sizeSelect">${sizeOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">Background Color</label>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="color" id="bgColor" value="#ffffff" style="width:48px;height:36px;border:none;border-radius:6px;cursor:pointer">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" data-color="#ffffff">White</button>
          <button class="btn btn--ghost btn--sm" data-color="#a8c4e0">Light Blue</button>
          <button class="btn btn--ghost btn--sm" data-color="#f0f0f0">Off-White</button>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Fit Mode</label>
      <select class="form-select" id="fitMode">
        <option value="cover">Fill (crop to fit)</option>
        <option value="contain">Fit (letterbox)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Output Format</label>
      <select class="form-select" id="outFmt">
        <option value="image/jpeg">JPG</option>
        <option value="image/png">PNG</option>
      </select>
    </div>`;

  // Quick color preset buttons
  document.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('bgColor').value = btn.dataset.color;
    });
  });

  function generatePhoto() {
    if (!img) return;
    ToolsApp.showStatus('statusArea', 'info', 'Generating…');
    setTimeout(() => {
      try {
        const sizeKey  = document.getElementById('sizeSelect').value;
        const { w, h } = SIZES[sizeKey];
        const bgColor  = document.getElementById('bgColor').value;
        const fitMode  = document.getElementById('fitMode').value;
        const fmt      = document.getElementById('outFmt').value;

        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, w, h);

        // Draw image
        const iw = img.naturalWidth, ih = img.naturalHeight;
        let dx, dy, dw, dh;

        if (fitMode === 'cover') {
          const scale = Math.max(w / iw, h / ih);
          dw = iw * scale; dh = ih * scale;
          dx = (w - dw) / 2; dy = (h - dh) / 2;
        } else {
          const scale = Math.min(w / iw, h / ih);
          dw = iw * scale; dh = ih * scale;
          dx = (w - dw) / 2; dy = (h - dh) / 2;
        }
        ctx.drawImage(img, dx, dy, dw, dh);

        canvas.toBlob(blob => {
          resultBlob = blob;
          const url = URL.createObjectURL(blob);
          previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Passport Photo" style="max-height:400px">`;
          sizeInfo.textContent = `${w}×${h}px | ${ToolsApp.formatBytes(blob.size)}`;
          downloadArea.style.display = '';
          ToolsApp.showStatus('statusArea', 'success', 'Passport photo generated! Click Download to save.');
        }, fmt, 0.95);
      } catch (e) {
        ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
      }
    }, 10);
  }

  processBtn.addEventListener('click', generatePhoto);

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const ext = resultBlob.type.split('/')[1].replace('jpeg', 'jpg');
      const sizeKey = document.getElementById('sizeSelect').value;
      ToolsApp.downloadBlob(resultBlob, `passport-photo-${sizeKey}.${ext}`);
    }
  });

  function loadImage(file) {
    if (!file.type.startsWith('image/')) { ToolsApp.showStatus('statusArea', 'error', 'Please upload an image file.'); return; }
    if (file.size > 20 * 1024 * 1024) { ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 20MB.'); return; }
    origFile = file;
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Original">`;
      sizeInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(file.size)}`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBlob = null;
      ToolsApp.showStatus('statusArea', 'success', 'Photo loaded. Select size and click Generate.');
    };
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
