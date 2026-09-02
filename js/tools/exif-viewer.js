(function(){
  let currentFile=null,cleanedBlob=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <p class="text-muted" style="font-size:.9rem;margin-bottom:12px">EXIF data is read using the browser's native APIs and exif-js library.</p>
  <div id="exifTable" style="font-size:.85rem"></div>
  <div style="margin-top:16px">
  <label class="form-label">Actions</label>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn btn--danger btn--sm" id="stripBtn">🗑 Strip All Metadata</button>
  </div></div>`;

  processBtn.style.display='none';

  function loadFile(file){
    if(!file.type.startsWith('image/')) return;
    currentFile=file;
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Preview">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${28tools.formatBytes(file.size)}`; workspace.style.display=''; readExif(file); };
    img.src=url;
  }

  function readExif(file){
    const reader=new FileReader();
    reader.onload=e=>{
      const view=new DataView(e.target.result);
      const exifData=parseBasicExif(view,file.type);
      renderExifTable(exifData);
    };
    reader.readAsArrayBuffer(file);
  }

  function parseBasicExif(view,type){
    const data={};
    data['File Type']=type;
    data['File Size']=28tools.formatBytes(view.byteLength);
    if(type==='image/jpeg'){
      try{
        let offset=2;
        while(offset<view.byteLength){
          const marker=view.getUint16(offset);
          if(marker===0xFFE1){
            const len=view.getUint16(offset+2);
            data['EXIF Block Found']='Yes ('+len+' bytes)';
            // Check for GPS
            const seg=new Uint8Array(view.buffer,offset+4,len-2);
            const str=String.fromCharCode(...seg.slice(0,6));
            if(str.includes('Exif')) data['EXIF Marker']='Present';
            break;
          }
          const len=view.getUint16(offset+2);
          offset+=2+len;
        }
      }catch(e){ data['Parse Error']='Could not fully parse'; }
    }
    data['Note']='Full EXIF tags require exif-js library (loaded below)';
    return data;
  }

  // Load exif-js for full metadata
  const s=document.createElement('script');
  s.src='https://cdn.jsdelivr.net/npm/exif-js@2.3.0/exif.min.js';
  s.onload=()=>{
    if(currentFile) readWithExifJS(currentFile);
  };
  document.head.appendChild(s);

  function readWithExifJS(file){
    EXIF.getData(file,function(){
      const tags=EXIF.getAllTags(this);
      const table=document.getElementById('exifTable');
      if(!tags||Object.keys(tags).length===0){
        table.innerHTML='<div class="status-msg status-msg--info">ℹ️ No EXIF data found in this image</div>';return;
      }
      let rows='<table style="width:100%;border-collapse:collapse;font-size:.82rem">';
      rows+='<tr style="background:var(--clr-surface-2)"><th style="padding:8px;text-align:left;border-bottom:1px solid var(--clr-border)">Tag</th><th style="padding:8px;text-align:left;border-bottom:1px solid var(--clr-border)">Value</th></tr>';
      Object.entries(tags).forEach(([k,v])=>{
        if(typeof v==='object'&&!(v instanceof Array)) return;
        rows+=`<tr><td style="padding:6px 8px;border-bottom:1px solid var(--clr-border);color:var(--clr-text-muted)">${k}</td><td style="padding:6px 8px;border-bottom:1px solid var(--clr-border);word-break:break-all">${String(v).slice(0,100)}</td></tr>`;
      });
      rows+='</table>';
      table.innerHTML=rows;
    });
  }

  function renderExifTable(data){
    const table=document.getElementById('exifTable');
    table.innerHTML='<div class="status-msg status-msg--info">ℹ️ Loading EXIF data…</div>';
    if(window.EXIF && currentFile) readWithExifJS(currentFile);
  }

  document.getElementById('stripBtn').addEventListener('click',()=>{
    if(!currentFile) return;
    const img=new Image();
    const url=URL.createObjectURL(currentFile);
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      canvas.getContext('2d').drawImage(img,0,0);
      canvas.toBlob(blob=>{
        cleanedBlob=blob;
        previewBody.innerHTML=`<img src="${URL.createObjectURL(blob)}" class="preview-img" alt="Cleaned">`;
        sizeInfo.textContent=`Metadata removed | ${28tools.formatBytes(blob.size)}`;
        document.getElementById('exifTable').innerHTML='<div class="status-msg status-msg--success">✅ All metadata stripped. Download the clean image below.</div>';
        downloadArea.style.display='';
      },'image/png');
    };
    img.src=url;
  });

  downloadBtn.addEventListener('click',()=>{ if(cleanedBlob) 28tools.downloadBlob(cleanedBlob,(currentFile?currentFile.name.replace(/\.[^.]+$/,''):'img')+'-clean.png'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();