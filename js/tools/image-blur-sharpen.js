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

  // Build controls
  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Effect</label>
      <select class="form-select" id="effectMode">
        <option value="blur">Gaussian Blur</option>
        <option value="sharpen">Sharpen (Unsharp Mask)</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Intensity <span id="intensityVal">5</span></label>
      <input type="range" class="form-range" id="intensity" min="1" max="20" value="5">
    </div>
    <div class="form-group">
      <label class="form-label">Output Format</label>
      <select class="form-select" id="outFmt">
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPG</option>
        <option value="image/webp">WebP</option>
      </select>
    </div>`;

  const intensityRange = document.getElementById('intensity');
  const intensityVal = document.getElementById('intensityVal');
  intensityRange.addEventListener('input', () => { intensityVal.textContent = intensityRange.value; });

  /* ---- Box blur (one pass horizontal then vertical) ---- */
  function boxBlurH(src, dst, w, h, r) {
    const iarr = 1 / (r + r + 1);
    for (let i = 0; i < h; i++) {
      let ti = i * w, li = ti, ri = ti + r;
      let fv_r = src[ti * 4], fv_g = src[ti * 4 + 1], fv_b = src[ti * 4 + 2];
      let lv_r = src[(ti + w - 1) * 4], lv_g = src[(ti + w - 1) * 4 + 1], lv_b = src[(ti + w - 1) * 4 + 2];
      let val_r = (r + 1) * fv_r, val_g = (r + 1) * fv_g, val_b = (r + 1) * fv_b;
      for (let j = 0; j < r; j++) {
        const idx = (ti + j) * 4;
        val_r += src[idx]; val_g += src[idx + 1]; val_b += src[idx + 2];
      }
      for (let j = 0; j <= r; j++) {
        const ri4 = ri++ * 4, ti4 = ti * 4;
        val_r += src[ri4] - fv_r; val_g += src[ri4 + 1] - fv_g; val_b += src[ri4 + 2] - fv_b;
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        ti++;
      }
      for (let j = r + 1; j < w - r; j++) {
        const ri4 = ri++ * 4, li4 = li++ * 4, ti4 = ti * 4;
        val_r += src[ri4] - src[li4]; val_g += src[ri4 + 1] - src[li4 + 1]; val_b += src[ri4 + 2] - src[li4 + 2];
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        ti++;
      }
      for (let j = w - r; j < w; j++) {
        const li4 = li++ * 4, ti4 = ti * 4;
        val_r += lv_r - src[li4]; val_g += lv_g - src[li4 + 1]; val_b += lv_b - src[li4 + 2];
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        ti++;
      }
    }
  }

  function boxBlurV(src, dst, w, h, r) {
    const iarr = 1 / (r + r + 1);
    for (let i = 0; i < w; i++) {
      let ti = i, li = ti, ri = ti + r * w;
      let fv_r = src[ti * 4], fv_g = src[ti * 4 + 1], fv_b = src[ti * 4 + 2];
      let lv_r = src[(ti + w * (h - 1)) * 4], lv_g = src[(ti + w * (h - 1)) * 4 + 1], lv_b = src[(ti + w * (h - 1)) * 4 + 2];
      let val_r = (r + 1) * fv_r, val_g = (r + 1) * fv_g, val_b = (r + 1) * fv_b;
      for (let j = 0; j < r; j++) { val_r += src[(ti + j * w) * 4]; val_g += src[(ti + j * w) * 4 + 1]; val_b += src[(ti + j * w) * 4 + 2]; }
      for (let j = 0; j <= r; j++) {
        const ri4 = ri * 4, ti4 = ti * 4;
        val_r += src[ri4] - fv_r; val_g += src[ri4 + 1] - fv_g; val_b += src[ri4 + 2] - fv_b;
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        ri += w; ti += w;
      }
      for (let j = r + 1; j < h - r; j++) {
        const ri4 = ri * 4, li4 = li * 4, ti4 = ti * 4;
        val_r += src[ri4] - src[li4]; val_g += src[ri4 + 1] - src[li4 + 1]; val_b += src[ri4 + 2] - src[li4 + 2];
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        ri += w; li += w; ti += w;
      }
      for (let j = h - r; j < h; j++) {
        const li4 = li * 4, ti4 = ti * 4;
        val_r += lv_r - src[li4]; val_g += lv_g - src[li4 + 1]; val_b += lv_b - src[li4 + 2];
        dst[ti4] = Math.round(val_r * iarr); dst[ti4 + 1] = Math.round(val_g * iarr); dst[ti4 + 2] = Math.round(val_b * iarr); dst[ti4 + 3] = src[ti4 + 3];
        li += w; ti += w;
      }
    }
  }

  function gaussianBlur(data, w, h, radius) {
    const tmp = new Uint8ClampedArray(data.length);
    const buf = new Uint8ClampedArray(data.length);
    // 3-pass box blur approximates Gaussian
    buf.set(data);
    for (let pass = 0; pass < 3; pass++) {
      boxBlurH(buf, tmp, w, h, radius);
      boxBlurV(tmp, buf, w, h, radius);
    }
    data.set(buf);
  }

  function sharpen(data, w, h, amount) {
    // Unsharp mask: original + amount * (original - blurred)
    const blurred = new Uint8ClampedArray(data);
    gaussianBlur(blurred, w, h, Math.max(1, Math.round(amount / 3)));
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = Math.min(255, Math.max(0, data[i]     + amount * (data[i]     - blurred[i])));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + amount * (data[i + 1] - blurred[i + 1])));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + amount * (data[i + 2] - blurred[i + 2])));
    }
  }

  function applyEffect() {
    if (!img) return;
    28tools.showStatus('statusArea', 'info', 'Processing…');
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;
        const intensity = parseInt(document.getElementById('intensity').value);
        const mode = document.getElementById('effectMode').value;
        if (mode === 'blur') {
          gaussianBlur(data, canvas.width, canvas.height, intensity);
        } else {
          sharpen(data, canvas.width, canvas.height, intensity / 5);
        }
        ctx.putImageData(imageData, 0, 0);
        const fmt = document.getElementById('outFmt').value;
        canvas.toBlob(blob => {
          resultBlob = blob;
          const url = URL.createObjectURL(blob);
          previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Result">`;
          sizeInfo.textContent = `${canvas.width}×${canvas.height} | ${28tools.formatBytes(blob.size)}`;
          downloadArea.style.display = '';
          28tools.showStatus('statusArea', 'success', 'Effect applied! Click Download to save.');
        }, fmt, 0.92);
      } catch (e) {
        28tools.showStatus('statusArea', 'error', 'Error: ' + e.message);
      }
    }, 10);
  }

  processBtn.addEventListener('click', applyEffect);

  downloadBtn.addEventListener('click', () => {
    if (resultBlob) {
      const ext = resultBlob.type.split('/')[1].replace('jpeg', 'jpg');
      const base = origFile ? origFile.name.replace(/\.[^.]+$/, '') : 'image';
      const mode = document.getElementById('effectMode').value;
      28tools.downloadBlob(resultBlob, `${base}-${mode}.${ext}`);
    }
  });

  function loadImage(file) {
    if (!file.type.startsWith('image/')) {
      28tools.showStatus('statusArea', 'error', 'Please upload an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      28tools.showStatus('statusArea', 'error', 'File too large. Max 20MB.');
      return;
    }
    origFile = file;
    const url = URL.createObjectURL(file);
    img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Original">`;
      sizeInfo.textContent = `${img.naturalWidth}×${img.naturalHeight} | ${28tools.formatBytes(file.size)}`;
      workspace.style.display = '';
      downloadArea.style.display = 'none';
      resultBlob = null;
      28tools.showStatus('statusArea', 'success', 'Image loaded. Adjust settings and click Apply.');
    };
    img.onerror = () => 28tools.showStatus('statusArea', 'error', 'Could not load image.');
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
