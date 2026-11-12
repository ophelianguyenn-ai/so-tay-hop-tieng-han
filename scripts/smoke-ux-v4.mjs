/* Nhi UI v4 regression: mobile layout, reverse-side text, theme, close, calendar neck. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const lesson=JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons.find(x=>x.items?.length>=4);
if(!lesson)throw Error('No test lesson');
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
  const context=await browser.createBrowserContext(),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/#/bai/'+lesson.id,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#planBox .ppage',{timeout:18000});
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||''));
    if(!b)throw Error('Missing lesson start');b.click();
  });
  await page.waitForSelector('#planBox .pcard',{timeout:12000});
  await page.$eval('#planBox .prate .hard',b=>b.click());
  await page.waitForSelector('#planBox .pcard.nhi-mascot-active .pfront #nhi-hard-mascot',{timeout:7000});
  const front=await page.evaluate(()=>{
    const c=document.querySelector('#planBox .pcard'),m=c.querySelector('#nhi-hard-mascot'),p=c.querySelector('.pfront .prompt');
    const r=m.getBoundingClientRect(),t=p.getBoundingClientRect();
    const overlap=Math.max(0,Math.min(r.right,t.right)-Math.max(r.left,t.left))*Math.max(0,Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top));
    return {inside:m.parentElement.classList.contains('pfront'),position:getComputedStyle(m).position,overlap,mascotRight:r.right,textLeft:t.left};
  });
  console.log('NHI V4 FRONT',JSON.stringify(front));
  if(!front.inside||front.position!=='absolute'||front.overlap>1||front.mascotRight>front.textLeft+1)throw Error('Nhi overlaps front');
  await page.$eval('#planBox .pflip',b=>b.click());
  await page.waitForSelector('#planBox .pcard.nhi-mascot-active .pfront .answer.ko',{timeout:7000});
  const back=await page.evaluate(()=>{
    const c=document.querySelector('#planBox .pcard'),m=c.querySelector('#nhi-hard-mascot'),a=c.querySelector('.pfront .answer.ko');
    return {right:m.getBoundingClientRect().right,left:a.getBoundingClientRect().left,text:a.textContent.trim(),notes:c.querySelectorAll(':scope > .listinfo').length};
  });
  console.log('NHI V4 KOREAN',JSON.stringify(back));
  if(back.right>back.left+1||!back.text||back.notes)throw Error('Nhi overlaps Korean or note leaked');
  await page.$eval('#planBox .pnav .parrow:last-child',b=>b.click());
  const animation=await page.evaluate(()=>document.querySelector('#planBox .pcard')?.getAnimations().map(a=>a.effect?.getTiming?.().duration)||[]);
  console.log('NHI V4 NAVIGATION',JSON.stringify(animation));
  if(!animation.some(n=>Number(n)>=550))throw Error('Directional animation missing');
  await page.$eval('#brandBtn',b=>b.click());
  await page.waitForSelector('#cover:not([hidden])',{timeout:3000});
  await page.waitForSelector('#nhi-cover-theme-v4');
  await page.$eval('[data-nhi-theme="dark"]',b=>b.click());
  if(await page.evaluate(()=>document.documentElement.getAttribute('data-theme'))!=='dark')throw Error('Moon failed');
  await page.$eval('[data-nhi-theme="light"]',b=>b.click());
  if(await page.evaluate(()=>document.documentElement.getAttribute('data-theme'))!=='light')throw Error('Sun failed');
  await page.waitForSelector('#nhi-global-close-v4:not([hidden])',{timeout:3000});
  await page.$eval('#nhi-global-close-v4',b=>b.click());
  const closed=await page.evaluate(()=>document.querySelector('#cover').hidden||document.querySelector('#cover').classList.contains('leave'));
  if(!closed)throw Error('Cover close failed');
  const calendar=await page.evaluate(()=>{
    document.querySelector('#tab-plan')?.click();
    const girl=document.querySelector('.nhi-calendar-hero .nhi-calendar-girl svg');
    return {girl:!!girl,neck:!!girl?.querySelector('[data-nhi-neck]')};
  });
  console.log('NHI V4 CALENDAR',JSON.stringify(calendar));
  if(!calendar.girl||!calendar.neck)throw Error('Calendar neck missing');
  if(errors.length)throw Error('Page errors '+JSON.stringify(errors.slice(0,10)));
  console.log('ALL NHI UI V4 BROWSER CHECKS PASSED');
  await page.close();await context.close();
}finally{console.log('NHI V4 ERRORS',JSON.stringify(errors.slice(0,10)));await browser.close();}
