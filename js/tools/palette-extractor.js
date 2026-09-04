(function () {
  'use strict';
  let img = null, origFile = null;
  const uploadZone   = document.getElementById('uploadZone');
  const fileInput    = document.getElementById('fileInput');
  const workspace    = document.getElementById('workspace');
  const previewBody  = document.getElementById('previewBody');
  const sizeInfo     = document.getElementById('sizeInfo');
  const paletteArea  = document.getElementById('paletteArea');
  const processBtn   = document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML = `
    <div class="form-group">
      <label class="form-label">Number of Colors <span id="colorCountVal">8</span></label>
      <input type="range" class="form-range" id="colorCount" min="4" max="16" value="8">
    </div>
    <div class="form-group">
      <label class="form-label">Sample Quality</label>
      <select class="form-select" id="sampleQuality">
        <option value="fast">Fast (every 10th pixel)</option>
        <option value="balanced" selected>Balanced (every 4th pixel)</option>
        <option value="precise">Precise (every pixel)</option>
      </select>
    </div>`;

  const colorCountRange = document.getElementById('colorCount');
  colorCountRange.addEventListener('input', () => {
    document.getElementById('colorCountVal').textContent = colorCountRange.value;
  });

  // Median Cut algorithm for color quantization
  function medianCut(pixels, depth, maxDepth) {
    if (depth === maxDepth || pixels.length === 0) {
      // Return average color of this bucket
      let r = 0, g = 0, b = 0;
      for (const p of pixels) { r += p[0]; g += p[1]; b += p[2]; }
      const n = pixels.length;
      return [{ r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), count: n }];
    }

    // Find the channel with the largest range
    let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
    for (const p of pixels) {
      if (p[0] < rMin) rMin = p[0]; if (p[0] > rMax) rMax = p[0];
      if (p[1] < gMin) gMin = p[1]; if (p[1] > gMax) gMax = p[1];
      if (p[2] < bMin) bMin = p[2]; if (p[2] > bMax) bMax = p[2];
    }
    const rRange = rMax - rMin, gRange = gMax - gMin, bRange = bMax - bMin;
    let sortChannel;
    if (rRange >= gRange && rRange >= bRange) sortChannel = 0;
    else if (gRange >= rRange && gRange >= bRange) sortChannel = 1;
    else sortChannel = 2;

    pixels.sort((a, b) => a[sortChannel] - b[sortChannel]);
    const mid = Math.floor(pixels.length / 2);

    return [
      ...medianCut(pixels.slice(0, mid), depth + 1, maxDepth),
      ...medianCut(pixels.slice(mid), depth + 1, maxDepth),
    ];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function extractPalette() {
    if (!img) return;
    ToolsApp.showStatus('statusArea', 'info', 'Analyzing image colors…');

    setTimeout(() => {
      try {
        const colorCount = parseInt(colorCountRange.value);
        const quality    = document.getElementById('sampleQuality').value;
        const step = quality === 'fast' ? 10 : quality === 'balanced' ? 4 : 1;

        // Sample pixels
        const canvas = document.createElement('canvas');
        const maxDim = 400; // limit for speed
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width  = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels = [];
        for (let i = 0; i < imageData.length; i += 4 * step) {
          const a = imageData[i + 3];
          if (a < 128) continue; // skip transparent
          pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
        }

        // Median cut: depth = log2(colorCount)
        const depth = Math.ceil(Math.log2(colorCount));
        let palette = medianCut(pixels, 0, depth);

        // Trim or pad to requested count
        palette = palette.slice(0, colorCount);
        // Sort by count descending
        palette.sort((a, b) => b.count - a.count);

        // Render palette
        const swatches = palette.map(({ r, g, b, count }) => {
          const hex = rgbToHex(r, g, b);
          const lum = getLuminance(r, g, b);
          const textColor = lum > 128 ? '#1a1a2e' : '#ffffff';
          const pct = pixels.length > 0 ? Math.round(count / pixels.length * 100) : 0;
          return `
            <div class="palette-swatch" data-hex="${hex}" title="Click to copy HEX"
              style="background:${hex};color:${textColor};cursor:pointer;
                     border-radius:10px;padding:16px 12px;text-align:center;
                     flex:1;min-width:80px;max-width:140px;transition:transform .15s">
              <div style="font-weight:700;font-size:1rem;letter-spacing:.5px">${hex}</div>
              <div style="font-size:.78rem;margin-top:4px;opacity:.85">rgb(${r},${g},${b})</div>
              <div style="font-size:.75rem;margin-top:2px;opacity:.7">${pct}%</div>
            </div>`;
        }).join('');

        paletteArea.innerHTML = `
          <div class="preview-panel">
            <div class="preview-panel__header">
              <span class="preview-panel__title">🎨 Extracted Palette (${palette.length} colors)</span>
              <span class="text-muted" style="font-size:.8rem">Click swatch to copy HEX</span>
            </div>
            <div style="padding:16px;display:flex;flex-wrap:wrap;gap:10px">${swatches}</div>
            <div id="copyFeedback" style="padding:0 16px 12px;font-size:.85rem;color:var(--clr-primary);height:20px"></div>
          </div>`;

        // Click to copy
        paletteArea.querySelectorAll('.palette-swatch').forEach(sw => {
          sw.addEventListener('mouseenter', () => { sw.style.transform = 'scale(1.05)'; });
          sw.addEventListener('mouseleave', () => { sw.style.transform = ''; });
          sw.addEventListener('click', () => {
            navigator.clipboard.writeText(sw.dataset.hex).then(() => {
              document.getElementById('copyFeedback').textContent = `✅ Copied ${sw.dataset.hex} to clipboard`;
              setTimeout(() => {
                const fb = document.getElementById('copyFeedback');
                if (fb) fb.textContent = '';
              }, 2500);
            }).catch(() => {
              document.getElementById('copyFeedback').textContent = sw.dataset.hex;
            });
          });
        });

        ToolsApp.showStatus('statusArea', 'success', `Extracted ${palette.length} dominant colors!`);
      } catch (e) {
        ToolsApp.showStatus('statusArea', 'error', 'Error: ' + e.message);
      }
    }, 10);
  }

  processBtn.addEventListener('click', extractPalette);

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
      paletteArea.innerHTML = '';
      ToolsApp.showStatus('statusArea', 'success', 'Image loaded. Click Extract Palette.');
    };
    img.src = url;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImage(fileInput.files[0]); });
})();
