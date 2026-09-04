(function(){
  let img=null,origFile=null,currentAngle=0,flipH=false,flipV=false,resultBlob=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  // Build controls
  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Rotate</label>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn btn--ghost btn--sm" id="rot90">↻ 90°</button>
  <button class="btn btn--ghost btn--sm" id="rot180">↻ 180°</button>
  <button class="btn btn--ghost btn--sm" id="rot270">↺ 270°</button>
  <button class="btn btn--ghost btn--sm" id="rotReset">Reset</button>
  </div></div>
  <div class="form-group"><label class="form-label">Flip</label>
  <div style="display:flex;gap:8px">
  <button class="btn btn--ghost btn--sm" id="flipH">↔ Horizontal</button>
  <button class="btn btn--ghost btn--sm" id="flipV">↕ Vertical</button>
  </div></div>
  <div class="form-group"><label class="form-label">Custom Angle <span id="angleVal">0°</span></label>
  <input type="range" class="form-range" id="customAngle" min="-180" max="180" value="0"></div>
  <div class="form-group"><label class="form-label">Output Format</label>
  <select class="form-select" id="outFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></div>`;

  const angleRange=document.getElementById('customAngle'),angleVal=document.getElementById('angleVal');
  angleRange.addEventListener('input',()=>{ currentAngle=parseInt(angleRange.value); angleVal.textContent=currentAngle+'°'; applyTransform(); });
  document.getElementById('rot90').onclick=()=>{ currentAngle=(currentAngle+90)%360; angleRange.value=currentAngle; angleVal.textContent=currentAngle+'°'; applyTransform(); };
  document.getElementById('rot180').onclick=()=>{ currentAngle=(currentAngle+180)%360; angleRange.value=currentAngle; angleVal.textContent=currentAngle+'°'; applyTransform(); };
  document.getElementById('rot270').onclick=()=>{ currentAngle=(currentAngle+270)%360; angleRange.value=currentAngle; angleVal.textContent=currentAngle+'°'; applyTransform(); };
  document.getElementById('rotReset').onclick=()=>{ currentAngle=0;flipH=false;flipV=false;angleRange.value=0;angleVal.textContent='0°'; applyTransform(); };
  document.getElementById('flipH').onclick=()=>{ flipH=!flipH; applyTransform(); };
  document.getElementById('flipV').onclick=()=>{ flipV=!flipV; applyTransform(); };

  function applyTransform(){
    if(!img) return;
    const rad=currentAngle*Math.PI/180;
    const sin=Math.abs(Math.sin(rad)),cos=Math.abs(Math.cos(rad));
    const w=img.naturalWidth,h=img.naturalHeight;
    const nw=Math.round(w*cos+h*sin),nh=Math.round(w*sin+h*cos);
    const canvas=document.createElement('canvas');
    canvas.width=nw;canvas.height=nh;
    const ctx=canvas.getContext('2d');
    ctx.translate(nw/2,nh/2);
    ctx.rotate(rad);
    ctx.scale(flipH?-1:1,flipV?-1:1);
    ctx.drawImage(img,-w/2,-h/2);
    const fmt=document.getElementById('outFmt').value;
    canvas.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Result">`;
      sizeInfo.textContent=`${nw}×${nh} | ${ToolsApp.formatBytes(blob.size)}`;
      downloadArea.style.display='';
    },fmt,0.92);
  }

  processBtn.addEventListener('click',applyTransform);
  downloadBtn.addEventListener('click',()=>{
    if(resultBlob){ const ext=resultBlob.type.split('/')[1].replace('jpeg','jpg'); ToolsApp.downloadBlob(resultBlob,(origFile?origFile.name.replace(/\.[^.]+$/,''):'img')+'-rotated.'+ext); }
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