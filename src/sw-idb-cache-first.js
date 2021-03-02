export class IDBCacheFirst {
    constructor(dbName, version, callback, mercatorStore) {
        this.dbName = dbName;
        this.mercatorStore = mercatorStore;
        const open = indexedDB.open(dbName, version);
        this.dbPromise = open;
        open.onsuccess = () => {
            console.log('DB opened successfully');
        };
        open.onerror = () => {
            console.log('Error while opening DB');
        };
        open.onupgradeneeded = callback.bind(null, open);
    }
    getImageIdFromURL(url) {
        return url.pathname.replace(/[/.]/g,'_');
    }
    getStoreNameFromURL(url){
        if (url.href.startsWith('https://api.mapbox.com')) {
            return this.mercatorStore;
        }
        return url.pathname.replace(/[/.]/g,'_').split('_')[1];
    }
    fetchImageFromDB (imageId, storeName) {
        return new Promise((resolve, reject) => {
            const tx =  this.dbPromise.result.transaction(storeName, 'readonly');
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
    putImageInDB(imageId, storeName, blob) {
        return new Promise((resolve, reject) => {
            const tx = this.dbPromise.result.transaction(storeName, 'readwrite');
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
    async cacheHandler({ request, url }) {
        const imageID = this.getImageIdFromURL(url);
        const storeName = this.getStoreNameFromURL(url);
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
