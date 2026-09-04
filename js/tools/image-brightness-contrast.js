(function () {
  'use strict';
  let img = null, origFile = null, resultBlob = null;
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const workspace = document.getElementById('workspace');
  const previewBody = document.getElementById('previewBody');
  const sizeInfo = document.getElementById('sizeInfo');
  const downloadArea = document.getElementById('downloadArea');
  const downloadBtn = document.getElementById('downloadBtn');
  const processBtn = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Brightness <span id="brightVal">0</span></label>
      <input type="range" class="form-range" id="brightness" min="-150" max="150" value="0">
    </div>
    <div class="form-group">
      <label class="form-label">Contrast <span id="contrastVal">0</span></label>
      <input type="range" class="form-range" id="contrast" min="-100" max="100" value="0">
    </div>
    <div class="form-group">
      <label class="form-label">Saturation <span id="satVal">0</span></label>
      <input type="range" class="form-range" id="saturation" min="-100" max="100" value="0">
    </div>
    <div class="form-group">
      <label class="form-label">Gamma <span id="gammaVal">1.0</span></label>
      <input type="range" class="form-range" id="gamma" min="5" max="30" value="10">
    </div>
    <div class="form-group">
      <button class="btn btn--ghost btn--sm w-full" id="resetBtn">↺ Reset All</button>
    </div>
    <div class="form-group">
      <label class="form-label">Output Format</label>
      <select class="form-select" id="outFmt">
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/webp">WebP</option>
      </select>
    </div>`;

  const brightnessEl = document.getElementById('brightness');
  const contrastEl   = document.getElementById('contrast');
  const saturationEl = document.getElementById('saturation');
  const gammaEl      = document.getElementById('gamma');

  function updateLabels() {
    document.getElementById('brightVal').textContent   = brightnessEl.value;
    document.getElementById('contrastVal').textContent = contrastEl.value;
    document.getElementById('satVal').textContent      = saturationEl.value;
    document.getElementById('gammaVal').textContent    = (gammaEl.value / 10).toFixed(1);
  }

  [brightnessEl, contrastEl, saturationEl, gammaEl].forEach(el =>
    el.addEventListener('input', updateLabels));

  document.getElementById('resetBtn').addEventListener('click', () => {
    brightnessEl.value = 0; contrastEl.value = 0; saturationEl.value = 0; gammaEl.value = 10;
    updateLabels();
  });

  function clamp(v) { return Math.min(255, Math.max(0, v)); }

  function applyAdjustments() {
    if (!img) return;
    ToolsApp.showStatus('statusArea', 'info', 'Processing…');
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;

        const brightness = parseInt(brightnessEl.value);
        const contrast   = parseInt(contrastEl.value);
        const sat        = parseInt(saturationEl.value) / 100;
        const gamma      = parseFloat(gammaEl.value) / 10;

        // Contrast factor
        const cf = (259 * (contrast + 255)) / (255 * (259 - contrast));
        // Gamma lookup table
        const gammaLUT = new Uint8ClampedArray(256);
        for (let i = 0; i < 256; i++) {
          gammaLUT[i] = clamp(Math.round(255 * Math.pow(i / 255, 1 / gamma)));
        }

        for (let i = 0; i < d.length; i += 4) {
          let r = d[i], g = d[i + 1], b = d[i + 2];

          // Brightness
          r += brightness; g += brightness; b += brightness;

          // Contrast
          r = cf * (r - 128) + 128;
          g = cf * (g - 128) + 128;
          b = cf * (b - 128) + 128;

          // Saturation (via luminosity)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray + (r - gray) * (1 + sat);
          g = gray + (g - gray) * (1 + sat);
          b = gray + (b - gray) * (1 + sat);

          // Gamma
          r = gammaLUT[clamp(Math.round(r))];
          g = gammaLUT[clamp(Math.round(g))];
          b = gammaLUT[clamp(Math.round(b))];

          d[i] = r; d[i + 1] = g; d[i + 2] = b;
        }

        ctx.putImageData(imageData, 0, 0);
        const fmt = document.getElementById('outFmt').value;
        canvas.toBlob(blob => {
          resultBlob = blob;
          previewBody.innerHTML = `<img src="${URL.createObjectURL(blob)}" class="preview-img" alt="Result">`;
          sizeInfo.textContent = `${canvas.width}×${canvas.height} | ${ToolsApp.formatBytes(blob.size)}`;
          downloadArea.style.display = '';
          ToolsApp.showStatus('statusArea', 'success', 'Adjustments applied! Click Download to save.');
        }, fmt, 0.92);
      } catch (e) {
        ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
      }
    }, 10);
  }

  processBtn.addEventListener('click', applyAdjustments);

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const ext = resultBlob.type.split('/')[1].replace('jpeg', 'jpg');
      const base = origFile ? origFile.name.replace(/\.[^.]+$/, '') : 'image';
      ToolsApp.downloadBlob(resultBlob, `${base}-adjusted.${ext}`);
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
      ToolsApp.showStatus('statusArea', 'success', 'Image loaded. Adjust sliders and click Apply.');
    };
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
