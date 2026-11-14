/* Draggable AI panel width and persistent chat font size. */
(function(){
'use strict';
var KEY='nlc-ai-display-v2',pref={width:520,font:16};
try{Object.assign(pref,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x));}
function save(){try{localStorage.setItem(KEY,JSON.stringify(pref));}catch(e){}}
function init(){
 var panel=document.getElementById('aiPanel'),handle=document.getElementById('aiResizeHandle'),font=document.getElementById('aiFontSize');
 if(!panel||!handle||!font)return;
 function min(){return 340;}
 function max(){return Math.max(min(),Math.min(980,innerWidth-420));}
 function render(){
   if(innerWidth>=700){
     pref.width=clamp(Number(pref.width)||520,min(),max());
     document.documentElement.style.setProperty('--nhi-ai-width',pref.width+'px');
     handle.setAttribute('aria-valuemin',String(min()));
     handle.setAttribute('aria-valuemax',String(max()));
     handle.setAttribute('aria-valuenow',String(pref.width));
   }
   var sizes=[13,14,15,16,18,20,22],size=Number(pref.font)||16;
   pref.font=sizes.indexOf(size)>=0?size:16;
   document.documentElement.style.setProperty('--nhi-ai-font-size',pref.font+'px');
   font.value=String(pref.font);
 }
 font.addEventListener('change',function(){pref.font=Number(font.value);render();save();});
 var drag=null;
 handle.addEventListener('pointerdown',function(e){
   if(innerWidth<700||(e.pointerType==='mouse'&&e.button!==0))return;
   e.preventDefault();drag={id:e.pointerId,x:e.clientX,width:pref.width};
   handle.setPointerCapture(e.pointerId);
   handle.classList.add('resizing');document.body.classList.add('nhi-ai-resizing');
 });
 handle.addEventListener('pointermove',function(e){
   if(!drag||e.pointerId!==drag.id)return;
   pref.width=clamp(drag.width+drag.x-e.clientX,min(),max());render();
 });
 function stop(){
   if(!drag)return;
   drag=null;handle.classList.remove('resizing');
   document.body.classList.remove('nhi-ai-resizing');save();
 }
 handle.addEventListener('pointerup',stop);
 handle.addEventListener('pointercancel',stop);
 handle.addEventListener('keydown',function(e){
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();
   if(e.key==='Home')pref.width=min();
   else if(e.key==='End')pref.width=max();
   else pref.width+=e.key==='ArrowLeft'?24:-24;
   render();save();
 });
 window.addEventListener('resize',render);
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();