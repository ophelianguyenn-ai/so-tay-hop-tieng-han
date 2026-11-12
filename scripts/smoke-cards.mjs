/* Browser regression: visible Korean flip in built-in, custom, restored and classic modes. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const lesson = JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons.find(l => l.items?.length);
if(!lesson) throw new Error('No built-in lessons');
const ROOT='http://127.0.0.1:8765/';
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN || '/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
const issues=[];
function attach(page,name){
  page.on('pageerror',e=>issues.push(name+': PAGEERROR '+String(e)));
  page.on('console',msg=>{ if(msg.type()==='error') issues.push(name+': CONSOLE '+msg.text()); });
}
async function visibleCard(page,name){
  const d=await page.evaluate(()=>{
    const v=document.querySelector('#view-plan'),card=document.querySelector('#planBox .pcard');
    const rect=card?.getBoundingClientRect();
    const style=card?getComputedStyle(card):null;
    return {path:location.hash,bodyClass:document.body.className,viewHidden:v?.hidden,viewDisplay:v?getComputedStyle(v).display:null,
      cardCount:document.querySelectorAll('#planBox .pcard').length,cardWidth:rect?.width||0,cardHeight:rect?.height||0,
      cardDisplay:style?.display,answer:card?.querySelector('.answer.ko')?.textContent||'',
      fallback:!!document.querySelector('.nhi-fallback-card'),snippet:document.querySelector('#planBox')?.textContent.slice(0,160)};
  });
  console.log(name,JSON.stringify(d));
  if(d.viewHidden||d.viewDisplay==='none'||!d.cardCount||d.cardWidth<100||d.cardHeight<50||!d.answer||d.fallback)
    throw Error(name+': card disappeared or answer hidden; '+JSON.stringify(d));
}
async function openLesson(page,id){
  await page.goto(ROOT+'#/bai/'+id,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!document.querySelector('#planBox .ppage'),{timeout:18000});
  await page.evaluate(()=>{
    const b=[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||''));
    if(!b) throw Error('No start lesson button');
    b.click();
  });
  await page.waitForSelector('#planBox .pcard',{timeout:16000});
}
try {
  {
    const page=await browser.newPage();attach(page,'built-in');
    await page.setViewport({width:1350,height:820});
    await openLesson(page,lesson.id);
    await page.click('#planBox .pflip');
    await new Promise(r=>setTimeout(r,650));
    await visibleCard(page,'built-in first flip');
    await page.click('#planBox .pflip');
    await new Promise(r=>setTimeout(r,480));
    await page.click('#planBox .pflip');
    await new Promise(r=>setTimeout(r,550));
    await visibleCard(page,'built-in third flip');
    await page.close();
  }
  {
    const id='daily-2026-11-12-testpayment',itemId='di-payment-test';
    const item=['di-payment-test','w','Báo giá, hợp đồng & thanh toán','Thủ tục thanh toán','결제 절차',1,[['Thủ tục thanh toán','결제 절차']],''];
    const fixture={id,date:'2026-11-12',plan:'2026-11-12',title:'Bài ngày 12.11 · Báo giá',items:[item],updatedAt:Date.now()};
    // Seed localStorage before any app code runs, as if the learner had already saved the custom lesson.
    // Use a one-time marker to avoid resetting learning data on the subsequent reload test.
    const context=await browser.createBrowserContext();
    const customPage=await context.newPage();
    attach(customPage,'custom-restored-isolated');
    await customPage.setViewport({width:900,height:740});
    await customPage.evaluateOnNewDocument((id,fixture,itemId)=>{
      if(sessionStorage.getItem('nhi-smoke-seeded'))return;
      localStorage.setItem('viko-daily-lessons-v1',JSON.stringify({[id]:fixture}));
      localStorage.setItem('viko-plan-sess-v1',JSON.stringify({kind:'lesson',title:fixture.title,lesson:id,queue:[itemId],pos:0,picked:{},stats:{hard:0,mid:0}}));
      localStorage.setItem('viko-ko-meeting-ui-v1',JSON.stringify({mode:'cards',dir:'vk'}));
      sessionStorage.setItem('nlc-cover-seen','1');
      sessionStorage.setItem('nhi-smoke-seeded','1');
    },id,fixture,itemId);
    await customPage.goto(ROOT+'#/bai/'+id,{waitUntil:'domcontentloaded'});
    try { await customPage.waitForSelector('#planBox .pcard',{timeout:9000}); }
    catch(ex) {
      const diag=await customPage.evaluate(()=>({
        hash:location.hash,url:location.href,
        localSession:localStorage.getItem('viko-plan-sess-v1')?.slice(0,320),
        daily:localStorage.getItem('viko-daily-lessons-v1')?.slice(0,450),
        mode:localStorage.getItem('viko-ko-meeting-ui-v1')?.slice(0,220),
        bodyClass:document.body.className,
        planHidden:document.querySelector('#view-plan')?.hidden,
        planHTML:document.querySelector('#planBox')?.innerHTML.slice(0,1200),
        bodyExcerpt:document.body.textContent.slice(0,550),
        status:document.readyState
      }));
      console.log('CUSTOM CARD DEBUG',JSON.stringify(diag));
      throw ex;
    }
    const before=await customPage.evaluate(()=>({mode:document.querySelector('#view-plan').hidden,body:document.body.className}));
    console.log('restored before',before);
    await customPage.click('#planBox .pflip');
    await new Promise(r=>setTimeout(r,650));
    await visibleCard(customPage,'restored custom Vietnamese-Korean');
    await customPage.reload({waitUntil:'domcontentloaded'});
    await customPage.waitForSelector('#planBox .pcard',{timeout:18000});
    await customPage.click('#planBox .pflip');
    await new Promise(r=>setTimeout(r,650));
    await visibleCard(customPage,'restored after reload');
    // Regress prior blank mint-screen: lesson route exists, but its view is hidden.
    await customPage.evaluate(()=>{
      document.querySelector('#view-plan').hidden=true;
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await new Promise(r=>setTimeout(r,700));
    const recovered=await customPage.evaluate(()=>({
      hidden:document.querySelector('#view-plan').hidden,
      visible:getComputedStyle(document.querySelector('#view-plan')).display,
      card:document.querySelector('#planBox .pcard')?.getBoundingClientRect().height||0
    }));
    console.log('hidden-view recovery',JSON.stringify(recovered));
    if(recovered.hidden||recovered.visible==='none'||recovered.card<50)throw Error('Hidden-view recovery failed: '+JSON.stringify(recovered));
    await customPage.close(); await context.close();
  }
  {
    const page=await browser.newPage();attach(page,'classic');
    await page.goto(ROOT,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{sessionStorage.setItem('nlc-cover-seen','1');document.querySelector('#tab-cards').click();});
    await page.waitForSelector('#view-cards:not([hidden]) #card',{timeout:12000});
    await page.click('#card');
    await new Promise(r=>setTimeout(r,550));
    const classic=await page.evaluate(()=>({mode:document.querySelector('#view-cards').hidden,show:!document.querySelector('#cAnswer').hidden,
      answer:document.querySelector('#cAnswer').textContent.slice(0,140),width:document.querySelector('#card').getBoundingClientRect().width,
      viewDisplay:getComputedStyle(document.querySelector('#view-cards')).display}));
    console.log('classic flip',JSON.stringify(classic));
    if(classic.mode||!classic.show||!classic.answer||classic.width<100||classic.viewDisplay==='none')throw Error('Classic flashcard flip failed');
    await page.close();
  }
  if(issues.length)throw Error('Runtime browser errors: '+JSON.stringify(issues.slice(0,20)));
  console.log('ALL FLIP REGRESSION TESTS PASSED');
}finally{
  console.log('BROWSER ERRORS',JSON.stringify(issues.slice(0,20)));
  await browser.close();
}
