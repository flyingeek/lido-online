import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst} from 'workbox-strategies';
import {ExpirationPlugin} from 'workbox-expiration';
//import { openDB, deleteDB, wrap, unwrap } from 'idb';

const maps = {
  'north': 'CONF_NORTH',
  'south': 'CONF_SOUTH',
  'pacific': 'CONF_PACIFIC',
  'theworld': 'CONF_THEWORLD'
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


const initIndexedDB = () => {
  const open = indexedDB.open('lido-tiles', 2);
  open.onsuccess = evt => {
    console.log('DB opened successfully');
  };
  open.onerror = evt => {
    console.log('Error while opening DB');
  };
  open.onupgradeneeded = evt => {
    if (evt.oldVersion < 1) {
      open.result.createObjectStore(maps['theworld']);
    }
    if (evt.oldVersion < 2) {
      open.result.createObjectStore(maps['north']);
      open.result.createObjectStore(maps['south']);
      open.result.createObjectStore(maps['pacific']);
    }
  }
  return open;
}
const dbPromise = initIndexedDB();
const getImageIdFromURL = (url) => {
  const u = new URL(url);
  return u.pathname.replace(/[/.]/g,'_');
};
const getStoreNameFromURL = (url) => {
  const u = new URL(url);
  return u.pathname.replace(/[/.]/g,'_').split('_')[1];
}
const fetchImageFromDB = (imageId, storeName) => {
  return new Promise((resolve, reject) => {
    const tx =  dbPromise.result.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const imageInStoreReq = store.get(imageId);
    imageInStoreReq.onsuccess = (evt) => {
        resolve(imageInStoreReq.result);
    };
    imageInStoreReq.onerror = (evt) => {
        reject('Something went wrong while fetching image from DB ');
    };
  });
};
const putImageInDB = (imageId, storeName, blob) => {
  return new Promise((resolve, reject) => {
      const tx = dbPromise.result.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const imagePutReq = store.put(blob, imageId);
      imagePutReq.onsuccess = (evt) => {
          const imageInStoreReq = store.get(imageId);
          imageInStoreReq.onsuccess = (evt) => {
              resolve(imageInStoreReq.result);
          };
      };
      imagePutReq.onerror = (evt) => {
          reject('Something went wrong while putting image in DB ');
      };
  });
}
const idbCacheHandler = async ({ request, url, event }) => { 
  const imageID = getImageIdFromURL(url);
  const storeName = getStoreNameFromURL(url);
  return fetchImageFromDB(imageID, storeName).then((blob) => {
      if (blob) {
          // If image is directly available in DB then return the blob as the response.
          return new Response(blob);
      } else {
          // If the image is unavailable, fetch the image by resuming the intercepted request to the server.
          return fetch(event.request).then(response => {
              const respClone = response.clone();
              return respClone.blob()
          }).then(imageBlob => {
              if (imageBlob.type.startsWith('image/')) {
                return putImageInDB(imageID, storeName, imageBlob).then((blob) => {
                    return new Response(blob);
                });
              } else {
                return new Response('', { "status" : 404 , "statusText" : "invalid image found (sw)"})
              }
          });
      }
  });
};
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_NORTH_TILES_BASE_URL' + '/[0-4]/.*')),
  idbCacheHandler
  // new CacheFirst({
  //   cacheName: validCaches['north'],
  // })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_SOUTH_TILES_BASE_URL' + '/[0-4]/.*')),
  idbCacheHandler
  // new CacheFirst({
  //   cacheName: validCaches['south'],
  // })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_THEWORLD_TILES_BASE_URL' + '/[0-5]/.*')),
  idbCacheHandler
  // new CacheFirst({
  //   cacheName: validCaches['theworld'],
  // })
);
registerRoute(
  ({url}) => url.href.match(new RegExp('CONF_PACIFIC_TILES_BASE_URL' + '/[0-4]/.*')),
  idbCacheHandler
  // new CacheFirst({
  //   cacheName: validCaches['pacific'],
  //   plugins: [
  //     new ExpirationPlugin({
  //       maxAgeSeconds: 15 * 60 * 3600
  //     })
  //   ]
  // })
);
// registerRoute(
//   ({url}) => url.href.match(new RegExp('(CONF_NORTH_TILES_BASE_URL|CONF_SOUTH_TILES_BASE_URL|CONF_PACIFIC_TILES_BASE_URL)/4/.*')),
//   new CacheFirst({
//     cacheName: validCaches['zoom4'],
//     plugins: [
//       new ExpirationPlugin({
//         maxEntries: 128
//       })
//     ]
//   })
// );
// registerRoute(
//   ({url}) => url.href.match(new RegExp('(CONF_THEWORLD_TILES_BASE_URL)/5/.*')),
//   new CacheFirst({
//     cacheName: validCaches['zoom5'],
//     plugins: [
//       new ExpirationPlugin({
//         maxEntries: 128
//       })
//     ]
//   })
// );
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
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
