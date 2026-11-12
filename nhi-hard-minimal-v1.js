/* Nhi's companion: centered vertically at left, with reserved text space on phones.
 * Transparent existing image; no controls or opaque backgrounds. */
(function(){
  'use strict';
  var active=null,lastCard=null,expiry=0,timer=null;
  function clear(){
    if(timer)clearTimeout(timer);
    timer=null;
    if(lastCard)lastCard.classList.remove('nhi-mascot-active');
    lastCard=null;
    if(active)active.remove();
    active=null;expiry=0;
    window.removeEventListener('resize',onResize);
  }
  function attach(card){
    if(!active||!card||!card.classList||Date.now()>=expiry)return;
    if(lastCard&&lastCard!==card)lastCard.classList.remove('nhi-mascot-active');
    lastCard=card;
    var phone=window.innerWidth<=720,stage=card.querySelector('.pfront')||card;
    if(phone){
      card.classList.add('nhi-mascot-active');
      active.classList.add('nhi-hard-inline');
      if(active.parentElement!==stage)stage.appendChild(active);
      active.style.removeProperty('left');active.style.removeProperty('top');
    } else {
      card.classList.remove('nhi-mascot-active');
      active.classList.remove('nhi-hard-inline');
      if(active.parentElement!==document.body)document.body.appendChild(active);
      requestAnimationFrame(function(){
        if(!active||!card.isConnected||innerWidth<=720)return;
        var b=stage.getBoundingClientRect(),w=active.offsetWidth,h=active.offsetHeight;
        if(!b.width)return;
        active.style.left=Math.max(8,Math.min(innerWidth-w-8,b.left+12))+'px';
        active.style.top=Math.max(8,Math.min(innerHeight-h-8,b.top+(b.height-h)/2))+'px';
      });
    }
  }
  function onResize(){if(!active||!lastCard||Date.now()>=expiry)return clear();attach(lastCard);}
  function show(card){
    clear();if(!card)return;
    var root=document.createElement('div');root.id='nhi-hard-mascot';
    root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-label','Bạn Nhi động viên');
    var image=document.createElement('img');image.src='nhi-mascot.webp';image.alt='Bạn Nhi';image.draggable=false;
    var msg=document.createElement('p');msg.className='nhi-hard-caption';msg.textContent='Từ này hơi khó nhỉ... mình ôn lại nhé';
    root.appendChild(image);root.appendChild(msg);active=root;
    expiry=Date.now()+7000;attach(card);
    addEventListener('resize',onResize);
    timer=setTimeout(clear,7000);
  }
  function sync(card){if(!active)return;if(Date.now()>=expiry)return clear();attach(card);}
  window.NHI_HARD_MASCOT={show:show,clear:clear,sync:sync};
})();