/* English meaning, IPA and English speech for Nhi cards. */
(function(){
'use strict';
const STORE='nhi-english-edits-v5';
let edits={};try{edits=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){}
let data=window.NHI_ENGLISH_PRELOADED||null,once=null;
const clean=s=>String(s||'').trim();

/* Match dynamic daily-card content against the already pretranslated lesson corpus;
   for genuinely new content, translate on first view and cache by text. */
const AUTO_STORE='nhi-english-bytext-v1';
let byText={};try{byText=JSON.parse(localStorage.getItem(AUTO_STORE)||'{}')||{};}catch(e){}
const normalize=s=>clean(s).normalize('NFC').toLowerCase().replace(/\s+/g,' ').replace(/[.!?。？！]+$/,'').trim();
const entryKey=(vi,ko)=>normalize(vi)+'\u001f'+normalize(ko);

const REVIEW_KEY='nhi-english-reviewed-v1';
let reviewCache={};try{reviewCache=JSON.parse(localStorage.getItem(REVIEW_KEY)||'{}')||{};}catch(e){}
function numbers(x){return (clean(x).replace(/,/g,'.').match(/\d+(?:\.\d+)?/g)||[]).map(t=>''+Number(t));}
function suspect(en,vi,ko){
 const x=clean(en),v=clean(vi),k=clean(ko);
 if(!x)return true;
 if(/^(test result|translation result|hello|undefined|null|n\/a|error|too many requests)$/i.test(x)&&!/(kết quả|thử nghiệm|kiểm tra|결과|시험|검사|테스트)/i.test(v+' '+k))return true;
 if(v.length>35&&x.split(/\s+/).length<3)return true;
 if(numbers(v).some(t=>!numbers(x).includes(t)))return true;
 const tags=v.match(/\b(?:R|T|S|P|HE|EV|AG|CT)-\d{2,4}[A-Z]?(?:\/[A-Z])?\b/gi)||[];
 if(tags.some(t=>x.toUpperCase().indexOf(t.toUpperCase())===-1))return true;
 return false;
}
function verifiedEntry(id,vi,ko){
 const record=edits[id]||(data&&data[id]);
 if(!record)return null;
 if(['manual','editorial','verified'].includes(record.source)||!suspect(record.en,vi,ko))return record;
 if(edits[id]){delete edits[id];try{localStorage.setItem(STORE,JSON.stringify(edits));}catch(e){}}
 return null;
}
async function independentTranslation(text,language){
 const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl='+language+'&tl=en&dt=t&q='+encodeURIComponent(text);
 const res=await fetch(url,{mode:'cors',cache:'no-store'});if(!res.ok)throw Error('Dịch vụ đối chiếu đang lỗi.');
 const data=await res.json();return clean((data&&data[0]||[]).map(p=>p&&p[0]||'').join(''));
}
const CHOICE_KEY='nhi-english-primary-v1';
let choices={};try{choices=JSON.parse(localStorage.getItem(CHOICE_KEY)||'{}')||{};}catch(e){}
function suppliedComparison(vi,ko){
 return normalize(vi)==='đã được phê duyệt cuối cùng'&&normalize(ko)==='최종 승인을 받았습니다' ? {vi:'Final approval has been given',ko:'Final approval has been received'} : null;
}
function comparisonRows(box,id,vi,ko){
 let holder=box.querySelector('.nhi-en-choices');
 if(!holder){holder=document.createElement('div');holder.className='nhi-en-choices';box.querySelector('.nhi-en-status').before(holder);}
 holder.replaceChildren();
 let result=reviewCache[entryKey(vi,ko)]||suppliedComparison(vi,ko);
 // Recover the two alternatives saved by the older, long comparison notice.
 if(typeof result==='string'){
  const match=result.match(/tiếng Việt: “(.*?)”; từ tiếng Hàn: “(.*?)”/);
  result=match?{vi:match[1],ko:match[2]}:null;
 }
 if(!result||typeof result!=='object')return;
 for(const [lang,flag] of [['vi','🇻🇳'],['ko','🇰🇷']]){
  if(!clean(result[lang]))continue;
  const button=document.createElement('button');button.type='button';button.className='nhi-en-choice';
  const active=clean((choices[entryKey(vi,ko)]||{}).en)===result[lang];
  button.setAttribute('aria-pressed',String(active));
  button.title='Chọn bản dịch từ '+(lang==='vi'?'tiếng Việt':'tiếng Hàn')+' làm tiếng Anh chính';
  const text=document.createElement('span');text.textContent=flag+' “'+result[lang]+'”';
  const action=document.createElement('small');action.textContent=active?'✓ Chính':'Chọn';
  if(window.NHI_STUDY)window.NHI_STUDY.wordElements(text,result[lang]);
  button.append(text,action);button.onclick=()=>{
   const key=entryKey(vi,ko),previous=choices[key];
   choices[key]={en:result[lang],ipa:'',source:'comparison',language:lang};
   try{localStorage.setItem(CHOICE_KEY,JSON.stringify(choices));}
   catch(e){if(previous)choices[key]=previous;else delete choices[key];box.querySelector('.nhi-en-status').textContent='Không lưu được lựa chọn.';return;}
   display(box,verifiedEntry(id,vi,ko),id,vi,ko);
  };
  holder.appendChild(button);
 }
 const original=verifiedEntry(id,vi,ko);
 if(choices[entryKey(vi,ko)]&&original){
  const restore=document.createElement('button');restore.type='button';restore.className='nhi-en-original';restore.textContent='↩ Bản gốc';restore.title=original.en;
  restore.onclick=()=>{
   const key=entryKey(vi,ko),previous=choices[key];delete choices[key];
   try{localStorage.setItem(CHOICE_KEY,JSON.stringify(choices));}catch(e){choices[key]=previous;box.querySelector('.nhi-en-status').textContent='Không lưu được lựa chọn.';return;}
   display(box,original,id,vi,ko);
  };holder.appendChild(restore);
 }
}
async function checkMeaning(box,id,vi,ko){
 const status=box.querySelector('.nhi-en-status'),btn=box.querySelector('.nhi-en-review');
 const supplied=suppliedComparison(vi,ko);
 if(supplied){reviewCache[entryKey(vi,ko)]=supplied;status.textContent='';comparisonRows(box,id,vi,ko);return;}
 btn.disabled=true;status.textContent='Đang đối chiếu…';
 try{
  const [v,k]=await Promise.all([independentTranslation(vi,'vi'),independentTranslation(ko,'ko')]);
  if(!v||!k)throw Error('Chưa có đủ hai bản dịch');
  reviewCache[entryKey(vi,ko)]={vi:v,ko:k};
  try{localStorage.setItem(REVIEW_KEY,JSON.stringify(reviewCache));}catch(e){}
  status.textContent='';comparisonRows(box,id,vi,ko);
 }catch(e){status.textContent='Chưa đối chiếu được. Thử lại sau.';}
 finally{btn.disabled=false;}
}

let corpus=null,corpusPromise=null;
const inFlight=new Map();
function cacheEntry(id,vi,ko,entry){
 if(!entry||!clean(entry.en)||((entry.source==='online'||entry.source==='online-google'||entry.source==='machine')&&suspect(entry.en,vi,ko)))return;
 delete reviewCache[entryKey(vi,ko)];
 try{localStorage.setItem(REVIEW_KEY,JSON.stringify(reviewCache));}catch(e){}
 edits[id]=entry;
 try{localStorage.setItem(STORE,JSON.stringify(edits));}catch(e){}
 const key=entryKey(vi,ko);
 byText[key]=entry;
 try{
  const keys=Object.keys(byText);if(keys.length>400)keys.slice(0,keys.length-400).forEach(k=>delete byText[k]);
  localStorage.setItem(AUTO_STORE,JSON.stringify(byText));
 }catch(e){}
}
function indexCorpus(){
 if(corpus)return Promise.resolve(corpus);
 if(!corpusPromise)corpusPromise=fetch(new URL('lessons.json',document.baseURI),{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw Error('Lesson index unavailable');return r.json();})
  .then(j=>{
   const exact=new Map(),byVi=new Map();
   (j.lessons||[]).forEach(L=>(L.items||[]).forEach(row=>{
    const entry=data&&data[row[0]];
    if(!entry||!clean(entry.en))return;
    exact.set(entryKey(row[3],row[4]),entry);
    const key=normalize(row[3]),previous=byVi.get(key);
    if(!previous)byVi.set(key,entry);
    else if(clean(previous.en)!==clean(entry.en))byVi.set(key,{ambiguous:true});
   }));
   corpus={exact,byVi};return corpus;
  }).catch(()=>{corpus={exact:new Map(),byVi:new Map()};return corpus;});
 return corpusPromise;
}
function cachedMeaning(vi,ko,dict){
 const key=entryKey(vi,ko),text=byText[key];
 if(text&&clean(text.en)&&!suspect(text.en,vi,ko))return text;
 if(text){delete byText[key];try{localStorage.setItem(AUTO_STORE,JSON.stringify(byText));}catch(e){}}
 const exact=dict.exact.get(key);
 if(exact&&!suspect(exact.en,vi,ko))return exact;
 const approx=dict.byVi.get(normalize(vi));
 return approx&&!approx.ambiguous&&!suspect(approx.en,vi,ko)?approx:null;
}
async function onlineTranslation(vi){
 // Read the lesson corpus first. Only genuinely new text needs an online call.
 // MyMemory accepts at most 500 UTF-8 BYTES per request (Vietnamese accents count).
 const text=clean(vi),chunks=[];let rest=text;
 const bytes=s=>new TextEncoder().encode(s).length;
 while(rest){
  if(chunks.length>=16)throw Error('Câu quá dài để tự dịch.');
  let cut=Math.min(360,rest.length);
  while(cut>1&&bytes(rest.slice(0,cut))>460)cut-=Math.max(1,Math.ceil(cut/12));
  if(cut<rest.length){const last=rest.lastIndexOf(' ',cut);if(last>Math.floor(cut/2))cut=last;}
  chunks.push(rest.slice(0,cut));rest=rest.slice(cut).trim();
 }
 async function fromMyMemory(){
  const outputs=[];
  for(const chunk of chunks){
   const url='https://api.mymemory.translated.net/get?langpair=vi%7Cen&q='+encodeURIComponent(chunk);
   const response=await fetch(url,{method:'GET',mode:'cors',cache:'no-store'});
   if(!response.ok)throw Error('MyMemory HTTP '+response.status);
   const result=await response.json();
   const translated=clean(result&&result.responseData&&result.responseData.translatedText);
   if(!translated||Number(result.responseStatus||200)!==200||suspect(translated,chunk,''))throw Error('MyMemory trả về kết quả sai hoặc hết hạn mức.');
   outputs.push(translated);
  }
  return {en:clean(outputs.join(' ')),ipa:'',source:'online'};
 }
 async function fromGoogle(){
  // Unofficial public endpoint: secondary fallback, subject to provider availability.
  const outputs=[];
  for(const chunk of chunks){
   const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q='+encodeURIComponent(chunk);
   const response=await fetch(url,{method:'GET',mode:'cors'});
   if(!response.ok)throw Error('Google Translate HTTP '+response.status);
   const result=await response.json();
   const translated=clean(Array.isArray(result&&result[0])?result[0].map(part=>part&&part[0]||'').join(''):'');
   if(!translated||suspect(translated,chunk,''))throw Error('Google Translate không trả về kết quả đạt kiểm tra.');
   outputs.push(translated);
  }
  return {en:clean(outputs.join(' ')),ipa:'',source:'online-google'};
 }
 let result;
 try{result=await fromMyMemory();}
 catch(firstError){
  try{result=await fromGoogle();}
  catch(secondError){throw Error('MyMemory và dịch vụ dự phòng đều không khả dụng.');}
 }
 if(!clean(result.en)||normalize(result.en)===normalize(text))throw Error('Chưa nhận được bản dịch tiếng Anh khác nội dung gốc.');
 return result;
}
async function resolveAutomatic(id,vi,ko,box){
 if(verifiedEntry(id,vi,ko))return;
 const key=entryKey(vi,ko);
 try{
  const dict=await indexCorpus(),found=cachedMeaning(vi,ko,dict);
  if(found){
   cacheEntry(id,vi,ko,found);
   if(box&&box.isConnected)display(box,found,id,vi,ko);
   return;
  }
  let promise=inFlight.get(key);
  if(!promise){
   promise=onlineTranslation(vi).finally(()=>inFlight.delete(key));
   inFlight.set(key,promise);
  }
  const result=await promise;
  if(suspect(result.en,vi,ko))throw Error('Bản dịch không qua kiểm tra số liệu.');
  cacheEntry(id,vi,ko,result);
  if(box&&box.isConnected)display(box,result,id,vi,ko);
 }catch(e){
  if(box&&box.isConnected&&!clean((edits[id]||{}).en)){
   const status=box.querySelector('.nhi-en-status');
   if(status)status.textContent='Chưa lấy được bản dịch tự động ('+String(e.message||e).slice(0,100)+'). Có thể dùng Dịch lại hoặc Sửa.';
  }
 }
}

function load(){
 if(data && Object.keys(data).length)return Promise.resolve(data);
 if(!once)once=fetch(new URL('english.json',document.baseURI),{cache:'no-cache'}).then(r=>{
  if(!r.ok)throw Error('No English dataset');
  return r.json();
 }).then(j=>{data=j.cards||{};return data;}).catch(()=>{data={};return data;});
 return once;
}
async function speakEnglish(t){
 if(!t)return;
 if(window.NHI_SPEECH)return window.NHI_SPEECH.speak(t,'en-US');
 if(window.NHI_AUDIO){await window.NHI_AUDIO.ready;if(window.NHI_AUDIO.play(t,'en',1))return;}
}

function display(box,entry,id,vi,ko){
 // Cards are constructed off-DOM, then appended; populate immediately.
 // isConnected is false during the first render, even though the box is valid.
 if(!box)return;
 entry=choices[entryKey(vi,ko)]||entry;
 const en=clean(entry&&entry.en),ipa=clean(entry&&entry.ipa);
 const translation=box.querySelector('.nhi-en-translation');translation.textContent=en||'Đang chuẩn bị bản dịch tiếng Anh…';if(en&&window.NHI_STUDY)window.NHI_STUDY.wordElements(translation,en);
 const span=box.querySelector('.nhi-en-ipa');span.textContent=ipa?'/'+ipa.replace(/^\/|\/$/g,'')+'/':'';span.hidden=!ipa;
 const play=box.querySelector('.nhi-en-speak');
 play.hidden=!en;play.onclick=()=>window.NHI_SPEECH?window.NHI_SPEECH.toggle(en,'en-US'):speakEnglish(en);

 box.querySelector('.nhi-en-status').textContent='';
 comparisonRows(box,id,vi,ko);
 var review=box.querySelector('.nhi-en-review');if(review){review.hidden=!en;review.onclick=()=>checkMeaning(box,id,vi,ko);}
 var editBtn=box.querySelector('.nhi-en-edit');if(editBtn)editBtn.onclick=()=>editEnglish(box,id,vi,ko);
}
function editEnglish(box,id,vi,ko) {
  var open=box.querySelector('.nhi-en-edit-form');if(open){open.remove();return;}
  var current=choices[entryKey(vi,ko)] || edits[id] || (data && data[id]) || {};
  var form=document.createElement('form');form.className='nhi-en-edit-form';
  var label=document.createElement('label');label.textContent='Bản dịch tiếng Anh';
  var field=document.createElement('textarea');field.className='field';field.rows=2;field.value=clean(current.en);
  label.appendChild(field);form.appendChild(label);
  var labelIPA=document.createElement('label');labelIPA.textContent='Phiên âm IPA';
  var ipa=document.createElement('input');ipa.className='field';ipa.type='text';ipa.value=clean(current.ipa);
  labelIPA.appendChild(ipa);form.appendChild(labelIPA);
  var actions=document.createElement('div');actions.className='nhi-en-edit-actions';
  var save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Lưu bản dịch';
  var cancel=document.createElement('button');cancel.type='button';cancel.textContent='Hủy';cancel.className='ghost';
  cancel.addEventListener('click',function(){form.remove();});
  actions.appendChild(save);actions.appendChild(cancel);form.appendChild(actions);
  form.addEventListener('submit',function(e){
    e.preventDefault();var en=clean(field.value),reading=clean(ipa.value);
    if(!en){field.focus();return;}
    cacheEntry(id,vi,ko,{en:en,ipa:reading,source:'manual'});
    try{localStorage.setItem(STORE,JSON.stringify(edits));}
    catch(err){box.querySelector('.nhi-en-status').textContent='Không thể lưu thay đổi.';return;}
    delete choices[entryKey(vi,ko)];
    try{localStorage.setItem(CHOICE_KEY,JSON.stringify(choices));}catch(e){}
    form.remove();display(box,edits[id],id,vi,ko);
  });
  box.appendChild(form);field.focus();
}
function mount(parent,id,vi,ko,options){
 if(!parent)return;
 const before=parent.querySelector('.nhi-english-v5');if(before)before.remove();
 const box=document.createElement('section');box.className='nhi-english-v5';box.setAttribute('aria-label','Tiếng Anh');
 box.innerHTML='<div class="nhi-en-head"><strong>EN · Tiếng Anh</strong><span class="nhi-en-head-actions"><button type="button" class="nhi-en-speak" aria-label="Nghe tiếng Anh">🔊 Nghe</button><button type="button" class="nhi-en-edit" aria-label="Chỉnh sửa bản dịch tiếng Anh">✎ Sửa</button></span></div><p class="nhi-en-translation"></p><p class="nhi-en-ipa"></p><p class="nhi-en-status" aria-live="polite"></p><div class="nhi-en-tools"><button type="button" class="nhi-en-review" title="Khi bấm, nội dung tiếng Việt và tiếng Hàn sẽ được gửi đến Google Translate để đối chiếu tự động. Đây không phải kiểm duyệt chuyên gia.">✓ Đối chiếu</button></div>';
 if(options){const label=document.createElement('label');label.className='nhi-en-forgot';const check=document.createElement('input');check.type='checkbox';check.checked=!!options.unremembered;check.onchange=()=>options.toggle(check.checked);label.append(check,document.createTextNode('Chưa nhớ tiếng Anh'));box.querySelector('.nhi-en-tools').append(label);}
 parent.appendChild(box);
 display(box,verifiedEntry(id,vi,ko),id,vi,ko);
 if(!data||!Object.keys(data).length){
  load().then(()=>{display(box,verifiedEntry(id,vi,ko),id,vi,ko);if(!verifiedEntry(id,vi,ko))resolveAutomatic(id,vi,ko,box);});
 }else if(!verifiedEntry(id,vi,ko))resolveAutomatic(id,vi,ko,box);
 return box;
}
window.NHI_ENGLISH={mount,load,speakEnglish};
})();
