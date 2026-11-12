/* Google Images workflow, with manual links/upload and optional legacy Custom Search API. */
(function(){
'use strict';
var api=window.NHI_IMAGES;if(!api)return;
var KEY='nlc-google-images-v1',config={key:'',cx:''};
try{Object.assign(config,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function E(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function https(u){try{var x=new URL(u);return x.protocol==='https:'?x.href:'';}catch(e){return '';}}
function searchUrl(q){return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q);}
function term(it){var txt=(it.vi||'')+' '+(it.ko||'');var defs=[
[/ly tâm|원심펌프/i,'industrial centrifugal pump'],[/trao đổi nhiệt|열교환기/i,'industrial heat exchanger'],
[/van một chiều|체크밸브/i,'industrial check valve'],[/áp suất|압력계/i,'pressure gauge industrial'],
[/bẫy hơi|스팀 트랩/i,'steam trap cutaway'],[/lò hơi|보일러/i,'industrial steam boiler'],
[/cảm biến|센서/i,'industrial sensor'],[/mặt bích|플랜지/i,'pipe flange'],
[/bồn chứa|탱크/i,'industrial storage tank'],[/lưu lượng|유량계/i,'industrial flow meter']
];for(var i=0;i<defs.length;i++)if(defs[i][0].test(txt))return defs[i][1];return String(it.ko||it.vi||'');}
function upload(file,it,save,status){
if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){status.textContent='Chọn JPG, PNG hoặc WebP.';return;}
if(file.size>12*1024*1024){status.textContent='Ảnh quá lớn (trên 12 MB).';return;}
var fr=new FileReader();fr.onerror=function(){status.textContent='Không đọc được ảnh.';};
fr.onload=function(){var im=new Image();im.onerror=function(){status.textContent='Tệp ảnh không hợp lệ.';};im.onload=function(){
var scale=Math.min(1,900/im.width,900/im.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));
var ctx=c.getContext('2d');if(!ctx)return;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(im,0,0,c.width,c.height);
try{save({url:c.toDataURL('image/jpeg',0.7),caption:it.vi||it.ko||''});}catch(e){status.textContent='Không lưu được ảnh; hãy thử ảnh nhỏ hơn.';}
};im.src=fr.result;};fr.readAsDataURL(file);
}
function picker(it,save,close){
var root=E('section','nhi-picture-picker');root.setAttribute('role','dialog');root.setAttribute('aria-label','Tìm ảnh minh họa Google');
var top=E('div','nhi-picture-head');top.appendChild(E('strong',null,'Hình ảnh minh họa · Google'));
var quit=E('button','ghost','× Đóng');quit.type='button';quit.addEventListener('click',close);top.appendChild(quit);root.appendChild(top);
root.appendChild(E('p','nhi-google-note','Chỉ lưu ảnh bạn chọn, và chỉ hiện ở mặt sau thẻ dưới chữ Hàn.'));
var form=E('form','nhi-picture-search'),input=E('input','field');input.type='search';input.value=term(it);input.placeholder='Ví dụ: industrial heat exchanger';input.setAttribute('aria-label','Từ khóa tìm Google Hình ảnh');
var go=E('button','primary','Tìm');go.type='submit';form.appendChild(input);form.appendChild(go);root.appendChild(form);
var link=E('a','ghost','Mở Google Hình ảnh');link.href=searchUrl(input.value);link.target='_blank';link.rel='noopener noreferrer';root.appendChild(link);
var state=E('p','nhi-picture-status');state.setAttribute('role','status');root.appendChild(state);
var tiles=E('div','nhi-picture-results');root.appendChild(tiles);
var manual=E('div','nhi-google-manual');manual.appendChild(E('label',null,'Dán liên kết trực tiếp của ảnh (HTTPS):'));
var url=E('input','field');url.type='url';url.placeholder='https://.../image.jpg';manual.appendChild(url);
var add=E('button','ghost','Lưu ảnh từ liên kết');add.type='button';add.addEventListener('click',function(){var u=https(url.value.trim());if(!u){state.textContent='Đường dẫn ảnh phải bắt đầu bằng https://';return;}save({url:u,source:u,caption:it.vi||it.ko||''});});manual.appendChild(add);
manual.appendChild(E('label',null,'Hoặc tải hình JPG/PNG/WebP từ thiết bị:'));
var file=E('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.addEventListener('change',function(){upload(file.files&&file.files[0],it,save,state);file.value='';});manual.appendChild(file);root.appendChild(manual);
var details=E('details','nhi-google-advanced');details.appendChild(E('summary',null,'Đã có Google Custom Search API? Bật chọn ảnh một chạm'));
details.appendChild(E('p','nhi-google-note','API này đã ngừng tiếp nhận khách hàng mới. Phần này chỉ dành cho tài khoản có sẵn API key và Search Engine ID (cx).'));
var key=E('input','field');key.type='password';key.placeholder='Google Search API key';key.value=config.key;key.autocomplete='off';
var cx=E('input','field');cx.placeholder='Search Engine ID (cx)';cx.value=config.cx;cx.autocomplete='off';
details.appendChild(key);details.appendChild(cx);
var store=E('button','ghost','Lưu trên thiết bị');store.type='button';store.addEventListener('click',function(){config.key=key.value.trim();config.cx=cx.value.trim();try{localStorage.setItem(KEY,JSON.stringify(config));}catch(e){}state.textContent='Đã lưu cài đặt Google trên thiết bị.';});
details.appendChild(store);root.appendChild(details);
var token=0;
form.addEventListener('submit',async function(e){
e.preventDefault();var q=input.value.trim();link.href=searchUrl(q);tiles.replaceChildren();if(!q)return;
if(!config.key||!config.cx){state.textContent='Google Hình ảnh đã mở ở tab mới. Chọn một hình, sao chép liên kết trực tiếp hoặc tải ảnh rồi thêm vào thẻ.';window.open(link.href,'_blank','noopener,noreferrer');return;}
var my=++token;go.disabled=true;state.textContent='Đang lấy hình từ Google…';
try{var endpoint='https://www.googleapis.com/customsearch/v1?searchType=image&safe=active&num=10&key='+encodeURIComponent(config.key)+'&cx='+encodeURIComponent(config.cx)+'&q='+encodeURIComponent(q);
var resp=await fetch(endpoint),data=await resp.json();if(!resp.ok)throw Error(data.error?.message||('HTTP '+resp.status));
if(my!==token||!root.isConnected)return;var items=(data.items||[]).filter(function(x){return https(x.link);});state.textContent=items.length?'Chạm vào ảnh để lưu.':'Không tìm thấy hình.';
items.forEach(function(itm){var tile=E('button','nhi-picture-result');tile.type='button';var img=E('img');img.loading='lazy';img.referrerPolicy='no-referrer';img.src=https(itm.image?.thumbnailLink)||https(itm.link);img.alt=itm.title||'Ảnh minh họa';tile.appendChild(img);tile.appendChild(E('span',null,itm.title||'Hình từ Google'));tile.addEventListener('click',function(){save({url:itm.link,caption:it.vi||it.ko||'',source:https(itm.image?.contextLink)||itm.link,credit:itm.displayLink||'Nguồn từ Google'});});tiles.appendChild(tile);});
}catch(ex){state.textContent='Google API không khả dụng: '+String(ex.message||ex).slice(0,130)+'. Bạn vẫn có thể tải ảnh từ Google và thêm thủ công.';}finally{go.disabled=false;}
});
root.addEventListener('click',function(e){e.stopPropagation();});
root.addEventListener('keydown',function(e){if(e.key==='Escape'){e.stopPropagation();close();}});
return root;
}
api.picker=picker;
api.editor=function(it,value,persist){
var field=E('fieldset','nhi-google-editor');field.appendChild(E('legend',null,'Hình ảnh mặt sau · Google'));
field.appendChild(E('p','nhi-google-note','Ảnh nằm dưới chữ Hàn trong khung thẻ trắng, chỉ hiện khi lật.'));
var open=E('button','ghost','Tìm / chọn hình Google');open.type='button';field.appendChild(open);var inside=null,current=value;
function preview(){var previous=field.querySelector('figure');if(previous)previous.remove();var fig=api.figure(it,current);if(fig)field.appendChild(fig);}
function close(){if(inside){inside.remove();inside=null;}}
open.addEventListener('click',function(){if(inside)return close();inside=picker(it,function(v){current=v;persist(v);close();preview();},close);field.appendChild(inside);});
var remove=E('button','ghost','Ẩn ảnh');remove.type='button';remove.addEventListener('click',function(){current={hidden:true};persist(current);preview();});field.appendChild(remove);preview();return field;
};
})();