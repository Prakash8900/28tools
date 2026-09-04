/**
 * image-compressor.js
 * Uses Canvas API for compression. No external libraries needed.
 */
(function() {
  let files = [];
  let compressedBlobs = [];

  const uploadZone  = document.getElementById('uploadZone');
  const fileInput   = document.getElementById('fileInput');
  const workspace   = document.getElementById('workspace');
  const qualityRange= document.getElementById('qualityRange');
  const qualityVal  = document.getElementById('qualityVal');
  const outputFmt   = document.getElementById('outputFormat');
  const maxWidth    = document.getElementById('maxWidthInput');
  const compressBtn = document.getElementById('compressBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadArea= document.getElementById('downloadArea');
  const fileListArea= document.getElementById('fileListArea');
  const previewBody = document.getElementById('previewBody');
  const sizeInfo    = document.getElementById('sizeInfo');
  const statusArea  = document.getElementById('statusArea');

  qualityRange.addEventListener('input', () => qualityVal.textContent = qualityRange.value + '%');

  function handleFiles(fileList) {
    files = [...fileList].filter(f => {
      if (!['image/jpeg','image/png','image/webp'].includes(f.type)) {
        showMsg('error', `Skipped "${f.name}" — unsupported format`); return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        showMsg('error', `Skipped "${f.name}" — exceeds 20MB limit`); return false;
      }
      return true;
    });
    if (!files.length) return;
    renderFileList();
    workspace.style.display = '';
    // Preview first
    previewFile(files[0]);
  }

  function renderFileList() {
    fileListArea.innerHTML = files.map((f,i) => `
      <div class="file-item" id="fi-${i}">
        <span class="file-item__icon">🖼️</span>
        <span class="file-item__name">${f.name}</span>
        <span class="file-item__size">${ToolsApp.formatBytes(f.size)}</span>
        <button class="file-item__remove" onclick="removeFile(${i})" aria-label="Remove ${f.name}">✕</button>
      </div>`).join('');
  }

  window.removeFile = function(i) {
    files.splice(i, 1);
    if (!files.length) { workspace.style.display = 'none'; return; }
    renderFileList();
    previewFile(files[0]);
  };

  function previewFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${url}" class="preview-img" alt="Original preview">`;
      sizeInfo.textContent = `Original: ${ToolsApp.formatBytes(file.size)} | ${img.naturalWidth}×${img.naturalHeight}`;
    };
    img.src = url;
  }

  function showMsg(type, msg) {
    statusArea.innerHTML = `<div class="status-msg status-msg--${type}">${type==='error'?'❌':'✅'} ${msg}</div>`;
  }

  compressBtn.addEventListener('click', async () => {
    if (!files.length) return;
    compressBtn.disabled = true;
    compressBtn.innerHTML = '<span class="spinner"></span> Compressing…';
    compressedBlobs = [];

    const quality = parseInt(qualityRange.value) / 100;
    const mw = parseInt(maxWidth.value) || 0;

    for (let i = 0; i < files.length; i++) {
      const blob = await compressImage(files[i], quality, outputFmt.value, mw);
      compressedBlobs.push({ blob, name: buildName(files[i], outputFmt.value) });
      showMsg('info', `Compressed ${i+1}/${files.length}: ${ToolsApp.formatBytes(files[i].size)} → ${ToolsApp.formatBytes(blob.size)} (${Math.round((1-blob.size/files[i].size)*100)}% saved)`);
    }

    // Show first preview
    const firstUrl = URL.createObjectURL(compressedBlobs[0].blob);
    const img = new Image();
    img.onload = () => {
      previewBody.innerHTML = `<img src="${firstUrl}" class="preview-img" alt="Compressed preview">`;
      sizeInfo.textContent = `Compressed: ${ToolsApp.formatBytes(compressedBlobs[0].blob.size)} | ${img.naturalWidth}×${img.naturalHeight}`;
    };
    img.src = firstUrl;

    downloadArea.style.display = '';
    compressBtn.disabled = false;
    compressBtn.innerHTML = '🗜️ Compress Images';
  });

  function compressImage(file, quality, fmt, maxW) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (maxW > 0 && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const type = fmt === 'same' ? (file.type || 'image/jpeg') : fmt;
        const q = type === 'image/png' ? undefined : quality;
        canvas.toBlob(blob => resolve(blob), type, q);
      };
      img.src = url;
    });
  }

  function buildName(file, fmt) {
    const base = file.name.replace(/\.[^.]+$/, '');
    const ext  = fmt === 'same'          ? file.name.split('.').pop()
               : fmt === 'image/jpeg'    ? 'jpg'
               : fmt === 'image/png'     ? 'png'
               :                           'webp';
    return `${base}-compressed.${ext}`;
  }

  downloadBtn.addEventListener('click', async () => {
    if (compressedBlobs.length === 1) {
      ToolsApp.downloadBlob(compressedBlobs[0].blob, compressedBlobs[0].name);
    } else {
      // Multiple: use JSZip via CDN
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '<span class="spinner"></span> Zipping…';
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.onload = async () => {
        const zip = new JSZip();
        compressedBlobs.forEach(({blob, name}) => zip.file(name, blob));
        const zipBlob = await zip.generateAsync({type:'blob'});
        ToolsApp.downloadBlob(zipBlob, 'compressed-images.zip');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '⬇️ Download Compressed Image(s)';
      };
      document.head.appendChild(script);
    }
  });

  // Drag & drop
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));
})();