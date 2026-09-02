(function(){
  let img=null,origFile=null,resultBlob=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="wmText">Watermark Text</label><input type="text" class="form-input" id="wmText" value="© 28tools" placeholder="Enter watermark text"></div>
  <div class="form-group"><label class="form-label">Font Size <span id="fsVal">40px</span></label><input type="range" class="form-range" id="fontSize" min="10" max="200" value="40"></div>
  <div class="form-group"><label class="form-label" for="wmColor">Color</label><input type="color" id="wmColor" value="#ffffff" style="width:100%;height:44px;border-radius:8px;border:1.5px solid var(--clr-border);cursor:pointer"></div>
  <div class="form-group"><label class="form-label">Opacity <span id="opVal">50%</span></label><input type="range" class="form-range" id="wmOpacity" min="5" max="100" value="50"></div>
  <div class="form-group"><label class="form-label">Position</label>
  <select class="form-select" id="wmPos"><option value="center">Center</option><option value="bottomRight">Bottom Right</option><option value="bottomLeft">Bottom Left</option><option value="topRight">Top Right</option><option value="topLeft">Top Left</option><option value="tiled">Tiled</option></select></div>
  <div class="form-group"><label class="form-label">Rotation <span id="rotVal">-30°</span></label><input type="range" class="form-range" id="wmRotation" min="-90" max="90" value="-30"></div>`;

  const fs=document.getElementById('fontSize'),op=document.getElementById('wmOpacity'),rot=document.getElementById('wmRotation');
  fs.addEventListener('input',()=>document.getElementById('fsVal').textContent=fs.value+'px');
  op.addEventListener('input',()=>document.getElementById('opVal').textContent=op.value+'%');
  rot.addEventListener('input',()=>document.getElementById('rotVal').textContent=rot.value+'°');

  function applyWatermark(){
    if(!img) return;
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth; canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    const text=document.getElementById('wmText').value||'Watermark';
    const size=parseInt(fs.value);
    const color=document.getElementById('wmColor').value;
    const opacity=parseInt(op.value)/100;
    const pos=document.getElementById('wmPos').value;
    const angle=parseInt(rot.value)*Math.PI/180;
    ctx.save();
    ctx.globalAlpha=opacity;
    ctx.fillStyle=color;
    ctx.font=`bold ${size}px Inter, sans-serif`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    const tw=canvas.width,th=canvas.height;
    if(pos==='tiled'){
      const spacing=size*4;
      for(let x=-tw;x<tw*2;x+=spacing){
        for(let y=-th;y<th*2;y+=spacing){
          ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillText(text,0,0);ctx.restore();
        }
      }
    } else {
      let x=tw/2,y=th/2;
      const pad=size*2;
      if(pos==='bottomRight'){x=tw-pad;y=th-pad;}
      else if(pos==='bottomLeft'){x=pad;y=th-pad;}
      else if(pos==='topRight'){x=tw-pad;y=pad;}
      else if(pos==='topLeft'){x=pad;y=pad;}
      ctx.translate(x,y);ctx.rotate(angle);ctx.fillText(text,0,0);
    }
    ctx.restore();
    canvas.toBlob(blob=>{
      resultBlob=blob;
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Watermarked">`;
      sizeInfo.textContent=`${canvas.width}×${canvas.height} | ${28tools.formatBytes(blob.size)}`;
      downloadArea.style.display='';
    },'image/png');
  }

  processBtn.addEventListener('click',applyWatermark);
  downloadBtn.addEventListener('click',()=>{
    if(resultBlob) 28tools.downloadBlob(resultBlob,(origFile?origFile.name.replace(/\.[^.]+$/,''):'img')+'-watermarked.png');
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