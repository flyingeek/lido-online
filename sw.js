!function(){"use strict";try{self["workbox:precaching:5.1.4"]&&_()}catch(e){}const e=[],t={get:()=>e,add(t){e.push(...t)}};try{self["workbox:core:5.1.4"]&&_()}catch(e){}const s={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[s.prefix,e,s.suffix].filter((e=>e&&e.length>0)).join("-"),a=e=>e||n(s.precache),r=e=>e||n(s.runtime),i=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class o extends Error{constructor(e,t){super(i(e,t)),this.name=e,this.details=t}}const c=new Set;const h=(e,t)=>e.filter((e=>t in e)),l=async({request:e,mode:t,plugins:s=[]})=>{const n=h(s,"cacheKeyWillBeUsed");let a=e;for(const e of n)a=await e.cacheKeyWillBeUsed.call(e,{mode:t,request:a}),"string"==typeof a&&(a=new Request(a));return a},u=async({cacheName:e,request:t,event:s,matchOptions:n,plugins:a=[]})=>{const r=await self.caches.open(e),i=await l({plugins:a,request:t,mode:"read"});let o=await r.match(i,n);for(const t of a)if("cachedResponseWillBeUsed"in t){const a=t.cachedResponseWillBeUsed;o=await a.call(t,{cacheName:e,event:s,matchOptions:n,cachedResponse:o,request:i})}return o},p=async({cacheName:e,request:t,response:s,event:n,plugins:a=[],matchOptions:r})=>{const i=await l({plugins:a,request:t,mode:"write"});if(!s)throw new o("cache-put-with-no-response",{url:(p=i.url,new URL(String(p),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var p;const d=await(async({request:e,response:t,event:s,plugins:n=[]})=>{let a=t,r=!1;for(const t of n)if("cacheWillUpdate"in t){r=!0;const n=t.cacheWillUpdate;if(a=await n.call(t,{request:e,response:a,event:s}),!a)break}return r||(a=a&&200===a.status?a:void 0),a||null})({event:n,plugins:a,response:s,request:i});if(!d)return;const f=await self.caches.open(e),m=h(a,"cacheDidUpdate"),g=m.length>0?await u({cacheName:e,matchOptions:r,request:i}):null;try{await f.put(i,d)}catch(e){throw"QuotaExceededError"===e.name&&await async function(){for(const e of c)await e()}(),e}for(const t of m)await t.cacheDidUpdate.call(t,{cacheName:e,event:n,oldResponse:g,newResponse:d,request:i})},d=u,f=async({request:e,fetchOptions:t,event:s,plugins:n=[]})=>{if("string"==typeof e&&(e=new Request(e)),s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const a=h(n,"fetchDidFail"),r=a.length>0?e.clone():null;try{for(const t of n)if("requestWillFetch"in t){const n=t.requestWillFetch,a=e.clone();e=await n.call(t,{request:a,event:s})}}catch(e){throw new o("plugin-error-request-will-fetch",{thrownError:e})}const i=e.clone();try{let a;a="navigate"===e.mode?await fetch(e):await fetch(e,t);for(const e of n)"fetchDidSucceed"in e&&(a=await e.fetchDidSucceed.call(e,{event:s,request:i,response:a}));return a}catch(e){for(const t of a)await t.fetchDidFail.call(t,{error:e,event:s,originalRequest:r.clone(),request:i.clone()});throw e}};let m;async function g(e,t){const s=e.clone(),n={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},a=t?t(n):n,r=function(){if(void 0===m){const e=new Response("");if("body"in e)try{new Response(e.body),m=!0}catch(e){m=!1}m=!1}return m}()?s.body:await s.blob();return new Response(r,a)}function w(e){if(!e)throw new o("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:t,url:s}=e;if(!s)throw new o("add-to-cache-list-unexpected-type",{entry:e});if(!t){const e=new URL(s,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(s,location.href),a=new URL(s,location.href);return n.searchParams.set("__WB_REVISION__",t),{cacheKey:n.href,url:a.href}}class y{constructor(e){this._cacheName=a(e),this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map}addToCacheList(e){const t=[];for(const s of e){"string"==typeof s?t.push(s):s&&void 0===s.revision&&t.push(s.url);const{cacheKey:e,url:n}=w(s),a="string"!=typeof s&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new o("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof s&&s.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==s.integrity)throw new o("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,s.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,a),t.length>0){const e=`Workbox is precaching URLs without revision info: ${t.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}async install({event:e,plugins:t}={}){const s=[],n=[],a=await self.caches.open(this._cacheName),r=await a.keys(),i=new Set(r.map((e=>e.url)));for(const[e,t]of this._urlsToCacheKeys)i.has(t)?n.push(e):s.push({cacheKey:t,url:e});const o=s.map((({cacheKey:s,url:n})=>{const a=this._cacheKeysToIntegrities.get(s),r=this._urlsToCacheModes.get(n);return this._addURLToCache({cacheKey:s,cacheMode:r,event:e,integrity:a,plugins:t,url:n})}));await Promise.all(o);return{updatedURLs:s.map((e=>e.url)),notUpdatedURLs:n}}async activate(){const e=await self.caches.open(this._cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const a of t)s.has(a.url)||(await e.delete(a),n.push(a.url));return{deletedURLs:n}}async _addURLToCache({cacheKey:e,url:t,cacheMode:s,event:n,plugins:a,integrity:r}){const i=new Request(t,{integrity:r,cache:s,credentials:"same-origin"});let c,h=await f({event:n,plugins:a,request:i});for(const e of a||[])"cacheWillUpdate"in e&&(c=e);if(!(c?await c.cacheWillUpdate({event:n,request:i,response:h}):h.status<400))throw new o("bad-precaching-response",{url:t,status:h.status});h.redirected&&(h=await g(h)),await p({event:n,plugins:a,response:h,request:e===t?i:new Request(e),cacheName:this._cacheName,matchOptions:{ignoreSearch:!0}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this._cacheName)).match(s)}}createHandler(e=!0){return async({request:t})=>{try{const e=await this.matchPrecache(t);if(e)return e;throw new o("missing-precache-entry",{cacheName:this._cacheName,url:t instanceof Request?t.url:t})}catch(s){if(e)return fetch(t);throw s}}}createHandlerBoundToURL(e,t=!0){if(!this.getCacheKeyForURL(e))throw new o("non-precached-url",{url:e});const s=this.createHandler(t),n=new Request(e);return()=>s({request:n})}}let v;const x=()=>(v||(v=new y),v);const R=(e,t)=>{const s=x().getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t,directoryIndex:s,cleanURLs:n,urlManipulation:a}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(a){const e=a({url:r});for(const t of e)yield t.href}}(e,t)){const e=s.get(n);if(e)return e}};let b=!1;function q(e){b||((({ignoreURLParametersMatching:e=[/^utm_/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:n}={})=>{const r=a();self.addEventListener("fetch",(a=>{const i=R(a.request.url,{cleanURLs:s,directoryIndex:t,ignoreURLParametersMatching:e,urlManipulation:n});if(!i)return;let o=self.caches.open(r).then((e=>e.match(i))).then((e=>e||fetch(i)));a.respondWith(o)}))})(e),b=!0)}const U=e=>{const s=x(),n=t.get();e.waitUntil(s.install({event:e,plugins:n}).catch((e=>{throw e})))},E=e=>{const t=x();e.waitUntil(t.activate())};try{self["workbox:routing:5.1.4"]&&_()}catch(e){}const N=e=>e&&"object"==typeof e?e:{handle:e};class T{constructor(e,t,s="GET"){this.handler=N(t),this.match=e,this.method=s}}class L extends T{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class j{constructor(){this._routes=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map((e=>{"string"==typeof e&&(e=[e]);const t=new Request(...e);return this.handleRequest({request:t})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const{params:n,route:a}=this.findMatchingRoute({url:s,request:e,event:t});let r,i=a&&a.handler;if(!i&&this._defaultHandler&&(i=this._defaultHandler),i){try{r=i.handle({url:s,request:e,event:t,params:n})}catch(e){r=Promise.reject(e)}return r instanceof Promise&&this._catchHandler&&(r=r.catch((n=>this._catchHandler.handle({url:s,request:e,event:t})))),r}}findMatchingRoute({url:e,request:t,event:s}){const n=this._routes.get(t.method)||[];for(const a of n){let n;const r=a.match({url:e,request:t,event:s});if(r)return n=r,(Array.isArray(r)&&0===r.length||r.constructor===Object&&0===Object.keys(r).length||"boolean"==typeof r)&&(n=void 0),{route:a,params:n}}return{}}setDefaultHandler(e){this._defaultHandler=N(e)}setCatchHandler(e){this._catchHandler=N(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new o("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(!(t>-1))throw new o("unregister-route-route-not-registered");this._routes.get(e.method).splice(t,1)}}let O;const C=()=>(O||(O=new j,O.addFetchListener(),O.addCacheListener()),O);function S(e,t,s){let n;if("string"==typeof e){const a=new URL(e,location.href);n=new T((({url:e})=>e.href===a.href),t,s)}else if(e instanceof RegExp)n=new L(e,t,s);else if("function"==typeof e)n=new T(e,t,s);else{if(!(e instanceof T))throw new o("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=e}return C().registerRoute(n),n}try{self["workbox:strategies:5.1.4"]&&_()}catch(e){}class K{constructor(e={}){this._cacheName=r(e.cacheName),this._plugins=e.plugins||[],this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:t}){"string"==typeof t&&(t=new Request(t));let s,n=await d({cacheName:this._cacheName,request:t,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(!n)try{n=await this._getFromNetwork(t,e)}catch(e){s=e}if(!n)throw new o("no-response",{url:t.url,error:s});return n}async _getFromNetwork(e,t){const s=await f({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=s.clone(),a=p({cacheName:this._cacheName,request:e,response:n,event:t,plugins:this._plugins});if(t)try{t.waitUntil(a)}catch(e){}return s}}const M={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};function A(e){e.then((()=>{}))}class k{constructor(e,t,{onupgradeneeded:s,onversionchange:n}={}){this._db=null,this._name=e,this._version=t,this._onupgradeneeded=s,this._onversionchange=n||(()=>this.close())}get db(){return this._db}async open(){if(!this._db)return this._db=await new Promise(((e,t)=>{let s=!1;setTimeout((()=>{s=!0,t(new Error("The open request was blocked and timed out"))}),this.OPEN_TIMEOUT);const n=indexedDB.open(this._name,this._version);n.onerror=()=>t(n.error),n.onupgradeneeded=e=>{s?(n.transaction.abort(),n.result.close()):"function"==typeof this._onupgradeneeded&&this._onupgradeneeded(e)},n.onsuccess=()=>{const t=n.result;s?t.close():(t.onversionchange=this._onversionchange.bind(this),e(t))}})),this}async getKey(e,t){return(await this.getAllKeys(e,t,1))[0]}async getAll(e,t,s){return await this.getAllMatching(e,{query:t,count:s})}async getAllKeys(e,t,s){return(await this.getAllMatching(e,{query:t,count:s,includeKeys:!0})).map((e=>e.key))}async getAllMatching(e,{index:t,query:s=null,direction:n="next",count:a,includeKeys:r=!1}={}){return await this.transaction([e],"readonly",((i,o)=>{const c=i.objectStore(e),h=t?c.index(t):c,l=[],u=h.openCursor(s,n);u.onsuccess=()=>{const e=u.result;e?(l.push(r?e:e.value),a&&l.length>=a?o(l):e.continue()):o(l)}}))}async transaction(e,t,s){return await this.open(),await new Promise(((n,a)=>{const r=this._db.transaction(e,t);r.onabort=()=>a(r.error),r.oncomplete=()=>n(),s(r,(e=>n(e)))}))}async _call(e,t,s,...n){return await this.transaction([t],s,((s,a)=>{const r=s.objectStore(t),i=r[e].apply(r,n);i.onsuccess=()=>a(i.result)}))}close(){this._db&&(this._db.close(),this._db=null)}}k.prototype.OPEN_TIMEOUT=2e3;const D={readonly:["get","count","getKey","getAll","getAllKeys"],readwrite:["add","put","clear","delete"]};for(const[e,t]of Object.entries(D))for(const s of t)s in IDBObjectStore.prototype&&(k.prototype[s]=async function(t,...n){return await this._call(s,t,e,...n)});try{self["workbox:expiration:5.1.4"]&&_()}catch(e){}const P="cache-entries",I=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class W{constructor(e){this._cacheName=e,this._db=new k("workbox-expiration",1,{onupgradeneeded:e=>this._handleUpgrade(e)})}_handleUpgrade(e){const t=e.target.result.createObjectStore(P,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1}),(async e=>{await new Promise(((t,s)=>{const n=indexedDB.deleteDatabase(e);n.onerror=()=>{s(n.error)},n.onblocked=()=>{s(new Error("Delete blocked"))},n.onsuccess=()=>{t()}}))})(this._cacheName)}async setTimestamp(e,t){const s={url:e=I(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)};await this._db.put(P,s)}async getTimestamp(e){return(await this._db.get(P,this._getId(e))).timestamp}async expireEntries(e,t){const s=await this._db.transaction(P,"readwrite",((s,n)=>{const a=s.objectStore(P).index("timestamp").openCursor(null,"prev"),r=[];let i=0;a.onsuccess=()=>{const s=a.result;if(s){const n=s.value;n.cacheName===this._cacheName&&(e&&n.timestamp<e||t&&i>=t?r.push(s.value):i++),s.continue()}else n(r)}})),n=[];for(const e of s)await this._db.delete(P,e.id),n.push(e.url);return n}_getId(e){return this._cacheName+"|"+I(e)}}class B{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._cacheName=e,this._timestampModel=new W(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const e of t)await s.delete(e);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,A(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){return await this._timestampModel.getTimestamp(e)<Date.now()-1e3*this._maxAgeSeconds}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class F{constructor(e={}){var t;this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:n})=>{if(!n)return null;const a=this._isResponseDateFresh(n),r=this._getCacheExpiration(s);A(r.expireEntries());const i=r.updateTimestamp(t.url);if(e)try{e.waitUntil(i)}catch(e){}return a?n:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&(t=()=>this.deleteCacheAndMetadata(),c.add(t))}_getCacheExpiration(e){if(e===r())throw new o("expire-custom-caches-only");let t=this._cacheExpirations.get(e);return t||(t=new B(e,this._config),this._cacheExpirations.set(e,t)),t}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}const H="northv3",$="southv3",z="pacificv1",G="theworldv2",V="lido-warmup",Q="lido-mapbox",J="lido-data",X="lido-fir",Y="lido-gramet2",Z=["lido-ona-theworldv1","lido-zoom5_ona1","lido-ona-theworldv2","lido-zoom5_ona2","lido-ona-southv3","lido-ona-northv3","lido-ona-pacificv1","lido-zoom4_ona3_ona3_ona1"],ee=["swtest"];var te,se;te=[{"revision":"761523c07f54aff4e43f63fc1fe7f921","url":"index.html"},{"revision":"74188d6ac788a0bd90c0a2354710c229","url":"images/ofp2map-icons/icon-180x180.png"},{"revision":"a2af94b7b7af7491c7443e39862acb75","url":"images/ofp2map-icons/icon-128x128.png"},{"revision":"ab6e00281f98e876ffa8693dc7e4aa16","url":"css/bundle.css"},{"revision":"fc4f39761ca665bc5c436e404eeccd64","url":"js/bundle.js"},{"revision":"c91b009cf61317c952c846696614b167","url":"svg/Air_France_Logo.svg"},{"revision":"a71d482d2ab40879af8dcc00b21143b7","url":"svg/worldmap.svg"},{"revision":"bbe6044400b48432202958c1684ac1ed","url":"sdf/maki-marker-sdf.png"},{"revision":"ae8eb6c1acf90de671f61ebd3c06523d","url":"sdf/map-circle-sdf.png"},{"revision":"e5437d8af78d3b5af20aa7a4bc6c7253","url":"sdf/map-plane-sdf.png"},{"revision":"aede03a01013f77c127e3f79068c9ff2","url":"sdf/map-star-sdf.png"},{"revision":"3cad1d5b1d95fd21e80b7077707b32ee","url":"sdf/map-triangle-sdf.png"}],se={directoryIndex:null,ignoreURLParametersMatching:[/.+Pin$/,/.+Display$/,/.+Color$/,/.+PinPosition$/,/^shortcut$/,/^downloadType$/,/^runShortcut$/]},function(e){x().addToCacheList(e),e.length>0&&(self.addEventListener("install",U),self.addEventListener("activate",E))}(te),q(se);const ne=["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.css","https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css","https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js"],ae=["./js/lidojs.1.3.6.min.js","./js/wmo.1.3.6.var.js"],re=ne.concat(ae);S(/.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|proj4\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js)$/,new K({cacheName:V})),S((({url:e})=>"https://api.mapbox.com"===e.origin&&(e.pathname.startsWith("/styles/")||e.pathname.startsWith("/fonts/")||"/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json"===e.pathname)),new class{constructor(e={}){if(this._cacheName=r(e.cacheName),this._plugins=e.plugins||[],e.plugins){const t=e.plugins.some((e=>!!e.cacheWillUpdate));this._plugins=t?e.plugins:[M,...e.plugins]}else this._plugins=[M];this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:t}){"string"==typeof t&&(t=new Request(t));const s=this._getFromNetwork({request:t,event:e});let n,a=await d({cacheName:this._cacheName,request:t,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(a){if(e)try{e.waitUntil(s)}catch(n){}}else try{a=await s}catch(e){n=e}if(!a)throw new o("no-response",{url:t.url,error:n});return a}async _getFromNetwork({request:e,event:t}){const s=await f({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=p({cacheName:this._cacheName,request:e,response:s.clone(),event:t,plugins:this._plugins});if(t)try{t.waitUntil(n)}catch(e){}return s}}({cacheName:Q})),S((({url:e})=>e.pathname.endsWith("/data/airports.2102.geojson")),new K({cacheName:J,plugins:[new F({maxEntries:2})]})),S((({url:e})=>e.pathname.endsWith("/data/fir-reg.2102.geojson")),new K({cacheName:X,plugins:[new F({maxEntries:2})]})),S((({url:e})=>e.href.match(new RegExp("https://ofp2map-gramet.vercel.app/api/${data.proxy}__${data.route.name.replace(/[^a-z0-9-_]/giu, '_')}.png".replace(/\$\{[^}]+\}/g,".+")))),new K({cacheName:Y,plugins:[new F({maxEntries:5,maxAgeSeconds:172800})]}));const ie=(()=>{const e=indexedDB.open("lido-tiles",2);return e.onsuccess=e=>{console.log("DB opened successfully")},e.onerror=e=>{console.log("Error while opening DB")},e.onupgradeneeded=t=>{t.oldVersion<1&&e.result.createObjectStore(G),t.oldVersion<2&&(e.result.createObjectStore(H),e.result.createObjectStore($),e.result.createObjectStore(z))},e})(),oe=async({request:e,url:t,event:s})=>{const n=(e=>new URL(e).pathname.replace(/[/.]/g,"_"))(t),a=(e=>new URL(e).pathname.replace(/[/.]/g,"_").split("_")[1])(t);return((e,t)=>new Promise(((s,n)=>{const a=ie.result.transaction(t,"readonly").objectStore(t).get(e);a.onsuccess=e=>{s(a.result)},a.onerror=e=>{n("Something went wrong while fetching image from DB ")}})))(n,a).then((e=>e?new Response(e):fetch(s.request).then((e=>e.clone().blob())).then((e=>e.type.startsWith("image/")?((e,t,s)=>new Promise(((n,a)=>{const r=ie.result.transaction(t,"readwrite").objectStore(t),i=r.put(s,e);i.onsuccess=t=>{const s=r.get(e);s.onsuccess=e=>{n(s.result)}},i.onerror=e=>{a("Something went wrong while putting image in DB ")}})))(n,a,e).then((e=>new Response(e))):new Response("",{status:404,statusText:"invalid image found (sw)"})))))};S((({url:e})=>e.href.match(new RegExp("https://ofp2map-northv3.netlify.app/northv3/[0-4]/.*"))),oe),S((({url:e})=>e.href.match(new RegExp("https://ofp2map-southv3.netlify.app/southv3/[0-4]/.*"))),oe),S((({url:e})=>e.href.match(new RegExp("https://ofp2map-theworldv2.netlify.app/theworldv2/[0-5]/.*"))),oe),S((({url:e})=>e.href.match(new RegExp("https://ofp2map-pacificv1.netlify.app/pacificv1/[0-4]/.*"))),oe),S((({url:e})=>e.href.match(new RegExp("(https://ofp2map-northv3.netlify.app/northv3|https://ofp2map-southv3.netlify.app/southv3|https://ofp2map-pacificv1.netlify.app/pacificv1)/[5-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),S((({url:e})=>e.href.match(new RegExp("(https://ofp2map-theworldv2.netlify.app/theworldv2)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"})));self.addEventListener("install",(e=>{e.waitUntil(caches.open("lido-warmup").then((e=>function(e,t=[],s=[]){if(!(e instanceof Cache&&Array.isArray(t)&&Array.isArray(s)))return Promise.reject();let n=[];return Promise.all(t.map((function(t){return caches.match(t).then((function(s){return s?e.put(t,s):(n.push(t),Promise.resolve())}))}))).then((function(){return e.addAll(n.concat(s))}))}(e,re))))}));const ce=e=>!!["northv3","northv2","northv1","southv3","southv2","southv1","pacificv1"].includes(e)||Z.includes(e),he=e=>{if(-1!==ne.indexOf(e.url))return!1;for(const t of ae)if(t.startsWith("http")){if(e.url===t)return!1}else if(-1!==e.url.indexOf(t.replace(/^\./,"")))return!1;return!0};self.addEventListener("activate",(function(e){e.waitUntil(caches.keys().then((function(e){return e.filter(ce).map((e=>caches.delete(e)))})).then((()=>caches.open("lido-warmup"))).then((function(e){return e.keys().then((function(t){return Promise.all(t.filter(he).map((t=>e.delete(t))))}))})).then((()=>{try{ee.forEach((e=>{indexedDB.deleteDatabase(e)}))}catch(e){}self.clients.claim()})))})),self.addEventListener("message",(e=>{!e.data||"SKIP_WAITING"!==e.data&&"SKIP_WAITING"!==e.data.type?e.data&&"GET_VERSION"===e.data.type?e.ports[0].postMessage("1.3.4"):e.data&&"CLIENTS_CLAIM"===e.data.type&&self.clients.claim():self.skipWaiting()}))}();
//# sourceMappingURL=sw.js.map
