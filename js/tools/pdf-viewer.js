(function(){
  let pdfDoc=null,currentPage=1;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div id="pdfInfo" style="font-size:.85rem;color:var(--clr-text-muted)"><p>Upload a PDF to see its details.</p></div>
  <div style="margin-top:16px">
  <label class="form-label">Zoom <span id="zoomVal">100%</span></label>
  <input type="range" class="form-range" id="zoomRange" min="50" max="300" value="100">
  </div>`;

  processBtn.style.display='none';
  document.getElementById('zoomRange')?.addEventListener('input',e=>{ document.getElementById('zoomVal').textContent=e.target.value+'%'; if(pdfDoc) renderPage(currentPage,e.target.value/100); });

  function loadFile(file){
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=async()=>{
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab=await file.arrayBuffer();
      pdfDoc=await pdfjsLib.getDocument({data:ab}).promise;
      const meta=await pdfDoc.getMetadata().catch(()=>({info:{}}));
      const info=meta.info||{};
      document.getElementById('pdfInfo').innerHTML=`
      <table style="width:100%;border-collapse:collapse;font-size:.82rem">
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">Pages</td><td style="padding:5px 0;font-weight:600">${pdfDoc.numPages}</td></tr>
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">File Size</td><td style="padding:5px 0;font-weight:600">${ToolsApp.formatBytes(file.size)}</td></tr>
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">Title</td><td style="padding:5px 0">${info.Title||'(none)'}</td></tr>
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">Author</td><td style="padding:5px 0">${info.Author||'(none)'}</td></tr>
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">Creator</td><td style="padding:5px 0">${info.Creator||'(none)'}</td></tr>
      <tr><td style="padding:5px 0;color:var(--clr-text-muted)">Producer</td><td style="padding:5px 0">${info.Producer||'(none)'}</td></tr>
      </table>`;
      sizeInfo.textContent=`${pdfDoc.numPages} pages | ${ToolsApp.formatBytes(file.size)}`;
      workspace.style.display='';
      currentPage=1;
      await renderPage(1,1);
      // Navigation
      const nav=document.createElement('div');
      nav.className='pdf-page-nav';
      nav.innerHTML=`<button class="btn btn--ghost btn--sm" id="prevPage">← Prev</button><span id="pageNum">Page 1 / ${pdfDoc.numPages}</span><button class="btn btn--ghost btn--sm" id="nextPage">Next →</button>`;
      previewBody.after(nav);
      document.getElementById('prevPage').addEventListener('click',async()=>{ if(currentPage>1){currentPage--;await renderPage(currentPage,document.getElementById('zoomRange').value/100);document.getElementById('pageNum').textContent=`Page ${currentPage} / ${pdfDoc.numPages}`;} });
      document.getElementById('nextPage').addEventListener('click',async()=>{ if(currentPage<pdfDoc.numPages){currentPage++;await renderPage(currentPage,document.getElementById('zoomRange').value/100);document.getElementById('pageNum').textContent=`Page ${currentPage} / ${pdfDoc.numPages}`;} });
    };
    document.head.appendChild(s);
  }

  async function renderPage(num,scale=1){
    const page=await pdfDoc.getPage(num);
    const vp=page.getViewport({scale});
    const canvas=document.createElement('canvas');
    canvas.width=vp.width;canvas.height=vp.height;
    canvas.style.cssText='display:block;max-width:100%;box-shadow:var(--shadow-md);border-radius:4px';
    await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
    previewBody.innerHTML='';
    previewBody.style.cssText='padding:16px;overflow:auto;';
    previewBody.appendChild(canvas);
  }

  downloadArea.style.display='none';
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();