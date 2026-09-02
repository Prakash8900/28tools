(function(){
  let currentFile=null;
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label" for="metaTitle">Title</label><input type="text" class="form-input" id="metaTitle" placeholder="Document title"></div>
  <div class="form-group"><label class="form-label" for="metaAuthor">Author</label><input type="text" class="form-input" id="metaAuthor" placeholder="Author name"></div>
  <div class="form-group"><label class="form-label" for="metaSubject">Subject</label><input type="text" class="form-input" id="metaSubject" placeholder="Document subject"></div>
  <div class="form-group"><label class="form-label" for="metaKeywords">Keywords</label><input type="text" class="form-input" id="metaKeywords" placeholder="keyword1, keyword2"></div>
  <div class="form-group"><label class="form-label" for="metaCreator">Creator</label><input type="text" class="form-input" id="metaCreator" placeholder="Application used to create"></div>`;

  processBtn.textContent='📝 Save Metadata';
  function loadFile(file){
    currentFile=file;
    const s=document.createElement('script');s.src='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    s.onload=async()=>{
      const {PDFDocument}=PDFLib;
      const ab=await file.arrayBuffer();
      const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
      // Pre-fill existing metadata
      document.getElementById('metaTitle').value=doc.getTitle()||'';
      document.getElementById('metaAuthor').value=doc.getAuthor()||'';
      document.getElementById('metaSubject').value=doc.getSubject()||'';
      document.getElementById('metaKeywords').value=doc.getKeywords()||'';
      document.getElementById('metaCreator').value=doc.getCreator()||'';
      previewBody.innerHTML=`
      <div style="font-size:.85rem;color:var(--clr-text-muted)">
      <p><strong>Pages:</strong> ${doc.getPageCount()}</p>
      <p><strong>Size:</strong> ${28tools.formatBytes(file.size)}</p>
      <p><strong>Current Title:</strong> ${doc.getTitle()||'(none)'}</p>
      <p><strong>Current Author:</strong> ${doc.getAuthor()||'(none)'}</p>
      <p><strong>Created:</strong> ${doc.getCreationDate()||'(unknown)'}</p>
      </div>`;
      sizeInfo.textContent=`${doc.getPageCount()} pages | ${28tools.formatBytes(file.size)}`;
      workspace.style.display='';
    };
    document.head.appendChild(s);
  }

  processBtn.addEventListener('click',async()=>{
    if(!currentFile) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Saving…';
    const {PDFDocument}=PDFLib;
    const ab=await currentFile.arrayBuffer();
    const doc=await PDFDocument.load(ab,{ignoreEncryption:true});
    doc.setTitle(document.getElementById('metaTitle').value);
    doc.setAuthor(document.getElementById('metaAuthor').value);
    doc.setSubject(document.getElementById('metaSubject').value);
    doc.setKeywords(document.getElementById('metaKeywords').value.split(',').map(s=>s.trim()).filter(Boolean));
    doc.setCreator(document.getElementById('metaCreator').value);
    doc.setModificationDate(new Date());
    const bytes=await doc.save();
    const blob=new Blob([bytes],{type:'application/pdf'});
    window._metaPdf=blob;
    previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ Metadata saved successfully!</div>`;
    sizeInfo.textContent=28tools.formatBytes(blob.size);
    downloadArea.style.display='';
    processBtn.disabled=false;processBtn.innerHTML='📝 Save Metadata';
  });

  downloadBtn.addEventListener('click',()=>{ if(window._metaPdf) 28tools.downloadBlob(window._metaPdf,'metadata-edited.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');if(e.dataTransfer.files[0])loadFile(e.dataTransfer.files[0]);});
  fileInput.addEventListener('change',()=>{if(fileInput.files[0])loadFile(fileInput.files[0]);});
})();