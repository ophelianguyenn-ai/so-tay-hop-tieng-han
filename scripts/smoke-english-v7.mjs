/* Regression: EN comparison never replaces the original; synonyms/antonyms
   are separate lookups, and neural audio is available for recorded phrases. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const lessons=JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons;
const manifest=JSON.parse(fs.readFileSync('audio-manifest.json','utf8'));
const preloadFile=fs.readFileSync('nhi-english-data-v6.js','utf8');
const marker='window.NHI_ENGLISH_PRELOADED=';
const preloaded=JSON.parse(preloadFile.split(marker,2)[1].trim().replace(/;\s*$/,''));
let chosen;
for(const lesson of lessons){
 const item=(lesson.items||[])[0];
 if(!item)continue;
 const en=preloaded[item[0]]?.en;
 if(en&&manifest['en|'+en]){chosen={lessonId:lesson.id,id:item[0],en};break;}
}
if(!chosen)throw Error('No lesson card with recorded English neural MP3 found');
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.evaluate(({id,en})=>{
  localStorage.setItem('nhi-english-edits-v5',JSON.stringify({[id]:{en,ipa:'',source:'manual'}}));
 },chosen);
 await page.goto('http://127.0.0.1:8765/#/bai/'+chosen.lessonId,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#planBox .ppage',{timeout:16000});
 await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#planBox button')].find(x=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(x.textContent||''));
  if(!b)throw Error('Cannot start daily flashcards');b.click();
 });
 await page.waitForSelector('#planBox .pcard',{timeout:12000});
 await page.$eval('#planBox .pflip',b=>b.click());
 await page.waitForSelector('#planBox .pcard .nhi-english-v5',{timeout:6500});
 const baseline=await page.$eval('.nhi-en-translation',el=>el.textContent);
 if(!baseline)throw Error('Original translation not displayed');
 await page.evaluate(()=>{
  const oldFetch=window.fetch;
  window.fetch=function(url,options){
   const s=String(url);
   if(s.includes('translate.googleapis.com/translate_a/single'))
    return Promise.resolve({ok:true,json:async()=>[[['Separate comparison only']]]});
   if(s.includes('api.datamuse.com/words?')){
    return Promise.resolve({ok:true,json:async()=>s.includes('rel_syn=')?[{word:'operate'},{word:'function'}]:[{word:'stop'},{word:'cease'}]});
   }
   return oldFetch.apply(this,arguments);
  };
 });
 await page.$eval('.nhi-en-review',b=>b.click());
 await page.waitForFunction(()=>{const p=document.querySelector('.nhi-en-compare-panel');return p&&!p.hidden;},{timeout:5000});
 let compared=await page.evaluate(()=>({
  en:document.querySelector('.nhi-en-translation')?.textContent,
  panel:document.querySelector('.nhi-en-compare-panel')?.textContent,
  original:document.querySelector('.nhi-en-compare-panel')?.textContent.includes('Từ gốc đang học')
 }));
 if(compared.en!==baseline||!compared.original||!compared.panel.includes('Separate comparison only'))
  throw Error('Comparison changed original English or failed to display reference');
 await page.$eval('.nhi-en-compare-back',b=>b.click());
 const restored=await page.evaluate(()=>({
  en:document.querySelector('.nhi-en-translation')?.textContent,
  hidden:document.querySelector('.nhi-en-compare-panel')?.hidden
 }));
 if(restored.en!==baseline||!restored.hidden)
  throw Error('Closing comparison did not preserve the original');
 await page.$eval('.nhi-en-syn',b=>b.click());
 await page.waitForFunction(()=>document.querySelector('.nhi-en-lex-results')?.textContent.includes('operate'),{timeout:5000});
 let still=await page.$eval('.nhi-en-translation',x=>x.textContent);
 if(still!==baseline)throw Error('Synonym lookup replaced original English text');
 await page.$eval('.nhi-en-ant',b=>b.click());
 await page.waitForFunction(()=>document.querySelector('.nhi-en-lex-results')?.textContent.includes('stop'),{timeout:5000});
 still=await page.$eval('.nhi-en-translation',x=>x.textContent);
 if(still!==baseline)throw Error('Antonym lookup replaced original English text');
 await page.waitForSelector('.nhi-en-download:not([hidden])',{timeout:15000});
 const download=await page.$eval('.nhi-en-download',b=>({visible:!b.hidden,label:b.getAttribute('aria-label')}));
 const warning=await page.$eval('.nhi-en-status',x=>x.textContent||'');
 if(/CẦN RÀ SOÁT|Bản dịch tự động, chưa qua|Vui lòng kiểm tra và sửa nếu cần/.test(warning))
  throw Error('Removed warning appears');
 if(errors.length)throw Error('Unexpected JS errors: '+JSON.stringify(errors));
 console.log('ENGLISH UI REGRESSION PASSED',JSON.stringify({lesson:chosen.lessonId,word:baseline,comparisonStable:restored.en===baseline,synonymStable:true,antonymStable:true,download,warningAbsent:true}));
 await page.close();
}finally{await browser.close();}
