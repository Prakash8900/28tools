(function(){
  let files=[];
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="prefix">Prefix</label><input type="text" class="form-input" id="prefix" value="photo" placeholder="e.g. photo"></div>
  <div class="form-group"><label class="form-label" for="suffix">Suffix</label><input type="text" class="form-input" id="suffix" placeholder="e.g. _hd (optional)"></div>
  <div class="form-group"><label class="form-label">Start Number <span id="startVal">1</span></label><input type="number" class="form-input" id="startNum" min="0" value="1"></div>
  <div class="form-group"><label class="form-label">Padding (digits) <span id="padVal">3 → 001</span></label><input type="range" class="form-range" id="zeroPad" min="1" max="6" value="3"></div>
  <div class="form-group"><label class="form-label">Keep Original Extension</label><label class="toggle-switch"><input type="checkbox" id="keepExt" checked><div class="toggle-track"></div><span class="toggle-label">Yes</span></label></div>`;

  document.getElementById('zeroPad').addEventListener('input',e=>{ const v=parseInt(e.target.value); document.getElementById('padVal').textContent=`${v} → ${'0'.repeat(v-1)}1`; updatePreview(); });
  ['prefix','suffix','startNum','keepExt'].forEach(id=>document.getElementById(id).addEventListener('input',updatePreview));

  function buildName(file,index){
    const prefix=document.getElementById('prefix').value;
    const suffix=document.getElementById('suffix').value;
    const start=parseInt(document.getElementById('startNum').value)||1;
    const pad=parseInt(document.getElementById('zeroPad').value)||3;
    const keepExt=document.getElementById('keepExt').checked;
    const num=String(start+index).padStart(pad,'0');
    const ext=keepExt?'.'+file.name.split('.').pop():'';
    return `${prefix}${num}${suffix}${ext}`;
  }

  function updatePreview(){
    if(!files.length) return;
    renderTable();
  }

  function renderTable(){
    const rows=files.map((f,i)=>`<tr><td style="padding:6px 10px;color:var(--clr-text-muted);font-size:.85rem;border-bottom:1px solid var(--clr-border)">${f.name}</td><td style="padding:6px 10px;font-weight:600;font-size:.85rem;border-bottom:1px solid var(--clr-border);color:var(--clr-primary)">→ ${buildName(f,i)}</td></tr>`).join('');
    previewBody.innerHTML=`<div style="width:100%;overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="padding:8px 10px;text-align:left;background:var(--clr-surface-2);font-size:.8rem">Original Name</th><th style="padding:8px 10px;text-align:left;background:var(--clr-surface-2);font-size:.8rem">New Name</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    sizeInfo.textContent=`${files.length} files`;
  }

  processBtn.textContent='📝 Preview Rename';
  processBtn.addEventListener('click',()=>{ if(files.length) renderTable(); downloadArea.style.display=''; });

  downloadBtn.addEventListener('click',async()=>{
    if(!files.length) return;
    downloadBtn.disabled=true;downloadBtn.innerHTML='<span class="spinner"></span> Preparing…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload=async()=>{
      const zip=new JSZip();
      files.forEach((f,i)=>zip.file(buildName(f,i),f));
      const zb=await zip.generateAsync({type:'blob'});
      28tools.downloadBlob(zb,'renamed-images.zip');
      downloadBtn.disabled=false;downloadBtn.innerHTML='⬇️ Download Renamed Images ZIP';
    };
    document.head.appendChild(script);
  });

  function loadFiles(fileList){
    files=[...fileList].filter(f=>f.type.startsWith('image/'));
    if(!files.length) return;
    workspace.style.display='';
    renderTable();
    downloadArea.style.display='';
  }
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');loadFiles(e.dataTransfer.files);});
  fileInput.setAttribute('multiple','');
  fileInput.addEventListener('change',()=>loadFiles(fileInput.files));
})();