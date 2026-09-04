(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="wmText">Watermark Text</label><input type="text" class="form-input" id="wmText" value="CONFIDENTIAL" placeholder="Watermark text"></div>
  <div class="form-group"><label class="form-label">Font Size <span id="fsVal">60pt</span></label><input type="range" class="form-range" id="fontSize" min="12" max="150" value="60"></div>
  <div class="form-group"><label class="form-label">Opacity <span id="opVal">30%</span></label><input type="range" class="form-range" id="wmOpacity" min="5" max="100" value="30"></div>
  <div class="form-group"><label class="form-label">Rotation (degrees) <span id="rotVal">-45°</span></label><input type="range" class="form-range" id="wmRotation" min="-90" max="90" value="-45"></div>
  <div class="form-group"><label class="form-label" for="wmColor">Color</label>
  <select class="form-select" id="wmColor"><option value="gray">Gray</option><option value="red">Red</option><option value="blue">Blue</option><option value="black">Black</option></select></div>
  <div class="form-group"><label class="form-label">Apply To</label>
  <select class="form-select" id="applyTo"><option value="all">All Pages</option><option value="first">First Page Only</option></select></div>`;

  ['fontSize','wmOpacity','wmRotation'].forEach(id=>{
    const lblMap={fontSize:'fsVal',wmOpacity:'opVal',wmRotation:'rotVal'};
    const unitMap={fontSize:'pt',wmOpacity:'%',wmRotation:'°'};
    document.getElementById(id).addEventListener('input',e=>document.getElementById(lblMap[id]).textContent=e.target.value+unitMap[id]);
  });

  processBtn.textContent='💧 Add Watermark';
  function loadFile(file){
    currentFile=file;
    previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ PDF ready. Configure watermark and click Add.</div>`;
    sizeInfo.textContent=ToolsApp.formatBytes(file.size);
    workspace.style.display='';
  }

  processBtn.addEventListener('click',async()=>{
    if(!currentFile) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Adding watermark…';
    const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      const {PDFDocument,rgb,StandardFonts,degrees}=PDFLib;
      const ab=await currentFile.arrayBuffer();
      const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
      const font=await doc.embedFont(StandardFonts.HelveticaBold);
      const text=document.getElementById('wmText').value||'WATERMARK';
      const size=parseInt(document.getElementById('fontSize').value);
      const opacity=parseInt(document.getElementById('wmOpacity').value)/100;
      const rotation=parseInt(document.getElementById('wmRotation').value);
      const colorName=document.getElementById('wmColor').value;
      const colorMap={gray:rgb(.5,.5,.5),red:rgb(.8,.1,.1),blue:rgb(.1,.1,.8),black:rgb(0,0,0)};
      const color=colorMap[colorName]||rgb(.5,.5,.5);
      const applyTo=document.getElementById('applyTo').value;
      const pages=applyTo==='all'?doc.getPages():[doc.getPages()[0]];
      pages.forEach(page=>{
        const {width,height}=page.getSize();
        const tw=font.widthOfTextAtSize(text,size);
        page.drawText(text,{x:width/2-tw/2,y:height/2-size/2,size,font,color,opacity,rotate:degrees(rotation)});
      });
      const bytes=await doc.save();
      const blob=new Blob([bytes],{type:'application/pdf'});
      window._wmPdf=blob;
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Watermark added to ${pages.length} page(s)</div>`;
      sizeInfo.textContent=ToolsApp.formatBytes(blob.size);
      downloadArea.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='💧 Add Watermark';
    };
    document.head.appendChild(s);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._wmPdf) ToolsApp.downloadBlob(window._wmPdf,'watermarked.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();