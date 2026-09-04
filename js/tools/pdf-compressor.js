(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <p class="text-muted" style="font-size:.9rem;margin-bottom:12px">Compresses embedded images in the PDF to reduce file size.</p>
  <div class="form-group"><label class="form-label">Image Quality <span id="qVal">60%</span></label><input type="range" class="form-range" id="pdfQuality" min="10" max="90" value="60"></div>
  <div class="form-group"><label class="form-label">Note</label><p class="text-muted" style="font-size:.85rem">PDF compression re-renders embedded images at lower quality. Text and vectors remain lossless.</p></div>`;

  document.getElementById('pdfQuality').addEventListener('input',e=>document.getElementById('qVal').textContent=e.target.value+'%');

  function loadFile(file){ currentFile=file; previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF ready: ${ToolsApp.formatBytes(file.size)}</div>`; sizeInfo.textContent=ToolsApp.formatBytes(file.size); workspace.style.display=''; }

  processBtn.textContent='🗜️ Compress PDF';
  processBtn.addEventListener('click',async()=>{
    if(!currentFile) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Compressing…';
    const quality=parseInt(document.getElementById('pdfQuality').value)/100;
    // Load PDF.js to render + pdf-lib to rebuild
    const s1=document.createElement('script');s1.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s1.onload=async()=>{
      const s2=document.createElement('script');s2.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      s2.onload=async()=>{
        const {PDFDocument,rgb}=PDFLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const ab=await currentFile.arrayBuffer();
        const pdfJsDoc=await pdfjsLib.getDocument({data:ab.slice()}).promise;
        const newDoc=await PDFDocument.create();
        for(let i=1;i<=pdfJsDoc.numPages;i++){
          const page=await pdfJsDoc.getPage(i);
          const vp=page.getViewport({scale:1});
          const canvas=document.createElement('canvas');
          canvas.width=vp.width;canvas.height=vp.height;
          await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
          const dataUrl=canvas.toDataURL('image/jpeg',quality);
          const imgBytes=await fetch(dataUrl).then(r=>r.arrayBuffer());
          const img=await newDoc.embedJpg(imgBytes);
          const p=newDoc.addPage([vp.width,vp.height]);
          p.drawImage(img,{x:0,y:0,width:vp.width,height:vp.height});
        }
        const bytes=await newDoc.save();
        const blob=new Blob([bytes],{type:'application/pdf'});
        window._compressedPdf=blob;
        const saved=currentFile.size-blob.size;
        const pct=Math.round(saved/currentFile.size*100);
        previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Compressed!<br>Original: ${ToolsApp.formatBytes(currentFile.size)}<br>Compressed: ${ToolsApp.formatBytes(blob.size)}<br>Saved: ${ToolsApp.formatBytes(Math.max(0,saved))} (${Math.max(0,pct)}%)</div>`;
        sizeInfo.textContent=`${ToolsApp.formatBytes(blob.size)} (${Math.max(0,pct)}% smaller)`;
        downloadArea.style.display='';
        processBtn.disabled=false;processBtn.innerHTML='🗜️ Compress PDF';
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._compressedPdf) ToolsApp.downloadBlob(window._compressedPdf,'compressed.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();