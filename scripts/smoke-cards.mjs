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
    // Regression: pause at card 15, reload, resume and go back to card 14.
    const resumeContext=await browser.createBrowserContext();
    const page=await resumeContext.newPage();attach(page,'pause-resume');
    await page.setViewport({width:1350,height:850});
    await openLesson(page,lesson.id);
    for(var i=0;i<14;i++) {
      await page.$eval('#planBox .pnav .parrow:last-child',button=>button.click());
    }
    const before=await page.$eval('#planBox .counter',el=>el.textContent.trim());
    if(!before.startsWith('15 /'))throw Error('Not on card 15: '+before);
    await page.$eval('#planBox .shead button:first-child',button=>button.click());
    const snapshot=await page.evaluate(id=>(JSON.parse(localStorage.getItem('viko-plan-v1')||'{}').resumeFull||{})[id],lesson.id);
    console.log('PAUSED SNAPSHOT',JSON.stringify({position:snapshot?.pos,queueLength:snapshot?.queue?.length}));
    if(snapshot?.pos!==14||snapshot.queue.length<15)throw Error('Pause lost previous cards');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!document.querySelector('#planBox .ppage'),{timeout:12000});
    await page.evaluate(()=>{
      const button=[...document.querySelectorAll('#planBox button')].find(b=>/Tiếp tục/.test(b.textContent||''));
      if(!button)throw Error('Resume button missing');
      button.click();
    });
    await page.waitForSelector('#planBox .pcard',{timeout:12000});
    const reopened=await page.$eval('#planBox .counter',el=>el.textContent.trim());
    if(!reopened.startsWith('15 /'))throw Error('Resume did not return to card 15: '+reopened);
    await page.$eval('#planBox .pnav .parrow:first-child',button=>button.click());
    const back=await page.$eval('#planBox .counter',el=>el.textContent.trim());
    console.log('RESUME REVERSE NAVIGATION',JSON.stringify({before,reopened,back}));
    if(!back.startsWith('14 /'))throw Error('Cannot go back from card 15 to card 14 after resuming');
    // AI width can change through the resize handle; text size persists across reload.
    await page.evaluate(()=>document.querySelector('#aiBtn').click());
    await page.waitForFunction(()=>document.body.classList.contains('ai-open'));
    const beforeWidth=await page.$eval('#aiPanel',el=>el.getBoundingClientRect().width);
    await page.focus('#aiResizeHandle');
    await page.keyboard.press('ArrowLeft');
    const afterWidth=await page.$eval('#aiPanel',el=>el.getBoundingClientRect().width);
    const widthDebug=await page.evaluate(()=>({
      active:document.activeElement?.id,
      root:getComputedStyle(document.documentElement).getPropertyValue('--nhi-ai-width'),
      saved:localStorage.getItem('nlc-ai-display-v2'),
      panel:getComputedStyle(document.querySelector('#aiPanel')).width,
      handle:getComputedStyle(document.querySelector('#aiResizeHandle')).display,
      open:document.body.classList.contains('ai-open')
    }));
    console.log('AI KEYBOARD DEBUG',JSON.stringify({beforeWidth,afterWidth,widthDebug}));
    if(afterWidth<beforeWidth+20)throw Error('AI panel did not grow with resize keyboard control');
    // Verify pointer dragging too, not only keyboard accessibility.
    const grip=await page.$('#aiResizeHandle'),bounds=await grip.boundingBox();
    if(!bounds||bounds.width<5)throw Error('AI resize handle is not visible');
    const gx=bounds.x+bounds.width/2,gy=bounds.y+bounds.height/2;
    await page.mouse.move(gx,gy);
    await page.mouse.down();
    await page.mouse.move(gx-68,gy,{steps:5});
    await page.mouse.up();
    const dragWidth=await page.$eval('#aiPanel',el=>el.getBoundingClientRect().width);
    console.log('AI POINTER RESIZE',JSON.stringify({afterWidth,dragWidth}));
    if(dragWidth<afterWidth+40)throw Error('Dragging the AI panel border did not increase width');
    await page.select('#aiFontSize','20');
    const font=await page.$eval('#aiPanel .aimsg',el=>getComputedStyle(el).fontSize);
    if(font!=='20px')throw Error('AI chat font size was not applied: '+font);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForSelector('#aiFontSize',{timeout:12000});
    const saved=await page.evaluate(()=>({
      font:document.querySelector('#aiFontSize').value,
      width:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nhi-ai-width'))
    }));
    console.log('AI RESIZE & FONT',JSON.stringify({beforeWidth,afterWidth,font,saved}));
    if(saved.font!=='20'||saved.width<dragWidth-2)throw Error('AI display settings did not persist');
    await page.evaluate(()=>window.NHI_HARD_MASCOT.show(document.querySelector('#planBox .pcard')));
    const companion=await page.evaluate(()=>{
      var n=document.querySelector('#nhi-hard-mascot'),card=document.querySelector('#planBox .pfront');
      if(!n||!card)return null;
      return {left:n.getBoundingClientRect().left,cardLeft:card.getBoundingClientRect().left,
        buttonCount:n.querySelectorAll('button').length,text:n.textContent.trim(),
        background:getComputedStyle(n).backgroundColor,position:getComputedStyle(n).position};
    });
    console.log('FIXED LEFT COMPANION',JSON.stringify(companion));
    if(!companion||companion.left>companion.cardLeft+40||companion.buttonCount||companion.position!=='fixed')
      throw Error('Nhi mascot is not fixed at left without controls');
    await page.close();await resumeContext.close();
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

    // Undo a deletion (including the last card) restores the item and its position.
    await customPage.click('#planBox .pdel');
    await customPage.waitForSelector('#nhi-undo-delete:not([hidden])',{timeout:5000});
    const deleted=await customPage.evaluate(()=>({
      deleted:JSON.parse(localStorage.getItem('viko-plan-v1')||'{}').del?.['di-payment-test']?.v,
      last:JSON.parse(localStorage.getItem('nhi-plan-deletions-v2')||'[]').at(-1)?.id
    }));
    console.log('delete state',JSON.stringify(deleted));
    if(!deleted.deleted||deleted.last!=='di-payment-test')throw Error('Deletion was not stored for Undo');
    await customPage.click('#nhi-undo-delete');
    await customPage.waitForSelector('#planBox .pcard',{timeout:8000});
    const restoredDelete=await customPage.evaluate(()=>({
      deleted:JSON.parse(localStorage.getItem('viko-plan-v1')||'{}').del?.['di-payment-test']?.v,
      card:!!document.querySelector('#planBox .pcard'),
      itemText:document.querySelector('#planBox .pcard')?.textContent.includes('Thủ tục thanh toán')
    }));
    console.log('undo state',JSON.stringify(restoredDelete));
    if(restoredDelete.deleted||!restoredDelete.card||!restoredDelete.itemText)throw Error('Undo failed to restore card');

    await customPage.close(); await context.close();
  }
  {
    const page=await browser.newPage();attach(page,'classic');
    await page.goto(ROOT,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{sessionStorage.setItem('nlc-cover-seen','1');document.querySelector('#tab-cards').click();});
    try{await page.waitForSelector('#view-cards:not([hidden]) #card',{timeout:5000});}
    catch(ex){
      const d=await page.evaluate(()=>({
        hash:location.hash,bodyClass:document.body.className,
        cardsHidden:document.querySelector('#view-cards')?.hidden,
        cardsStyle:getComputedStyle(document.querySelector('#view-cards')).display,
        planHidden:document.querySelector('#view-plan')?.hidden,
        tabSelected:document.querySelector('#tab-cards')?.getAttribute('aria-selected'),
        savedUI:localStorage.getItem('viko-ko-meeting-ui-v1')?.slice(0,300),
        coverHidden:document.querySelector('#cover')?.hidden,
        viewHTML:document.querySelector('#view-cards')?.outerHTML.slice(0,400)
      }));
      console.log('CLASSIC DEBUG',JSON.stringify(d));throw ex;
    }
    // The card deliberately ignores text taps (used for highlights); click the blank card surface.
    await page.$eval('#card',el=>el.click());
    await new Promise(r=>setTimeout(r,550));
    const classic=await page.evaluate(()=>({mode:document.querySelector('#view-cards').hidden,show:!document.querySelector('#cAnswer').hidden,
      answer:document.querySelector('#cAnswer').textContent.slice(0,140),width:document.querySelector('#card').getBoundingClientRect().width,
      viewDisplay:getComputedStyle(document.querySelector('#view-cards')).display}));
    console.log('classic flip',JSON.stringify(classic));
    if(classic.mode||!classic.show||!classic.answer||classic.width<100||classic.viewDisplay==='none')throw Error('Classic flashcard flip failed');
    await page.close();
  }
  {
    // Mock Google without exposing a real API key or incurring API usage.
    const page=await browser.newPage();attach(page,'gemini-model');
    await page.goto(ROOT,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{
      localStorage.setItem('nlc-ai-v1',JSON.stringify({
        p:'gemini',k:{gemini:'dummy-test-only'},m:{gemini:'models/models/gemini-3.5-flash-lite'}
      }));
      sessionStorage.setItem('nlc-cover-seen','1');
    });
    await page.evaluateOnNewDocument(()=>{
      const oldFetch=window.fetch.bind(window);
      window.__geminiTestUrls=[];
      window.fetch=function(resource,opts){
        var url=typeof resource==='string'?resource:resource.url;
        if(url.indexOf('generativelanguage.googleapis.com')>=0){
          window.__geminiTestUrls.push(url);
          var payload=url.includes(':generateContent')
            ? {candidates:[{content:{parts:[{text:'Đã nhận câu hỏi bằng tiếng Hàn.'}]}}]}
            : {models:[{name:'models/gemini-3.5-flash-lite',supportedGenerationMethods:['generateContent']}]};
          return Promise.resolve(new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json'}}));
        }
        return oldFetch(resource,opts);
      };
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>!!document.querySelector('#aiBtn'));
    await page.evaluate(()=>{
      document.querySelector('#aiBtn').click();
      document.querySelector('#aiInput').value='Giải thích tiếng Hàn';
      document.querySelector('#aiForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    });
    await page.waitForFunction(()=>document.querySelector('#aiLog')?.textContent.includes('Đã nhận câu hỏi bằng tiếng Hàn.'),{timeout:9000});
    const first=await page.evaluate(()=>window.__geminiTestUrls.slice());
    console.log('GEMINI NORMALIZED REQUEST',JSON.stringify(first));
    if(!first.some(u=>u.endsWith('/models/gemini-3.5-flash-lite:generateContent')))
      throw Error('Gemini model prefix was not normalized: '+JSON.stringify(first));
    if(first.some(u=>u.includes('models/models/')))throw Error('Gemini models/models duplicated');

    await page.evaluate(()=>{
      document.querySelector('#aiCfgBtn').click();
      document.querySelector('#aiCheck').click();
    });
    await page.waitForFunction(()=>document.querySelector('#aiCheckStatus')?.textContent.includes('Đã chọn'),{timeout:9000});
    const checked=await page.evaluate(()=>({
      status:document.querySelector('#aiCheckStatus').textContent,
      model:document.querySelector('#aiModel').value,
      requests:window.__geminiTestUrls.slice()
    }));
    console.log('GEMINI MODEL CHECK',JSON.stringify(checked));
    if(checked.model!=='gemini-3.5-flash-lite')throw Error('Gemini model discovery failed');
    await page.close();
  }
  if(issues.length)throw Error('Runtime browser errors: '+JSON.stringify(issues.slice(0,20)));
  console.log('ALL FLIP AND GEMINI REGRESSION TESTS PASSED');
}finally{
  console.log('BROWSER ERRORS',JSON.stringify(issues.slice(0,20)));
  await browser.close();
}
