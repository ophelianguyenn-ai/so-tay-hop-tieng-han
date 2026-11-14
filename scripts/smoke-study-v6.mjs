/* User-flow regression for the November study controls; no live AI requests. */
import fs from 'node:fs';import puppeteer from 'puppeteer-core';
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const L=JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons.find(l=>l.items.length>=8);
const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:1360,height:900});
 await page.evaluateOnNewDocument(()=>{sessionStorage.setItem('nlc-cover-seen','1');localStorage.setItem('nlc-prefs-v1',JSON.stringify({fx:false}));});
 await page.goto('http://127.0.0.1:8765/#/bai/'+L.id,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('#planBox .ppage');
 await page.evaluate(()=>[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Học lại|Tiếp tục/.test(b.textContent)).click());
 await page.waitForSelector('#planBox .pcard');
 await page.evaluate(async()=>{await NHI_AUDIO.ready;window.__spoken=[];NHI_AUDIO.play=(text,lang)=>{window.__spoken.push({text,lang});return true;};});
 // Both face transitions must call the same Neural player used by the sample.
 await page.keyboard.press('Enter');await page.waitForSelector('#planBox .answer.ko');
 await page.keyboard.press('Enter');await page.waitForSelector('#planBox .prompt');
 const spoken=await page.evaluate(()=>window.__spoken);assert(spoken.at(-2)?.lang==='ko-KR'&&spoken.at(-1)?.lang==='vi-VN','Face language speech mismatch');
 await page.click('.cicons [title*="Phát âm"]');assert(!await page.evaluate(()=>NHI_SPEECH.active()),'Toolbar did not stop current speech');
 await page.keyboard.press('ArrowRight');assert((await page.$eval('#planBox .counter',x=>x.textContent)).startsWith('2 /'),'ArrowRight failed');
 await page.keyboard.press('ArrowLeft');assert((await page.$eval('#planBox .counter',x=>x.textContent)).startsWith('1 /'),'ArrowLeft failed');
 // Notes/formatting save, display and survive a face change.
 await page.click('.cicons [title*="Sửa thẻ"]');
 const bounds=await page.$eval('.editbox',e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight,position:getComputedStyle(e).position};});
 assert(bounds.position==='fixed'&&bounds.top>=0&&bounds.bottom<=bounds.height,'Editor is outside viewport');
 await page.$eval('textarea[name="vi"]',e=>{e.focus();e.setSelectionRange(0,Math.min(2,e.value.length));});
 await page.$eval('textarea[name="vi"]',e=>e.parentElement.nextElementSibling.querySelector('button').click());
 await page.$eval('textarea[name="note"]',e=>{e.value='Ghi chú kiểm tra';});
 await page.$eval('.editbox button[type="submit"]',e=>e.click());
 await page.keyboard.press('Enter');await page.waitForSelector('.nhi-card-note');
 assert(await page.$eval('.nhi-card-note',e=>e.textContent)==='Ghi chú kiểm tra','Note did not save');
 assert(await page.$eval('.vi-under',e=>!!e.querySelector('[style*="font-weight"]')),'Selected text bold format missing');
 await page.click('.nhi-en-forgot input');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('viko-plan-v1')));assert(Object.values(stored.enHard).some(x=>x.v===1),'English unremembered flag missing');
 const word=await page.$eval('.nhi-en-translation .nhi-en-word',e=>e.textContent);
 await page.$eval('.nhi-en-translation .nhi-en-word',e=>e.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true})));
 assert(await page.$eval('dialog iframe',e=>e.src).then(x=>x.includes('vdict.com')&&x.includes(encodeURIComponent(word))),'VDict dialog missing');
 await page.click('dialog button');
 await page.click('.nhi-dict-button');assert(await page.$eval('dialog iframe',e=>e.src).then(x=>x.includes('kovidict')),'Naver VI dialog missing');await page.click('dialog button');
 // Image picker accepts clipboard files; no redundant link-save or API panel.
 await page.click('.cicons [title*="Tìm ảnh"]');
 assert(await page.$eval('.nhi-picture-picker',e=>!e.textContent.includes('Lưu ảnh từ liên kết')&&!e.textContent.includes('Đã có Google Custom Search')),'Legacy image controls remain');
 await page.$eval('.nhi-picture-picker',e=>{const binary=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0)),file=new File([bytes],'paste.png',{type:'image/png'}),dt=new DataTransfer();dt.items.add(file);e.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}));});
 await page.waitForFunction(()=>!document.querySelector('.nhi-picture-picker'));
 assert(await page.$eval('.card-illustration img',e=>e.src.startsWith('data:image/')),'Pasted image not saved');
 // One undo action exists on the immediate successor and expires at the next navigation.
 await page.keyboard.press('ArrowRight');
 const before=await page.$eval('.pcard',e=>e.dataset.item);await page.keyboard.press('Delete');
 assert(await page.$$eval('.pundo',e=>e.length)===1,'Delete should expose one undo');
 await page.click('.pundo');assert(await page.$eval('.pcard',e=>e.dataset.item)===before,'Undo restored wrong card');
 await page.keyboard.press('Delete');await page.keyboard.press('ArrowRight');assert(await page.$$eval('.pundo',e=>e.length)===0,'Undo did not expire on third card');
 await page.click('#setBtn');await page.click('#fxChk');await page.click('#setSheet button[data-close]');
 await page.keyboard.press('1');await page.waitForSelector('#nhi-hard-mascot');
 assert(await page.$eval('.pcard',e=>e.contains(document.getElementById('nhi-hard-mascot'))),'Mascot is detached from card');
 await page.keyboard.press('ArrowRight');assert(await page.$('#nhi-hard-mascot')===null,'Mascot survived card transition');
 await page.click('#aiBtn');await page.waitForFunction(()=>document.body.classList.contains('ai-open'));
 await page.waitForSelector('.nhi-reader-toolbar');
 await page.click('#aiInput');await page.type('#aiInput','Giải thích từ này');await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('#aiLog').textContent.includes('Giải thích từ này'));
 console.log('CHAT CONTROL BOUNDS',await page.$eval('#aiClose',e=>{const r=e.getBoundingClientRect();return {display:getComputedStyle(e).display,top:r.top,bottom:r.bottom,width:r.width,height:r.height,viewport:innerHeight};}));
 await page.click('#aiClose');
 await page.click('#planBox .shead button:first-child');
 await page.evaluate(()=>[...document.querySelectorAll('#planBox button')].find(b=>b.textContent.includes('Ôn chưa nhớ tiếng Anh')).click());
 await page.waitForSelector('#planBox .pcard');
 assert((await page.$eval('#planBox .counter',e=>e.textContent)).endsWith('/ 1'),'English review includes unrelated cards');
 assert(errors.length===0,'Page runtime errors: '+errors.join('; '));
 console.log('STUDY V6 PASS',JSON.stringify({spoken,editor:bounds,notes:true,formatting:true,englishReview:true,dictionaries:true,pasteImage:true,undo:true,keyboard:true,mascot:true,chatEnter:true}));
}finally{await browser.close();}
