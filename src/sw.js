import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate, CacheFirst, NetworkFirst} from 'workbox-strategies';
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

registerRoute(
    /.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|mapbox-gl\.js|mapbox-gl\.css)$/,
    new CacheFirst({
      cacheName: 'lido-3rd-static'
    })
);
registerRoute(
  ({url}) => url.origin === self.location.origin && (url.pathname === '/lidojs.js' || url.pathname === '/wmo.var.js'),
  new NetworkFirst({
    cacheName: 'lido-ressources'
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
        maxAgeSeconds: 24 * 60, // 24h
      })
    ]
  })
);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open("lido-3rd-static")
        .then((cache) => cache.addAll(thirdPartyUrls))
    );
    event.waitUntil(
        caches.open("lido-ressources")
        .then((cache) => cache.addAll(lidoUrls))
    );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
