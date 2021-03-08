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
