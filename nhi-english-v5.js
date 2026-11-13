/* English meaning, IPA and English speech for Nhi cards. */
(function(){
'use strict';
const STORE='nhi-english-edits-v5';
let edits={};try{edits=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(e){}
let data=null,once=null;
const clean=s=>String(s||'').trim();
function load(){
 if(!once)once=fetch('english.json',{cache:'no-cache'}).then(r=>{
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
 if(!key){status.textContent='Hãy cấu hình API key Gemini trong cửa sổ AI trước.';return;}
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
  edits[id]={en:clean(parsed.en),ipa:clean(parsed.ipa),source:'gemini'};
  localStorage.setItem(STORE,JSON.stringify(edits));display(box,edits[id],id,vi,ko);
 }catch(e){status.textContent='Không thể dịch: '+String(e.message||e).slice(0,140);}
 finally{button.disabled=false;}
}
function display(box,entry,id,vi,ko){
 if(!box.isConnected)return;
 const en=clean(entry&&entry.en),ipa=clean(entry&&entry.ipa);
 box.querySelector('.nhi-en-translation').textContent=en||'Chưa có bản dịch tiếng Anh';
 const span=box.querySelector('.nhi-en-ipa');span.textContent=ipa?'/'+ipa.replace(/^\/|\/$/g,'')+'/':'';span.hidden=!ipa;
 const play=box.querySelector('.nhi-en-speak'),generate=box.querySelector('.nhi-en-translate');
 play.hidden=!en;play.onclick=()=>speakEnglish(en);
 generate.hidden=false;generate.textContent=en?'↻ Dịch lại bằng Gemini':'Dịch tiếng Anh';generate.onclick=()=>translate(id,vi,ko,box);
 box.querySelector('.nhi-en-status').textContent=en&&entry.source==='machine'?'Bản dịch tự động chưa kiểm duyệt · hãy đối chiếu thuật ngữ, tên riêng và số liệu':(entry&&entry.source==='manual'?'Đã sửa thủ công trên thiết bị này':'');var editBtn=box.querySelector('.nhi-en-edit');if(editBtn)editBtn.onclick=()=>editEnglish(box,id,vi,ko);
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
    edits[id]={en:en,ipa:reading,source:'manual'};
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
 load().then(()=>display(box,edits[id]||(data&&data[id]),id,vi,ko));
 return box;
}
window.NHI_ENGLISH={mount,load,speakEnglish};
})();