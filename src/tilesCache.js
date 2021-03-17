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
        return new Promise((resolve, reject) => {
            const tx =  open.result.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const countStoreReq = store.count();
            countStoreReq.onsuccess = () => resolve(countStoreReq.result);
            countStoreReq.onerror = () => reject('Something went wrong while counting entries from DB');
        });
    }
    async close() {
        const open = await this.dbPromise;
        open.result.close();
    }
    async _cacheHandler(storeName, { request, url }) {
        const imageID = this.getImageIdFromURL(url);
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
}
function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
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
            console.log('map is fully cached', tilesMax);
            caches[mapOptions.id] = true;
            return [];
        }
    }

    const [sw, ne] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
    const promises = [];
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
                    let url;
                    if(mapOptions.tiles) {
                        url = new URL(mapOptions.tiles[0].replace('{z}', zoom).replace('{x}', x).replace('{y}', y));
                        promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                    } else {
                        url = new URL(`https://api.mapbox.com/v4/denizotjb.63g5ah66/${zoom}/${x}/${y}@2x.webp?sku=${map._requestManager._skuToken}&access_token=${mapboxgl.accessToken}`);
                        promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                        url = new URL(`https://api.mapbox.com/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.bifqeinj,denizotjb.cz0kdfpx,mapbox.mapbox-terrain-v2/${zoom}/${x}/${y}.vector.pbf?sku=${map._requestManager._skuToken}&access_token=${mapboxgl.accessToken}`);
                        promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                    }
                }
            }
        }
    }
    const results = await Promise.all(promises);
    tilesCaches.close();
    return results.filter(url => url !== null);
};
