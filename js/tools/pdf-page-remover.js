(function(){
  let pdfDoc=null,currentFile=null,selectedPages=new Set();
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`<p class="text-muted" style="font-size:.9rem;margin-bottom:8px">Click page thumbnails to select pages to remove. Selected pages are highlighted in red.</p><div id="pageGrid" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div><p id="selCount" style="font-size:.85rem;color:var(--clr-text-muted);margin-top:8px">0 pages selected for removal</p>`;
  processBtn.textContent='🗑️ Remove Selected Pages';

  function loadFile(file){
    currentFile=file; selectedPages.clear();
    const s1=document.createElement('script');s1.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s1.onload=async()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab=await file.arrayBuffer();
      const pdfJs=await pdfjsLib.getDocument({data:ab}).promise;
      const s2=document.createElement('script');s2.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      s2.onload=async()=>{ pdfDoc=await PDFLib.PDFDocument.load(ab.slice(),{ignoreEncryption:true}); };
      document.head.appendChild(s2);
      // Render thumbnails
      const grid=document.getElementById('pageGrid');
      grid.innerHTML='';
      for(let i=1;i<=pdfJs.numPages;i++){
        const page=await pdfJs.getPage(i);
        const vp=page.getViewport({scale:.3});
        const canvas=document.createElement('canvas');
        canvas.width=vp.width;canvas.height=vp.height;
        canvas.style.cssText='cursor:pointer;border:2px solid var(--clr-border);border-radius:4px;';
        canvas.dataset.page=i;
        canvas.title=`Page ${i}`;
        await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
        const label=document.createElement('div');
        label.style.cssText='font-size:.7rem;text-align:center;color:var(--clr-text-muted)';
        label.textContent=`P${i}`;
        const wrap=document.createElement('div');
        wrap.style.cssText='text-align:center;cursor:pointer';
        wrap.appendChild(canvas);wrap.appendChild(label);
        wrap.addEventListener('click',()=>{ if(selectedPages.has(i)){selectedPages.delete(i);canvas.style.borderColor='var(--clr-border)';canvas.style.opacity='1';}else{selectedPages.add(i);canvas.style.borderColor='var(--clr-pdf)';canvas.style.opacity='.5';} document.getElementById('selCount').textContent=`${selectedPages.size} page(s) selected for removal`; });
        grid.appendChild(wrap);
      }
      previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ ${pdfJs.numPages} pages loaded. Click thumbnails to select pages to remove.</div>`;
      sizeInfo.textContent=`${pdfJs.numPages} pages | ${ToolsApp.formatBytes(file.size)}`;
      workspace.style.display='';
    };
    document.head.appendChild(s1);
  }

  processBtn.addEventListener('click',async()=>{
    if(!pdfDoc||!selectedPages.size){previewBody.innerHTML='<div class="status-msg status-msg--error">❌ Select at least one page to remove</div>';return;}
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Removing…';
    const {PDFDocument}=PDFLib;
    const ab=await currentFile.arrayBuffer();
    const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
    const toRemove=[...selectedPages].sort((a,b)=>b-a);
    toRemove.forEach(p=>doc.removePage(p-1));
    const bytes=await doc.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    window._removedPdf=blob;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Removed ${selectedPages.size} page(s). New document: ${doc.getPageCount()} pages</div>`;
    sizeInfo.textContent=`${doc.getPageCount()} pages | ${ToolsApp.formatBytes(blob.size)}`;
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='🗑️ Remove Selected Pages';
  });

  downloadBtn.addEventListener('click',()=>{ if(window._removedPdf) ToolsApp.downloadBlob(window._removedPdf,'pages-removed.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();