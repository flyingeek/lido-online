import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
import {TilesCache} from './tilesCache';

//import { openDB, deleteDB, wrap, unwrap } from 'idb';

const maps = {
  'north': 'CONF_NORTH',
  'south': 'CONF_SOUTH',
  'pacific': 'CONF_PACIFIC',
  'theworld': 'CONF_THEWORLD',
  'mercator': 'CONF_MERCATOR'
};
// compute a host hash based on url origin
// simply use first letters of url's origin
const hostId = (url, postfix='-') => {
  const hash = (new URL(url)).hostname.split('.').map(name => name.charAt(0)).join('');
  return (hash === 'ean' ? '' : hash + postfix);
};

const validCaches ={
  'warmup': 'lido-warmup',
  'mapbox': 'lido-mapbox',
  'airports': 'lido-data',
  'fir-reg': 'lido-fir',
  'gramet': 'lido-gramet2', // if you change here, you must also change in Map.svelte/map.load 
  //'north': 'lido-' + hostId('CONF_NORTH_TILES_BASE_URL') + maps['north'],
  //'south': 'lido-' + hostId('CONF_SOUTH_TILES_BASE_URL') + maps['south'],
  //'pacific': 'lido-' + hostId('CONF_PACIFIC_TILES_BASE_URL') + maps['pacific'],
  //'theworld': 'lido-' + hostId('CONF_THEWORLD_TILES_BASE_URL') + maps['theworld'],
  //'zoom4': `lido-zoom4_${hostId('CONF_NORTH_TILES_BASE_URL', '') + maps['north'].substr(-1)}_${hostId('CONF_SOUTH_TILES_BASE_URL', '') + maps['south'].substr(-1)}_${hostId('CONF_PACIFIC_TILES_BASE_URL', '') + maps['pacific'].substr(-1)}`,
  //'zoom5': `lido-zoom5_${hostId('CONF_THEWORLD_TILES_BASE_URL', '') + maps['theworld'].substr(-1)}`
};
const deprecatedCaches = ['lido-ona-theworldv1', 'lido-zoom5_ona1', 'lido-ona-theworldv2', 'lido-zoom5_ona2', 'lido-ona-southv3', 'lido-ona-northv3', 'lido-ona-pacificv1', 'lido-zoom4_ona3_ona3_ona1'];
const deprecatedDB = ['swtest'];
const SW_VERSION = 'APP_VERSION';

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
  ({url}) => url.origin === 'https://api.mapbox.com' && ( 
    (url.pathname.startsWith('/styles/') || url.pathname.startsWith('/fonts/')) ||
    url.pathname === '/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json' ||
    url.pathname === '/v4/denizotjb.63g5ah66.json' ||
    url.pathname === '/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.bifqeinj,denizotjb.cz0kdfpx,mapbox.mapbox-terrain-v2.json'
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
);
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
);

registerRoute(
  ({url}) => url.href.match(new RegExp("CONF_GRAMET_PROXY".replace(/\$\{[^}]+\}/g, ".+"))),
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

const tilesCache = new TilesCache('CONF_TILES_DB', 3, (open, evt) => {
    if (evt.oldVersion < 1) {
        open.result.createObjectStore(maps['theworld']);
    }
    if (evt.oldVersion < 2) {
        open.result.createObjectStore(maps['north']);
        open.result.createObjectStore(maps['south']);
        open.result.createObjectStore(maps['pacific']);
    }
    if (evt.oldVersion < 3) {
      open.result.createObjectStore(maps['mercator']);
    }
});

registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_NORTH_TILES_BASE_URL' + '/[0-4]/.*')),
  tilesCache.getCacheHandler(maps['north'])
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_SOUTH_TILES_BASE_URL' + '/[0-4]/.*')),
  tilesCache.getCacheHandler(maps['south'])
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_THEWORLD_TILES_BASE_URL' + '/[0-5]/.*')),
  tilesCache.getCacheHandler(maps['theworld'])
);
const baseMercator = `https://api.mapbox.com/v4/${maps['mercator'].slice(0,-2)}`;
registerRoute(
  ({url}) => url.href.match(new RegExp(baseMercator + '[^/]+/[0-6]/.*')),
  tilesCache.getCacheHandler(maps['mercator'])
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_PACIFIC_TILES_BASE_URL' + '/[0-4]/.*')),
  tilesCache.getCacheHandler(maps['pacific'])
);

registerRoute(
  ({url}) => url.href.match(new RegExp('(CONF_NORTH_TILES_BASE_URL|CONF_SOUTH_TILES_BASE_URL|CONF_PACIFIC_TILES_BASE_URL)/[5-9]/.*')),
  async () => new Response('', { "status" : 404 , "statusText" : "sw says nope!"})
);
registerRoute(
  ({url}) => url.href.match(new RegExp('(CONF_THEWORLD_TILES_BASE_URL)/[6-9]/.*')),
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
  if (['northv3', 'northv2', 'northv1', 'southv3', 'southv2', 'southv1', 'pacificv1'].includes(cacheName)) return true;
  return deprecatedCaches.includes(cacheName);
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
    }).then(() => {
      try{
        //dbPromise.result.close();
        deprecatedDB.forEach((name) => {
          indexedDB.deleteDatabase(name);
        });
      } catch (e) {
        //noop
      }
      self.clients.claim();
    })
  );
});


self.addEventListener('message', (event) => {
  if (event.data && (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING')) {
      self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
      event.ports[0].postMessage(SW_VERSION);
  } else if (event.data && event.data.type === 'CLIENTS_CLAIM') {
      self.clients.claim();
  }
});
