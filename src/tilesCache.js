/* global mapboxgl */
import mapOptions from "./components/mapboxgl/mapOptions";

const FORCE_CACHE = '&force_cache';
const storeName2MapMatrix = Object.fromEntries(mapOptions.map(o => [o.cacheName, o.matrix]));
const imageIDRegex = /_(\d+)_(\d+)_(\d+)_/; // extract zoom,x, y from id

export class TilesCache {
    constructor(dbName, version, callback) {
        this.dbName = dbName;

        this.dbPromise = new Promise((resolve, reject) => {
            const open = indexedDB.open(dbName, version);
            open.onsuccess = () => {
                resolve(open);
            };
            open.onerror = () => {
                reject('Error while opening DB');
            };
            open.onupgradeneeded = (callback) ? callback.bind(null, open): () => {};
        });

    }
    getImageIdFromURL(url) {
        return url.pathname.replace(/[/.]/g,'_');
    }
    async fetchImageFromDB (imageId, storeName) {
        const open = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx =  open.result.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const imageInStoreReq = store.get(imageId);
            imageInStoreReq.onsuccess = () => {
                resolve(imageInStoreReq.result);
            };
            imageInStoreReq.onerror = () => {
                reject('Something went wrong while fetching image from DB ');
            };
        });
    }
    async putImageInDB(imageId, storeName, blob) {
        const open = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = open.result.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const imagePutReq = store.put(blob, imageId);
            imagePutReq.onsuccess = () => {
                const imageInStoreReq = store.get(imageId);
                imageInStoreReq.onsuccess = () => {
                    resolve(imageInStoreReq.result);
                };
            };
            imagePutReq.onerror = () => {
                reject('Something went wrong while putting image in DB ');
            };
        });
    }
    getCacheHandler(storeName) {
        return this._cacheHandler.bind(this, storeName);
    }
    getReadOnlyCacheHandler(storeName) {
        return this._cacheReadOnlyHandler.bind(this, storeName);
    }
    async isNotCached(storeName, url) {
        const imageID = this.getImageIdFromURL(url);
        const open = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx =  open.result.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const imageInStoreReq = store.getKey(imageID);
            imageInStoreReq.onsuccess = () => {
                resolve((imageInStoreReq.result === undefined) ? url : null); //returns url if not in cache, null otherwise
            };
            imageInStoreReq.onerror = () => {
                reject('Something went wrong while checking if cached from DB ');
            };
        });
    }
    async countTiles(storeName) {
        const open = await this.dbPromise;
        return (new Promise((resolve, reject) => {
            const tx =  open.result.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const countStoreReq = store.count();
            countStoreReq.onsuccess = () => resolve(countStoreReq.result);
            countStoreReq.onerror = () => reject('Something went wrong while counting entries from DB');
        }));
    }
    async close() {
        const open = await this.dbPromise;
        open.result.close();
    }
    async clear(storeName) {
      const open = await this.dbPromise;
      return (new Promise((resolve, reject) => {
        const tx =  open.result.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const clearStoreReq = store.clear();
        clearStoreReq.onsuccess = () => resolve(store);
        clearStoreReq.onerror = () => reject(`Something went wrong while purging ${storeName}`);
      }));
    }
    async _cacheHandler(storeName, { request, url}) {
        const imageID = this.getImageIdFromURL(url);
        const matrix = storeName2MapMatrix[storeName];
        if (matrix) {
          const [, zoom, x, y] = (imageIDRegex.exec(imageID) || []).map(v => parseInt(v, 10));
          if (zoom === undefined) console.error('tilesCache bad ID:', {zoom, x, y, matrix}, imageID);
          if (zoom && (x > matrix[zoom][0] - 1 || y > matrix[zoom][1] - 1)){
            return new Response('', { "status" : 404 , "statusText" : "non existing tile (sw)"});
          }
        }
        return this.fetchImageFromDB(imageID, storeName).then((blob) => {
            if (blob) {
                // If image is directly available in DB then return the blob as the response.
                return new Response(blob);
            } else {
                // If the image is unavailable, fetch the image by resuming the intercepted request to the server.
                return fetch(request).then(response => {
                    const respClone = response.clone();
                    return respClone.blob()
                }).then(imageBlob => {
                    if (imageBlob.type.startsWith('image/')||imageBlob.type === 'application/x-protobuf') {
                        return this.putImageInDB(imageID, storeName, imageBlob).then((blob) => {
                            return new Response(blob);
                        });
                    } else {
                        return new Response('', { "status" : 404 , "statusText" : "invalid image found (sw)"})
                    }
                });
            }
        });
    }
    /**
     * This cache does not write in DB unless FORCE_CACHE parameter is added to the url
     * This allows to browse the map without writing in the cache but at the same time to force an entry in the cache
     */
    async _cacheReadOnlyHandler(storeName, { request, url}) {
        const realURL = new URL(url.href.replace(FORCE_CACHE, ''));
        const force_cache = realURL.href !== url.href;
        const modifiedRequest = (force_cache) ? new Request(realURL, request) : request;
        const imageID = this.getImageIdFromURL(realURL);
        return this.fetchImageFromDB(imageID, storeName).then((blob) => {
            if (blob) {
                // If image is directly available in DB then return the blob as the response.
                return new Response(blob);
            } else {
                // If the image is unavailable, fetch the image by resuming the intercepted request to the server.
                return fetch(modifiedRequest).then(response => {
                    const respClone = response.clone();
                    return respClone.blob()
                }).then(imageBlob => {
                    if (imageBlob.type.startsWith('image/')||imageBlob.type === 'application/x-protobuf') {
                        if (force_cache) {
                          return this.putImageInDB(imageID, storeName, imageBlob).then((blob) => {
                              return new Response(blob);
                          });
                        } else {
                          return new Response(imageBlob);
                      }
                    } else {
                        return new Response('', { "status" : 404 , "statusText" : "invalid image found (sw)"})
                    }
                });
            }
        });
    }
}
function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
function gridRoute(route, zoom) {
  // Longitude size is (2 * Math.PI / 2 ^zoom) => at N60 is (Math.PI / 2 ^zoom)
    const points = route.split(Math.PI / Math.pow(2,zoom), {preserve:true, converter: null}).points;
    return gridPoints(points, zoom);
}
function gridPoints(points, zoom) {
    const max = Math.pow(2, zoom) - 1;
    const tileCoordinatesSet = [];
    for (const p of points) {
      // push 9 tiles per point
      const x = Math.trunc(lon2tile(p.longitude, zoom));
      const y = Math.trunc(lat2tile(p.latitude, zoom));
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const u = x + i;
          const v = y + j;
          if (u >= 0 && u <= max && v >= 0 && v <= max) {
            tileCoordinatesSet.push(`${u}_${v}`);
          }
        }
      }
    }
    return tileCoordinatesSet;
}
function vectorTileURL(map, zoom, x, y , force_cache='') {
  return new URL(`https://api.mapbox.com/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.1x3i1g8r,denizotjb.bifqeinj,denizotjb.cz0kdfpx,denizotjb.aop85z8z,mapbox.mapbox-terrain-v2/${zoom}/${x}/${y}.vector.pbf?sku=${map._requestManager._skuToken}&access_token=${mapboxgl.accessToken}${force_cache}`)
}
export const purgeHDCache = async () => {
  const cacheName = 'CONF_MERCATOR' + '_hd';
  const tilesCaches = new TilesCache('CONF_TILES_DB');
  console.debug(`clearing cache ${cacheName}`);
  return tilesCaches.clear(cacheName).finally(() => tilesCaches.close());
}
export const findMissingCacheTiles = async (ofp, mapData) => {
    const {map, mapOptions, bbox} = mapData;
    if (!map) return [];
    const tilesCaches = new TilesCache('CONF_TILES_DB');

    if (mapOptions.cacheAll) {
        const tilesCount = await tilesCaches.countTiles(mapOptions.cacheName);

        let tilesMax;
        if (mapOptions.matrix) {
            tilesMax = mapOptions.matrix.map(([w, h]) => w * h);
        } else {
            tilesMax = [...Array(mapOptions.cacheZoom + 1).keys()].map(v => Math.pow(2, v) * Math.pow(2, v));
        }
        if (tilesCount >= tilesMax.reduce((a, b) => a + b, 0)) {
            tilesCaches.close();
            // console.log('map is fully cached', tilesMax);
            caches[mapOptions.id] = true;
            return [];
        }
    }
    const promises = [];
    if (mapOptions.tiles) { // all but mercator
      const [sw, ne] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
      for (let zoom=0; zoom <= mapOptions.cacheZoom; zoom++) {
          let swXY, neXY;
          const max = Math.pow(2,zoom);
          if (mapOptions.cacheAll) {
              swXY={x: 0, y: max - 1};
              neXY={x: max - 1, y: 0};
          } else {
              swXY={x: lon2tile(sw[0], zoom), y: lat2tile(sw[1], zoom)};
              neXY={x: lon2tile(ne[0], zoom), y: lat2tile(ne[1], zoom)};
          }
          let maxX, maxY;
          if (mapOptions.matrix) {
              [maxX, maxY] = mapOptions.matrix[zoom];
          }else{
              [maxX, maxY] = [max, max];
          }

          for (let x=swXY.x; x<=neXY.x; x++) {
              for (let y=neXY.y; y<=swXY.y; y++) {
                  if(x>=0 && y>=0 && x<maxX && y<maxY){
                      const url = new URL(mapOptions.tiles[0].replace('{z}', zoom).replace('{x}', x).replace('{y}', y));
                      promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                  }
              }
          }
      }
    } else { // mercator
      const airports = [];
      const alternatePoints = ofp.wptCoordinatesAlternate();
      if (ofp.route && ofp.route.points.length > 0) airports.push(ofp.route.points[0], ofp.route.points[ofp.route.points.length - 1]);
      if (alternatePoints.length > 0) airports.push(alternatePoints[alternatePoints.length - 1]);
      // airports.push(...ofp.infos.raltPoints);
      for (let zoom=0; zoom <= mapOptions.cacheZoom; zoom++) {
        for (const x_y of (new Set(gridRoute(ofp.route, zoom).concat(gridPoints(airports, zoom))))) {
          const [x, y] = x_y.split('_');
          const url = new URL(`https://api.mapbox.com/v4/denizotjb.6nts91f3/${zoom}/${x}/${y}@2x.webp?sku=${map._requestManager._skuToken}&access_token=${mapboxgl.accessToken}`);
          promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
          promises.push(tilesCaches.isNotCached(mapOptions.cacheName, vectorTileURL(map, zoom, x, y)));
        }
      }
      if (mapOptions.routeCacheZoom){ // HD cache requires FORCE_CACHE
        const cacheName = mapOptions.cacheName+'_hd';
        // cache along route aind airports
        for (let zoom=mapOptions.cacheZoom + 1; zoom <= mapOptions.routeCacheZoom; zoom++) {
          for (const x_y of (new Set(gridRoute(ofp.route, zoom).concat(gridPoints(airports, zoom))))) {
            const [x, y] = x_y.split('_');
            const url = vectorTileURL(map, zoom, x, y, FORCE_CACHE);
            promises.push(tilesCaches.isNotCached(cacheName, url));
          }
        }
        // // cache airports
        for (let zoom=mapOptions.routeCacheZoom + 1; zoom <= 9; zoom++) {
          for (const x_y of (new Set(gridPoints(airports, zoom)))) {
            const [x, y] = x_y.split('_');
            const url = vectorTileURL(map, zoom, x, y, FORCE_CACHE);
            promises.push(tilesCaches.isNotCached(cacheName, url));
          }
        }
      }
    }
    return Promise.all(promises)
    .then(results => results.filter(url => url !== null))
    .finally(() => tilesCaches.close());
};
