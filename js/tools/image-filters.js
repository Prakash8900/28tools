(function(){
  let img=null,origFile=null,resultBlob=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Preset Filter</label>
  <select class="form-select" id="presetFilter">
  <option value="none">None (Custom)</option><option value="grayscale(100%)">Grayscale</option>
  <option value="sepia(100%)">Sepia</option><option value="invert(100%)">Invert</option>
  <option value="blur(3px)">Blur</option><option value="saturate(0%)">Desaturate</option>
  <option value="saturate(300%)">Vivid</option><option value="contrast(200%)">High Contrast</option>
  <option value="hue-rotate(90deg)">Hue Rotate 90°</option><option value="hue-rotate(180deg)">Hue Rotate 180°</option>
  </select></div>
  <div class="form-group"><label class="form-label">Brightness <span id="brVal">100%</span></label><input type="range" class="form-range" id="brightness" min="0" max="300" value="100"></div>
  <div class="form-group"><label class="form-label">Contrast <span id="coVal">100%</span></label><input type="range" class="form-range" id="contrast" min="0" max="300" value="100"></div>
  <div class="form-group"><label class="form-label">Saturation <span id="saVal">100%</span></label><input type="range" class="form-range" id="saturation" min="0" max="300" value="100"></div>
  <div class="form-group"><label class="form-label">Blur <span id="blVal">0px</span></label><input type="range" class="form-range" id="blurAmount" min="0" max="20" value="0"></div>
  <div class="form-group"><label class="form-label">Hue Rotate <span id="hrVal">0°</span></label><input type="range" class="form-range" id="hueRotate" min="0" max="360" value="0"></div>
  <div class="form-group"><label class="form-label">Output Format</label><select class="form-select" id="outFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></div>`;

  const sliders={brightness:'brVal',contrast:'coVal',saturation:'saVal',blurAmount:'blVal',hueRotate:'hrVal'};
  const units={brightness:'%',contrast:'%',saturation:'%',blurAmount:'px',hueRotate:'°'};
  Object.keys(sliders).forEach(id=>{
    const el=document.getElementById(id),label=document.getElementById(sliders[id]);
    el.addEventListener('input',()=>{ label.textContent=el.value+units[id]; if(img) livePreview(); });
  });
  document.getElementById('presetFilter').addEventListener('change',()=>{ if(img) applyFilter(); });

  function getFilterStr(){
    const preset=document.getElementById('presetFilter').value;
    if(preset!=='none') return preset;
    return `brightness(${document.getElementById('brightness').value}%) contrast(${document.getElementById('contrast').value}%) saturate(${document.getElementById('saturation').value}%) blur(${document.getElementById('blurAmount').value}px) hue-rotate(${document.getElementById('hueRotate').value}deg)`;
  }

  function livePreview(){
    const fstr=getFilterStr();
    const el=previewBody.querySelector('img');
    if(el) el.style.filter=fstr;
  }

  function applyFilter(){
    if(!img) return;
    processBtn.disabled=true; processBtn.innerHTML='<span class="spinner"></span> Applying…';
    const fstr=getFilterStr();
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d');
    ctx.filter=fstr;
    ctx.drawImage(img,0,0);
    const fmt=document.getElementById('outFmt').value;
    canvas.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Filtered">`;
      sizeInfo.textContent=`${canvas.width}×${canvas.height} | ${ToolsApp.formatBytes(blob.size)}`;
      downloadArea.style.display='';
      processBtn.disabled=false; processBtn.innerHTML='▶ Apply Filter';
    },fmt,0.92);
  }

  processBtn.addEventListener('click',applyFilter);
  processBtn.textContent='▶ Apply Filter';
  downloadBtn.addEventListener('click',()=>{
    if(resultBlob){ const ext=resultBlob.type.split('/')[1].replace('jpeg','jpg'); ToolsApp.downloadBlob(resultBlob,(origFile?origFile.name.replace(/\.[^.]+$/,''):'img')+'-filtered.'+ext); }
  });

  function loadImage(file){
    if(!file.type.startsWith('image/')) return;
    origFile=file;
    const url=URL.createObjectURL(file);
    img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Original">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(file.size)}`; workspace.style.display=''; };
    img.src=url;
  }
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadImage(fileInput.files[0]);});
})();