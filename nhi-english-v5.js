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
let corpus=null,corpusPromise=null;
const inFlight=new Map();
function cacheEntry(id,vi,ko,entry){
 if(!entry||!clean(entry.en))return;
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
 const text=byText[entryKey(vi,ko)];
 if(text&&clean(text.en))return text;
 const exact=dict.exact.get(entryKey(vi,ko));
 if(exact)return exact;
 const approx=dict.byVi.get(normalize(vi));
 return approx&&!approx.ambiguous?approx:null;
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
   if(!translated||Number(result.responseStatus||200)!==200)throw Error('MyMemory trả về lỗi hoặc hết hạn mức.');
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
   if(!translated)throw Error('Google Translate không trả về nội dung.');
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
 if(clean((edits[id]||(data&&data[id])||{}).en))return;
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
function speakEnglish(t){
 if(!t||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;
 const msg=new SpeechSynthesisUtterance(t);msg.lang='en-US';msg.rate=.87;
 const voices=speechSynthesis.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang||''));
 voices.sort((a,b)=>Number(/Natural|Google|Premium|Enhanced/i.test(b.name))-Number(/Natural|Google|Premium|Enhanced/i.test(a.name)));
 if(voices[0]){msg.voice=voices[0];msg.lang=voices[0].lang;}
 speechSynthesis.cancel();speechSynthesis.speak(msg);
}
async function translate(id,vi,ko,box){
 const status=box.querySelector('.nhi-en-status'),button=box.querySelector('.nhi-en-translate');
 let config={};try{config=JSON.parse(localStorage.getItem('nlc-ai-v1')||'{}')||{};}catch(e){}
 const key=clean(config.k&&config.k.gemini);
 if(!key){
  button.disabled=true;status.textContent='Đang dịch tự động sang tiếng Anh…';
  try{const entry=await onlineTranslation(vi);cacheEntry(id,vi,ko,entry);display(box,entry,id,vi,ko);}
  catch(e){status.textContent='Không thể dịch tự động: '+String(e.message||e).slice(0,120);}
  finally{button.disabled=false;}
  return;
 }
 button.disabled=true;status.textContent='Đang dịch và tạo phiên âm…';
 try{
  const model=clean(config.m&&config.m.gemini||'gemini-3.5-flash-lite').replace(/^models\//,'');
  const prompt='Translate Vietnamese workplace material into accurate natural English, using Korean as context. Provide English IPA. Return a JSON object only, keys en and ipa. Vietnamese: '+vi+'; Korean: '+ko;
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
   method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},
   body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.1}})
  });
  const answer=await r.json();if(!r.ok)throw Error(answer.error&&answer.error.message||'HTTP '+r.status);
  const raw=(answer.candidates&&answer.candidates[0]&&answer.candidates[0].content&&answer.candidates[0].content.parts||[]).map(p=>p.text||'').join('');
  const parsed=JSON.parse(raw);
  if(!clean(parsed.en))throw Error('Không tìm được bản dịch');
  cacheEntry(id,vi,ko,{en:clean(parsed.en),ipa:clean(parsed.ipa),source:'gemini'});
  display(box,edits[id],id,vi,ko);
 }catch(e){status.textContent='Không thể dịch: '+String(e.message||e).slice(0,140);}
 finally{button.disabled=false;}
}
function display(box,entry,id,vi,ko){
 // Cards are constructed off-DOM, then appended; populate immediately.
 // isConnected is false during the first render, even though the box is valid.
 if(!box)return;
 const en=clean(entry&&entry.en),ipa=clean(entry&&entry.ipa);
 box.querySelector('.nhi-en-translation').textContent=en||'Đang chuẩn bị bản dịch tiếng Anh…';
 const span=box.querySelector('.nhi-en-ipa');span.textContent=ipa?'/'+ipa.replace(/^\/|\/$/g,'')+'/':'';span.hidden=!ipa;
 const play=box.querySelector('.nhi-en-speak'),generate=box.querySelector('.nhi-en-translate');
 play.hidden=!en;play.onclick=()=>speakEnglish(en);
 generate.hidden=false;generate.textContent=en?'↻ Dịch lại tiếng Anh':'Dịch lại tự động';generate.onclick=()=>translate(id,vi,ko,box);
 box.querySelector('.nhi-en-status').textContent=en&&(entry.source==='machine'||entry.source==='online'||entry.source==='online-google')?'Bản dịch tự động chưa kiểm duyệt'+(entry.source==='online'?' · từ MyMemory':entry.source==='online-google'?' · từ Google Translate':'')+(entry.source==='online'||entry.source==='online-google'?' · nội dung tiếng Việt được gửi đến dịch vụ dịch':'')+' · hãy kiểm tra thuật ngữ và số liệu':(entry&&entry.source==='manual'?'Đã sửa thủ công trên thiết bị này':'');var editBtn=box.querySelector('.nhi-en-edit');if(editBtn)editBtn.onclick=()=>editEnglish(box,id,vi,ko);
}
function editEnglish(box,id,vi,ko) {
  var open=box.querySelector('.nhi-en-edit-form');if(open){open.remove();return;}
  var current=edits[id] || (data && data[id]) || {};
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
    form.remove();display(box,edits[id],id,vi,ko);
  });
  box.appendChild(form);field.focus();
}
function mount(parent,id,vi,ko){
 if(!parent)return;
 const before=parent.querySelector('.nhi-english-v5');if(before)before.remove();
 const box=document.createElement('section');box.className='nhi-english-v5';box.setAttribute('aria-label','Tiếng Anh');
 box.innerHTML='<div class="nhi-en-head"><strong>EN · Tiếng Anh</strong><span class="nhi-en-head-actions"><button type="button" class="nhi-en-speak" aria-label="Nghe tiếng Anh">🔊 Nghe</button><button type="button" class="nhi-en-edit" aria-label="Chỉnh sửa bản dịch tiếng Anh">✎ Sửa</button></span></div><p class="nhi-en-translation"></p><p class="nhi-en-ipa"></p><p class="nhi-en-status" aria-live="polite"></p><button type="button" class="nhi-en-translate">Dịch tiếng Anh</button>';
 parent.appendChild(box);
 display(box,edits[id]||(data&&data[id]),id,vi,ko);
 if(!data||!Object.keys(data).length){
  load().then(()=>{display(box,edits[id]||(data&&data[id]),id,vi,ko);if(!edits[id]&&!(data&&data[id]))resolveAutomatic(id,vi,ko,box);});
 }else if(!edits[id]&&!(data&&data[id]))resolveAutomatic(id,vi,ko,box);
 return box;
}
window.NHI_ENGLISH={mount,load,speakEnglish};
})();