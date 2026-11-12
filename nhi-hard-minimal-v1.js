/* Responsive Nhi reaction: inline on phones, left-anchored floating on desktop. */
(function(){
'use strict';
var active=null,stopTimer=null,onResize=null;
function clear(){
  if(stopTimer)clearTimeout(stopTimer);
  if(onResize)window.removeEventListener('resize',onResize);
  stopTimer=null;onResize=null;
  if(active)active.remove();
  active=null;
}
function show(card){
  clear();
  if(!card||!card.isConnected)return;
  var root=document.createElement('div');root.id='nhi-hard-mascot';root.setAttribute('role','status');
  var img=document.createElement('img');img.src='nhi-mascot.webp';img.alt='Bạn Nhi động viên';img.draggable=false;
  var caption=document.createElement('p');caption.className='nhi-hard-caption';
  caption.textContent='Từ này hơi khó nhỉ... mình ôn lại nhé';
  root.appendChild(img);root.appendChild(caption);active=root;
  function layout(){
    if(active!==root)return;
    var isPhone=window.innerWidth<=720;
    if(isPhone){
      if(root.parentElement!==card)card.appendChild(root);
      root.classList.add('nhi-hard-inline');
      root.style.removeProperty('left');root.style.removeProperty('top');
      root.style.removeProperty('right');root.style.removeProperty('bottom');
    }else{
      if(root.parentElement!==document.body)document.body.appendChild(root);
      root.classList.remove('nhi-hard-inline');
      var area=card.querySelector('.pfront')||card,r=area.getBoundingClientRect(),w=root.offsetWidth,h=root.offsetHeight;
      root.style.left=Math.max(6,Math.min(innerWidth-w-6,r.left+14))+'px';
      root.style.top=Math.max(6,Math.min(innerHeight-h-6,r.top+(r.height-h)/2))+'px';
    }
  }
  onResize=layout;window.addEventListener('resize',onResize);
  layout();stopTimer=setTimeout(clear,6000);
}
window.NHI_HARD_MASCOT={show:show,clear:clear};
})();