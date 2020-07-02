import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';

const maps = {
  'north': 'CONF_NORTH',
  'south': 'CONF_SOUTH',
  'pacific': 'CONF_PACIFIC'
};

const validCaches ={
  'warmup': 'lido-warmup',
  'mapbox': 'lido-mapbox',
  'airports': 'lido-data',
  'fir-reg': 'lido-fir',
  'gramet': 'lido-gramet2', // if you change here, you must also change in Map.svelte/map.load 
  'north': 'lido-' + maps['north'],
  'south': 'lido-' + maps['south'],
  'pacific': 'lido-' + maps['pacific'],
  'zoom4': `lido-zoom4_${maps['north'].substr(-1)}_${maps['south'].substr(-1)}_${maps['pacific'].substr(-1)}`
}

precacheAndRoute(
    self.__WB_MANIFEST, {
    "directoryIndex": null,
    "ignoreURLParametersMatching": [/.+Pin$/, /.+Display$/, /.+Color$/, /.+PinPosition$/, /^shortcut$/, /^downloadType$/, /^runShortcut$/]
});

const thirdPartyUrls = [
    'CONF_PDFJS_JS',
    'CONF_PDFJS_WORKER_JS',
    'CONF_MAPBOXGL_JS',
    'CONF_MAPBOXGL_CSS',
    'CONF_BOOTSTRAP_CSS',
    'CONF_PROJ4_JS'
];
const lidoUrls = [
    'CONF_LIDOJS_JS',
    'CONF_WMO_JS'
];
const allUrls = thirdPartyUrls.concat(lidoUrls);

registerRoute(
    /.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|proj4\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js)$/,
    new CacheFirst({
      cacheName: validCaches['warmup'],
    })
);

registerRoute(
  ({url}) => url.origin === 'https://api.mapbox.com' && !url.pathname.includes('/flyingeek/') && ( 
     (url.pathname.startsWith('/styles/') || url.pathname.startsWith('/fonts/')) ||
     url.pathname === '/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json'
  ),
  new StaleWhileRevalidate({
    cacheName: validCaches['mapbox']
  })
);

registerRoute(
  ({url}) => url.pathname.endsWith('/data/airports.CONF_AIRAC.geojson'),
  new CacheFirst({
    cacheName: validCaches['airports'],
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2
      })
    ]
  })
)
registerRoute(
  ({url}) => url.pathname.endsWith('/data/fir-reg.CONF_AIRAC.geojson'),
  new CacheFirst({
    cacheName: validCaches['fir-reg'],
    plugins: [
      new ExpirationPlugin({
        maxEntries: 2
      })
    ]
  })
)

registerRoute(
  ({url}) => url.origin === 'https://editolido.alwaysdata.net' && url.pathname.startsWith('/proxy_gramet'),
  new CacheFirst({
    cacheName: validCaches['gramet'],
    plugins: [
      new ExpirationPlugin({
        maxEntries: 5,
        maxAgeSeconds: 48 * 3600
      })
    ]
  })
);

registerRoute(
  ({url}) => url.href.match(new RegExp('https://editolido.alwaysdata.net/i/' + maps['north'] + '/[0-3]/.*')),
  new CacheFirst({
    cacheName: validCaches['north'],
  })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('https://editolido.alwaysdata.net/i/' + maps['south'] + '/[0-3]/.*')),
  new CacheFirst({
    cacheName: validCaches['south'],
  })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('https://editolido.alwaysdata.net/i/' + maps['pacific'] + '/[0-3]/.*')),
  new CacheFirst({
    cacheName: validCaches['pacific'],
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 15 * 60 * 3600
      })
    ]
  })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('https://editolido.alwaysdata.net/i/[^/]+/4/.*')),
  new CacheFirst({
    cacheName: validCaches['zoom4'],
    plugins: [
      new ExpirationPlugin({
        maxEntries: 128
      })
    ]
  })
);

registerRoute(
  ({url}) => url.href.match(new RegExp('https://editolido.alwaysdata.net/i/[^/]+/[5-9]/.*')),
  async () => new Response('', { "status" : 404 , "statusText" : "sw says nope!"})
);

// from https://github.com/TalAter/cache.adderall
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
        caches.open("lido-warmup").then((cache) => {
          return addAll(cache, allUrls)
        })
    );
});
/**
 * Check if we should keep the cache based on the name
 * @param {Array} cacheName
 * @returns {Boolean}
 */
const isOldCache = (cacheName) => {
  if (['northv3', 'northv2', 'northv1', 'southv3', 'southv2', 'southv1', 'pacificv1'].indexOf(cacheName) !== -1) return true;
  if (!cacheName.startsWith('lido-')) return false;
  return Object.values(validCaches).indexOf(cacheName) === -1;
};
/**
 * check entries of a cache to find 
 * old entry (not present in thirdPartyUrls or lidoUrls)
 * @param {Request} request 
 * @returns {Boolean} true if should be removed from cache
 */
const isOldRequest = (request) => {
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
};

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return cacheNames.filter(isOldCache).map((cacheName) => caches.delete(cacheName));
    }).then(() => {
      return caches.open('lido-warmup')
    }).then(function(cache) {
        return cache.keys().then(function(keys) {
          return Promise.all(keys.filter(isOldRequest).map(request => cache.delete(request)));
        });
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
