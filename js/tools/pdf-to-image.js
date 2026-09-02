(function(){
  let pdfDoc=null,currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Output Format</label>
  <select class="form-select" id="imgFmt"><option value="image/png">PNG (higher quality)</option><option value="image/jpeg">JPG (smaller size)</option></select></div>
  <div class="form-group"><label class="form-label">Scale / DPI <span id="scaleVal">1.5x (~108 DPI)</span></label>
  <input type="range" class="form-range" id="imgScale" min="1" max="4" step="0.5" value="1.5"></div>
  <div class="form-group"><label class="form-label">Pages</label>
  <select class="form-select" id="pageRange"><option value="all">All Pages</option><option value="first">First Page Only</option><option value="custom">Custom Range</option></select></div>
  <div id="customRange" style="display:none" class="form-group"><label class="form-label">Page Range (e.g. 1-3,5)</label><input type="text" class="form-input" id="pageRangeInput" placeholder="1-3,5,7"></div>`;

  document.getElementById('imgScale').addEventListener('input',e=>{
    const v=parseFloat(e.target.value);
    document.getElementById('scaleVal').textContent=`${v}x (~${Math.round(v*72)} DPI)`;
  });
  document.getElementById('pageRange').addEventListener('change',e=>{ document.getElementById('customRange').style.display=e.target.value==='custom'?'':'none'; });

  function loadPDF(file){
    if(file.type!=='application/pdf'&&!file.name.endsWith('.pdf')){return;}
    currentFile=file;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Loading…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload=async()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab=await file.arrayBuffer();
      pdfDoc=await pdfjsLib.getDocument({data:ab}).promise;
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF loaded: ${pdfDoc.numPages} page(s)</div>`;
      sizeInfo.textContent=`${pdfDoc.numPages} pages | ${28tools.formatBytes(file.size)}`;
      workspace.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='🖼️ Convert to Images';
    };
    document.head.appendChild(script);
  }

  processBtn.textContent='🖼️ Convert to Images';
  processBtn.addEventListener('click',async()=>{
    if(!pdfDoc) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Converting…';
    const fmt=document.getElementById('imgFmt').value;
    const scale=parseFloat(document.getElementById('imgScale').value);
    const ext=fmt==='image/png'?'png':'jpg';
    const rangeMode=document.getElementById('pageRange').value;
    let pages=[];
    if(rangeMode==='all') pages=[...Array(pdfDoc.numPages)].map((_,i)=>i+1);
    else if(rangeMode==='first') pages=[1];
    else{
      const input=document.getElementById('pageRangeInput').value;
      input.split(',').forEach(part=>{
        const [a,b]=part.split('-').map(Number);
        if(b) for(let i=a;i<=b;i++) pages.push(i);
        else if(!isNaN(a)) pages.push(a);
      });
      pages=pages.filter(p=>p>=1&&p<=pdfDoc.numPages);
    }
    const blobs=[];
    const prevItems=[];
    for(const pNum of pages){
      const page=await pdfDoc.getPage(pNum);
      const vp=page.getViewport({scale});
      const canvas=document.createElement('canvas');
      canvas.width=vp.width;canvas.height=vp.height;
      await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
      const blob=await new Promise(res=>canvas.toBlob(res,fmt,0.95));
      blobs.push({blob,name:`page-${pNum}.${ext}`});
      prevItems.push(`<img src="${URL.createObjectURL(blob)}" style="width:100%;max-height:200px;object-fit:contain;border-radius:6px;border:1px solid var(--clr-border)" alt="Page ${pNum}">`);
    }
    previewBody.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">${prevItems.join('')}</div>`;
    sizeInfo.textContent=`${pages.length} images converted`;
    window._pdfImages=blobs;
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='🖼️ Convert to Images';
  });

  downloadBtn.addEventListener('click',async()=>{
    const imgs=window._pdfImages||[];
    if(!imgs.length) return;
    if(imgs.length===1){28tools.downloadBlob(imgs[0].blob,imgs[0].name);return;}
    downloadBtn.disabled=true;downloadBtn.innerHTML='<span class="spinner"></span> Zipping…';
    const s2=document.createElement('script');s2.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s2.onload=async()=>{ const zip=new JSZip(); imgs.forEach(({blob,name})=>zip.file(name,blob)); const zb=await zip.generateAsync({type:'blob'}); 28tools.downloadBlob(zb,'pdf-pages.zip'); downloadBtn.disabled=false;downloadBtn.innerHTML='⬇️ Download Images ZIP'; };
    document.head.appendChild(s2);
  });

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadPDF(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadPDF(fileInput.files[0]);});
})();