(function(){
  var cover=document.getElementById('cover'), scene=cover.querySelector('.landscape');
  for(var i=0;i<24;i++){
    var p=document.createElement('i');p.className='petal day-only';
    p.style.cssText='left:'+(i*37%100)+'%;top:'+(-15+i*13%65)+'%;--d:'+(9+i%8)+'s;--delay:-'+(i*.83)+'s;--size:'+(8+i%8)+'px';scene.appendChild(p);
  }
  for(var i=0;i<3;i++){
    var p=document.createElement('i');p.className='shooting-star night-only';p.style.cssText='left:'+(20+i*24)+'%;top:'+(10+i*8)+'%;animation-delay:'+i*5+'s';scene.appendChild(p);
  }
  var control=document.createElement('button');control.type='button';control.className='garden-control';control.textContent='❚❚ Dừng chuyển động';control.setAttribute('aria-pressed','false');
  function pause(on){cover.classList.toggle('garden-paused',on);control.textContent=on?'▶ Bật chuyển động':'❚❚ Dừng chuyển động';control.setAttribute('aria-pressed',String(on));}
  control.addEventListener('click',function(){pause(!cover.classList.contains('garden-paused'));});cover.appendChild(control);
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)pause(true);
})();
