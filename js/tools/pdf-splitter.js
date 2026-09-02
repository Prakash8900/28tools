(function(){
  let pdfDoc=null,currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Split Mode</label>
  <select class="form-select" id="splitMode"><option value="all">Extract All Pages (individual files)</option><option value="range">Custom Page Ranges</option><option value="every">Every N Pages</option></select></div>
  <div id="rangeMode" style="display:none" class="form-group"><label class="form-label">Ranges (e.g. 1-3,4-6,7)</label><input type="text" class="form-input" id="rangeInput" placeholder="1-3,4-6,7-9"></div>
  <div id="everyMode" style="display:none" class="form-group"><label class="form-label">Pages per file</label><input type="number" class="form-input" id="everyN" min="1" value="1"></div>`;

  document.getElementById('splitMode').addEventListener('change',e=>{
    document.getElementById('rangeMode').style.display=e.target.value==='range'?'':'none';
    document.getElementById('everyMode').style.display=e.target.value==='every'?'':'none';
  });

  function loadPDF(file){
    currentFile=file;
    const s=document.createElement('script');
    s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      const {PDFDocument}=PDFLib;
      const ab=await file.arrayBuffer();
      pdfDoc=await PDFDocument.load(ab,{ignoreEncryption:true});
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF loaded: ${pdfDoc.getPageCount()} pages</div>`;
      sizeInfo.textContent=`${pdfDoc.getPageCount()} pages | ${28tools.formatBytes(file.size)}`;
      workspace.style.display='';
    };
    document.head.appendChild(s);
  }

  processBtn.textContent='✂️ Split PDF';
  processBtn.addEventListener('click',async()=>{
    if(!pdfDoc) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Splitting…';
    const {PDFDocument}=PDFLib;
    const totalPages=pdfDoc.getPageCount();
    const mode=document.getElementById('splitMode').value;
    let groups=[];
    if(mode==='all') groups=[...Array(totalPages)].map((_,i)=>[i]);
    else if(mode==='every'){
      const n=parseInt(document.getElementById('everyN').value)||1;
      for(let i=0;i<totalPages;i+=n) groups.push([...Array(Math.min(n,totalPages-i))].map((_,j)=>i+j));
    } else {
      const input=document.getElementById('rangeInput').value;
      input.split(',').forEach(part=>{
        const [a,b]=part.trim().split('-').map(s=>parseInt(s)-1);
        if(isNaN(a)) return;
        const end=isNaN(b)?a:b;
        const pages=[];
        for(let i=a;i<=end&&i<totalPages;i++) pages.push(i);
        if(pages.length) groups.push(pages);
      });
    }
    const blobs=[];
    for(let g=0;g<groups.length;g++){
      const newDoc=await PDFDocument.create();
      const pages=await newDoc.copyPages(pdfDoc,groups[g]);
      pages.forEach(p=>newDoc.addPage(p));
      const bytes=await newDoc.save();
      const name=mode==='all'?`page-${groups[g][0]+1}.pdf`:`part-${g+1}-pages-${groups[g][0]+1}-${groups[g][groups[g].length-1]+1}.pdf`;
      blobs.push({blob:new Blob([bytes],{type:'application/pdf'}),name});
    }
    window._splitBlobs=blobs;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Split into ${blobs.length} file(s)</div><ul style="margin-top:12px;font-size:.9rem">${blobs.map(b=>`<li style="padding:4px 0;color:var(--clr-text-muted)">📄 ${b.name} (${28tools.formatBytes(b.blob.size)})</li>`).join('')}</ul>`;
    sizeInfo.textContent=`${blobs.length} files created`;
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='✂️ Split PDF';
  });

  downloadBtn.addEventListener('click',async()=>{
    const blobs=window._splitBlobs||[];
    if(blobs.length===1){28tools.downloadBlob(blobs[0].blob,blobs[0].name);return;}
    downloadBtn.disabled=true;downloadBtn.innerHTML='<span class="spinner"></span> Zipping…';
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    s.onload=async()=>{ const zip=new JSZip(); blobs.forEach(({blob,name})=>zip.file(name,blob)); const zb=await zip.generateAsync({type:'blob'}); 28tools.downloadBlob(zb,'split-pages.zip'); downloadBtn.disabled=false;downloadBtn.innerHTML='⬇️ Download ZIP'; };
    document.head.appendChild(s);
  });

  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadPDF(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadPDF(fileInput.files[0]);});
})();