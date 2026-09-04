(function(){
  let img=null,canvas=null,ctx=null,zoom=10;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <p class="text-muted" style="font-size:.9rem;margin-bottom:12px">Click anywhere on the image to pick a color. Colors are added to your palette below.</p>
  <div id="currentColor" style="display:none">
  <div id="colorSwatch" class="color-swatch" style="width:100%;height:60px;border-radius:12px;margin-bottom:12px"></div>
  <div class="color-info" id="hexInfo"><span>HEX</span><span id="hexVal">#000000</span><button class="btn btn--sm btn--ghost" onclick="copyColor('hex')" style="margin-left:auto">📋</button></div>
  <div class="color-info" style="margin-top:8px" id="rgbInfo"><span>RGB</span><span id="rgbVal">0, 0, 0</span><button class="btn btn--sm btn--ghost" onclick="copyColor('rgb')" style="margin-left:auto">📋</button></div>
  <div class="color-info" style="margin-top:8px" id="hslInfo"><span>HSL</span><span id="hslVal">0°, 0%, 0%</span><button class="btn btn--sm btn--ghost" onclick="copyColor('hsl')" style="margin-left:auto">📋</button></div>
  </div>
  <div style="margin-top:16px"><label class="form-label">Picked Colors Palette</label><div class="color-palette" id="palette"></div></div>
  <button class="btn btn--ghost btn--sm" id="clearPaletteBtn" style="margin-top:8px">🗑 Clear Palette</button>`;

  let palette=[];
  document.getElementById('clearPaletteBtn').onclick=()=>{ palette=[]; renderPalette(); };

  window.copyColor=function(type){
    let text='';
    if(type==='hex') text=document.getElementById('hexVal').textContent;
    else if(type==='rgb') text='rgb('+document.getElementById('rgbVal').textContent+')';
    else text='hsl('+document.getElementById('hslVal').textContent+')';
    navigator.clipboard.writeText(text);
  };

  function renderPalette(){
    const p=document.getElementById('palette');
    p.innerHTML=palette.map(c=>`<div class="color-swatch" style="background:${c}" title="${c}" onclick="navigator.clipboard.writeText('${c}')"></div>`).join('');
  }

  function rgbToHsl(r,g,b){
    r/=255;g/=255;b/=255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0;}else{
      const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
      switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}
      h/=6;
    }
    return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
  }

  function setupCanvas(file){
    const url=URL.createObjectURL(file);
    img=new Image();
    img.onload=()=>{
      canvas=document.createElement('canvas');
      canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
      ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0);
      const displayW=Math.min(img.naturalWidth,700);
      canvas.style.maxWidth='100%';canvas.style.cursor='crosshair';canvas.style.borderRadius='12px';
      previewBody.innerHTML='';previewBody.style.padding='12px';previewBody.appendChild(canvas);
      sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${ToolsApp.formatBytes(file.size)}`;
      workspace.style.display='';
      canvas.addEventListener('click',pickColor);
      canvas.addEventListener('mousemove',e=>{ canvas.style.cursor='crosshair'; });
    };
    img.src=url;
  }

  function pickColor(e){
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const x=Math.floor((e.clientX-rect.left)*scaleX),y=Math.floor((e.clientY-rect.top)*scaleY);
    const px=ctx.getImageData(x,y,1,1).data;
    const r=px[0],g=px[1],b=px[2];
    const hex='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
    const [h,s,l]=rgbToHsl(r,g,b);
    document.getElementById('colorSwatch').style.background=hex;
    document.getElementById('hexVal').textContent=hex;
    document.getElementById('rgbVal').textContent=`${r}, ${g}, ${b}`;
    document.getElementById('hslVal').textContent=`${h}°, ${s}%, ${l}%`;
    document.getElementById('currentColor').style.display='';
    if(!palette.includes(hex)){ palette.unshift(hex); if(palette.length>20) palette.pop(); renderPalette(); }
  }

  processBtn.style.display='none';
  downloadBtn.addEventListener('click',()=>{
    const text=palette.map(c=>{const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16);return `${c}\trgb(${r},${g},${b})`;}).join('\n');
    const blob=new Blob([text],{type:'text/plain'});
    ToolsApp.downloadBlob(blob,'color-palette.txt');
  });
  downloadArea.style.display='';

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])setupCanvas(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])setupCanvas(fileInput.files[0]);});
})();