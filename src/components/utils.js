export class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject)=> {
            this.reject = reject
            this.resolve = resolve
        })
    }
}
export const runningOnIpad = (navigator.platform === "iPad")||(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const runningOnIpadUsingIOS15 = runningOnIpad && /Version\/15/i.test(navigator.userAgent);
export const usingChromeOnIOS = /CriOS/i.test(navigator.userAgent) && /iphone|ipod|ipad/i.test(navigator.userAgent);
export const usingSafari = /Safari\//i.test(navigator.userAgent) && !(/(Chrome\/|Chromium\/)/i.test(navigator.userAgent));
export const supportsHover = matchMedia('(hover: hover)').matches;
export const noop = () => {};
export const previousOFPKey = 'previousOFP';
export const previousOFPUIDKey = 'previousOFPUID';
export const previousOFPExpirationKey = 'previousOFPExpiration';
export const previousMapProjectionKey = 'previousMapProjectionId';
export const previousTakeOFFKey = 'previousOFP2MAPTakeOFF';

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
export function throttle(func, wait, leading, trailing, context) {
    let ctx, args, result;
    let timeout = null;
    let previous = 0;
    const later = function() {
        previous = new Date;
        timeout = null;
        result = func.apply(ctx, args);
    };
    return function() {
        var now = new Date;
        if (!previous && !leading) previous = now;
        var remaining = wait - (now - previous);
        ctx = context || this;
        args = arguments;
        // Si la période d'attente est écoulée
        if (remaining <= 0) {
            // Réinitialiser les compteurs
            clearTimeout(timeout);
            timeout = null;
            // Enregistrer le moment du dernier appel
            previous = now;
            // Appeler la fonction
            result = func.apply(ctx, args);
        } else if (!timeout && trailing) {
            // Sinon on s’endort pendant le temps restant
            timeout = setTimeout(later, remaining);
        }
        return result;
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
export function folder2prefix(str){
    switch (str) {
        case "rmain":
            return "route";
        case "ralt":
            return "alternate";
        case "rnat":
            return "nat";
        default:
            return str;
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
    // noinspection JSBitwiseOperatorUsage
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

export function polygonclip(points, bbox) {

    var result, edge, prev, prevInside, i, p, inside;

    // clip against each side of the clip rectangle
    for (edge = 1; edge <= 8; edge *= 2) {
        result = [];
        prev = points[points.length - 1];
        prevInside = !(bitCode(prev, bbox) & edge);

        for (i = 0; i < points.length; i++) {
            p = points[i];
            inside = !(bitCode(p, bbox) & edge);

            // if segment goes through the clip window, add an intersection
            if (inside !== prevInside) result.push(intersect(prev, p, edge, bbox));

            if (inside) result.push(p); // add a point if it's inside

            prev = p;
            prevInside = inside;
        }

        points = result;

        if (!points.length) break;
    }

    return result;
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
    const controller = new AbortController();
    const signal = controller.signal;
    return await new Promise((resolve, reject) => {
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
                await fetch(url, {signal});
                if (fetchCallback) fetchCallback();
            } catch(err) {
              clearInterval(fetcher);
              controller.abort();
              reject(err);
            }
            currentRequests--;

            // Set value of index to empty (undefined)
            delete queue[index];
        }, 100);
    });
}

export const isPatchUpdate = (current, next) => {
    const cParts = current.split('.');
    const nParts = next.split('.');
    return cParts.slice(0, -1).join('.') === nParts.slice(0, -1).join('.');
}
//semver-compare
export const semverCompare = (a, b) => {
    let pa = a.split('.');
    let pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        let na = Number(pa[i]);
        let nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};

export const shareAppLink = async () => {
    const shareData = {
        'title': 'OFP2MAP',
        'url': window.location.pathname
    };
    try {
        await navigator.share(shareData)
    } catch(err) {
        console.log(err);
    }
    return false;
};

// search for condition in array, returns the index, -1 if no match (-1 also for empty array)
// condition might be > or >= for ascending order array, < or < = for descending order array
export const binarysearch = (sortedArray, condition) => {
    let start = 0, end = sortedArray.length - 1;
    let ans = -1;
    while (start <= end)
    {
        let mid = Math.trunc((start + end) / 2);
        if (!condition(sortedArray[mid]))
        {
            start = mid + 1;
        }
        else
        {
            ans = mid;
            end = mid - 1;
        }
    }
    return (ans === -1 || !condition(sortedArray[ans])) ? -1 : ans;
};

export const focusMap = (evenIfHidden= false) => {
    const canvas = (evenIfHidden) ?
        document.querySelector("#map canvas.mapboxgl-canvas") :
        document.querySelector("page:not(.d-none)>#map canvas.mapboxgl-canvas");
    if (canvas) canvas.focus();
};

const ofpUID = (ofp) => `${ofp.infos.flightNo}_${ofp.infos.depICAO}_${ofp.infos.destICAO}_${ofp.infos.flightNo}_${ofp.infos.ofpOUT.toISOString()}_${ofp.infos.ofp.replace('/','-')}}`;

const getPrevious = (key, ofp) => {
    if (ofp === undefined) {
        console.trace('ofp parameter missing');
        return null;
    }
    if (localStorage) {
        const previousKey = localStorage.getItem(key);
        const previousOFPUID = localStorage.getItem(previousOFPUIDKey);
        const previousExpiration = localStorage.getItem(previousOFPExpirationKey);
        if (previousKey && previousExpiration && parseInt(previousExpiration, 10) > Date.now()) {
            if (ofp === null || (!!ofp && previousOFPUID === ofpUID(ofp))) {
                return previousKey;
            }
        }
    }
    return null;
};
export const savePrevious = (key, value) => {
    if (localStorage && key) {
        localStorage.setItem(key, value);
    }
};
export const savePreviousMapProjection = value => savePrevious(previousMapProjectionKey, value);
export const getPreviousMapProjection = ofp => (ofp) ? getPrevious(previousMapProjectionKey, ofp) : null;
export const savePreviousTakeOFF = value => savePrevious(previousTakeOFFKey, value);
export const getPreviousTakeOFF = ofp => {
    const timestampString = (ofp) ? getPrevious(previousTakeOFFKey, ofp) : null;
    if (timestampString) {
        return parseInt(timestampString, 10);
    }
    return null;
};
export const getPreviousOFPText = () => {
    return getPrevious(previousOFPKey, null);
};
export const isPreviousOFPExpired = (delayMs=0) => {
    const previousExpiration = localStorage.getItem(previousOFPExpirationKey);
    if (previousExpiration) {
      return (parseInt(previousExpiration, 10) + delayMs) < Date.now();
    }
    return true;
};
export const savePreviousOFP = (ofp) => {
    if (localStorage && ofp) {
        localStorage.setItem(previousOFPUIDKey, ofpUID(ofp));
        localStorage.setItem(previousOFPKey, ofp.text);
        localStorage.setItem(previousOFPExpirationKey, Math.max(Date.now() + 1800000, ofp.infos.ofpIN.getTime()));
        localStorage.setItem(previousTakeOFFKey, ofp.infos.ofpOFF.getTime());
        localStorage.removeItem(previousMapProjectionKey);
    }
};
export const deletePreviousOFP = () => {
    if (localStorage) {
        localStorage.removeItem(previousOFPUIDKey);
        localStorage.removeItem(previousOFPKey);
        localStorage.removeItem(previousOFPExpirationKey);
        localStorage.removeItem(previousTakeOFFKey);
        localStorage.removeItem(previousMapProjectionKey);
    }
};
