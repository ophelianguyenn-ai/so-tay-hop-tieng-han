/* Companion belongs to the current card; only hard-rating can show it. */
(function(){
'use strict';let active=null,card=null,timer=0,removeTimer=0;
function clear(){clearTimeout(timer);clearTimeout(removeTimer);if(active)active.remove();if(card)card.classList.remove('nhi-mascot-active');active=null;card=null;}
function show(target){clear();if(!target)return;card=target;active=document.createElement('div');active.id='nhi-hard-mascot';active.setAttribute('role','status');
const img=document.createElement('img');img.src='nhi-mascot.webp';img.alt='Bạn Nhi động viên';const caption=document.createElement('p');caption.className='nhi-hard-caption';caption.textContent='Mình ôn lại nhé!';active.append(img,caption);card.append(active);card.classList.add('nhi-mascot-active');
timer=setTimeout(()=>{if(!active)return;active.classList.add('nhi-mascot-leave');removeTimer=setTimeout(clear,650);},1500);}
function sync(target){if(!active)return;if(target!==card)clear();}
window.NHI_HARD_MASCOT={show,clear,sync};
})();
