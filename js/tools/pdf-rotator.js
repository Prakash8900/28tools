(function(){
  let pdfDoc=null,currentFile=null,pageRotations={};
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Apply To</label>
  <select class="form-select" id="rotateTarget"><option value="all">All Pages</option><option value="odd">Odd Pages</option><option value="even">Even Pages</option><option value="custom">Custom Pages</option></select></div>
  <div id="customPages" style="display:none" class="form-group"><label class="form-label">Page Numbers (comma-separated)</label><input type="text" class="form-input" id="customPageNums" placeholder="1,3,5"></div>
  <div class="form-group"><label class="form-label">Rotation</label>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
  <button class="btn btn--ghost btn--sm" onclick="setRot(90)">↻ 90°</button>
  <button class="btn btn--ghost btn--sm" onclick="setRot(180)">↻ 180°</button>
  <button class="btn btn--ghost btn--sm" onclick="setRot(270)">↺ 270°</button>
  <button class="btn btn--ghost btn--sm" onclick="setRot(0)">↩ Reset</button>
  </div></div>
  <div id="rotList" style="font-size:.85rem;margin-top:8px;color:var(--clr-text-muted)"></div>`;

  document.getElementById('rotateTarget').addEventListener('change',e=>{ document.getElementById('customPages').style.display=e.target.value==='custom'?'':'none'; });

  window.setRot=function(deg){
    if(!pdfDoc) return;
    const target=document.getElementById('rotateTarget').value;
    const total=pdfDoc.getPageCount();
    let pages=[];
    if(target==='all') pages=[...Array(total)].map((_,i)=>i+1);
    else if(target==='odd') pages=[...Array(total)].map((_,i)=>i+1).filter(n=>n%2!==0);
    else if(target==='even') pages=[...Array(total)].map((_,i)=>i+1).filter(n=>n%2===0);
    else pages=document.getElementById('customPageNums').value.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n)&&n>=1&&n<=total);
    pages.forEach(p=>pageRotations[p]=(pageRotations[p]||0)+deg);
    document.getElementById('rotList').innerHTML=Object.entries(pageRotations).filter(([,v])=>v%360!==0).map(([p,r])=>`Page ${p}: ${r%360}°`).join(', ') || 'No rotations set';
  };

  function loadFile(file){
    currentFile=file; pageRotations={};
    const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{ const {PDFDocument}=PDFLib; const ab=await file.arrayBuffer(); pdfDoc=await PDFDocument.load(ab,{ignoreEncryption:true}); previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Loaded: ${pdfDoc.getPageCount()} pages</div>`; sizeInfo.textContent=`${pdfDoc.getPageCount()} pages | ${ToolsApp.formatBytes(file.size)}`; workspace.style.display=''; };
    document.head.appendChild(s);
  }

  processBtn.textContent='🔃 Apply Rotations';
  processBtn.addEventListener('click',async()=>{
    if(!pdfDoc) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Rotating…';
    const {PDFDocument}=PDFLib;
    const ab=await currentFile.arrayBuffer();
    const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
    doc.getPages().forEach((page,i)=>{
      const pNum=i+1;
      const rot=pageRotations[pNum]||0;
      if(rot%360!==0) page.setRotation({angle:(page.getRotation().angle+rot)%360,type:'degrees'});
    });
    const bytes=await doc.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    window._rotatedPdf=blob;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Rotations applied and PDF saved</div>`;
    sizeInfo.textContent=ToolsApp.formatBytes(blob.size);
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='🔃 Apply Rotations';
  });

  downloadBtn.addEventListener('click',()=>{ if(window._rotatedPdf) ToolsApp.downloadBlob(window._rotatedPdf,'rotated.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();