/* UI v4: per-button feedback, top-left close button, theme controls on cover.
 * Event delegation supports dynamic lesson and image-picker content.
 */
(function(){
'use strict';
function $(q,root){return (root||document).querySelector(q);}
function reduced(){return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);}
function visible(el){return !!(el&&!el.hidden&&el.getClientRects().length);}
function activeSurface(){
  var dlg=$('dialog[open]');if(dlg)return {type:'dialog',target:dlg};
  var pic=$('.nhi-picture-picker');if(visible(pic))return {type:'images',target:pic};
  var set=$('#setSheet');if(visible(set))return {type:'settings',target:set};
  var ai=$('#aiPanel');if(document.body.classList.contains('ai-open')&&ai)return {type:'ai',target:ai};
  var menu=$('#menuList');if(visible(menu))return {type:'menu',target:menu};
  var legend=$('.legendpop');if(visible(legend))return {type:'legend',target:legend};
  var editor=$('#planBox .editbox');if(visible(editor))return {type:'editor',target:editor};
  var cover=$('#cover');if(visible(cover))return {type:'cover',target:cover};
  return null;
}
function doClose(s){
  if(!s)return;
  switch(s.type){
    case 'dialog':s.target.close();break;
    case 'images':{var b=$('.nhi-picture-head button',s.target);if(b)b.click();break;}
    case 'settings':{var b=$('[data-close]',s.target);if(b)b.click();break;}
    case 'ai':{var b=$('#aiClose');if(b)b.click();break;}
    case 'menu':{var b=$('#menuBtn');if(b)b.click();break;}
    case 'legend':{var b=$('.lclose',s.target);if(b)b.click();break;}
    case 'editor':{
      var b=Array.prototype.find.call(s.target.querySelectorAll('button'),function(x){return /^huỷ$|^hủy$|^đóng$/i.test(x.textContent.trim());});
      if(b)b.click();break;
    }
    case 'cover':{var b=$('#coverGo');if(b)b.click();break;}
  }
}
function makeClose(){
  if($('#nhi-global-close-v4'))return;
  var b=document.createElement('button');b.type='button';b.id='nhi-global-close-v4';
  b.className='nhi-global-close-v4';b.setAttribute('aria-label','Đóng cửa sổ đang mở');
  b.title='Đóng (X)';b.textContent='×';b.hidden=true;document.body.appendChild(b);
  b.addEventListener('click',function(e){e.stopPropagation();doClose(activeSurface());requestAnimationFrame(updateClose);});
}
function updateClose(){
  var b=$('#nhi-global-close-v4');if(!b)return;
  var s=activeSurface();if(b.hidden===!!s)b.hidden=!s;
  if(s)b.setAttribute('aria-label','Đóng '+({ai:'chat AI',images:'tìm ảnh',settings:'cài đặt',cover:'trang bìa',editor:'chỉnh sửa thẻ',legend:'chú giải',menu:'menu',dialog:'hộp thoại'}[s.type]||'cửa sổ'));
}
var scheduled=false;
function scheduleCloseUpdate(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(function(){scheduled=false;updateClose();});
}
function updateCoverTheme(){
  var group=$('#nhi-cover-theme-v4');if(!group)return;
  var theme=document.documentElement.getAttribute('data-theme')||'light';
  group.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.nhiTheme===theme));});
}
function makeCoverControls(){
  var cover=$('#cover');if(!cover||$('#nhi-cover-theme-v4'))return;
  var group=document.createElement('div');group.id='nhi-cover-theme-v4';group.className='nhi-cover-theme-v4';
  group.setAttribute('role','group');group.setAttribute('aria-label','Giao diện trang bìa');
  [['light','☀','Bật giao diện sáng'],['dark','☾','Bật giao diện tối']].forEach(function(item){
    var b=document.createElement('button');b.type='button';b.dataset.nhiTheme=item[0];
    b.textContent=item[1];b.title=item[2];b.setAttribute('aria-label',item[2]);
    b.addEventListener('click',function(){
      var existing=$('[data-theme-set="'+item[0]+'"]');
      if(existing)existing.click();updateCoverTheme();
    });
    group.appendChild(b);
  });
  cover.appendChild(group);updateCoverTheme();
  new MutationObserver(updateCoverTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
}
function pressFeedback(button){
  if(reduced()||!button||button.disabled)return;
  var r=button.getBoundingClientRect();if(!r.width||!r.height)return;
  var ring=document.createElement('span');ring.className='nhi-button-ring-v4';ring.setAttribute('aria-hidden','true');
  var color=button.classList.contains('hard')?'#D97706':button.classList.contains('mid')?'#1684D4':button.classList.contains('known')?'#059669':'#8B77DF';
  ring.style.setProperty('--ring-color',color);
  ring.style.left=r.left+'px';ring.style.top=r.top+'px';ring.style.width=r.width+'px';ring.style.height=r.height+'px';
  ring.style.borderRadius=getComputedStyle(button).borderRadius||'12px';
  document.body.appendChild(ring);
  var anim=ring.animate([
    {opacity:.85,transform:'scale(.96)'},{opacity:.92,transform:'scale(1.035)',offset:.35},
    {opacity:0,transform:'scale(1.095)'}
  ],{duration:460,easing:'cubic-bezier(.16,.82,.2,1)',fill:'forwards'});
  anim.onfinish=anim.oncancel=function(){ring.remove();};
  setTimeout(function(){ring.remove();},560);
}
function init(){
  makeClose();makeCoverControls();
  document.addEventListener('click',function(e){
    var target=e.target instanceof Element?e.target:null;
    var b=target&&target.closest('button,[role="button"]');
    if(b)pressFeedback(b);
    scheduleCloseUpdate();
  },true);
  document.addEventListener('keydown',function(e){
    if((e.key==='Enter'||e.key===' ')&&document.activeElement?.matches('button'))pressFeedback(document.activeElement);
  },true);
  var observer=new MutationObserver(scheduleCloseUpdate);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','open']});
  scheduleCloseUpdate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();