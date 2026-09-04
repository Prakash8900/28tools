(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="pdfPass">PDF Password</label><input type="password" class="form-input" id="pdfPass" placeholder="Enter the PDF password" autocomplete="current-password"></div>
  <div class="status-msg status-msg--info" style="margin-top:8px">ℹ️ Only use this on PDFs you own. This tool removes protection for personal use.</div>`;

  processBtn.textContent='🔓 Unlock PDF';
  function loadFile(file){
    currentFile=file;
    previewBody.innerHTML=`<div class="status-msg status-msg--info">ℹ️ Enter the password and click Unlock</div>`;
    sizeInfo.textContent=ToolsApp.formatBytes(file.size);
    workspace.style.display='';
  }

  processBtn.addEventListener('click',async()=>{
    if(!currentFile) return;
    const pass=document.getElementById('pdfPass').value;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Unlocking…';
    const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      try{
        const {PDFDocument}=PDFLib;
        const ab=await currentFile.arrayBuffer();
        const doc=await PDFDocument.load(ab,{password:pass,ignoreEncryption:false});
        const bytes=await doc.save();
        const blob=new Blob([bytes],{type:'application/pdf'});
        window._unlockedPdf=blob;
        previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF unlocked successfully! ${doc.getPageCount()} pages</div>`;
        sizeInfo.textContent=`${doc.getPageCount()} pages | ${ToolsApp.formatBytes(blob.size)}`;
        downloadArea.style.display='';
      }catch(e){
        previewBody.innerHTML=`<div class="status-msg status-msg--error">❌ Failed to unlock: ${e.message}. Check your password.</div>`;
      }
      processBtn.disabled=false;processBtn.innerHTML='🔓 Unlock PDF';
    };
    document.head.appendChild(s);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._unlockedPdf) ToolsApp.downloadBlob(window._unlockedPdf,'unlocked.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();