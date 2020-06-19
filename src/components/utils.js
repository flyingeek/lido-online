export class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject)=> {
            this.reject = reject
            this.resolve = resolve
        })
    }
}
export const runningOnIpad = (navigator.platform === "iPad")||(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

export function folderName(str) {
    const a = str.split('-');
    const name = a.slice(0, -1).join('');
    switch (name) {
        case "route":
            return "rmain";
        case "alternate":
            return "ralt";
        case "nat":
            return "rnat";
        default:
            return name;
    }
}

export function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

export function isInside(num, min, max) {
    return num < min ? false : num > max ? false : true;
}

export async function addToSWCache(urls, cacheName) {
    if (window.caches) {
        try {
            const myCache = await window.caches.open(cacheName);
            await myCache.addAll(urls);
        } catch (err) {
            //console.log('could not cache', err);
        }
    }
}