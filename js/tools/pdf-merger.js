(function(){
  let files=[];
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  fileInput.setAttribute('multiple','');
  document.getElementById('toolControls').innerHTML=`
  <p class="text-muted" style="font-size:.9rem;margin-bottom:12px">Add multiple PDFs below. Drag to reorder them before merging.</p>
  <div id="fileListArea" class="file-list"></div>`;

  function loadFiles(fileList){
    const pdfs=[...fileList].filter(f=>f.type==='application/pdf'||f.name.endsWith('.pdf'));
    files=[...files,...pdfs];
    renderList();
    workspace.style.display='';
    sizeInfo.textContent=`${files.length} PDF files`;
    previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ ${files.length} PDF file(s) ready to merge</div>`;
  }

  function renderList(){
    document.getElementById('fileListArea').innerHTML=files.map((f,i)=>`
    <div class="file-item" draggable="true" data-idx="${i}" id="fi-${i}">
    <span class="drag-handle" title="Drag to reorder">⠿</span>
    <span class="file-item__icon">📄</span>
    <span class="file-item__name">${f.name}</span>
    <span class="file-item__size">${28tools.formatBytes(f.size)}</span>
    <button class="file-item__remove" onclick="removePdf(${i})">✕</button>
    </div>`).join('');
    setupDragSort();
  }

  window.removePdf=function(i){ files.splice(i,1); renderList(); sizeInfo.textContent=`${files.length} PDF files`; };

  function setupDragSort(){
    let dragged=null;
    document.querySelectorAll('.file-item[draggable]').forEach(el=>{
      el.addEventListener('dragstart',()=>{ dragged=el; el.style.opacity='.5'; });
      el.addEventListener('dragend',()=>{ el.style.opacity=''; });
      el.addEventListener('dragover',e=>{ e.preventDefault(); const r=el.getBoundingClientRect(); if(e.clientY>r.top+r.height/2) el.after(dragged); else el.before(dragged); });
      el.addEventListener('drop',e=>{ e.preventDefault(); const newOrder=[...document.querySelectorAll('.file-item[draggable]')].map(el=>files[parseInt(el.dataset.idx)]); files=newOrder; renderList(); });
    });
  }

  processBtn.textContent='🔗 Merge PDFs';
  processBtn.addEventListener('click',async()=>{
    if(files.length<2){previewBody.innerHTML='<div class="status-msg status-msg--error">❌ Please add at least 2 PDF files</div>';return;}
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Merging…';
    const s=document.createElement('script');
    s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      const {PDFDocument}=PDFLib;
      const merged=await PDFDocument.create();
      for(const file of files){
        const ab=await file.arrayBuffer();
        const pdf=await PDFDocument.load(ab,{ignoreEncryption:true});
        const pages=await merged.copyPages(pdf,pdf.getPageIndices());
        pages.forEach(p=>merged.addPage(p));
      }
      const bytes=await merged.save();
      const blob=new Blob([bytes],{type:'application/pdf'});
      window._mergedPdf=blob;
      const total=merged.getPageCount();
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Merged ${files.length} PDFs into 1 file with ${total} pages.<br><a href="${URL.createObjectURL(blob)}" target="_blank" style="color:var(--clr-primary)">Preview PDF</a></div>`;
      sizeInfo.textContent=`Merged: ${total} pages | ${28tools.formatBytes(blob.size)}`;
      downloadArea.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='🔗 Merge PDFs';
    };
    document.head.appendChild(s);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._mergedPdf) 28tools.downloadBlob(window._mergedPdf,'merged.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');loadFiles(e.dataTransfer.files);});
  fileInput.addEventListener('change',()=>loadFiles(fileInput.files));
})();