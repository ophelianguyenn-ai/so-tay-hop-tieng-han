/* Technical visual suggestions on the reverse of daily flashcards.
   Search only known technical concepts, cite Commons; do not save arbitrary result as verified. */
(function(){
'use strict';
var dictionary=[
[/bơm ly tâm|펌프|원심펌프/i,'centrifugal pump machinery'],
[/van một chiều|체크밸브/i,'check valve plumbing'],
[/van cửa|게이트 밸브|밸브/i,'gate valve industrial'],
[/trao đổi nhiệt|열교환기/i,'shell tube heat exchanger'],
[/bình ngưng|응축기|콘덴서/i,'industrial condenser'],
[/đồng hồ áp suất|압력계|게이지압/i,'pressure gauge industrial'],
[/bẫy hơi|스팀 트랩|트랩/i,'steam trap plumbing'],
[/lò hơi|보일러|스팀보일러/i,'industrial steam boiler'],
[/bộ trao đổi|heat exchanger/i,'shell tube heat exchanger'],
[/đường ống|배관|급수관/i,'industrial pipework'],
[/mặt bích|플랜지/i,'pipe flange'],
[/đầu đốt|버너/i,'industrial gas burner'],
[/bồn chứa|탱크|저장고/i,'storage tank chemical plant'],
[/băng tải|컨베이어/i,'conveyor belt industrial'],
[/cánh khuấy|교반기|임펠러/i,'industrial agitator mixer'],
[/đo mức|액위계|레벨계|트랜스미터/i,'level transmitter industrial'],
[/cảm biến nhiệt|온도 센서/i,'temperature sensor industrial'],
[/van điều khiển|조절 밸브/i,'control valve actuator'],
[/tủ điện|제어반|판넬/i,'industrial control panel'],
[/bơm chân không|진공펌프/i,'vacuum pump equipment'],
[/lọc túi|bag filter/i,'industrial bag filter'],
[/bộ lọc|필터/i,'industrial water filter'],
[/phòng thí nghiệm|실험실|QC실/i,'chemical laboratory equipment'],
[/máy ly tâm|원심분리기/i,'industrial centrifuge'],
[/máy đo độ ẩm|수분 측정기/i,'moisture analyzer instrument'],
[/bồn ngưng tụ|응축수 탱크/i,'condensate tank industrial'],
[/quạt hút|배기팬/i,'industrial exhaust fan'],
[/tủ hút|흄후드/i,'laboratory fume hood'],
[/mối hàn|용접 비드|용접/i,'welding bead industrial'],
[/sàn epoxy|에폭시 바닥/i,'industrial epoxy floor'],
[/đồng hồ lưu lượng|유량계/i,'flow meter industrial'],
[/trục bơm|펌프 샤프트/i,'pump shaft industrial'],
[/thiết bị bảo hộ|보호구/i,'industrial personal protective equipment'],
[/bình chữa cháy|소화기/i,'fire extinguisher']
];
var original=window.NHI_IMAGES;if(!original)return;
var cache={};
function query(it){var word=String(it.vi||'')+' '+String(it.ko||'');for(var i=0;i<dictionary.length;i++)if(dictionary[i][0].test(word))return dictionary[i][1];return null;}
function suggested(it){
var q=query(it);if(!q)return null;
var f=document.createElement('figure');f.className='card-illustration auto-illustration';
var tip=document.createElement('figcaption');tip.textContent='Đang tìm hình kỹ thuật: '+q+'…';f.appendChild(tip);
if(!cache[q]){
cache[q]=fetch('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch='+encodeURIComponent(q)+'&prop=imageinfo&iiprop=url%7Cmime&iiurlwidth=520&origin=*&format=json')
.then(function(r){if(!r.ok)throw Error('Network');return r.json();})
.then(function(d){var pages=Object.values((d.query||{}).pages||{}).filter(function(p){var inf=(p.imageinfo||[])[0];return inf&&/^image\/(jpeg|png|webp)$/i.test(inf.mime||'')&&/^https:\/\//.test(inf.thumburl||inf.url||'');});return pages.length?pages[0]:null;}).catch(function(){return null;});
}
cache[q].then(function(p){if(!f.isConnected)return;
tip.textContent=p?'Ảnh gợi ý: '+(it.vi||q)+' · Wikimedia Commons (hãy kiểm tra độ phù hợp)':'Chưa tìm thấy ảnh phù hợp; dùng nút Sửa → Tìm ảnh';
if(!p)return;
var inf=p.imageinfo[0],img=document.createElement('img');img.src=inf.thumburl||inf.url;img.loading='lazy';img.referrerPolicy='no-referrer';img.alt='Ảnh gợi ý kỹ thuật '+(it.vi||q);img.onerror=function(){img.remove();tip.textContent='Ảnh không tải được; mở Sửa → Tìm ảnh';};
f.insertBefore(img,tip);var a=document.createElement('a');a.href=inf.descriptionurl||'https://commons.wikimedia.org/';a.target='_blank';a.rel='noopener noreferrer';a.textContent='Nguồn ảnh';tip.appendChild(document.createTextNode(' · '));tip.appendChild(a);
});
return f;
}
window.NHI_IMAGES.figure=function(it,value){
var existing=original.figure(it,value);
if(existing||value&&value.hidden)return existing;
return suggested(it);
};
})();