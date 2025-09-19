const CACHE='skf-gr-v3.7';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./style.css','./script.js','./manifest.json','./skf-192.png','./favicon.ico'])))}) 
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})