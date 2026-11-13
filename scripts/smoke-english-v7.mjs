/* Restore regression: stable English UI with no Gemini/retranslation controls. */
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
 if(!initial.visible||initial.en!==selected.en||!initial.noRetranslate||!initial.noLexical||!initial.audio||!initial.naturalVoice)
  throw Error('English rollback controls fail: '+JSON.stringify(initial));
 await page.evaluate(()=>{
  const native=window.fetch;
  window.fetch=function(url,opts){
   if(String(url).includes('translate.googleapis.com/translate_a/single'))
     return Promise.resolve({ok:true,json:async()=>[[['Comparison-only result']]]});
   return native.apply(this,arguments);
  };
 });
 await page.$eval('.nhi-en-review',b=>b.click());
 await page.waitForFunction(()=>!!document.querySelector('.nhi-en-status')?.textContent.includes('Comparison-only result'),{timeout:5000});
 const after=await page.$eval('.nhi-en-translation',x=>x.textContent);
 if(after!==initial.en)throw Error('Comparison overwrote original translation');
 const labels=await page.$eval('.nhi-en-status',x=>x.textContent);
 if(/CẦN RÀ SOÁT|Vui lòng kiểm tra và sửa nếu cần|Bản dịch tự động, chưa qua kiểm duyệt/.test(labels))
  throw Error('Removed review warning appears');
 if(errors.length)throw Error('Page JS errors '+JSON.stringify(errors.slice(0,8)));
 console.log('RESTORED ENGLISH UI PASSED',JSON.stringify({lesson:selected.lesson,word:initial.en,buttons:initial.buttons,noGeminiControl:initial.noRetranslate,naturalMP3:initial.naturalVoice,originalPreserved:true}));
 await page.close();
}finally{await browser.close();}
