(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Pages</label>
  <select class="form-select" id="extractPages"><option value="all">All Pages</option><option value="first">First Page</option><option value="custom">Custom Range</option></select></div>
  <div id="customRange" style="display:none" class="form-group"><label class="form-label">Range (e.g. 1-5)</label><input type="text" class="form-input" id="rangeInput" placeholder="1-5"></div>`;

  document.getElementById('extractPages').addEventListener('change',e=>{ document.getElementById('customRange').style.display=e.target.value==='custom'?'':'none'; });

  processBtn.textContent='📋 Extract Text';
  function loadFile(file){
    currentFile=file;
    previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ PDF ready. Click Extract Text.</div>`;
    sizeInfo.textContent=ToolsApp.formatBytes(file.size);
    workspace.style.display='';
  }

  processBtn.addEventListener('click',async()=>{
    if(!currentFile) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Extracting…';
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=async()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab=await currentFile.arrayBuffer();
      const pdf=await pdfjsLib.getDocument({data:ab}).promise;
      const mode=document.getElementById('extractPages').value;
      let pages=[];
      if(mode==='all') pages=[...Array(pdf.numPages)].map((_,i)=>i+1);
      else if(mode==='first') pages=[1];
      else{
        const [a,b]=document.getElementById('rangeInput').value.split('-').map(Number);
        for(let i=a;i<=Math.min(b||a,pdf.numPages);i++) pages.push(i);
      }
      let fullText='';
      for(const pNum of pages){
        const page=await pdf.getPage(pNum);
        const tc=await page.getTextContent();
        const pageText=tc.items.map(item=>'str' in item?item.str:'').join(' ');
        fullText+=`\n\n--- Page ${pNum} ---\n${pageText}`;
      }
      fullText=fullText.trim();
      previewBody.innerHTML=`<div style="max-height:400px;overflow:auto;background:var(--clr-surface-2);border-radius:8px;padding:16px"><pre style="white-space:pre-wrap;word-break:break-word;font-size:.85rem;color:var(--clr-text);font-family:var(--font-mono)">${fullText.slice(0,5000)+(fullText.length>5000?'\n\n[... truncated, download for full text]':'')}</pre></div>`;
      sizeInfo.textContent=`${pages.length} pages | ${fullText.length} chars`;
      window._extractedText=fullText;
      downloadArea.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='📋 Extract Text';
    };
    document.head.appendChild(s);
  });

  downloadBtn.addEventListener('click',()=>{
    const text=window._extractedText||'';
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    ToolsApp.downloadBlob(blob,'extracted-text.txt');
  });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();