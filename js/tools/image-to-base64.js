(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),processBtn=document.getElementById('processBtn');
  const previewBody=document.getElementById('previewBody'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),sizeInfo=document.getElementById('sizeInfo');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Output Format</label>
  <select class="form-select" id="b64Fmt"><option value="full">Full Data URI (data:image/...;base64,...)</option><option value="raw">Raw Base64 only</option></select></div>
  <div id="b64Output" style="display:none;margin-top:16px">
  <label class="form-label">Base64 Output</label>
  <textarea id="b64Text" style="width:100%;height:120px;border-radius:8px;border:1.5px solid var(--clr-border);background:var(--clr-surface-2);color:var(--clr-text);padding:12px;font-family:monospace;font-size:.8rem;resize:vertical" readonly></textarea>
  <button class="btn btn--ghost btn--sm w-full" id="copyBtn" style="margin-top:8px">📋 Copy to Clipboard</button>
  <span id="copyConfirm" style="display:none;color:green;font-size:.85rem;margin-top:4px">✅ Copied!</span>
  </div>`;

  function loadFile(file){
    if(!file.type.startsWith('image/')){return;}
    currentFile=file;
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{ previewBody.innerHTML=`<img src="${url}" class="preview-img" alt="Preview">`; sizeInfo.textContent=`${img.naturalWidth}×${img.naturalHeight} | ${28tools.formatBytes(file.size)}`; workspace.style.display=''; };
    img.src=url;
  }
  processBtn.addEventListener('click',()=>{
    if(!currentFile) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const dataUri=e.target.result;
      const fmt=document.getElementById('b64Fmt').value;
      const output=fmt==='raw'?dataUri.split(',')[1]:dataUri;
      document.getElementById('b64Text').value=output;
      document.getElementById('b64Output').style.display='';
      sizeInfo.textContent=`Base64 size: ${28tools.formatBytes(output.length)} chars`;
      downloadArea.style.display='';
    };
    reader.readAsDataURL(currentFile);
  });
  document.addEventListener('click',e=>{
    if(e.target.id==='copyBtn'){
      const text=document.getElementById('b64Text').value;
      navigator.clipboard.writeText(text).then(()=>{ const c=document.getElementById('copyConfirm'); c.style.display='block'; setTimeout(()=>c.style.display='none',2000); });
    }
  });
  downloadBtn.addEventListener('click',()=>{
    const text=document.getElementById('b64Text')?.value;
    if(text){ const blob=new Blob([text],{type:'text/plain'}); 28tools.downloadBlob(blob,(currentFile?currentFile.name.replace(/\.[^.]+$/,''):'image')+'-base64.txt'); }
  });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();