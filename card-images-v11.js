(function(){
'use strict';var presets={};fetch('technical-images.json').then(function(r){return r.json();}).then(function(d){presets=d;}).catch(function(){});
function node(tag,text){var n=document.createElement(tag);if(text)n.textContent=text;return n;}
function safe(url){return /^pictures\/[a-z-]+\.webp$/.test(url)||/^https:\/\//i.test(url)||/^data:image\/(jpeg|png|webp);base64,/.test(url);}
function figure(it,value,onResize){
  var v=value||presets[it.ko];if(!v||v.hidden||!safe(v.url||''))return null;
  var f=node('figure');f.className='card-illustration';
  var im=node('img');im.src=v.url;im.alt=v.caption||it.vi;im.loading='lazy';im.referrerPolicy='no-referrer';im.draggable=false;
  im.onerror=function(){im.hidden=true;};f.appendChild(im);
  var cap=node('figcaption',v.caption||it.vi);
  if(v.source&&/^https:\/\//.test(v.source)){cap.appendChild(node('br'));var link=node('a',v.credit||'Nguồn ảnh');link.href=v.source;link.target='_blank';link.rel='noopener noreferrer';cap.appendChild(link);}
  f.appendChild(cap);
  if(typeof onResize==='function'){
    var width=Math.max(110,Math.min(680,Number(v.width)||220));
    f.dataset.resizable='true';f.setAttribute('aria-label','Kéo trực tiếp trên hình để thay đổi kích thước');
    im.title='Giữ và kéo trên hình để thu nhỏ hoặc phóng to';
    im.style.touchAction='none';
    function paint(){
      f.style.setProperty('--nhi-image-width',width+'px');
      var parent=f.closest('.pfront');if(parent)parent.style.setProperty('--nhi-image-width',width+'px');
    }
    var drag=null;
    im.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      paint();
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,width:width};
      f.classList.add('nhi-image-dragging');im.setPointerCapture(e.pointerId);
    });
    im.addEventListener('pointermove',function(e){
      if(!drag||e.pointerId!==drag.id)return;
      var parent=f.closest('.pfront'),maxWidth=parent?Math.max(160,Math.min(680,parent.clientWidth*.75)):680;
      width=Math.max(110,Math.min(maxWidth,drag.width+Math.max(e.clientX-drag.x,e.clientY-drag.y)));
      paint();e.stopPropagation();
    });
    function finish(e){
      if(!drag)return;
      drag=null;f.classList.remove('nhi-image-dragging');
      onResize(Object.assign({},v,{width:Math.round(width)}));
      if(e)e.stopPropagation();
    }
    im.addEventListener('pointerup',finish);im.addEventListener('pointercancel',finish);
    requestAnimationFrame(paint);
  }
  return f;
}
function editor(it,value,save){var box=node('fieldset');box.className='image-editor';box.appendChild(node('legend','Hình ảnh minh họa'));var current=value||presets[it.ko]||{},draft=Object.assign({},current);
var preview=node('div');box.appendChild(preview);function paint(){preview.replaceChildren();var f=figure(it,draft);if(f)preview.appendChild(f);}paint();
function field(label,val){var l=node('label',label),i=node('input');i.className='field';i.value=val||'';l.appendChild(i);box.appendChild(l);return i;}
var query=field('Từ khóa tìm ảnh',it.ko+' '+it.vi),url=field('Đường dẫn ảnh HTTPS',current.url&&current.url.indexOf('data:')!==0?current.url:''),caption=field('Chú thích',current.caption||it.vi);var row=node('div');row.className='dictionary-links';box.appendChild(row);
function button(text,fn){var b=node('button',text);b.type='button';b.className='ghost';b.onclick=fn;row.appendChild(b);return b;}
var status=node('p');status.className='hint';box.appendChild(status);var results=node('div');results.className='image-results';box.appendChild(results);var run=0;
button('Tìm ảnh miễn phí',async function(){var token=++run;results.replaceChildren();status.textContent='Đang tìm trên Wikimedia Commons…';try{var q=query.value.trim();var api='https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch='+encodeURIComponent(q)+'&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=500&format=json';var r=await fetch(api);if(!r.ok)throw Error();var data=await r.json();if(token!==run)return;Object.values((data.query||{}).pages||{}).forEach(function(p){var info=(p.imageinfo||[])[0];if(!info||!/^image\//.test((info.extmetadata?.MIMEType||{}).value||'image/'))return;var b=node('button');b.type='button';var im=node('img');im.src=info.thumburl||info.url;im.loading='lazy';b.appendChild(im);b.appendChild(node('span',p.title.replace(/^File:/,'')));b.onclick=function(){function plain(x){return new DOMParser().parseFromString(x||'','text/html').body.textContent;}draft={url:info.thumburl||info.url,caption:caption.value,source:info.descriptionurl,credit:plain(info.extmetadata?.Artist?.value)+' · '+plain(info.extmetadata?.LicenseShortName?.value)};url.value=draft.url;paint();status.textContent='Đã chọn ảnh. Bấm Lưu ảnh để áp dụng.';};results.appendChild(b);});status.textContent=results.childElementCount?'Chọn ảnh phù hợp, rồi bấm Lưu ảnh.':'Chưa có kết quả. Thử từ khóa tiếng Anh (ví dụ: centrifugal pump).';}catch(e){status.textContent='Chưa kết nối được kho ảnh. Dùng Tìm trên Google hoặc tải ảnh từ máy.';}});
button('Tìm trên Google',function(){window.open('https://www.google.com/search?tbm=isch&q='+encodeURIComponent(query.value),'_blank','noopener,noreferrer');});
var file=node('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.setAttribute('aria-label','Tải hình từ máy');box.appendChild(file);file.onchange=function(){var f=file.files[0];if(!f)return;if(f.size>12*1024*1024){status.textContent='Chọn ảnh dưới 12 MB.';return;}var reader=new FileReader();reader.onload=function(){var img=new Image();img.onload=function(){var c=node('canvas'),scale=Math.min(1,1000/img.width,1000/img.height);c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);draft={url:c.toDataURL('image/jpeg',.78),caption:caption.value};url.value='';paint();status.textContent='Ảnh đã sẵn sàng. Bấm Lưu ảnh.';};img.src=reader.result;};reader.readAsDataURL(f);};
url.oninput=function(){draft.url=url.value.trim();draft.source='';draft.credit='';paint();};caption.oninput=function(){draft.caption=caption.value;paint();};
button('Lưu ảnh',function(){if(!safe(draft.url||'')){status.textContent='Chọn ảnh hoặc nhập đường dẫn ảnh HTTPS.';return;}draft.caption=caption.value;save(draft);status.textContent='Đã lưu ảnh và đồng bộ với tiến độ.';});button('Ẩn ảnh',function(){draft={hidden:true};save(draft);paint();status.textContent='Đã ẩn ảnh trên thẻ.';});button('Ảnh mặc định',function(){save(null);draft=presets[it.ko]||{};paint();status.textContent='Đã khôi phục ảnh mặc định.';});return box;}
window.NHI_IMAGES={figure:figure,editor:editor};
})();
