/* Portable backup of study progress and personalization.
   Never export Firebase connection credentials or AI API keys. */
(function(){
'use strict';
var KEYS=[
'viko-ko-meeting-progress-v1','viko-custom-v1','viko-ko-meeting-ui-v1',
'viko-plan-v1','viko-plan-sess-v1','viko-daily-lessons-v1',
'viko-ko-meeting-voice-v1','viko-match-best-v1','nlc-prefs-v1',
'nlc-mascot-position-v12','nlc-hard-mascot-v13'
];
function saveFile(name,data){
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url);},10000);
}
function backup(){
  var values={};
  KEYS.forEach(function(k){try{var v=localStorage.getItem(k);if(v!==null)values[k]=v;}catch(e){}});
  saveFile('nhi-learning-corner-toan-bo-'+new Date().toISOString().slice(0,10)+'.json',
    {format:'nhi-learning-corner-local-backup',version:1,createdAt:new Date().toISOString(),values:values});
}
function restore(file){
  if(!file)return;
  if(file.size>30*1024*1024){alert('Tệp sao lưu quá lớn.');return;}
  var reader=new FileReader();
  reader.onerror=function(){alert('Không thể đọc tệp sao lưu.');};
  reader.onload=function(){
    var obj;
    try{obj=JSON.parse(reader.result);}catch(e){alert('Tệp không phải JSON hợp lệ.');return;}
    var values;
    if(obj&&obj.format==='nhi-learning-corner-local-backup'&&obj.version===1&&obj.values&&typeof obj.values==='object'){
      values=obj.values;
    }else if(obj&&obj.app==='viko-ko-meeting'&&obj.items&&typeof obj.items==='object'){
      values={'viko-ko-meeting-progress-v1':JSON.stringify(obj.items)};
    }else{alert('Chọn tệp sao lưu Nhi’s Learning Corner hoặc tệp Xuất tiến độ cũ.');return;}
    var ok=KEYS.filter(function(k){return typeof values[k]==='string';});
    if(!ok.length){alert('Tệp không chứa dữ liệu học cần nhập.');return;}
    if(!confirm('Nhập '+ok.length+' phần dữ liệu và thay thế dữ liệu cùng loại hiện có trên thiết bị này? Trước tiên hãy sao lưu dữ liệu hiện tại nếu cần.'))return;
    try{
      ok.forEach(function(k){localStorage.setItem(k,values[k]);});
      alert('Đã nhập dữ liệu. Trang sẽ tải lại để áp dụng.');
      location.reload();
    }catch(e){alert('Bộ nhớ trình duyệt không đủ hoặc không cho phép lưu: '+e.message);}
  };
  reader.readAsText(file);
}
function init(){
  var sheet=document.querySelector('#setSheet .setgroup:nth-last-of-type(1)')||document.getElementById('setSheet');
  if(!sheet||document.getElementById('nhi-full-backup'))return;
  var div=document.createElement('div');div.id='nhi-full-backup';div.style.cssText='border-top:1px solid var(--line);padding-top:12px;display:grid;gap:8px';
  var label=document.createElement('strong');label.textContent='Sao lưu toàn bộ dữ liệu';div.appendChild(label);
  var text=document.createElement('p');text.className='voice-note';text.textContent='Gồm tiến độ ôn, thẻ tự thêm, bài học theo ngày, ảnh đã chọn và tùy chỉnh trên thiết bị. Không xuất mật khẩu, mã đồng bộ hay API key.';div.appendChild(text);
  var row=document.createElement('div');row.className='btnrow';
  var ex=document.createElement('button');ex.type='button';ex.className='ghost';ex.textContent='Xuất toàn bộ JSON';ex.addEventListener('click',backup);
  var im=document.createElement('button');im.type='button';im.className='ghost';im.textContent='Nhập bản sao lưu';
  var file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json,application/json';file.addEventListener('change',function(){restore(file.files&&file.files[0]);file.value='';});
  im.addEventListener('click',function(){file.click();});
  row.appendChild(ex);row.appendChild(im);row.appendChild(file);
  div.appendChild(row);sheet.appendChild(div);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();