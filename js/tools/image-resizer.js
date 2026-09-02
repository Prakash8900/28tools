(function(){
  let origImg=null,origW=0,origH=0,resultBlob=null,currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),statusArea=document.getElementById('statusArea');
  const newWidth=document.getElementById('newWidth'),newHeight=document.getElementById('newHeight');
  const lockAR=document.getElementById('lockAR'),resizeMode=document.getElementById('resizeMode');
  const percentVal=document.getElementById('percentVal'),pctLabel=document.getElementById('pctLabel');
  const presetSelect=document.getElementById('presetSelect'),origSize=document.getElementById('origSize');
  const outputFormat=document.getElementById('outputFormat'),resizeBtn=document.getElementById('resizeBtn');
  const previewBody=document.getElementById('previewBody'),sizeInfo=document.getElementById('sizeInfo');
  const downloadBtn=document.getElementById('downloadBtn'),downloadArea=document.getElementById('downloadArea');

  resizeMode.addEventListener('change',()=>{
    document.getElementById('pixelMode').style.display=resizeMode.value==='pixels'?'':'none';
    document.getElementById('percentMode').style.display=resizeMode.value==='percent'?'':'none';
    document.getElementById('presetMode').style.display=resizeMode.value==='preset'?'':'none';
  });
  percentVal.addEventListener('input',()=>pctLabel.textContent=percentVal.value+'%');

  newWidth.addEventListener('input',()=>{ if(lockAR.checked && origW) newHeight.value=Math.round(newWidth.value*origH/origW); });
  newHeight.addEventListener('input',()=>{ if(lockAR.checked && origH) newWidth.value=Math.round(newHeight.value*origW/origH); });

  function loadFile(file){
    if(!file.type.startsWith('image/')){showMsg('error','Not an image file');return;}
    if(file.size>20*1024*1024){showMsg('error','File exceeds 20MB');return;}
    currentFile=file;
    const url=URL.createObjectURL(file);
    origImg=new Image();
    origImg.onload=()=>{
      origW=origImg.naturalWidth; origH=origImg.naturalHeight;
      origSize.textContent=`${origW}×${origH}`;
      newWidth.value=origW; newHeight.value=origH;
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Original">`;
      sizeInfo.textContent=`Original: ${origW}×${origH} | ${28tools.formatBytes(file.size)}`;
      workspace.style.display='';
    };
    origImg.src=url;
  }

  resizeBtn.addEventListener('click',()=>{
    if(!origImg){return;}
    let tw,th;
    if(resizeMode.value==='pixels'){
      tw=parseInt(newWidth.value)||origW; th=parseInt(newHeight.value)||origH;
    } else if(resizeMode.value==='percent'){
      const p=parseInt(percentVal.value)/100;
      tw=Math.round(origW*p); th=Math.round(origH*p);
    } else {
      const parts=presetSelect.value.split(',');
      tw=parseInt(parts[0]); th=parseInt(parts[1]);
    }
    const canvas=document.createElement('canvas');
    canvas.width=tw; canvas.height=th;
    canvas.getContext('2d').drawImage(origImg,0,0,tw,th);
    const fmt=outputFormat.value==='same'?(currentFile.type||'image/jpeg'):outputFormat.value;
    canvas.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Resized">`;
      sizeInfo.textContent=`Resized: ${tw}×${th} | ${28tools.formatBytes(blob.size)}`;
      downloadArea.style.display='';
    },fmt,0.92);
  });

  downloadBtn.addEventListener('click',()=>{
    if(!resultBlob) return;
    const base=currentFile.name.replace(/\.[^.]+$/,'');
    const ext=resultBlob.type.split('/')[1].replace('jpeg','jpg');
    28tools.downloadBlob(resultBlob,`${base}-resized.${ext}`);
  });

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
  function showMsg(type,msg){statusArea.innerHTML=`<div class="status-msg status-msg--${type}">${type==='error'?'❌':'✅'} ${msg}</div>`;}
})();