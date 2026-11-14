// Offline support: network-first for GitHub Pages and static assets.
// Fall back to cache only when offline. Different cache key forces eviction of earlier stale CSS/JS.
const CACHE = 'nhi-corner-v43-romantic-cover-and-flashcard';
const CORE = [
  'study-update-v6.js','study-update-v6.css','nhi-november-v15.js','nhi-november-v15.css',
  'nhi-late-2026.js','nhi-late-2026.css','nhi-romance-v1.js','nhi-romance-v1.css','nhi-luong-v1.svg',
  './','index.html','manifest.webmanifest','qrcode.js','lessons.json',
  'icon-192.png','icon-512.png','refresh-v9.css','study-enhancements-v13.css',
  'hanja-v9.js','hanja-extra-v12.js','nhi-avatar.png','nhi-mascot.webp',
  'nhi-puzzled.webp','garden-v10.js','card-images-v11.js','technical-images.json',
  'nhi-google-images-v1.js','nhi-hard-minimal-v1.js','nhi-updates-v1.css','nhi-ai-resize-v2.js','nhi-ai-resize-v2.css',
  'nhi-study-motion-v3.css','nhi-fireworks-v3.js','nhi-interface-v5.css','nhi-interface-v5.js','nhi-seasons-v1.css','nhi-seasons-v1.js','nhi-living-garden-v1.css','nhi-living-garden-v1.js','nhi-phrases-v5.js','nhi-english-data-v6.js','nhi-english-v5.js','nhi-interface-v4.css','nhi-interface-v4.js',
  'recorded-voices-v11.js','audio-manifest.json','backup-portable-v1.js',
  'garden-day.webp','garden-night.webp',
  'garden-summer-day.webp','garden-summer-night.webp',
  'garden-autumn-day.webp','garden-autumn-night.webp',
  'garden-winter-day.webp','garden-winter-night.webp'
];
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  var fonts=/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if(url.origin!==self.location.origin && !fonts)return;
  if(fonts){
    e.respondWith(caches.match(req).then(function(hit){return hit||fetch(req).then(function(res){
      if(res && (res.ok||res.type==='opaque')) caches.open(CACHE).then(function(c){c.put(req,res.clone());});
      return res;
    });}));
    return;
  }
  // Do not serve outdated JS/CSS as long as network works.
  e.respondWith(fetch(req).then(function(res){
    if(res && res.ok){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){return c.put(req,copy);}).catch(function(){});
    }
    return res;
  }).catch(function(){
    return caches.match(req).then(function(hit){
      return hit || (req.mode==='navigate' ? caches.match('index.html') : Response.error());
    });
  }));
});
