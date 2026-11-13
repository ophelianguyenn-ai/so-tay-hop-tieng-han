/* Browser regression for Nhi UI v5 (no remote API keys). */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const lessons=JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons;
const lesson=lessons.find(x=>(x.items||[]).length>=8);
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const context=await browser.createBrowserContext(),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8765/#/bai/'+lesson.id,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#planBox .ppage',{timeout:16000});
 await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#planBox button')].find(x=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(x.textContent||''));if(!b)throw Error('Lesson start missing');b.click();
 });
 await page.waitForSelector('#planBox .pcard',{timeout:12000});
 const semantic=await page.evaluate(()=>window.NHI_PHRASES_V5?.align(
  {id:'phrase-example',vi:'Vật tư đã đưa vào nhà máy',ko:'공장에 반입된 자재'},
  {}));
 console.log('V5 SEMANTIC PHRASES',JSON.stringify(semantic));
 if(!semantic||semantic.length!==3||!semantic.some(x=>x[0]==='vật tư'&&x[1]==='자재'))
  throw Error('Vietnamese-Korean phrase segmentation missing');
 await page.$eval('#planBox .pflip',b=>b.click());
 await page.waitForSelector('#planBox .pcard .nhi-english-v5',{timeout:6000});
 const english=await page.evaluate(()=>({
  english:!!document.querySelector('.nhi-english-v5'),
  audio:!!document.querySelector('.nhi-en-speak'),
  back:!!document.querySelector('#planBox .pfront .answer.ko')
 }));
 console.log('V5 ENGLISH BACK',JSON.stringify(english));
 if(!english.english||!english.audio||!english.back)throw Error('English module not mounted on back');
 await page.$eval('#planBox .cicons button[title*="Sửa thẻ"]',b=>b.click());
 await page.waitForSelector('#planBox .nhi-editor-close-v5',{timeout:5000});
 await page.$eval('#planBox .nhi-editor-close-v5',b=>b.click());
 await page.waitForFunction(()=>!document.querySelector('#planBox .editbox'),{timeout:5000});
 await page.$eval('#planBox .cicons button[title*="Sửa thẻ"]',b=>b.click());
 await page.waitForSelector('#planBox .editbox',{timeout:5000});
 await page.mouse.click(4,430);
 await page.waitForFunction(()=>!document.querySelector('#planBox .editbox'),{timeout:5000});
 await page.$eval('#aiBtn',b=>b.click());
 await page.waitForFunction(()=>document.body.classList.contains('ai-open'));
 const aiClose=await page.evaluate(()=>({
  x:!!document.querySelector('#aiPanel .aihead > #aiClose'),
  left:document.querySelector('#aiPanel .aihead > #aiClose')?.previousElementSibling===null
 }));
 console.log('V5 AI CLOSE',JSON.stringify(aiClose));
 if(!aiClose.x||!aiClose.left)throw Error('AI close is not at the left of its own panel');
 await page.$eval('#aiClose',b=>b.click());
 await page.waitForFunction(()=>!document.body.classList.contains('ai-open'));
 await page.$eval('#brandFaceBtn',b=>b.click());
 await page.waitForSelector('#cover:not([hidden])',{timeout:5000});
 await page.waitForSelector('#nhi-cover-theme-v5');
 const cover=await page.evaluate(()=>{
  const button=document.querySelector('#nhi-cover-theme-v5'),r=button.getBoundingClientRect();
  return {corner:r.right>=innerWidth-55,rBottom:innerHeight-r.bottom,globalX:!!document.querySelector('#nhi-global-close-v4'),pauseVisible:!!document.querySelector('.garden-control')&&getComputedStyle(document.querySelector('.garden-control')).display!=='none'};
 });
 console.log('V5 COVER',JSON.stringify(cover));
 if(!cover.corner||cover.rBottom>75||cover.globalX||cover.pauseVisible)throw Error('Cover controls not decorative bottom-right');
 await page.$eval('[data-mode="dark"]',b=>b.click());
 if(await page.evaluate(()=>document.documentElement.getAttribute('data-theme'))!=='dark')throw Error('Moon theme failed');
 await page.$eval('#coverGo',b=>b.click());
 await page.$eval('#brandBtn',b=>b.click());
 await page.waitForSelector('#planBox .thero',{timeout:6000});
 if(errors.length)throw Error('Page errors '+JSON.stringify(errors.slice(0,10)));
 console.log('ALL NHI UI V5 BROWSER CHECKS PASSED');
 await page.close();await context.close();
}finally{console.log('V5 JS ERRORS',JSON.stringify(errors));await browser.close();}
