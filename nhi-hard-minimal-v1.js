/* Nhi "Khó": transparent existing mascot, one caption, no frame or resize buttons. */
(function(){'use strict';
var active=null,closing=null;
function clear(){clearTimeout(closing);if(active)active.remove();active=null;}
function show(card){clear();if(!card)return;
var rect=(card.querySelector('.pfront')||card).getBoundingClientRect();if(!rect.width||!rect.height)return;
var box=document.createElement('div');box.id='nhi-hard-mascot';box.setAttribute('role','status');
var image=document.createElement('img');image.src='nhi-mascot.webp';image.alt='Bạn Nhi';image.draggable=false;
var caption=document.createElement('p');caption.className='nhi-hard-caption';caption.textContent='Từ này hơi khó nhỉ... mình ôn lại nhé';
box.appendChild(image);box.appendChild(caption);document.body.appendChild(box);active=box;
// Ở bên trái của khung trắng, căn giữa theo chiều dọc.
var x=rect.left+Math.max(90,Math.min(rect.width*0.22,rect.width/2)),y=rect.top+rect.height/2,ox=0,oy=0,drag=null;
function paint(){if(active!==box)return;var w=box.offsetWidth,h=box.offsetHeight;
box.style.left=Math.max(5,Math.min(innerWidth-w-5,x+ox-w/2))+'px';
box.style.top=Math.max(5,Math.min(innerHeight-h-5,y+oy-h/2))+'px';}
image.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();clearTimeout(closing);drag={x:e.clientX,y:e.clientY,ox:ox,oy:oy};image.setPointerCapture(e.pointerId);});
image.addEventListener('pointermove',function(e){if(!drag)return;ox=drag.ox+e.clientX-drag.x;oy=drag.oy+e.clientY-drag.y;paint();});
function done(){drag=null;closing=setTimeout(clear,7000);}
image.addEventListener('pointerup',done);image.addEventListener('pointercancel',done);box.addEventListener('click',function(e){e.stopPropagation();});
paint();closing=setTimeout(clear,7000);
}
window.NHI_HARD_MASCOT={show:show,clear:clear};
})();