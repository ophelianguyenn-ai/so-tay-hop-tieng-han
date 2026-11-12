/* Smoke test for the app's core flip path; runs inside GitHub Actions. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const lessons = JSON.parse(fs.readFileSync('lessons.json','utf8')).lessons;
const first = lessons.find(l => l?.items?.length);
if (!first) throw new Error('No study lessons in lessons.json');
const browser = await puppeteer.launch({
  headless: true, executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']
});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('PAGE ERROR: '+String(e)));
  page.on('console', m => { if(m.type()==='error') errors.push('CONSOLE ERROR: '+m.text()); });
  await page.setViewport({width:1320,height:860});
  await page.goto('http://127.0.0.1:8765/#/bai/'+first.id,{waitUntil:'domcontentloaded'});
  try { await page.waitForSelector('#coverGo',{timeout:4000}); await page.click('#coverGo'); } catch(e){}
  await page.waitForSelector('#planBox .ppage',{timeout:15000});
  const startButtons = await page.$$eval('#planBox button', buttons=>buttons.filter(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||'')).map(b=>({txt:b.textContent,cls:b.className})));
  console.log('START BUTTONS',JSON.stringify(startButtons.slice(0,8)));
  const go = await page.evaluate(() => {
    const b=[...document.querySelectorAll('#planBox button')].find(b=>/Học ngay|Học trước|Tiếp tục|Học lại|Ôn/.test(b.textContent||''));
    if(!b)return false;b.click();return true;
  });
  if(!go) throw new Error('Cannot find start-lesson button');
  await page.waitForSelector('#planBox .pcard',{timeout:12000});
  const before=await page.$eval('#planBox .pcard',el=>el.textContent.slice(0,250));
  console.log('BEFORE',before);
  await page.click('#planBox .pflip');
  await new Promise(r=>setTimeout(r,1000));
  const after=await page.evaluate(() => ({
    count:document.querySelectorAll('#planBox .pcard').length,
    answer:document.querySelector('#planBox .pcard .answer.ko')?.textContent||'',
    fallback:!!document.querySelector('.nhi-fallback-card'),
    bodyChars:document.querySelector('#planBox')?.textContent.length||0,
    snippet:document.querySelector('#planBox')?.textContent.slice(0,450)||''
  }));
  console.log('AFTER',JSON.stringify(after));
  if(!after.count || !after.answer || !after.bodyChars)throw Error('Flip failed to display Korean answer');
  if(after.fallback)throw Error('Flip works only with fallback; see preceding console errors');
  console.log('SMOKE TEST SUCCESS');
}finally{
  console.log('BROWSER ERRORS',JSON.stringify(errors.slice(0,30)));
  await browser.close();
}