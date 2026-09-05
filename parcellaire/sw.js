var CACHE_NAME = 'parcellaire-v2';
var APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(APP_SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Réseau en priorité (pour toujours avoir la dernière version), secours sur le cache si hors-ligne.
// cache:'reload' court-circuite le cache HTTP du navigateur pour la page principale, afin qu'une
// mise à jour publiée soit bien récupérée dès la prochaine ouverture, même sur une app installée
// sur l'écran d'accueil (ces apps gardent sinon volontiers une ancienne version en mémoire).
self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var isNavigation = event.request.mode === 'navigate';
  event.respondWith(
    fetch(event.request, isNavigation ? { cache: 'reload' } : {}).then(function(res){
      if (event.request.url.indexOf(self.location.origin) === 0){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, resClone); });
      }
      return res;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
