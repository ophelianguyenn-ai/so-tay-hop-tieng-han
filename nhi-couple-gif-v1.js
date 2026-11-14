/* Preserve the user's exact GIF: browser import and optional published source.
 * No AI redraw, re-timing or frame replacement. */
(function(){
'use strict';
const cover=document.getElementById('cover'),hero=document.getElementById('coverHero');
if(!cover||!hero)return;
const KEY='nhi-luong-nhi-original-gif', DB='nhi-cover-original-gif-v1';
let liveUrl=null,hasGif=false;
const MAX=3*1024*1024;
function storeDb(blob){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(Error('IndexedDB unavailable'));
  const open=indexedDB.open(DB,1);
  open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('media'))open.result.createObjectStore('media');};
  open.onerror=()=>reject(open.error);
  open.onsuccess=()=>{
   const db=open.result,tx=db.transaction('media','readwrite');
   tx.objectStore('media').put(blob,KEY);
   tx.oncomplete=()=>{db.close();resolve(true);};
   tx.onerror=()=>{db.close();reject(tx.error);};
  };
 });
}
function readDb(){
 return new Promise(resolve=>{
  if(!window.indexedDB)return resolve(null);
  try{
   const open=indexedDB.open(DB,1);
   open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('media'))open.result.createObjectStore('media');};
   open.onerror=()=>resolve(null);
   open.onsuccess=()=>{
    const db=open.result,tx=db.transaction('media','readonly'),req=tx.objectStore('media').get(KEY);
    req.onsuccess=()=>resolve(req.result instanceof Blob?req.result:null);
    req.onerror=()=>resolve(null);tx.oncomplete=()=>db.close();
   };
  }catch(_e){resolve(null);}
 });
}
function showGif(source,objectUrl){
 const img=document.getElementById('nhiExactCoupleGif');if(!img)return;
 img.onload=()=>{
  if(liveUrl && liveUrl!==objectUrl)URL.revokeObjectURL(liveUrl);
  liveUrl=objectUrl||null;hasGif=true;
  cover.classList.add('nhi-gif-loaded');
  img.hidden=false;
  const control=document.getElementById('nhiPickOriginalGif');
  if(control)control.title='Thay GIF Lương ❤️ Nhi (đang dùng tệp GIF gốc)';
 };
 img.onerror=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);};
 img.src=source;
}
async function useFile(file){
 if(!file || file.type!=='image/gif' || file.size>MAX || file.size<100)return;
 const url=URL.createObjectURL(file);showGif(url,url);
 try{await storeDb(file);}catch(_e){
  try{
   const reader=new FileReader();
   reader.onload=()=>{try{localStorage.setItem(KEY,reader.result);}catch(_e2){}};
   reader.readAsDataURL(file);
  }catch(_e2){}
 }
}
function tryBundled(){
 // This asset will work automatically once placed alongside index.html in GitHub.
 const pre=new Image();
 pre.onload=()=>showGif('luong-nhi-goc.gif?v=20261114-v1',null);
 pre.onerror=()=>{};
 pre.src='luong-nhi-goc.gif?v=20261114-v1';
}
async function setup(){
 const img=document.createElement('img');
 img.id='nhiExactCoupleGif';img.className='nhi-exact-couple-gif';
 img.alt='Lương và Nhi theo đúng các khung hình GIF gốc';img.hidden=true;img.draggable=false;
 hero.append(img);
 const input=document.createElement('input');input.type='file';input.accept='image/gif';
 input.hidden=true;input.id='nhiChooseGifFile';cover.append(input);
 const button=document.createElement('button');
 button.type='button';button.id='nhiPickOriginalGif';button.className='nhi-pick-original-gif';
 button.innerHTML='<span aria-hidden="true">🎞️</span><span>GIF gốc</span>';
 button.setAttribute('aria-label','Dùng tệp GIF Lương và Nhi gốc trên trang bìa');
 button.title='Chọn GIF gốc đã tải về; trình duyệt sẽ nhớ tệp này';
 button.addEventListener('click',e=>{e.stopPropagation();input.click();});
 input.addEventListener('change',()=>{
  const file=input.files&&input.files[0];input.value='';
  if(!file)return;
  if(file.type!=='image/gif'||file.size>MAX){
   alert('Vui lòng chọn GIF gốc có dung lượng không quá 3 MB.');return;
  }
  useFile(file);
 });
 cover.append(button);
 const stored=await readDb();
 if(stored){const localUrl=URL.createObjectURL(stored);showGif(localUrl,localUrl);return;}
 try{
  const text=localStorage.getItem(KEY);
  if(text&&text.startsWith('data:image/gif;base64,')){showGif(text,null);return;}
 }catch(_e){}
 tryBundled();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
else setup();
window.addEventListener('pagehide',()=>{if(liveUrl)URL.revokeObjectURL(liveUrl);});
})();