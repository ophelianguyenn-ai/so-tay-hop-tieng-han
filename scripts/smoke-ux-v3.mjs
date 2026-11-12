/* Browser UX checks: mobile Nhi placement, rating feedback, transition timing, lesson fireworks. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const lesson = JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons.find(x=>x.items?.length>=3);
if (!lesson) throw new Error('No suitable lesson');
const browser=await puppeteer.launch({
  headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
});
const errors=[];
function watch(page,label){
  page.on('pageerror', e=>errors.push(label+': '+String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(label+': '+m.text());});
}
async function lessonStart(page){
  await page.goto('http://127.0.0.1:8765/#/bai/'+lesson.id,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#planBox .ppage',{timeout:18000});
  await page.evaluate(()=>{
    var b=[...document.querySelectorAll('#planBox button')].find(x=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(x.textContent||''));
    if(!b)throw Error('Lesson start missing');
    b.click();
  });
  await page.waitForSelector('#planBox .pcard',{timeout:10000});
}
try {
  const mobileContext=await browser.createBrowserContext();
  const mobile=await mobileContext.newPage();watch(mobile,'mobile-390');
  await mobile.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await lessonStart(mobile);
  const pressed=await mobile.evaluate(()=>{
    const card=document.querySelector('#planBox .pcard');
    const phrase=card.querySelector('.pfront .prompt');
    const before=getComputedStyle(phrase).color;
    const action=card.querySelector('.prate .hard');
    action.click();
    const after=getComputedStyle(phrase).color;
    return {busy:card.classList.contains('nhi-rating-busy'),hard:card.classList.contains('nhi-rate-hard'),
      before,after,button:getComputedStyle(action).backgroundColor};
  });
  console.log('MOBILE HARD FEEDBACK',JSON.stringify(pressed));
  if(!pressed.busy||!pressed.hard||pressed.before===pressed.after)
    throw Error('Hard rating did not recolor learning text before advance');
  await mobile.waitForFunction(()=>document.querySelector('#planBox .counter')?.textContent.startsWith('2 /'),{timeout:7000});
  const mascot=await mobile.evaluate(()=>{
    const root=document.querySelector('#nhi-hard-mascot'),card=document.querySelector('#planBox .pcard');
    if(!root||!card)return null;
    const a=root.getBoundingClientRect(),p=card.querySelector('.pfront .prompt'),b=p.getBoundingClientRect();
    // Either layout is supported: Nhi below the text (v3) or in a reserved left gutter (v4).
    const overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
      Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
    return {parent:card.contains(root),position:getComputedStyle(root).position,
      width:a.width,imgWidth:root.querySelector('img').getBoundingClientRect().width,
      top:a.top,textLeft:b.left,mascotRight:a.right,overlap,
      buttons:root.querySelectorAll('button').length,text:root.textContent.trim()};
  });
  console.log('MOBILE NHI SAFE LAYOUT',JSON.stringify(mascot));
  if(!mascot||!mascot.parent||mascot.position==='fixed'||mascot.overlap>1||
      mascot.imgWidth>80||mascot.buttons)
    throw Error('Nhi overlaps the actual learning text on mobile');
  const mid=await mobile.evaluate(()=>{
    const card=document.querySelector('#planBox .pcard'),text=card.querySelector('.pfront .prompt');
    const before=getComputedStyle(text).color;
    card.querySelector('.prate .mid').click();
    return {active:card.classList.contains('nhi-rate-mid'),before,after:getComputedStyle(text).color};
  });
  console.log('MOBILE MID FEEDBACK',JSON.stringify(mid));
  if(!mid.active||mid.before===mid.after)throw Error('Normal rating did not recolor card text');
  await mobile.waitForFunction(()=>document.querySelector('#planBox .counter')?.textContent.startsWith('3 /'),{timeout:7000});
  await mobile.$eval('#planBox .pnav .parrow:first-child',n=>n.click());
  const transition=await mobile.evaluate(()=>{
    const card=document.querySelector('#planBox .pcard');
    return card.getAnimations().map(a=>a.effect?.getTiming?.().duration).filter(n=>typeof n==='number');
  });
  console.log('MOBILE CARD TRANSITIONS',JSON.stringify(transition));
  if(!transition.some(n=>n>=350))throw Error('Previous/next transition is unexpectedly abrupt');
  await mobile.close();await mobileContext.close();

  const completeCtx=await browser.createBrowserContext();
  const finish=await completeCtx.newPage();watch(finish,'completion');
  await finish.setViewport({width:1150,height:850});
  await finish.evaluateOnNewDocument((id,lessonId)=>{
    if(sessionStorage.getItem('nhi-fireworks-seeded'))return;
    localStorage.setItem('viko-plan-sess-v1',JSON.stringify({
      kind:'lesson',title:'Kiểm tra chúc mừng',lesson:lessonId,
      queue:[id],pos:0,picked:{},stats:{hard:0,mid:0}
    }));
    localStorage.setItem('viko-ko-meeting-ui-v1',JSON.stringify({mode:'plan',dir:'vk'}));
    sessionStorage.setItem('nhi-fireworks-seeded','1');
    sessionStorage.setItem('nlc-cover-seen','1');
  },lesson.items[0][0],lesson.id);
  await finish.goto('http://127.0.0.1:8765/#/bai/'+lesson.id,{waitUntil:'domcontentloaded'});
  await finish.waitForSelector('#planBox .pcard',{timeout:16000});
  await finish.$eval('#planBox .prate .mid',b=>b.click());
  await finish.waitForSelector('#planBox .sdone',{timeout:7000});
  const celebration=await finish.evaluate(()=>{
    return {title:document.querySelector('#planBox .sdone h2')?.textContent||'',
      message:document.querySelector('#planBox .sdone .nhi-victory-message')?.textContent||'',
      canvas:!!document.querySelector('#confetti:not([hidden])'),
      library:typeof window.NHI_FIREWORKS?.launch};
  });
  console.log('FIREWORK CELEBRATION',JSON.stringify(celebration));
  if(!celebration.canvas||celebration.library!=='function'||!celebration.title.includes('Chúc mừng'))
    throw Error('Firework celebration did not launch on completing the lesson');
  await finish.close();await completeCtx.close();
  if(errors.length)throw Error('Browser JavaScript errors: '+JSON.stringify(errors.slice(0,16)));
  console.log('ALL MOBILE AND CELEBRATION UX CHECKS PASSED');
} finally {
  console.log('JS_ERRORS',JSON.stringify(errors.slice(0,16)));
  await browser.close();
}