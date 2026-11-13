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
async function checkMeaning(box,id,vi,ko){
 // Side-by-side context only: NEVER replace/edit the card's original English.
 const status=box.querySelector('.nhi-en-status'),btn=box.querySelector('.nhi-en-review');
 const panel=box.querySelector('.nhi-en-compare-panel');
 const original=clean(box.querySelector('.nhi-en-translation').textContent);
 btn.disabled=true;status.textContent='Đang đối chiếu tiếng Việt và tiếng Hàn…';
 try{
  const results=await Promise.all([independentTranslation(vi,'vi'),independentTranslation(ko,'ko')]);
  if(!box.isConnected)return;
  panel.replaceChildren();
  const heading=document.createElement('strong');heading.textContent='Đối chiếu nghĩa (tham khảo)';panel.appendChild(heading);
  [['Từ gốc đang học',original],['Dịch từ tiếng Việt',results[0]],['Dịch từ tiếng Hàn',results[1]]].forEach(pair=>{
   const p=document.createElement('p'),strong=document.createElement('b');
   strong.textContent=pair[0]+': ';p.appendChild(strong);p.appendChild(document.createTextNode(pair[1]||'Không có kết quả.'));
   panel.appendChild(p);
  });
  const back=document.createElement('button');back.type='button';back.className='nhi-en-compare-back';
  back.textContent='↩ Trở về từ gốc';back.onclick=()=>{
   panel.hidden=true;status.textContent='';
   // .nhi-en-translation was never touched.
  };
  panel.appendChild(back);panel.hidden=false;
  status.textContent='';
 }catch(e){status.textContent='Chưa đối chiếu được. Bản dịch gốc vẫn được giữ nguyên.';}
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
function configuredGemini(){
 let config={};try{config=JSON.parse(localStorage.getItem('nlc-ai-v1')||'{}')||{};}catch(e){}
 return {key:clean(config.k&&config.k.gemini),model:clean(config.m&&config.m.gemini||'gemini-2.5-flash-lite').replace(/^models\//,'')};
}
async function geminiEnglish(vi,ko){
 const {key,model}=configuredGemini();if(!key)throw Error('Chưa cấu hình Gemini API.');
 const prompt='Translate to idiomatic, precise workplace English. Use the Vietnamese source as primary and the Korean source to disambiguate technical meaning. Retain numbers, equipment IDs, measurements and units EXACTLY. Do not invent terms. Output ONLY JSON with keys en and ipa (IPA may be empty). Vietnamese: '+vi+' \n Korean context: '+ko;
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{
  method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},
  body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0}})
 });
 const body=await r.json();if(!r.ok)throw Error((body.error&&body.error.message)||'Gemini HTTP '+r.status);
 const raw=(body.candidates&&body.candidates[0]&&body.candidates[0].content&&body.candidates[0].content.parts||[]).map(p=>p.text||'').join('');
 const parsed=JSON.parse(raw);
 if(!parsed.en||suspect(parsed.en,vi,ko))throw Error('Kết quả chưa đạt kiểm tra thuật ngữ hoặc số liệu.');
 return {en:clean(parsed.en),ipa:clean(parsed.ipa),source:'gemini'};
}
async function onlineTranslation(vi,ko){
 // Use official Gemini when configured. Do NOT send material to MyMemory.
 const config=configuredGemini();
 if(config.key)return geminiEnglish(vi,ko);
 // Public Google Translate web endpoint is a best-effort fallback, not an
 // authenticated Google Cloud Translation API and may change independently.
 const text=clean(vi),chunks=[];let rest=text;
 const bytes=s=>new TextEncoder().encode(s).length;
 while(rest){
  if(chunks.length>=16)throw Error('Câu quá dài để dịch.');
  let cut=Math.min(360,rest.length);
  while(cut>1&&bytes(rest.slice(0,cut))>460)cut-=Math.max(1,Math.ceil(cut/12));
  if(cut<rest.length){const last=rest.lastIndexOf(' ',cut);if(last>cut/2)cut=last;}
  chunks.push(rest.slice(0,cut));rest=rest.slice(cut).trim();
 }
 const output=[];
 for(const chunk of chunks){
  const url='https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q='+encodeURIComponent(chunk);
  const response=await fetch(url,{mode:'cors',cache:'no-store'});
  if(!response.ok)throw Error('Dịch vụ dịch đang bận.');
  const result=await response.json();
  const translated=clean(Array.isArray(result&&result[0])?result[0].map(part=>part&&part[0]||'').join(''):'');
  if(!translated||suspect(translated,chunk,''))throw Error('Không nhận được bản dịch phù hợp.');
  output.push(translated);
 }
 const en=clean(output.join(' '));
 if(!en||normalize(en)===normalize(text)||suspect(en,vi,ko))throw Error('Bản dịch cần kiểm tra lại.');
 return {en,ipa:'',source:'online-google'};
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
   promise=onlineTranslation(vi,ko).finally(()=>inFlight.delete(key));
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
 // Prefer actual downloadable neural MP3 whenever recorded in the English manifest.
 if(window.NHI_AUDIO){
  try{
   if(window.NHI_AUDIO.ready)await window.NHI_AUDIO.ready;
   if(window.NHI_AUDIO.play(t,'en',1))return;
  }catch(e){}
 }
 if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;
 const msg=new SpeechSynthesisUtterance(t);msg.lang='en-US';msg.rate=.92;msg.pitch=1.02;
 const voices=speechSynthesis.getVoices().filter(v=>/^en(?:-|$)/i.test(v.lang||''));
 voices.sort((a,b)=>{
  const weight=v=>(/Natural|Premium|Neural|Enhanced/i.test(v.name)?4:0)+(/Microsoft|Google/i.test(v.name)?2:0)+(/en-US/i.test(v.lang)?1:0);
  return weight(b)-weight(a);
 });
 if(voices[0]){msg.voice=voices[0];msg.lang=voices[0].lang;}
 speechSynthesis.cancel();speechSynthesis.speak(msg);
}
async function translate(id,vi,ko,box){
 const status=box.querySelector('.nhi-en-status'),button=box.querySelector('.nhi-en-translate');
 button.disabled=true;status.textContent='Đang tạo bản dịch tiếng Anh…';
 try{
  const entry=await onlineTranslation(vi,ko);
  cacheEntry(id,vi,ko,entry);
  if(!edits[id])throw Error('Bản dịch không vượt qua kiểm tra chất lượng.');
  display(box,edits[id],id,vi,ko);
 }catch(e){status.textContent='Chưa thể cập nhật bản dịch: '+String(e.message||e).slice(0,130);}
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
 box.querySelector('.nhi-en-status').textContent='';
 const panel=box.querySelector('.nhi-en-compare-panel');if(panel){panel.hidden=true;panel.replaceChildren();}
 const lex=box.querySelector('.nhi-en-lex-panel');if(lex){lex.hidden=true;}
 var review=box.querySelector('.nhi-en-review');if(review){review.hidden=!en;review.onclick=()=>checkMeaning(box,id,vi,ko);}
 box.querySelector('.nhi-en-syn').onclick=()=>openLexical(box,'syn',en);
 box.querySelector('.nhi-en-ant').onclick=()=>openLexical(box,'ant',en);
 box.querySelector('.nhi-en-syn').hidden=!en;
 box.querySelector('.nhi-en-ant').hidden=!en;
 var editBtn=box.querySelector('.nhi-en-edit');if(editBtn)editBtn.onclick=()=>editEnglish(box,id,vi,ko);
}
const lexicalStop=new Set('a an and as at be been by for from in into is it of on or our that the their this to was were will with you your we i my are very have has had if not do did does can should must one two three some any all each'.split(' '));
const lexCache=new Map();
function selectLexicalWord(box,en){
 try{
  const sel=window.getSelection&&window.getSelection();
  const chosen=clean(sel&&sel.toString());
  if(chosen&&chosen.length<50&&/^[a-z]+(?:[- ][a-z]+)?$/i.test(chosen)&&box.contains(sel.anchorNode))
   return chosen.toLowerCase();
 }catch(e){}
 const chunks=(en.toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g)||[]).filter(w=>w.length>=3&&!lexicalStop.has(w));
 return chunks[0]||'';
}
async function lexicalQuery(word,kind){
 const key=kind+'|'+word;
 if(lexCache.has(key))return lexCache.get(key);
 // Datamuse's rel_syn / rel_ant results are drawn from WordNet lexical sets.
 const url='https://api.datamuse.com/words?'+(kind==='syn'?'rel_syn':'rel_ant')+'='+encodeURIComponent(word)+'&max=8';
 const res=await fetch(url,{cache:'force-cache'});
 if(!res.ok)throw Error('Không tải được từ điển.');
 const data=await res.json();
 const words=(Array.isArray(data)?data:[]).map(row=>clean(row.word)).filter(Boolean).slice(0,8);
 lexCache.set(key,words);return words;
}
function openLexical(box,kind,en){
 const panel=box.querySelector('.nhi-en-lex-panel');panel.replaceChildren();panel.hidden=false;
 const form=document.createElement('form');form.className='nhi-en-lex-form';
 const label=document.createElement('label');label.textContent='Tra từ tiếng Anh: ';
 const input=document.createElement('input');input.type='text';input.autocomplete='off';input.maxLength=55;
 input.value=selectLexicalWord(box,en);input.setAttribute('aria-label','Từ tiếng Anh cần tra đồng nghĩa hoặc trái nghĩa');
 const go=document.createElement('button');go.type='submit';go.textContent='Tra';
 label.appendChild(input);form.appendChild(label);form.appendChild(go);panel.appendChild(form);
 const body=document.createElement('p');body.className='nhi-en-lex-results';body.textContent='Đang tra…';panel.appendChild(body);
 const source=document.createElement('small');source.textContent='Nguồn: Datamuse / WordNet · chỉ tham khảo theo nghĩa của từ, không thay thế bản dịch gốc.';panel.appendChild(source);
 const close=document.createElement('button');close.type='button';close.className='nhi-en-lex-close';close.textContent='× Đóng';close.onclick=()=>{panel.hidden=true};panel.appendChild(close);
 let request=0;
 const run=async()=>{
  const token=++request,word=clean(input.value).toLowerCase();
  if(!/^[a-z]+(?:[- ][a-z]+)?$/i.test(word)){body.textContent='Hãy nhập một từ tiếng Anh.';return;}
  body.textContent='Đang tìm '+(kind==='syn'?'từ đồng nghĩa':'từ trái nghĩa')+'…';go.disabled=true;
  try{
   const words=await lexicalQuery(word,kind);
   if(token!==request||!panel.isConnected)return;
   body.textContent=words.length?words.join(' · '):'Chưa tìm thấy kết quả phù hợp với từ này.';
  }catch(e){if(token===request)body.textContent='Không kết nối được từ điển. Hãy thử lại.';}
  finally{go.disabled=false;}
 };
 form.addEventListener('submit',e=>{e.preventDefault();run();});
 run();
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
 box.innerHTML='<div class="nhi-en-head"><strong>EN · Tiếng Anh</strong><span class="nhi-en-head-actions"><button type="button" class="nhi-en-speak" aria-label="Nghe tiếng Anh giọng tự nhiên">🔊 Nghe</button><button type="button" class="nhi-en-edit" aria-label="Chỉnh sửa bản dịch tiếng Anh">✎ Sửa</button></span></div><p class="nhi-en-translation"></p><p class="nhi-en-ipa"></p><div class="nhi-en-mini-actions"><button type="button" class="nhi-en-syn" title="Xem từ đồng nghĩa. Chọn một từ tiếng Anh trong câu trước khi bấm nếu cần.">≈ Đồng nghĩa</button><button type="button" class="nhi-en-ant" title="Xem từ trái nghĩa. Chọn một từ tiếng Anh trong câu trước khi bấm nếu cần.">↔ Trái nghĩa</button></div><div class="nhi-en-lex-panel" hidden></div><div class="nhi-en-compare-panel" hidden></div><p class="nhi-en-status" aria-live="polite"></p><div class="nhi-en-tools"><button type="button" class="nhi-en-review" title="Chỉ hiển thị bản đối chiếu riêng, không thay đổi nghĩa gốc">✓ Đối chiếu Việt–Hàn</button><button type="button" class="nhi-en-translate">Dịch tiếng Anh</button></div>';
 parent.appendChild(box);
 display(box,verifiedEntry(id,vi,ko),id,vi,ko);
 if(!data||!Object.keys(data).length){
  load().then(()=>{display(box,verifiedEntry(id,vi,ko),id,vi,ko);if(!verifiedEntry(id,vi,ko))resolveAutomatic(id,vi,ko,box);});
 }else if(!verifiedEntry(id,vi,ko))resolveAutomatic(id,vi,ko,box);
 return box;
}
window.NHI_ENGLISH={mount,load,speakEnglish};
})();