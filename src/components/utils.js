export class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject)=> {
            this.reject = reject
            this.resolve = resolve
        })
    }
}
export const runningOnIpad = (navigator.platform === "iPad")||(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const usingChromeOnIOS = /CriOS/i.test(navigator.userAgent) && /iphone|ipod|ipad/i.test(navigator.userAgent);
export const usingSafari = /Safari\//i.test(navigator.userAgent) && !(/(Chrome\/|Chromium\/)/i.test(navigator.userAgent));
export const supportsHover = matchMedia('(hover: hover)').matches;

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

// intersect a segment against one of the 4 lines that make up the bbox

function intersect(a, b, edge, bbox) {
    return edge & 8 ? [a[0] + (b[0] - a[0]) * (bbox[3] - a[1]) / (b[1] - a[1]), bbox[3]] : // top
        edge & 4 ? [a[0] + (b[0] - a[0]) * (bbox[1] - a[1]) / (b[1] - a[1]), bbox[1]] : // bottom
        edge & 2 ? [bbox[2], a[1] + (b[1] - a[1]) * (bbox[2] - a[0]) / (b[0] - a[0])] : // right
        edge & 1 ? [bbox[0], a[1] + (b[1] - a[1]) * (bbox[0] - a[0]) / (b[0] - a[0])] : null; // left
}

// bit code reflects the point position relative to the bbox:

//         left  mid  right
//    top  1001  1000  1010
//    mid  0001  0000  0010
// bottom  0101  0100  0110

function bitCode(p, bbox) {
    var code = 0;

    if (p[0] < bbox[0]) code |= 1; // left
    else if (p[0] > bbox[2]) code |= 2; // right

    if (p[1] < bbox[1]) code |= 4; // bottom
    else if (p[1] > bbox[3]) code |= 8; // top

    return code;
}

export function lineclip(points, bbox, result) {

    var len = points.length,
        codeA = bitCode(points[0], bbox),
        part = [],
        i, a, b, codeB, lastCode;

    if (!result) result = [];

    for (i = 1; i < len; i++) {
        a = points[i - 1];
        b = points[i];
        codeB = lastCode = bitCode(b, bbox);

        // eslint-disable-next-line no-constant-condition
        while (true) {

            if (!(codeA | codeB)) { // accept
                part.push(a);

                if (codeB !== lastCode) { // segment went outside
                    part.push(b);

                    if (i < len - 1) { // start a new line
                        result.push(part);
                        part = [];
                    }
                } else if (i === len - 1) {
                    part.push(b);
                }
                break;

            } else if (codeA & codeB) { // trivial reject
                break;

            } else if (codeA) { // a outside, intersect with clip edge
                a = intersect(a, b, codeA, bbox);
                codeA = bitCode(a, bbox);

            } else { // b outside
                b = intersect(a, b, codeB, bbox);
                codeB = bitCode(b, bbox);
            }
        }

        codeA = lastCode;
    }

    if (part.length) result.push(part);

    return result;
}

export function promiseTimeout(ms, promise){
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('Timed out in '+ ms + 'ms.')
        }, ms)
    });
    // Returns a race between our timeout and the passed in promise
    return Promise.race([
        promise,
        timeout
    ]);
}

export function lon2tile(lon,zoom) { return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
export function lat2tile(lat,zoom)  { return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }
export const getBounds = (points, affineAndClamp, result=[Infinity, Infinity, -Infinity, -Infinity]) => {
    for (const [lng, lat] of points.map(g => (affineAndClamp) ? affineAndClamp([g.longitude, g.latitude]) : [g.longitude, g.latitude])) {
        if (result[0] > lng) { result[0] = lng; }
        if (result[1] > lat) { result[1] = lat; }
        if (result[2] < lng) { result[2] = lng; }
        if (result[3] < lat) { result[3] = lat; }
    }
    result[0] -= 1;
    result[1] -= 1;
    result[2] += 1;
    result[3] += 1;
    return result;
}

export async function fetchSimultaneously(urls, fetchCallback) {
    const queue = urls;
    const maxSimultaneouslyRequests = 5;
    let currentRequests = 0;
    let i = 0;

    return await new Promise(resolve => {

        const fetcher = setInterval(async () => {
            if (queue.filter(url => url).length === 0) {
                clearInterval(fetcher);
                resolve();
            }

            if (currentRequests >= maxSimultaneouslyRequests || i > queue.length - 1) {
                return;
            }

            // Get current index and increase i
            const index = i++;
            const url = queue[index];

            currentRequests++;
            try {
                await fetch(url);
                if (fetchCallback) fetchCallback();
            } catch {}
            currentRequests--;

            // Set value of index to empty (undefined)
            delete queue[index];
        }, 100);
    });
}