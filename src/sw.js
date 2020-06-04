import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';

precacheAndRoute(
    self.__WB_MANIFEST, {
    "ignoreURLParametersMatching": [/.+Pin$/, /.+Display$/, /.+Color$/, /.+PinPosition$/, /^shortcut$/, /^downloadType$/, /^runShortcut$/]
});

const thirdPartyUrls = [
    'CONF_PDFJS_JS',
    'CONF_PDFJS_WORKER_JS',
    'CONF_MAPBOXGL_JS',
    'CONF_MAPBOXGL_CSS',
    'CONF_BOOTSTRAP_CSS'
];
const lidoUrls = [
    'CONF_LIDOJS_JS',
    'CONF_WMO_JS'
];
const allUrls = thirdPartyUrls.concat(lidoUrls);

registerRoute(
    /.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js)$/,
    new CacheFirst({
      cacheName: 'lido-warmup',
    })
);

registerRoute(
  ({url}) => url.origin === 'https://api.mapbox.com' && ( 
     (url.pathname.startsWith('/styles/') || url.pathname.startsWith('/fonts/')) ||
     url.pathname === '/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'
  ),
  new StaleWhileRevalidate({
    cacheName: 'lido-mapbox'
  })
);

registerRoute(
  ({url}) => url.origin === 'https://editolido.alwaysdata.net' && url.pathname.startsWith('/proxy_gramet/'),
  new CacheFirst({
    cacheName: 'lido-gramet',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 48 * 60, // 48h
      })
    ]
  })
);
const addAll = function(cache, immutableRequests = [], mutableRequests = []) {
  // Verify arguments
  if (!(cache instanceof Cache) || !Array.isArray(immutableRequests) || !Array.isArray(mutableRequests)) {
    return Promise.reject();
  }

  let newImmutableRequests = [];

  // Go over immutable requests
  return Promise.all(
    immutableRequests.map(function(url) {
      return caches.match(url).then(function(response) {
        if (response) {
          return cache.put(url, response);
        } else {
          newImmutableRequests.push(url);
          return Promise.resolve();
        }
      });
    })
  // go over mutable requests, and immutable requests not found in any cache
  ).then(function() {
    return cache.addAll(newImmutableRequests.concat(mutableRequests));
  });
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        // speed up install prompt by not downloading files already in cache
        caches.open("lido-warmup")
          .then((cache) => {
            addAll(cache, allUrls)
            // cache.keys().then((keys) => {
            //   const cachedUrls = keys.map(r => r.url);
            //   const urlsToAdd = allUrls.filter(url => {
            //     if (url.startsWith('http')) {
            //       if (cachedUrls.indexOf(url) !== -1) return false
            //     } else {
            //       for (const urlEntry of cachedUrls) {
            //         if (urlEntry.indexOf(url.replace(/^\./, '')) !== -1) return false;
            //       }
            //     }
            //     return true;
            //   });
            //   cache.addAll(urlsToAdd);
            // });
          })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      // cache to delete (as promise array)
      const cachesToDelete = cacheNames.filter(function(cacheName) {
        if (cacheName.startsWith('lidojs-')) {
          return true; // remove
        } else if (cacheName === 'lido-3rd-static') {
          return true; //remove
        } else if (cacheName === 'lido-ressources') {
          return true;
        }
        return false;
      }).map(function(cacheName) {
        return caches.delete(cacheName);
      });
      // entries to delete (as promise array)
      let entriesToDelete = [];
      caches.open('lido-warmup').then(function(cache) {
        cache.keys()
          .then(function(keys) {
            entriesToDelete = keys
              .filter((request,) => {
                if (thirdPartyUrls.indexOf(request.url) !== -1) {
                  return false;
                }
                for (const url of lidoUrls) {
                  if (url.startsWith("http")) {
                    if (request.url === url) return false;
                  } else {
                    if (request.url.indexOf(url.replace(/^\./, '')) !== -1) return false;
                  }
                }
                return true;
              }).map(request => cache.delete(request));
          });
      }).catch(err => console.log(err));
      return Promise.all(cachesToDelete.concat(entriesToDelete));
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
