/* Lightweight direct interactions layered on top of the existing study app. */
(function(){
'use strict';
const STORE='nhi-english-frame-width-v1';
function iconFont(){
 const label=document.querySelector('#aiPanel .ai-font-control');
 if(!label)return;
 const span=label.querySelector('span');
 if(span)span.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h13M10.5 6v12M6.5 18h8M19 6v11M16 14l3 3 3-3"/><path d="M17 6h4"/></svg>';
}
const HEIGHT_KEY='nhi-english-frame-height-v3';
const OFFSET_KEY='nhi-english-frame-offset-y-v3';
function setupEnglish(box){
 if(box.dataset.frameResizable)return;
 box.dataset.frameResizable='true';
 const read=(key,def)=>{try{const n=Number(localStorage.getItem(key));return Number.isFinite(n)&&n!==0?n:def;}catch(_e){return def;}};
 let w=read(STORE,0),h=read(HEIGHT_KEY,0),y=read(OFFSET_KEY,0);
 const apply=()=>{
  box.style.setProperty('--nhi-en-width',w>0?Math.round(w)+'px':'fit-content');
  box.style.setProperty('--nhi-en-height',h>0?Math.round(h)+'px':'auto');
  box.style.setProperty('--nhi-en-offset-y',Math.round(y)+'px');
 };
 apply();let drag=null;
 box.tabIndex=0;
 box.setAttribute('title','Kéo trực tiếp: mép phải để đổi chiều ngang; mép dưới để đổi chiều cao; nền tiêu đề để di chuyển lên xuống');
 const maxWidth=()=>Math.max(260,(box.closest('.pfront')?.clientWidth||box.parentElement.clientWidth)-24);
 const maxHeight=()=>Math.max(110,Math.min(480,(box.closest('.pfront')?.clientHeight||600)-56));
 const modeAt=e=>{
  const r=box.getBoundingClientRect(),right=e.clientX>=r.right-21,bottom=e.clientY>=r.bottom-21;
  if(right&&bottom)return 'corner';
  if(right)return 'width';
  if(bottom)return 'height';
  if(e.target===box || e.target.closest('.nhi-en-head,.nhi-en-title'))return 'move';
  return null;
 };
 box.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType==='mouse')return;
  if(e.target.closest('button,a,input,textarea,select,label,[contenteditable],.nhi-en-word,.nhi-en-choice'))return;
  const mode=modeAt(e);
  if(!mode)return;
  drag={id:e.pointerId,mode,x:e.clientX,y:e.clientY,width:box.getBoundingClientRect().width,
        height:box.getBoundingClientRect().height,offset:y,moved:false};
  box.classList.add('nhi-en-resizing');
  box.dataset.dragMode=mode;
  try{box.setPointerCapture(e.pointerId);}catch(_e){}
  e.preventDefault();e.stopPropagation();
 });
 box.addEventListener('pointermove',e=>{
  if(!drag || e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
  if(drag.mode==='width'||drag.mode==='corner')
   w=Math.max(255,Math.min(maxWidth(),drag.width+dx));
  if(drag.mode==='height'||drag.mode==='corner')
   h=Math.max(105,Math.min(maxHeight(),drag.height+dy));
  if(drag.mode==='move')
   y=Math.max(-40,Math.min(95,drag.offset+dy));
  apply();e.preventDefault();e.stopPropagation();
 });
 function finish(e){
  if(!drag||e.pointerId!==drag.id)return;
  const active=drag;drag=null;box.classList.remove('nhi-en-resizing');delete box.dataset.dragMode;
  if(active.moved){
   try{if(w>0)localStorage.setItem(STORE,String(Math.round(w)));
       if(h>0)localStorage.setItem(HEIGHT_KEY,String(Math.round(h)));
       localStorage.setItem(OFFSET_KEY,String(Math.round(y)));}catch(_e){}
  }
  try{box.releasePointerCapture(e.pointerId);}catch(_e){}
  e.stopPropagation();
 }
 box.addEventListener('pointerup',finish);
 box.addEventListener('pointercancel',finish);
 box.addEventListener('keydown',e=>{
  if(!e.altKey)return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   w=Math.max(255,Math.min(maxWidth(),(w||box.getBoundingClientRect().width)+(e.key==='ArrowRight'?20:-20)));
   try{localStorage.setItem(STORE,String(Math.round(w)));}catch(_e){}
  }else if(e.key==='ArrowUp'||e.key==='ArrowDown'){
   y=Math.max(-40,Math.min(95,y+(e.key==='ArrowDown'?10:-10)));
   try{localStorage.setItem(OFFSET_KEY,String(Math.round(y)));}catch(_e){}
  }else return;
  apply();e.preventDefault();e.stopPropagation();
 });
}
function compactEditor(editor){
 if(editor.dataset.autoFitEditor)return;
 editor.dataset.autoFitEditor='true';
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 const resize=()=>{
  for(const node of editor.querySelectorAll('.nhi-rich-field,textarea[name="pairs"]')){
   const style=getComputedStyle(node);
   if(ctx)ctx.font=style.font;
   const lines=String(node.value??node.textContent??'').split(/\n/);
   let widest=0;
   for(const line of lines)widest=Math.max(widest,ctx?ctx.measureText(line).width:line.length*10);
   const max=Math.min(690,Math.max(260,editor.clientWidth-36));
   const width=Math.max(245,Math.min(max,Math.ceil(widest+65)));
   node.style.setProperty('--nhi-field-width',width+'px');
  }
 };
 editor.addEventListener('input',resize,true);
 window.addEventListener('resize',resize,{passive:true});
 resize();
}
function update(){
 document.querySelectorAll('#planBox .nhi-editor-window-v5').forEach(compactEditor);
 document.querySelectorAll('#planBox .nhi-english-v5').forEach(setupEnglish);
 // Preserve the original speaker drawn by the main app; never replace it.
 document.querySelectorAll('#planBox .pcard').forEach(card=>{
  const stage=card.querySelector('.pfront');
  const photo=stage&&stage.querySelector('.card-illustration');
  if(!stage||!photo){card.classList.remove('nhi-side-art');return;}
  const p=stage.getBoundingClientRect(), i=photo.getBoundingClientRect();
  const side=i.width>75 && i.left>(p.left+p.width*.5) && i.right<=p.right+20;
  card.classList.toggle('nhi-side-art',side);
  if(side)card.style.setProperty('--nhi-photo-half',Math.round(i.width/2+8)+'px');
  else card.style.removeProperty('--nhi-photo-half');
 });
}
function init(){
 iconFont();update();
 const plan=document.getElementById('planBox');
 if(plan)new MutationObserver(update).observe(plan,{childList:true,subtree:true});
 window.addEventListener('resize',update,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();