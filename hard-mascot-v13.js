/* Interactive "Khó" mascot, centered inside the white study-card area. */
(function(){
'use strict';
var KEY='nlc-hard-mascot-v13';
var prefs={size:185,offsetX:0,offsetY:0}, active=null, timeout=0;
try{var saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved && typeof saved==='object')Object.assign(prefs,saved);}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(e){}}
function clamp(n,low,high){return Math.min(high,Math.max(low,n));}
function clear(){
  clearTimeout(timeout);
  if(active){active.remove();active=null;}
}
function show(card){
  clear();
  if(!card)return;
  var area=card.querySelector('.pfront')||card;
  var rect=area.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  var center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  var root=document.createElement('div');
  root.id='nhi-hard-mascot';
  root.setAttribute('role','group');
  root.setAttribute('aria-label','Bạn Nhi khích lệ khi gặp từ khó; kéo hoặc đổi kích thước');
  var grip=document.createElement('div');
  grip.className='nhi-hard-grip';
  grip.textContent='⋮⋮ Kéo Nhi';
  grip.title='Giữ và kéo để di chuyển';
  var img=document.createElement('img');
  img.src='nhi-puzzled.webp';img.alt='Bạn Nhi động viên';img.draggable=false;
  var caption=document.createElement('p');
  caption.className='nhi-hard-caption';
  caption.textContent='Từ này hơi khó nhỉ… Mình ôn lại nhé!';
  var ctl=document.createElement('div');ctl.className='nhi-hard-controls';
  function button(label,description,click){
    var b=document.createElement('button');b.type='button';b.textContent=label;
    b.title=description;b.setAttribute('aria-label',description);b.addEventListener('click',function(e){e.stopPropagation();clearTimeout(timeout);click();});
    ctl.appendChild(b);return b;
  }
  function place(){
    if(!active)return;
    prefs.size=clamp(Number(prefs.size)||185,90,280);
    root.style.setProperty('--nhi-hard-size',prefs.size+'px');
    var w=root.offsetWidth,h=root.offsetHeight;
    var x=center.x+Number(prefs.offsetX||0)-w/2;
    var y=center.y+Number(prefs.offsetY||0)-h/2;
    root.style.left=clamp(x,8,Math.max(8,innerWidth-w-8))+'px';
    root.style.top=clamp(y,8,Math.max(8,innerHeight-h-8))+'px';
  }
  function resize(change){prefs.size=clamp(prefs.size+change,90,280);place();persist();}
  button('−','Thu nhỏ bạn Nhi',function(){resize(-18);});
  button('+','Phóng to bạn Nhi',function(){resize(18);});
  button('◎','Đưa Nhi về giữa thẻ',function(){prefs.offsetX=0;prefs.offsetY=0;place();persist();});
  button('×','Đóng bạn Nhi',clear);
  root.appendChild(grip);root.appendChild(img);root.appendChild(caption);root.appendChild(ctl);
  document.body.appendChild(root);active=root;
  var drag=null;
  function dragStart(e){
    if(e.pointerType==='mouse' && e.button!==0)return;
    e.preventDefault();e.stopPropagation();
    clearTimeout(timeout);
    drag={px:e.clientX,py:e.clientY,ox:Number(prefs.offsetX)||0,oy:Number(prefs.offsetY)||0};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function dragMove(e){if(!drag)return;prefs.offsetX=drag.ox+e.clientX-drag.px;prefs.offsetY=drag.oy+e.clientY-drag.py;place();}
  function dragStop(){if(!drag)return;drag=null;persist();}
  [grip,img].forEach(function(target){
    target.addEventListener('pointerdown',dragStart);
    target.addEventListener('pointermove',dragMove);
    target.addEventListener('pointerup',dragStop);
    target.addEventListener('pointercancel',dragStop);
  });
  root.addEventListener('click',function(e){e.stopPropagation();});
  place();
  timeout=setTimeout(function(){if(active===root)clear();},7500);
}
window.NHI_HARD_MASCOT={show:show,clear:clear};
})();