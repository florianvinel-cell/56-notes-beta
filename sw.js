// 56 notes (bêta) : garder l'app sur l'appareil pour qu'elle s'ouvre même sans réseau.
var V='56n-beta-6dd4a58aa1';
var CORE=['./','index.html','manifest.webmanifest','icones/icone-192.png','icones/icone-512.png','icones/icone-masquable-512.png','icones/apple-touch-icon.png','icones/favicon-32.png'];
self.addEventListener('install',function(e){ e.waitUntil(caches.open(V).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate',function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch',function(e){
  var r=e.request; if(r.method!=='GET') return;
  var u=new URL(r.url);
  // la page : d'abord le réseau (pour les mises à jour), sinon la copie gardée
  if(r.mode==='navigate'){
    e.respondWith(fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(function(res){ var cp=res.clone(); caches.open(V).then(function(c){ c.put('index.html',cp); }); return res; })
      .catch(function(){ return caches.match('index.html'); }));
    return;
  }
  // le numéro de version : toujours le réseau, jamais la copie (c'est lui qui dit qu'une mise à jour attend)
  if(u.origin===self.location.origin&&/\/version\.txt$/.test(u.pathname)) return;
  // les polices : la copie gardée tout de suite, rafraîchie en arrière-plan
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(V).then(function(c){ return c.match(r).then(function(hit){
      var net=fetch(r).then(function(res){ c.put(r,res.clone()); return res; }).catch(function(){ return hit; });
      return hit||net; }); }));
    return;
  }
  // le reste de l'app : la copie gardée, sinon le réseau
  if(u.origin===self.location.origin){
    e.respondWith(caches.match(r).then(function(hit){ return hit||fetch(r).then(function(res){ var cp=res.clone(); caches.open(V).then(function(c){ c.put(r,cp); }); return res; }); }));
  }
});
