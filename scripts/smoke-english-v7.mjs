/* Compact comparison, original preservation, serif typography and no-device Neural regression. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const lessons=JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons;
const manifest=JSON.parse(fs.readFileSync('audio-manifest.json','utf8'));
const prefix='window.NHI_ENGLISH_PRELOADED=';
const data=JSON.parse(fs.readFileSync('nhi-english-data-v6.js','utf8').split(prefix,2)[1].trim().replace(/;\s*$/,''));
let selected;
for(const lesson of lessons){
 const first=(lesson.items||[])[0];if(!first)continue;
 const entry=data[first[0]];
 if(entry&&entry.en&&manifest['en|'+entry.en]){selected={lesson:lesson.id,id:first[0],en:entry.en};break;}
}
if(!selected)throw Error('Missing stable English MP3 sample');
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const page=await browser.newPage();
 await page.evaluateOnNewDocument(()=>{try{localStorage.setItem('nlc-prefs-v1',JSON.stringify({fx:false}));}catch(e){}});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.evaluate(arg=>{
  localStorage.setItem('nhi-english-edits-v5',JSON.stringify({[arg.id]:{en:arg.en,ipa:'',source:'manual'}}));
 },selected);
 await page.goto('http://127.0.0.1:8765/#/bai/'+selected.lesson,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#planBox .ppage',{timeout:16000});
 await page.evaluate(()=>{
  const button=[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||''));
  if(!button)throw Error('Cannot start flashcards');button.click();
 });
 await page.waitForSelector('#planBox .pcard',{timeout:12000});
 await page.$eval('#planBox .pflip',b=>b.click());
 await page.waitForSelector('.nhi-english-v5',{timeout:6500});
 await page.evaluate(async()=>{if(window.NHI_AUDIO?.ready)await window.NHI_AUDIO.ready;});
 const initial=await page.evaluate(()=>({
  en:document.querySelector('.nhi-en-translation')?.textContent,
  visible:!!document.querySelector('.nhi-en-translation'),
  buttons:[...document.querySelectorAll('.nhi-english-v5 button')].map(x=>x.textContent),
  noRetranslate:!document.querySelector('.nhi-en-translate'),
  noLexical:!document.querySelector('.nhi-en-syn')&&!document.querySelector('.nhi-en-ant'),
  audio:!!document.querySelector('.nhi-en-speak'),
  naturalVoice:!!window.NHI_AUDIO?.urlFor?.(document.querySelector('.nhi-en-translation')?.textContent,'en')
 }));
 if(!initial.visible||!initial.en||!initial.noRetranslate||!initial.noLexical||!initial.audio||!initial.naturalVoice)
  throw Error('English rollback controls fail: '+JSON.stringify(initial));
 await page.evaluate(()=>{
  const native=window.fetch;
  window.fetch=function(url,opts){
   if(String(url).includes('translate.googleapis.com/translate_a/single'))
     return Promise.resolve({ok:true,json:async()=>[[[String(url).includes('sl=vi')?'Final approval has been given':'Final approval has been received']]]});
   if(String(url).includes('api.dictionaryapi.dev'))return Promise.resolve({ok:true,json:async()=>[{meanings:[{synonyms:['authorization'],antonyms:['disapproval'],definitions:[]}]}]});
   return native.apply(this,arguments);
  };
 });
 await page.$eval('.nhi-en-review',b=>b.click());
 await page.waitForFunction(()=>document.querySelectorAll('.nhi-en-choice').length===2,{timeout:5000});
 const after=await page.$eval('.nhi-en-translation',x=>x.textContent);
 if(after!==initial.en)throw Error('Comparison overwrote original translation');
 await page.$eval('.nhi-en-choice:nth-child(2) input',b=>b.click());
 if(await page.$eval('.nhi-en-translation',x=>x.textContent)!=='Final approval has been received')throw Error('Korean alternative not selected');
 if(!await page.$eval('.nhi-en-ipa',x=>x.hidden))throw Error('Old IPA kept for a new translation');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForSelector('#planBox .ppage',{timeout:16000});
 await page.evaluate(()=>[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||''))?.click());
 await page.waitForSelector('#planBox .pflip');await page.$eval('#planBox .pflip',b=>b.click());
 await page.waitForSelector('.nhi-en-original');
 if(await page.$eval('.nhi-en-translation',x=>x.textContent)!=='Final approval has been received')throw Error('Selection not retained on reload');
 await page.$eval('.nhi-en-choice:first-child input',b=>b.click());
 if(await page.$eval('.nhi-en-translation',x=>x.textContent)!=='Final approval has been given')throw Error('Vietnamese alternative not selected');
 await page.$eval('.nhi-en-original',b=>b.click());
 if(await page.$eval('.nhi-en-translation',x=>x.textContent)!==initial.en)throw Error('Original not restored');
 const appearance=await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('.nhi-en-choice')];
  return {serif:getComputedStyle(document.body).fontFamily.includes('Times New Roman'),
   plain:rows.length===2&&rows.every(row=>{const css=getComputedStyle(row);return css.backgroundColor==='rgba(0, 0, 0, 0)'&&css.borderTopWidth==='0px'&&css.boxShadow==='none';})};
 });
 if(appearance.serif||!appearance.plain)throw Error('Sans Vietnamese or plain comparison styling missing: '+JSON.stringify(appearance));
 const noDevice=await page.evaluate(async text=>{
  const old=speechSynthesis.getVoices;speechSynthesis.getVoices=()=>[];speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  const selectors=['voiceKo','voiceVi','voiceEn'].every(id=>!document.getElementById(id).disabled&&document.getElementById(id).options[0].textContent.includes('Neural'));
  const play=NHI_AUDIO.play;let called=false;NHI_AUDIO.play=function(t,l){called=t===text&&l==='en-US';return true;};
  try{await NHI_ENGLISH.speakEnglish(text);}finally{NHI_AUDIO.play=play;speechSynthesis.getVoices=old;}
  return selectors&&called;
 },initial.en);
 if(!noDevice)throw Error('Neural unavailable without installed voices');
 if(errors.length)throw Error('Page JS errors '+JSON.stringify(errors.slice(0,8)));
 console.log('RESTORED ENGLISH UI PASSED',JSON.stringify({lesson:selected.lesson,word:initial.en,buttons:initial.buttons,noGeminiControl:initial.noRetranslate,naturalMP3:initial.naturalVoice,originalPreserved:true}));
 await page.close();
}finally{await browser.close();}

