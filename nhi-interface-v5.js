/* Nhi UI v5: local window close buttons, outside-tap dismiss, decorative cover theme.
   Never dismiss the cover with a floating X; never interfere with the user's key. */
(function(){
'use strict';
const $=(s,root=document)=>root.querySelector(s);
const shown=e=>!!(e&&!e.hidden&&e.getClientRects().length);
function makeCover(){
 const cover=$('#cover');if(!cover)return;
 const old=$('#nhi-cover-theme-v4');if(old)old.remove();
 const panel=document.createElement('div');panel.id='nhi-cover-theme-v5';panel.className='nhi-cover-theme-v5';
 panel.setAttribute('role','group');panel.setAttribute('aria-label','Chế độ màu trang bìa');
 for(const [mode,icon,label] of [['light','☀','Giao diện sáng'],['dark','☾','Giao diện tối']]){
   const b=document.createElement('button');b.type='button';b.dataset.mode=mode;b.textContent=icon;
   b.title=label;b.setAttribute('aria-label',label);
   b.addEventListener('click',e=>{
     e.stopPropagation();
     const el=$('[data-theme-set="'+mode+'"]');if(el)el.click();
     refresh();
   });
   panel.appendChild(b);
 }
 function refresh(){
   const isDark=document.documentElement.getAttribute('data-theme')==='dark';
   panel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(isDark===(b.dataset.mode==='dark'))));
 }
 cover.appendChild(panel);refresh();
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
function getContext(){
 const editor=$('#planBox .editbox.nhi-editor-window-v5');if(shown(editor))return ['editor',editor];
 const picker=$('.nhi-picture-picker');if(shown(picker))return ['picker',picker];
 const ai=$('#aiPanel');if(document.body.classList.contains('ai-open')&&ai)return ['ai',ai];
 return null;
}
function closeContext(name,box){
 if(name==='editor'){
   const b=$('.nhi-editor-close-v5',box);if(b)b.click();
 }else if(name==='picker'){
   const b=$('.nhi-picture-head button',box);if(b)b.click();
 }else if(name==='ai'){
   const b=$('#aiClose');if(b)b.click();
 }
}
let swallowUntil=0;
function init(){
 const old=$('#nhi-global-close-v4');if(old)old.remove();
 makeCover();
 // Each window keeps its X on the upper-left corner, not the page corner.
 document.addEventListener('pointerdown',function(e){
   const c=getContext();if(!c)return;
   const [name,box]=c,el=e.target instanceof Element?e.target:null;
   if(!el||box.contains(el))return;
   const trigger=el.closest('#aiBtn,.ai-resize-handle,#brandBtn,#brandFaceBtn');
   if(trigger&&name==='ai')return;
   // A click on empty space should only close the window, not flip a card.
   swallowUntil=Date.now()+260;
   e.preventDefault();e.stopPropagation();
   closeContext(name,box);
 },true);
 document.addEventListener('click',function(e){
   if(swallowUntil>Date.now()){e.preventDefault();e.stopImmediatePropagation();return;}
   const opened=getContext(),el=e.target instanceof Element?e.target:null;
   if(opened&&el&&!opened[1].contains(el)){
     const trigger=el.closest('#aiBtn,.ai-resize-handle,#brandBtn,#brandFaceBtn');
     if(!(trigger&&opened[0]==='ai')){
       e.preventDefault();e.stopImmediatePropagation();
       closeContext(opened[0],opened[1]);return;
     }
   }
   const btn=el?el.closest('button,[role="button"]'):null;
   if(!btn||btn.disabled||!btn.isConnected||!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const rect=btn.getBoundingClientRect();if(!rect.width||!rect.height)return;
   let glow=document.createElement('span');glow.className='nhi-button-ring-v4';glow.setAttribute('aria-hidden','true');
   glow.style.cssText='left:'+rect.left+'px;top:'+rect.top+'px;width:'+rect.width+'px;height:'+rect.height+'px;'+
     'border-radius:'+getComputedStyle(btn).borderRadius+';';
   glow.style.setProperty('--ring-color',btn.classList.contains('hard')?'#D97706':btn.classList.contains('mid')?'#1684D4':'#8971D1');
   document.body.appendChild(glow);
   const a=glow.animate([{opacity:.8,transform:'scale(.96)'},{opacity:0,transform:'scale(1.09)'}],
     {duration:450,easing:'cubic-bezier(.16,.82,.2,1)'});
   a.onfinish=a.oncancel=()=>glow.remove();setTimeout(()=>glow.remove(),520);
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();