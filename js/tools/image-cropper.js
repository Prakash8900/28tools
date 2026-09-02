(function(){
  let img=null,origFile=null,ratio='free';
  let isDragging=false,startX=0,startY=0,cropRect={x:0,y:0,w:0,h:0};
  let scaleX=1,scaleY=1;
  const canvas=document.getElementById('imgCanvas'),overlay=document.getElementById('overlayCanvas');
  const ctx=canvas.getContext('2d'),oc=overlay.getContext('2d');
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace');
  const cropXi=document.getElementById('cropX'),cropYi=document.getElementById('cropY');
  const cropWi=document.getElementById('cropW'),cropHi=document.getElementById('cropH');
  const cropBtn=document.getElementById('cropBtn'),resetBtn=document.getElementById('resetBtn');
  const resultArea=document.getElementById('resultArea'),cropPreview=document.getElementById('cropPreview');
  const cropInfo=document.getElementById('cropInfo'),downloadBtn=document.getElementById('downloadBtn');
  let resultBlob=null;

  document.querySelectorAll('[data-ratio]').forEach(b=>b.addEventListener('click',()=>{
    ratio=b.dataset.ratio;
    document.querySelectorAll('[data-ratio]').forEach(x=>x.classList.remove('btn--primary'));
    b.classList.add('btn--primary');
  }));

  function loadImage(file){
    if(!file.type.startsWith('image/')){return;}
    origFile=file;
    const url=URL.createObjectURL(file);
    img=new Image();
    img.onload=()=>{
      const maxW=Math.min(img.naturalWidth,800);
      scaleX=img.naturalWidth/maxW; scaleY=img.naturalHeight/(img.naturalHeight*maxW/img.naturalWidth);
      canvas.width=maxW; canvas.height=img.naturalHeight*maxW/img.naturalWidth;
      overlay.width=canvas.width; overlay.height=canvas.height;
      overlay.style.width=canvas.style.width=canvas.width+'px';
      overlay.style.height=canvas.style.height=canvas.height+'px';
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      cropRect={x:0,y:0,w:canvas.width,h:canvas.height};
      updateInputs(); drawOverlay();
      workspace.style.display='';
    };
    img.src=url;
  }

  function updateInputs(){
    cropXi.value=Math.round(cropRect.x*scaleX);
    cropYi.value=Math.round(cropRect.y*scaleY);
    cropWi.value=Math.round(cropRect.w*scaleX);
    cropHi.value=Math.round(cropRect.h*scaleY);
  }

  function drawOverlay(){
    oc.clearRect(0,0,overlay.width,overlay.height);
    oc.fillStyle='rgba(0,0,0,0.5)';
    oc.fillRect(0,0,overlay.width,overlay.height);
    oc.clearRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);
    oc.strokeStyle='#4f46e5';oc.lineWidth=2;
    oc.strokeRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);
    // Grid lines
    oc.strokeStyle='rgba(255,255,255,.4)';oc.lineWidth=1;
    [1/3,2/3].forEach(f=>{
      oc.beginPath();oc.moveTo(cropRect.x+cropRect.w*f,cropRect.y);oc.lineTo(cropRect.x+cropRect.w*f,cropRect.y+cropRect.h);oc.stroke();
      oc.beginPath();oc.moveTo(cropRect.x,cropRect.y+cropRect.h*f);oc.lineTo(cropRect.x+cropRect.w,cropRect.y+cropRect.h*f);oc.stroke();
    });
  }

  overlay.addEventListener('mousedown',e=>{
    const r=overlay.getBoundingClientRect();
    startX=e.clientX-r.left; startY=e.clientY-r.top;
    isDragging=true;
  });
  overlay.addEventListener('mousemove',e=>{
    if(!isDragging) return;
    const r=overlay.getBoundingClientRect();
    let x=e.clientX-r.left,y=e.clientY-r.top;
    let w=x-startX,h=y-startY;
    if(ratio!=='free'){
      const parts=ratio.split(':');
      const ar=parseFloat(parts[0])/parseFloat(parts[1]);
      if(Math.abs(w/h)>ar) h=w/ar; else w=h*ar;
    }
    cropRect={x:Math.min(startX,startX+w),y:Math.min(startY,startY+h),w:Math.abs(w),h:Math.abs(h)};
    cropRect.x=Math.max(0,Math.min(cropRect.x,canvas.width-cropRect.w));
    cropRect.y=Math.max(0,Math.min(cropRect.y,canvas.height-cropRect.h));
    updateInputs(); drawOverlay();
  });
  ['mouseup','mouseleave'].forEach(ev=>overlay.addEventListener(ev,()=>isDragging=false));

  // Touch support
  overlay.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0],r=overlay.getBoundingClientRect();startX=t.clientX-r.left;startY=t.clientY-r.top;isDragging=true;},{passive:false});
  overlay.addEventListener('touchmove',e=>{e.preventDefault();if(!isDragging)return;const t=e.touches[0],r=overlay.getBoundingClientRect();const fe=new MouseEvent('mousemove',{clientX:t.clientX,clientY:t.clientY});overlay.dispatchEvent(fe);},{passive:false});
  overlay.addEventListener('touchend',()=>isDragging=false);

  resetBtn.addEventListener('click',()=>{cropRect={x:0,y:0,w:canvas.width,h:canvas.height};updateInputs();drawOverlay();resultArea.style.display='none';});

  cropBtn.addEventListener('click',()=>{
    if(!img) return;
    const sx=parseFloat(cropXi.value),sy=parseFloat(cropYi.value),sw=parseFloat(cropWi.value),sh=parseFloat(cropHi.value);
    const out=document.createElement('canvas');
    out.width=sw;out.height=sh;
    out.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
    out.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      cropPreview.innerHTML=`<img src="${url}" class="preview-img" alt="Cropped">`;
      cropInfo.textContent=`${sw}×${sh}px | ${28tools.formatBytes(blob.size)}`;
      resultArea.style.display='';
    },'image/png');
  });

  downloadBtn.addEventListener('click',()=>{
    if(resultBlob) 28tools.downloadBlob(resultBlob,(origFile?origFile.name.replace(/\.[^.]+$/,''):'image')+'-cropped.png');
  });

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadImage(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadImage(fileInput.files[0]);});
})();