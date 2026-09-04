(function(){
  let files=[],loadedImgs=[];
  const uploadZone=document.getElementById('uploadZone'),fileInput=document.getElementById('fileInput');
  const workspace=document.getElementById('workspace'),previewBody=document.getElementById('previewBody');
  const sizeInfo=document.getElementById('sizeInfo'),downloadArea=document.getElementById('downloadArea');
  const downloadBtn=document.getElementById('downloadBtn'),processBtn=document.getElementById('processBtn');

  // Update accept for images
  fileInput.setAttribute('accept','image/*');
  fileInput.setAttribute('multiple','');
  uploadZone.querySelector('.upload-zone__icon').textContent='🖼️';
  uploadZone.querySelector('.upload-zone__title').textContent='Drop images here or click to upload';
  uploadZone.querySelector('.upload-zone__subtitle').textContent='JPG, PNG, WebP — Multiple images supported';
  uploadZone.querySelector('.upload-zone__formats').innerHTML='<span class="format-tag">JPG</span><span class="format-tag">PNG</span><span class="format-tag">WebP</span>';

  document.getElementById('toolControls').innerHTML=`
  <div class="form-group"><label class="form-label">Page Size</label>
  <select class="form-select" id="pageSize"><option value="A4">A4 (210×297mm)</option><option value="LETTER">Letter (216×279mm)</option><option value="A3">A3 (297×420mm)</option><option value="FIT">Fit to Image</option></select></div>
  <div class="form-group"><label class="form-label">Orientation</label>
  <select class="form-select" id="pageOrient"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>
  <div class="form-group"><label class="form-label">Image Quality <span id="iqVal">85%</span></label><input type="range" class="form-range" id="imgQuality" min="10" max="100" value="85"></div>
  <div id="fileListArea" class="file-list" style="margin-top:12px"></div>`;

  document.getElementById('imgQuality').addEventListener('input',e=>document.getElementById('iqVal').textContent=e.target.value+'%');

  function loadFiles(fileList){
    const newFiles=[...fileList].filter(f=>f.type.startsWith('image/'));
    files=[...files,...newFiles];
    Promise.all(files.map(f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=URL.createObjectURL(f);}))).then(imgs=>{
      loadedImgs=imgs;
      document.getElementById('fileListArea').innerHTML=files.map((f,i)=>`<div class="file-item"><span class="file-item__icon">🖼️</span><span class="file-item__name">${f.name}</span><span class="file-item__size">${ToolsApp.formatBytes(f.size)}</span></div>`).join('');
      previewBody.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px">${loadedImgs.map((img,i)=>`<img src="${URL.createObjectURL(files[i])}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;border:1px solid var(--clr-border)" alt="${files[i].name}">`).join('')}</div>`;
      sizeInfo.textContent=`${files.length} images`;
      workspace.style.display='';
    });
  }

  processBtn.textContent='📄 Convert to PDF';
  processBtn.addEventListener('click',async()=>{
    if(!loadedImgs.length) return;
    processBtn.disabled=true;processBtn.innerHTML='<span class="spinner"></span> Creating PDF…';
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload=async()=>{
      const {jsPDF}=window.jspdf;
      const pageSize=document.getElementById('pageSize').value;
      const orient=document.getElementById('pageOrient').value;
      const quality=parseInt(document.getElementById('imgQuality').value)/100;
      let doc=null;
      for(let i=0;i<loadedImgs.length;i++){
        const img=loadedImgs[i];
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        canvas.getContext('2d').drawImage(img,0,0);
        const dataUrl=canvas.toDataURL('image/jpeg',quality);
        const iw=img.naturalWidth,ih=img.naturalHeight;
        let pw,ph;
        if(pageSize==='FIT'){pw=iw*0.75;ph=ih*0.75;}
        else if(pageSize==='A4'){pw=orient==='portrait'?595:842;ph=orient==='portrait'?842:595;}
        else if(pageSize==='LETTER'){pw=orient==='portrait'?612:792;ph=orient==='portrait'?792:612;}
        else{pw=orient==='portrait'?842:1191;ph=orient==='portrait'?1191:842;}
        const pdfOrient=pw>ph?'l':'p';
        if(!doc) doc=new jsPDF({orientation:pdfOrient,unit:'pt',format:pageSize==='FIT'?[pw,ph]:pageSize});
        else doc.addPage(pageSize==='FIT'?[pw,ph]:pageSize,pdfOrient);
        // Fit image within page
        const ratio=Math.min((pw-40)/iw,(ph-40)/ih);
        const dw=iw*ratio,dh=ih*ratio;
        const x=(pw-dw)/2,y=(ph-dh)/2;
        doc.addImage(dataUrl,'JPEG',x,y,dw,dh);
      }
      const blob=doc.output('blob');
      const url=URL.createObjectURL(blob);
      previewBody.innerHTML=`<div class="status-msg status-msg--success">✅ PDF created with ${loadedImgs.length} page(s).<br><a href="${url}" target="_blank" style="color:var(--clr-primary)">Preview in new tab</a></div>`;
      sizeInfo.textContent=`PDF | ${ToolsApp.formatBytes(blob.size)}`;
      window._pdfBlob=blob;
      downloadArea.style.display='';
      processBtn.disabled=false;processBtn.innerHTML='📄 Convert to PDF';
    };
    document.head.appendChild(script);
  });

  downloadBtn.addEventListener('click',()=>{ if(window._pdfBlob) ToolsApp.downloadBlob(window._pdfBlob,'images-to-pdf.pdf'); });
  uploadZone.addEventListener('dragover',e=>{e.preventDefault();uploadZone.classList.add('drag-over');});
  uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop',e=>{e.preventDefault();uploadZone.classList.remove('drag-over');loadFiles(e.dataTransfer.files);});
  fileInput.addEventListener('change',()=>loadFiles(fileInput.files));
})();