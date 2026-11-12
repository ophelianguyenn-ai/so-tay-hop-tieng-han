/* Nhi mascot: move, resize and remember position without blocking lessons. */
(function(){
'use strict';
var KEY='nlc-mascot-position-v12',pref={x:null,y:null,size:112,hidden:false};
try{Object.assign(pref,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(pref));}catch(e){}}
function init(){
if(document.getElementById('nhi-movable'))return;
var widget=document.createElement('aside');widget.id='nhi-movable';widget.setAttribute('aria-label','Bạn Nhi đồng hành có thể di chuyển và thay đổi kích thước');
var header=document.createElement('div');header.className='nhi-drag-handle';header.textContent='⋮⋮ Kéo Nhi';header.title='Kéo để di chuyển bạn Nhi';
var img=document.createElement('img');img.src='nhi-mascot.webp';img.alt='Bạn Nhi đồng hành';img.draggable=false;
var toolbar=document.createElement('div');toolbar.className='nhi-mascot-controls';
function button(label,title,action){var b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',action);toolbar.appendChild(b);return b;}
function size(v){pref.size=Math.max(60,Math.min(280,v));paint();save();}
button('−','Thu nhỏ bạn Nhi',function(){size(pref.size-16);});
button('+','Phóng to bạn Nhi',function(){size(pref.size+16);});
button('↺','Đưa bạn Nhi về vị trí ban đầu',function(){pref.x=null;pref.y=null;pref.size=112;paint();save();});
button('×','Ẩn bạn Nhi',function(){pref.hidden=true;paint();save();});
widget.appendChild(header);widget.appendChild(img);widget.appendChild(toolbar);document.body.appendChild(widget);
var restore=document.createElement('button');restore.id='nhi-mascot-restore';restore.type='button';restore.textContent='👧 Hiện Nhi';restore.addEventListener('click',function(){pref.hidden=false;paint();save();});document.body.appendChild(restore);
function paint(){
widget.style.setProperty('--nhi-size',pref.size+'px');
widget.hidden=!!pref.hidden;restore.hidden=!pref.hidden;
var maxX=Math.max(0,innerWidth-widget.offsetWidth-8),maxY=Math.max(0,innerHeight-widget.offsetHeight-8);
if(pref.x===null||pref.x===undefined)pref.x=maxX;
if(pref.y===null||pref.y===undefined)pref.y=Math.max(8,maxY-60);
pref.x=Math.max(8,Math.min(maxX,pref.x));pref.y=Math.max(8,Math.min(maxY,pref.y));
widget.style.left=pref.x+'px';widget.style.top=pref.y+'px';
}
var dragging=null;
header.addEventListener('pointerdown',function(e){
if(e.button!==0&&e.pointerType==='mouse')return;
dragging={x:e.clientX,y:e.clientY,left:pref.x,top:pref.y};header.setPointerCapture(e.pointerId);e.preventDefault();
});
header.addEventListener('pointermove',function(e){if(!dragging)return;pref.x=dragging.left+e.clientX-dragging.x;pref.y=dragging.top+e.clientY-dragging.y;paint();});
function stop(){if(dragging){dragging=null;save();}}
header.addEventListener('pointerup',stop);header.addEventListener('pointercancel',stop);
window.addEventListener('resize',paint);paint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();