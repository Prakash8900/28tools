(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="userPass">User Password <span>(required to open)</span></label><input type="password" class="form-input" id="userPass" placeholder="Enter password" autocomplete="new-password"></div>
  <div class="form-group"><label class="form-label" for="ownerPass">Owner Password <span>(optional, for permissions)</span></label><input type="password" class="form-input" id="ownerPass" placeholder="Same as user if blank" autocomplete="new-password"></div>
  <div class="form-group"><label class="form-label">Permissions</label>
  <label class="toggle-switch" style="margin-bottom:8px"><input type="checkbox" id="allowPrint" checked><div class="toggle-track"></div><span class="toggle-label">Allow Printing</span></label>
  <label class="toggle-switch"><input type="checkbox" id="allowCopy" checked><div class="toggle-track"></div><span class="toggle-label">Allow Copying Text</span></label></div>
  <div class="status-msg status-msg--info" style="margin-top:8px">ℹ️ Uses pdf-lib encryption. For strongest protection use a strong password.</div>`;

  processBtn.textContent='🔒 Protect PDF';
  function loadFile(file){
    currentFile=file;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF ready: ${ToolsApp.formatBytes(file.size)}</div>`;
    sizeInfo.textContent=ToolsApp.formatBytes(file.size);
    workspace.style.display='';
  }

  processBtn.addEventListener('click',async()=>{
    const uPass=document.getElementById('userPass').value;
    if(!uPass){previewBody.innerHTML='<div class="status-msg status-msg--error">❌ Please enter a user password</div>';return;}
    if(!currentFile) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Encrypting…';
    const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      const {PDFDocument}=PDFLib;
      const ab=await currentFile.arrayBuffer();
      const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
      const oPass=document.getElementById('ownerPass').value||uPass;
      const bytes=await doc.save({
        userPassword:uPass,ownerPassword:oPass,
        permissions:{printing:document.getElementById('allowPrint').checked?'lowResolution':undefined,copying:document.getElementById('allowCopy').checked}
      });
      const blob=new Blob([bytes],{type:'application/pdf'});
      window._protectedPdf=blob;
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF encrypted with password protection!</div>`;
      sizeInfo.textContent=ToolsApp.formatBytes(blob.size);
      downloadArea.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='🔒 Protect PDF';
    };
    document.head.appendChild(s);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._protectedPdf) ToolsApp.downloadBlob(window._protectedPdf,'protected.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();