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
function setupEnglish(box){
 if(box.dataset.frameResizable)return;
 box.dataset.frameResizable='true';
 let stored=0;
 try{stored=Number(localStorage.getItem(STORE))||0;}catch(_e){}
 if(stored>0)box.style.setProperty('--nhi-en-width',stored+'px');
 let drag=null;
 box.setAttribute('title','Kéo mép phải hoặc góc dưới bên phải để chỉnh độ rộng khung tiếng Anh');
 const bounds=()=>{const p=box.closest('.pfront');return Math.max(280,(p?p.clientWidth:box.parentElement.clientWidth)-16);};
 box.addEventListener('pointerdown',e=>{
  if(e.button!==0 && e.pointerType==='mouse')return;
  if(e.target.closest('button,input,textarea,select,a,label,.nhi-en-word,.nhi-en-choice,[contenteditable]'))return;
  const rect=box.getBoundingClientRect();
  const edge=e.clientX>rect.right-20 || e.clientY>rect.bottom-16;
  if(!edge && e.target!==box)return;
  e.preventDefault();e.stopPropagation();
  drag={id:e.pointerId,start:e.clientX,width:rect.width};
  try{box.setPointerCapture(e.pointerId);}catch(_e){}
  box.classList.add('nhi-en-resizing');
 });
 box.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const width=Math.max(270,Math.min(bounds(),drag.width+e.clientX-drag.start));
  box.style.setProperty('--nhi-en-width',Math.round(width)+'px');
  e.preventDefault();e.stopPropagation();
 });
 function finish(e){
  if(!drag)return;
  drag=null;box.classList.remove('nhi-en-resizing');
  const w=Math.round(box.getBoundingClientRect().width);
  try{localStorage.setItem(STORE,String(w));}catch(_e){}
  if(e)e.stopPropagation();
 }
 box.addEventListener('pointerup',finish);box.addEventListener('pointercancel',finish);
 box.addEventListener('keydown',e=>{
  if(!e.altKey || !['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();
  const w=Math.max(270,Math.min(bounds(),box.getBoundingClientRect().width+(e.key==='ArrowRight'?24:-24)));
  box.style.setProperty('--nhi-en-width',w+'px');
  try{localStorage.setItem(STORE,String(w));}catch(_e){}
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
   const lines=String(node.value??node.textContent??'').split(/\\n/);
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
 document.querySelectorAll('#planBox .cicons button[title*="Phát âm / Dừng"]').forEach(b=>{
  if(b.dataset.neonReader || !window.NHI_STUDY)return;
  b.dataset.neonReader='true';
  b.innerHTML=window.NHI_STUDY.icon('headphones');
  b.classList.add('nhi-neon-speaker');
 });
}
function init(){
 iconFont();update();
 const plan=document.getElementById('planBox');
 if(plan)new MutationObserver(update).observe(plan,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();