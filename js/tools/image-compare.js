(function () {
  'use strict';
  let imgBefore = null, imgAfter = null;
  let isDragging = false;
  let sliderPct = 50;

  const workspace    = document.getElementById('workspace');
  const compareWrapper = document.getElementById('compareWrapper');
  const handle       = document.getElementById('compareHandle');
  const imgBeforeEl  = document.getElementById('imgBefore');
  const imgAfterEl   = document.getElementById('imgAfter');
  const sliderRange  = document.getElementById('sliderRange');
  const sliderPctEl  = document.getElementById('sliderPct');

  function setSlider(pct) {
    sliderPct = Math.min(100, Math.max(0, pct));
    handle.style.left = sliderPct + '%';
    imgAfterEl.style.clipPath = `inset(0 0 0 ${sliderPct}%)`;
    sliderRange.value = sliderPct;
    sliderPctEl.textContent = Math.round(sliderPct) + '%';
  }

  function getEventX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    return e.clientX;
  }

  function onMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const rect = compareWrapper.getBoundingClientRect();
    const x = getEventX(e) - rect.left;
    setSlider((x / rect.width) * 100);
  }

  compareWrapper.addEventListener('mousedown', e => { isDragging = true; onMove(e); });
  compareWrapper.addEventListener('touchstart', e => { isDragging = true; onMove(e); }, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  sliderRange.addEventListener('input', () => setSlider(parseInt(sliderRange.value)));

  function checkShowWorkspace() {
    if (imgBefore && imgAfter) {
      workspace.style.display = '';
      setSlider(50);
      ToolsApp.showStatus('statusArea', 'success', 'Both images loaded! Drag the handle to compare.');
    }
  }

  function setupZone(zoneId, inputId, side) {
    const zone  = document.getElementById(zoneId);
    const input = document.getElementById(inputId);

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0], side, zone);
    });
    input.addEventListener('change', () => { if (input.files[0]) loadFile(input.files[0], side, zone); });
  }

  function loadFile(file, side, zone) {
    if (!file.type.startsWith('image/')) {
      ToolsApp.showStatus('statusArea', 'error', 'Please upload an image file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      ToolsApp.showStatus('statusArea', 'error', 'File too large. Max 20MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (side === 'before') {
        imgBefore = img;
        imgBeforeEl.src = url;
        zone.innerHTML = `<img src="${url}" style="max-height:100px;border-radius:6px;object-fit:cover">
          <div style="font-size:.8rem;margin-top:4px;font-weight:600">${file.name}</div>`;
      } else {
        imgAfter = img;
        imgAfterEl.src = url;
        zone.innerHTML = `<img src="${url}" style="max-height:100px;border-radius:6px;object-fit:cover">
          <div style="font-size:.8rem;margin-top:4px;font-weight:600">${file.name}</div>`;
      }
      checkShowWorkspace();
    };
    img.src = url;
  }

  setupZone('uploadZoneBefore', 'fileInputBefore', 'before');
  setupZone('uploadZoneAfter',  'fileInputAfter',  'after');
})();
