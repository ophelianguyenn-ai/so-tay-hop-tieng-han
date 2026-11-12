/* Nhi's difficult-card companion, fixed at the left side of the white card. */
(function(){
'use strict';
var active=null,timeout=null,resize=null;
function clear(){
 clearTimeout(timeout);
 if(resize)window.removeEventListener('resize',resize);
 resize=null;
 if(active)active.remove();
 active=null;
}
function show(card){
 clear();
 if(!card)return;
 var area=card.querySelector('.pfront')||card,r=area.getBoundingClientRect();
 if(!r.width||!r.height)return;
 var root=document.createElement('div');root.id='nhi-hard-mascot';root.setAttribute('role','status');
 var im=document.createElement('img');im.src='nhi-mascot.webp';im.alt='Bạn Nhi';im.draggable=false;
 var caption=document.createElement('p');caption.className='nhi-hard-caption';
 caption.textContent='Từ này hơi khó nhỉ... mình ôn lại nhé';
 root.appendChild(im);root.appendChild(caption);document.body.appendChild(root);active=root;
 function position(){
   if(active!==root)return;
   var w=root.offsetWidth,h=root.offsetHeight;
   // Always anchor to LEFT edge; never to the center of the card.
   root.style.left=Math.max(6,Math.min(innerWidth-w-6,r.left+14))+'px';
   root.style.top=Math.max(6,Math.min(innerHeight-h-6,r.top+(r.height-h)/2))+'px';
 }
 resize=position;window.addEventListener('resize',resize);position();
 timeout=setTimeout(clear,7000);
}
window.NHI_HARD_MASCOT={show:show,clear:clear};
})();