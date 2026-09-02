(function(){
  let img=null,origFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Preset Grid</label>
  <select class="form-select" id="gridPreset">
  <option value="2,2">2×2 (4 pieces)</option><option value="3,3">3×3 (9 pieces)</option>
  <option value="2,3">2 cols × 3 rows</option><option value="4,4">4×4 (16 pieces)</option>
  <option value="custom">Custom</option></select></div>
  <div id="customGrid" style="display:none"><div class="form-group"><label class="form-label">Columns</label><input type="number" class="form-input" id="gridCols" min="1" max="10" value="3"></div>
  <div class="form-group"><label class="form-label">Rows</label><input type="number" class="form-input" id="gridRows" min="1" max="10" value="3"></div></div>`;

  document.getElementById('gridPreset').addEventListener('change',e=>{
    document.getElementById('customGrid').style.display=e.target.value==='custom'?'':'none';
  });

  processBtn.textContent='⚡ Split Image';
  processBtn.addEventListener('click',async()=>{
    if(!img) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Splitting…';
    const preset=document.getElementById('gridPreset').value;
    let cols,rows;
    if(preset==='custom'){ cols=parseInt(document.getElementById('gridCols').value)||2; rows=parseInt(document.getElementById('gridRows').value)||2; }
    else{ [cols,rows]=preset.split(',').map(Number); }
    const pieces=[];
    const pw=Math.floor(img.naturalWidth/cols),ph=Math.floor(img.naturalHeight/rows);
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const canvas=document.createElement('canvas');
        canvas.width=pw;canvas.height=ph;
        canvas.getContext('2d').drawImage(img,c*pw,r*ph,pw,ph,0,0,pw,ph);
        pieces.push({canvas,name:`piece-${r+1}-${c+1}.png`});
      }
    }
    // Preview grid
    previewBody.innerHTML=`<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;width:100%">${pieces.map(p=>`<canvas width="${pw}" height="${ph}" style="width:100%;border:1px solid var(--clr-border);border-radius:4px"></canvas>`).join('')}</div>`;
    const cvs=previewBody.querySelectorAll('canvas');
    pieces.forEach((p,i)=>{ const ctx=cvs[i].getContext('2d'); ctx.drawImage(p.canvas,0,0,pw,ph,0,0,cvs[i].width,cvs[i].height); });
    sizeInfo.textContent=`${cols}×${rows} grid | ${pieces.length} pieces | ${pw}×${ph}px each`;
    window._splitterPieces=pieces;
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='⚡ Split Image';
  });

  downloadBtn.addEventListener('click',async()=>{
    const pieces=window._splitterPieces||[];
    if(!pieces.length) return;
    downloadBtn.disabled=true;downloadBtn.innerHTML='<span class="spinner"></span> Zipping…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload=async()=>{
      const zip=new JSZip();
      await Promise.all(pieces.map(({canvas,name})=>new Promise(res=>{ canvas.toBlob(blob=>{ zip.file(name,blob); res(); },'image/png'); })));
      const zb=await zip.generateAsync({type:'blob'});
      28tools.downloadBlob(zb,'image-pieces.zip');
      downloadBtn.disabled=false;downloadBtn.innerHTML='⬇️ Download Pieces ZIP';
    };
    document.head.appendChild(script);
  });

  function loadImage(file){
    if(!file.type.startsWith('image/')) return;
    origFile=file;
    const url=URL.createObjectURL(file);
    img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Original">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${28tools.formatBytes(file.size)}`; workspace.style.display=''; };
    img.src=url;
  }
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadImage(fileInput.files[0]);});
})();