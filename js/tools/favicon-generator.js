(function(){
  let img=null,origFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');
  const sizes=[16,32,48,64,128,256];

  document.getElementById('toolControls').innerHTML=`
  <p class="text-muted" style="font-size:.9rem;margin-bottom:12px">Generates PNG icons in standard favicon sizes. Download individually or as ZIP.</p>
  <div class="form-group"><label class="form-label">Sizes to Generate</label>
  <div id="sizeChecks">${sizes.map(s=>`<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer"><input type="checkbox" class="sizeCheck" value="${s}" checked style="width:16px;height:16px"> ${s}×${s}px</label>`).join('')}</div></div>
  <div class="form-group"><label class="form-label" for="bgColor">Background</label>
  <select class="form-select" id="bgStyle"><option value="transparent">Transparent</option><option value="white">White</option><option value="black">Black</option></select></div>`;

  processBtn.textContent='⭐ Generate Favicons';
  processBtn.addEventListener('click',()=>{
    if(!img) return;
    const selected=[...document.querySelectorAll('.sizeCheck:checked')].map(c=>parseInt(c.value));
    if(!selected.length){ return; }
    const bg=document.getElementById('bgStyle').value;
    const previews=[];
    const blobs=[];
    selected.forEach(size=>{
      const canvas=document.createElement('canvas');
      canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d');
      if(bg==='white'){ctx.fillStyle='white';ctx.fillRect(0,0,size,size);}
      else if(bg==='black'){ctx.fillStyle='black';ctx.fillRect(0,0,size,size);}
      ctx.drawImage(img,0,0,size,size);
      previews.push({canvas,size});
    });
    // Build preview grid
    previewBody.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;padding:12px">';
    const p=previewBody.querySelector('div');
    previews.forEach(({canvas,size})=>{
      const div=document.createElement('div');
      div.style.cssText='text-align:center;font-size:.75rem;color:var(--clr-text-muted)';
      div.innerHTML=`${size}×${size}`;
      const c=canvas.cloneNode(true);
      const ctx2=c.getContext('2d');
      ctx2.drawImage(canvas,0,0);
      c.style.cssText=`display:block;width:${Math.min(size,64)}px;height:${Math.min(size,64)}px;border:1px solid var(--clr-border);border-radius:6px;margin:0 auto 4px;image-rendering:pixelated`;
      div.prepend(c);
      p.appendChild(div);
    });
    sizeInfo.textContent=`${selected.length} favicon sizes generated`;
    downloadArea.style.display='';
    window._faviconPreviews=previews;
  });

  downloadBtn.addEventListener('click',async()=>{
    const previews=window._faviconPreviews||[];
    if(!previews.length) return;
    downloadBtn.disabled=true;downloadBtn.innerHTML='<span class="spinner"></span> Zipping…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload=async()=>{
      const zip=new JSZip();
      await Promise.all(previews.map(({canvas,size})=>new Promise(res=>{
        canvas.toBlob(blob=>{ zip.file(`favicon-${size}x${size}.png`,blob); res(); },'image/png');
      })));
      const zb=await zip.generateAsync({type:'blob'});
      ToolsApp.downloadBlob(zb,'favicons.zip');
      downloadBtn.disabled=false;downloadBtn.innerHTML='⬇️ Download Favicons ZIP';
    };
    document.head.appendChild(script);
  });

  function loadImage(file){
    if(!file.type.startsWith('image/')) return;
    origFile=file;
    const url=URL.createObjectURL(file);
    img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Source" style="max-height:200px">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(file.size)}`; workspace.style.display=''; };
    img.src=url;
  }
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadImage(fileInput.files[0]);});
})();