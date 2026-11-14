/* Transparent companion: drag the picture to resize; remember the size. */
(function(){
'use strict';let active=null,card=null,timer=0,removeTimer=0,size=180,resizing=false;
try{size=Math.max(80,Math.min(340,Number(localStorage.getItem('nhi-companion-size-v1'))||180));}catch(e){}
function clear(){resizing=false;clearTimeout(timer);clearTimeout(removeTimer);if(active)active.remove();if(card)card.classList.remove('nhi-mascot-active');active=null;card=null;}
function show(target){clear();if(!target)return;card=target;const root=document.createElement('div');active=root;root.id='nhi-hard-mascot';root.setAttribute('role','status');
const img=document.createElement('img');img.src='nhi-mascot.webp';img.alt='Bạn Nhi động viên; kéo để đổi kích thước';img.title='Kéo sang phải / xuống để phóng to; kéo ngược lại để thu nhỏ';img.draggable=false;const caption=document.createElement('p');caption.className='nhi-hard-caption';caption.textContent='Mình ôn lại nhé!';root.append(img,caption);card.append(root);card.classList.add('nhi-mascot-active');
function paint(){root.style.setProperty('--nhi-companion-size',size+'px');card.style.setProperty('--nhi-companion-space',Math.min(size+18,card.clientWidth*.42)+'px');}paint();
function expire(){clearTimeout(timer);timer=setTimeout(()=>{if(active!==root)return;root.classList.add('nhi-mascot-leave');removeTimer=setTimeout(clear,650);},6000);}
let drag=null;img.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();clearTimeout(timer);resizing=true;drag={x:e.clientX,y:e.clientY,size};img.setPointerCapture(e.pointerId);};img.onpointermove=e=>{if(!drag)return;size=Math.max(80,Math.min(340,drag.size+Math.max(e.clientX-drag.x,e.clientY-drag.y)));paint();};img.onpointerup=img.onpointercancel=()=>{if(!drag)return;drag=null;resizing=false;try{localStorage.setItem('nhi-companion-size-v1',String(size));}catch(e){}expire();};root.onclick=e=>e.stopPropagation();expire();}
function sync(target){if(active&&target!==card)clear();}
window.NHI_HARD_MASCOT={show,clear,sync,resizing:()=>resizing};
})();
