(function(){
  let pdfDoc=null,currentFile=null,pageOrder=[];
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`<p class="text-muted" style="font-size:.9rem;margin-bottom:8px">Drag the page thumbnails to reorder them.</p><div id="thumbGrid" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>`;
  processBtn.textContent='↕️ Save Reordered PDF';

  function loadFile(file){
    currentFile=file;
    const s1=document.createElement('script');s1.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s1.onload=async()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const s2=document.createElement('script');s2.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      s2.onload=async()=>{
        const ab=await file.arrayBuffer();
        const pdfJs=await pdfjsLib.getDocument({data:ab.slice()}).promise;
        pdfDoc=await PDFLib.PDFDocument.load(ab.slice(),{ignoreEncryption:true});
        const grid=document.getElementById('thumbGrid');
        grid.innerHTML='';
        pageOrder=[...Array(pdfJs.numPages)].map((_,i)=>i);
        for(let i=0;i<pdfJs.numPages;i++){
          const page=await pdfJs.getPage(i+1);
          const vp=page.getViewport({scale:.25});
          const canvas=document.createElement('canvas');
          canvas.width=vp.width;canvas.height=vp.height;
          await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
          const wrap=document.createElement('div');
          wrap.dataset.idx=i;wrap.draggable=true;
          wrap.style.cssText='cursor:grab;text-align:center;border:2px solid var(--clr-border);border-radius:6px;padding:4px;background:var(--clr-surface)';
          const lbl=document.createElement('div');lbl.style.cssText='font-size:.7rem;margin-top:4px;color:var(--clr-text-muted)';lbl.textContent=`P${i+1}`;
          wrap.appendChild(canvas);wrap.appendChild(lbl);
          grid.appendChild(wrap);
        }
        setupDrag(grid);
        previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ ${pdfJs.numPages} pages loaded. Drag to reorder.</div>`;
        sizeInfo.textContent=`${pdfJs.numPages} pages | ${28tools.formatBytes(file.size)}`;
        workspace.style.display='';
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }

  function setupDrag(grid){
    let dragged=null;
    grid.querySelectorAll('[draggable]').forEach(el=>{
      el.addEventListener('dragstart',()=>{dragged=el;el.style.opacity='.4';});
      el.addEventListener('dragend',()=>{el.style.opacity='';});
      el.addEventListener('dragover',e=>{e.preventDefault();const r=el.getBoundingClientRect();if(e.clientX>r.left+r.width/2)el.after(dragged);else el.before(dragged);});
    });
  }

  processBtn.addEventListener('click',async()=>{
    if(!pdfDoc) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Saving…';
    const grid=document.getElementById('thumbGrid');
    const order=[...grid.querySelectorAll('[draggable]')].map(el=>parseInt(el.dataset.idx));
    const newDoc=await PDFLib.PDFDocument.create();
    const pages=await newDoc.copyPages(pdfDoc,order);
    pages.forEach(p=>newDoc.addPage(p));
    const bytes=await newDoc.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    window._reorderedPdf=blob;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF saved with new page order (${order.length} pages)</div>`;
    sizeInfo.textContent=28tools.formatBytes(blob.size);
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='↕️ Save Reordered PDF';
  });

  downloadBtn.addEventListener('click',()=>{ if(window._reorderedPdf) 28tools.downloadBlob(window._reorderedPdf,'reordered.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();