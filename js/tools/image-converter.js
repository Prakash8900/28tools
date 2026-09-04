(function(){
  let files=[],resultBlobs=[];
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),statusArea=document.getElementById('statusArea');
  const targetFormat=document.getElementById('targetFormat'),qualityRange=document.getElementById('qualityRange');
  const qualityVal=document.getElementById('qualityVal'),qualityGroup=document.getElementById('qualityGroup');
  const whiteBackground=document.getElementById('whiteBackground'),convertBtn=document.getElementById('convertBtn');
  const fileListArea=document.getElementById('fileListArea'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadBtn=document.getElementById('downloadBtn');
  const downloadArea=document.getElementById('downloadArea');

  qualityRange.addEventListener('input',()=>qualityVal.textContent=qualityRange.value+'%');
  targetFormat.addEventListener('change',()=>{ qualityGroup.style.display=targetFormat.value==='image/png'||targetFormat.value==='image/bmp'?'none':''; });

  function loadFiles(fileList){
    files=[...fileList].filter(f=>{ if(!f.type.startsWith('image/')){showMsg('error',`Skipped "${f.name}"`);return false;} return true; });
    if(!files.length) return;
    renderList(); workspace.style.display='';
    previewFile(files[0]);
  }
  function renderList(){
    fileListArea.innerHTML=files.map((f,i)=>`<div class="file-item"><span class="file-item__icon">🖼️</span><span class="file-item__name">${f.name}</span><span class="file-item__size">${ToolsApp.formatBytes(f.size)}</span></div>`).join('');
  }
  function previewFile(f){
    const url=URL.createObjectURL(f);
    const img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Original">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(f.size)}`; };
    img.src=url;
  }
  function convertOne(file,fmt,quality,whiteBg){
    return new Promise(resolve=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
        const ctx=canvas.getContext('2d');
        if(whiteBg&&fmt!=='image/png'){ ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.drawImage(img,0,0);
        URL.revokeObjectURL(url);
        const q=fmt==='image/png'||fmt==='image/bmp'?undefined:quality/100;
        canvas.toBlob(blob=>resolve(blob),fmt,q);
      };
      img.src=url;
    });
  }
  convertBtn.addEventListener('click',async()=>{
    if(!files.length) return;
    convertBtn.disabled=true; convertBtn.innerHTML='<span class="spinner"></span> Converting…';
    resultBlobs=[];
    const fmt=targetFormat.value,quality=parseInt(qualityRange.value),whiteBg=whiteBackground.checked;
    const ext=fmt.split('/')[1].replace('jpeg','jpg');
    for(let i=0;i<files.length;i++){
      const blob=await convertOne(files[i],fmt,quality,whiteBg);
      resultBlobs.push({blob,name:files[i].name.replace(/\.[^.]+$/,'')+'.'+ext});
    }
    const url=URL.createObjectURL(resultBlobs[0].blob);
    const img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Converted">`; sizeInfo.textContent=`Converted: ${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(resultBlobs[0].blob.size)}`; };
    img.src=url;
    downloadArea.style.display='';
    convertBtn.disabled=false; convertBtn.innerHTML='🔄 Convert Images';
  });
  downloadBtn.addEventListener('click',async()=>{
    if(resultBlobs.length===1){ ToolsApp.downloadBlob(resultBlobs[0].blob,resultBlobs[0].name); return; }
    downloadBtn.disabled=true; downloadBtn.innerHTML='<span class="spinner"></span> Zipping…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload=async()=>{ const zip=new JSZip(); resultBlobs.forEach(({blob,name})=>zip.file(name,blob)); const zb=await zip.generateAsync({type:'blob'}); ToolsApp.downloadBlob(zb,'converted-images.zip'); downloadBtn.disabled=false; downloadBtn.innerHTML='⬇️ Download Converted Image(s)'; };
    document.head.appendChild(script);
  });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');loadFiles(e.dataTransfer.files);});
  fileInput.addEventListener('change',()=>loadFiles(fileInput.files));
  function showMsg(type,msg){statusArea.innerHTML=`<div class="status-msg status-msg--${type}">${msg}</div>`;}
})();