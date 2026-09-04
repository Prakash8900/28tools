(function(){
  let files=[],loadedImgs=[],resultBlob=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Layout</label>
  <select class="form-select" id="layout"><option value="horizontal">Side by Side (Horizontal)</option><option value="vertical">Top to Bottom (Vertical)</option><option value="grid">Grid (2 columns)</option></select></div>
  <div class="form-group"><label class="form-label">Gap <span id="gapVal">10px</span></label><input type="range" class="form-range" id="gapSize" min="0" max="50" value="10"></div>
  <div class="form-group"><label class="form-label" for="bgColor">Background Color</label><input type="color" id="bgColor" value="#ffffff" style="width:100%;height:44px;border-radius:8px;border:1.5px solid var(--clr-border);cursor:pointer"></div>
  <div class="form-group"><label class="form-label">Output Format</label><select class="form-select" id="outFmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></div>
  <div id="fileListArea" class="file-list" style="margin-top:12px"></div>`;

  document.getElementById('gapSize').addEventListener('input',e=>document.getElementById('gapVal').textContent=e.target.value+'px');

  function loadFiles(fileList){
    const newFiles=[...fileList].filter(f=>f.type.startsWith('image/'));
    files=[...files,...newFiles];
    if(files.length<2){ document.getElementById('statusArea').innerHTML='<div class="status-msg status-msg--info">ℹ️ Upload at least 2 images to merge</div>'; }
    loadImgs().then(()=>{ renderList(); workspace.style.display=''; });
  }

  function loadImgs(){
    return Promise.all(files.map(f=>new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.src=URL.createObjectURL(f); }))).then(imgs=>loadedImgs=imgs);
  }

  function renderList(){
    document.getElementById('fileListArea').innerHTML=files.map((f,i)=>`<div class="file-item"><span class="file-item__icon">🖼️</span><span class="file-item__name">${f.name}</span><span class="file-item__size">${ToolsApp.formatBytes(f.size)}</span><button class="file-item__remove" onclick="removeMerge(${i})">✕</button></div>`).join('');
  }

  window.removeMerge=function(i){ files.splice(i,1); loadedImgs.splice(i,1); renderList(); };

  processBtn.addEventListener('click',()=>{
    if(loadedImgs.length<2){ return; }
    const layout=document.getElementById('layout').value;
    const gap=parseInt(document.getElementById('gapSize').value);
    const bg=document.getElementById('bgColor').value;
    const fmt=document.getElementById('outFmt').value;
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    if(layout==='horizontal'){
      const h=Math.max(...loadedImgs.map(i=>i.naturalHeight));
      const w=loadedImgs.reduce((s,i)=>s+i.naturalWidth,0)+gap*(loadedImgs.length-1);
      canvas.width=w;canvas.height=h;
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      let x=0;
      loadedImgs.forEach(i=>{ ctx.drawImage(i,x,0); x+=i.naturalWidth+gap; });
    } else if(layout==='vertical'){
      const w=Math.max(...loadedImgs.map(i=>i.naturalWidth));
      const h=loadedImgs.reduce((s,i)=>s+i.naturalHeight,0)+gap*(loadedImgs.length-1);
      canvas.width=w;canvas.height=h;
      ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      let y=0;
      loadedImgs.forEach(i=>{ ctx.drawImage(i,0,y); y+=i.naturalHeight+gap; });
    } else {
      const cols=2,rows=Math.ceil(loadedImgs.length/cols);
      const cw=Math.max(...loadedImgs.map(i=>i.naturalWidth));
      const ch=Math.max(...loadedImgs.map(i=>i.naturalHeight));
      canvas.width=cols*cw+(cols-1)*gap;canvas.height=rows*ch+(rows-1)*gap;
      ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);
      loadedImgs.forEach((img,i)=>{ const col=i%cols,row=Math.floor(i/cols); ctx.drawImage(img,col*(cw+gap),row*(ch+gap)); });
    }
    canvas.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Merged">`;
      sizeInfo.textContent=`${canvas.width}×${canvas.height} | ${ToolsApp.formatBytes(blob.size)}`;
      downloadArea.style.display='';
    },fmt,0.92);
  });

  downloadBtn.addEventListener('click',()=>{ if(resultBlob){ const ext=fmt==='image/jpeg'?'jpg':'png'; ToolsApp.downloadBlob(resultBlob,'merged.'+ext); } });
  document.getElementById('downloadBtn').addEventListener('click',()=>{ if(resultBlob){ ToolsApp.downloadBlob(resultBlob,'merged-image.png'); } });

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');loadFiles(e.dataTransfer.files);});
  fileInput.setAttribute('multiple','');
  fileInput.addEventListener('change',()=>loadFiles(fileInput.files));
})();