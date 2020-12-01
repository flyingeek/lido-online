!function(){"use strict";try{self["workbox:precaching:5.1.4"]&&_()}catch(e){}const e=[],t={get:()=>e,add(t){e.push(...t)}};try{self["workbox:core:5.1.4"]&&_()}catch(e){}const s={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[s.prefix,e,s.suffix].filter(e=>e&&e.length>0).join("-"),a=e=>e||n(s.precache),r=e=>e||n(s.runtime),i=e=>new URL(String(e),location.href).href.replace(new RegExp("^"+location.origin),""),c=(e,...t)=>{let s=e;return t.length>0&&(s+=" :: "+JSON.stringify(t)),s};class o extends Error{constructor(e,t){super(c(e,t)),this.name=e,this.details=t}}const h=new Set;const l=(e,t)=>e.filter(e=>t in e),u=async({request:e,mode:t,plugins:s=[]})=>{const n=l(s,"cacheKeyWillBeUsed");let a=e;for(const e of n)a=await e.cacheKeyWillBeUsed.call(e,{mode:t,request:a}),"string"==typeof a&&(a=new Request(a));return a},d=async({cacheName:e,request:t,event:s,matchOptions:n,plugins:a=[]})=>{const r=await self.caches.open(e),i=await u({plugins:a,request:t,mode:"read"});let c=await r.match(i,n);for(const t of a)if("cachedResponseWillBeUsed"in t){const a=t.cachedResponseWillBeUsed;c=await a.call(t,{cacheName:e,event:s,matchOptions:n,cachedResponse:c,request:i})}return c},p=async({cacheName:e,request:t,response:s,event:n,plugins:a=[],matchOptions:r})=>{const c=await u({plugins:a,request:t,mode:"write"});if(!s)throw new o("cache-put-with-no-response",{url:i(c.url)});const p=await(async({request:e,response:t,event:s,plugins:n=[]})=>{let a=t,r=!1;for(const t of n)if("cacheWillUpdate"in t){r=!0;const n=t.cacheWillUpdate;if(a=await n.call(t,{request:e,response:a,event:s}),!a)break}return r||(a=a&&200===a.status?a:void 0),a||null})({event:n,plugins:a,response:s,request:c});if(!p)return;const f=await self.caches.open(e),m=l(a,"cacheDidUpdate"),g=m.length>0?await d({cacheName:e,matchOptions:r,request:c}):null;try{await f.put(c,p)}catch(e){throw"QuotaExceededError"===e.name&&await async function(){for(const e of h)await e()}(),e}for(const t of m)await t.cacheDidUpdate.call(t,{cacheName:e,event:n,oldResponse:g,newResponse:p,request:c})},f=d,m=async({request:e,fetchOptions:t,event:s,plugins:n=[]})=>{if("string"==typeof e&&(e=new Request(e)),s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const a=l(n,"fetchDidFail"),r=a.length>0?e.clone():null;try{for(const t of n)if("requestWillFetch"in t){const n=t.requestWillFetch,a=e.clone();e=await n.call(t,{request:a,event:s})}}catch(e){throw new o("plugin-error-request-will-fetch",{thrownError:e})}const i=e.clone();try{let a;a="navigate"===e.mode?await fetch(e):await fetch(e,t);for(const e of n)"fetchDidSucceed"in e&&(a=await e.fetchDidSucceed.call(e,{event:s,request:i,response:a}));return a}catch(e){for(const t of a)await t.fetchDidFail.call(t,{error:e,event:s,originalRequest:r.clone(),request:i.clone()});throw e}};let g;async function w(e,t){const s=e.clone(),n={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},a=t?t(n):n,r=function(){if(void 0===g){const e=new Response("");if("body"in e)try{new Response(e.body),g=!0}catch(e){g=!1}g=!1}return g}()?s.body:await s.blob();return new Response(r,a)}function y(e){if(!e)throw new o("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:t,url:s}=e;if(!s)throw new o("add-to-cache-list-unexpected-type",{entry:e});if(!t){const e=new URL(s,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(s,location.href),a=new URL(s,location.href);return n.searchParams.set("__WB_REVISION__",t),{cacheKey:n.href,url:a.href}}class x{constructor(e){this._cacheName=a(e),this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map}addToCacheList(e){const t=[];for(const s of e){"string"==typeof s?t.push(s):s&&void 0===s.revision&&t.push(s.url);const{cacheKey:e,url:n}=y(s),a="string"!=typeof s&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new o("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof s&&s.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==s.integrity)throw new o("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,s.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,a),t.length>0){const e=`Workbox is precaching URLs without revision info: ${t.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}async install({event:e,plugins:t}={}){const s=[],n=[],a=await self.caches.open(this._cacheName),r=await a.keys(),i=new Set(r.map(e=>e.url));for(const[e,t]of this._urlsToCacheKeys)i.has(t)?n.push(e):s.push({cacheKey:t,url:e});const c=s.map(({cacheKey:s,url:n})=>{const a=this._cacheKeysToIntegrities.get(s),r=this._urlsToCacheModes.get(n);return this._addURLToCache({cacheKey:s,cacheMode:r,event:e,integrity:a,plugins:t,url:n})});await Promise.all(c);return{updatedURLs:s.map(e=>e.url),notUpdatedURLs:n}}async activate(){const e=await self.caches.open(this._cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const a of t)s.has(a.url)||(await e.delete(a),n.push(a.url));return{deletedURLs:n}}async _addURLToCache({cacheKey:e,url:t,cacheMode:s,event:n,plugins:a,integrity:r}){const i=new Request(t,{integrity:r,cache:s,credentials:"same-origin"});let c,h=await m({event:n,plugins:a,request:i});for(const e of a||[])"cacheWillUpdate"in e&&(c=e);if(!(c?await c.cacheWillUpdate({event:n,request:i,response:h}):h.status<400))throw new o("bad-precaching-response",{url:t,status:h.status});h.redirected&&(h=await w(h)),await p({event:n,plugins:a,response:h,request:e===t?i:new Request(e),cacheName:this._cacheName,matchOptions:{ignoreSearch:!0}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this._cacheName)).match(s)}}createHandler(e=!0){return async({request:t})=>{try{const e=await this.matchPrecache(t);if(e)return e;throw new o("missing-precache-entry",{cacheName:this._cacheName,url:t instanceof Request?t.url:t})}catch(s){if(e)return fetch(t);throw s}}}createHandlerBoundToURL(e,t=!0){if(!this.getCacheKeyForURL(e))throw new o("non-precached-url",{url:e});const s=this.createHandler(t),n=new Request(e);return()=>s({request:n})}}let v;const R=()=>(v||(v=new x),v);const b=(e,t)=>{const s=R().getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t,directoryIndex:s,cleanURLs:n,urlManipulation:a}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some(e=>e.test(s))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(a){const e=a({url:r});for(const t of e)yield t.href}}(e,t)){const e=s.get(n);if(e)return e}};let q=!1;function N(e){q||((({ignoreURLParametersMatching:e=[/^utm_/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:n}={})=>{const r=a();self.addEventListener("fetch",a=>{const i=b(a.request.url,{cleanURLs:s,directoryIndex:t,ignoreURLParametersMatching:e,urlManipulation:n});if(!i)return;let c=self.caches.open(r).then(e=>e.match(i)).then(e=>e||fetch(i));a.respondWith(c)})})(e),q=!0)}const U=e=>{const s=R(),n=t.get();e.waitUntil(s.install({event:e,plugins:n}).catch(e=>{throw e}))},E=e=>{const t=R();e.waitUntil(t.activate())};try{self["workbox:routing:5.1.4"]&&_()}catch(e){}const T=e=>e&&"object"==typeof e?e:{handle:e};class L{constructor(e,t,s="GET"){this.handler=T(t),this.match=e,this.method=s}}class j extends L{constructor(e,t,s){super(({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)},t,s)}}class O{constructor(){this._routes=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map(e=>{"string"==typeof e&&(e=[e]);const t=new Request(...e);return this.handleRequest({request:t})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const{params:n,route:a}=this.findMatchingRoute({url:s,request:e,event:t});let r,i=a&&a.handler;if(!i&&this._defaultHandler&&(i=this._defaultHandler),i){try{r=i.handle({url:s,request:e,event:t,params:n})}catch(e){r=Promise.reject(e)}return r instanceof Promise&&this._catchHandler&&(r=r.catch(n=>this._catchHandler.handle({url:s,request:e,event:t}))),r}}findMatchingRoute({url:e,request:t,event:s}){const n=this._routes.get(t.method)||[];for(const a of n){let n;const r=a.match({url:e,request:t,event:s});if(r)return n=r,(Array.isArray(r)&&0===r.length||r.constructor===Object&&0===Object.keys(r).length||"boolean"==typeof r)&&(n=void 0),{route:a,params:n}}return{}}setDefaultHandler(e){this._defaultHandler=T(e)}setCatchHandler(e){this._catchHandler=T(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new o("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(!(t>-1))throw new o("unregister-route-route-not-registered");this._routes.get(e.method).splice(t,1)}}let C;const K=()=>(C||(C=new O,C.addFetchListener(),C.addCacheListener()),C);function A(e,t,s){let n;if("string"==typeof e){const a=new URL(e,location.href);n=new L(({url:e})=>e.href===a.href,t,s)}else if(e instanceof RegExp)n=new j(e,t,s);else if("function"==typeof e)n=new L(e,t,s);else{if(!(e instanceof L))throw new o("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=e}return K().registerRoute(n),n}try{self["workbox:strategies:5.1.4"]&&_()}catch(e){}class M{constructor(e={}){this._cacheName=r(e.cacheName),this._plugins=e.plugins||[],this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:t}){"string"==typeof t&&(t=new Request(t));let s,n=await f({cacheName:this._cacheName,request:t,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(!n)try{n=await this._getFromNetwork(t,e)}catch(e){s=e}if(!n)throw new o("no-response",{url:t.url,error:s});return n}async _getFromNetwork(e,t){const s=await m({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=s.clone(),a=p({cacheName:this._cacheName,request:e,response:n,event:t,plugins:this._plugins});if(t)try{t.waitUntil(a)}catch(e){}return s}}const k={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};function S(e){e.then(()=>{})}class W{constructor(e,t,{onupgradeneeded:s,onversionchange:n}={}){this._db=null,this._name=e,this._version=t,this._onupgradeneeded=s,this._onversionchange=n||(()=>this.close())}get db(){return this._db}async open(){if(!this._db)return this._db=await new Promise((e,t)=>{let s=!1;setTimeout(()=>{s=!0,t(new Error("The open request was blocked and timed out"))},this.OPEN_TIMEOUT);const n=indexedDB.open(this._name,this._version);n.onerror=()=>t(n.error),n.onupgradeneeded=e=>{s?(n.transaction.abort(),n.result.close()):"function"==typeof this._onupgradeneeded&&this._onupgradeneeded(e)},n.onsuccess=()=>{const t=n.result;s?t.close():(t.onversionchange=this._onversionchange.bind(this),e(t))}}),this}async getKey(e,t){return(await this.getAllKeys(e,t,1))[0]}async getAll(e,t,s){return await this.getAllMatching(e,{query:t,count:s})}async getAllKeys(e,t,s){return(await this.getAllMatching(e,{query:t,count:s,includeKeys:!0})).map(e=>e.key)}async getAllMatching(e,{index:t,query:s=null,direction:n="next",count:a,includeKeys:r=!1}={}){return await this.transaction([e],"readonly",(i,c)=>{const o=i.objectStore(e),h=t?o.index(t):o,l=[],u=h.openCursor(s,n);u.onsuccess=()=>{const e=u.result;e?(l.push(r?e:e.value),a&&l.length>=a?c(l):e.continue()):c(l)}})}async transaction(e,t,s){return await this.open(),await new Promise((n,a)=>{const r=this._db.transaction(e,t);r.onabort=()=>a(r.error),r.oncomplete=()=>n(),s(r,e=>n(e))})}async _call(e,t,s,...n){return await this.transaction([t],s,(s,a)=>{const r=s.objectStore(t),i=r[e].apply(r,n);i.onsuccess=()=>a(i.result)})}close(){this._db&&(this._db.close(),this._db=null)}}W.prototype.OPEN_TIMEOUT=2e3;const P={readonly:["get","count","getKey","getAll","getAllKeys"],readwrite:["add","put","clear","delete"]};for(const[e,t]of Object.entries(P))for(const s of t)s in IDBObjectStore.prototype&&(W.prototype[s]=async function(t,...n){return await this._call(s,t,e,...n)});try{self["workbox:expiration:5.1.4"]&&_()}catch(e){}const D=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class I{constructor(e){this._cacheName=e,this._db=new W("workbox-expiration",1,{onupgradeneeded:e=>this._handleUpgrade(e)})}_handleUpgrade(e){const t=e.target.result.createObjectStore("cache-entries",{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1}),(async e=>{await new Promise((t,s)=>{const n=indexedDB.deleteDatabase(e);n.onerror=()=>{s(n.error)},n.onblocked=()=>{s(new Error("Delete blocked"))},n.onsuccess=()=>{t()}})})(this._cacheName)}async setTimestamp(e,t){const s={url:e=D(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)};await this._db.put("cache-entries",s)}async getTimestamp(e){return(await this._db.get("cache-entries",this._getId(e))).timestamp}async expireEntries(e,t){const s=await this._db.transaction("cache-entries","readwrite",(s,n)=>{const a=s.objectStore("cache-entries").index("timestamp").openCursor(null,"prev"),r=[];let i=0;a.onsuccess=()=>{const s=a.result;if(s){const n=s.value;n.cacheName===this._cacheName&&(e&&n.timestamp<e||t&&i>=t?r.push(s.value):i++),s.continue()}else n(r)}}),n=[];for(const e of s)await this._db.delete("cache-entries",e.id),n.push(e.url);return n}_getId(e){return this._cacheName+"|"+D(e)}}class F{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._cacheName=e,this._timestampModel=new I(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const e of t)await s.delete(e);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,S(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){return await this._timestampModel.getTimestamp(e)<Date.now()-1e3*this._maxAgeSeconds}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class H{constructor(e={}){var t;this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:n})=>{if(!n)return null;const a=this._isResponseDateFresh(n),r=this._getCacheExpiration(s);S(r.expireEntries());const i=r.updateTimestamp(t.url);if(e)try{e.waitUntil(i)}catch(e){}return a?n:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&(t=()=>this.deleteCacheAndMetadata(),h.add(t))}_getCacheExpiration(e){if(e===r())throw new o("expire-custom-caches-only");let t=this._cacheExpirations.get(e);return t||(t=new F(e,this._config),this._cacheExpirations.set(e,t)),t}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}const $={north:"northv3",south:"southv3",pacific:"pacificv1"},B={warmup:"lido-warmup",mapbox:"lido-mapbox",airports:"lido-data","fir-reg":"lido-fir",gramet:"lido-gramet2",north:"lido-"+$.north,south:"lido-"+$.south,pacific:"lido-"+$.pacific,zoom4:`lido-zoom4_${$.north.substr(-1)}_${$.south.substr(-1)}_${$.pacific.substr(-1)}`};var z,G;z=[{"revision":"631549706b38f28b25e72b97941d7bfb","url":"index.html"},{"revision":"74188d6ac788a0bd90c0a2354710c229","url":"apple-touch-icon.png"},{"revision":"d45e7d66a6c99d28d0361151adc26b86","url":"css/bundle.css"},{"revision":"b7b8e485bba00c1c7d9c9f75baffdbab","url":"js/bundle.js"},{"revision":"c91b009cf61317c952c846696614b167","url":"svg/Air_France_Logo.svg"},{"revision":"a71d482d2ab40879af8dcc00b21143b7","url":"svg/worldmap.svg"},{"revision":"bbe6044400b48432202958c1684ac1ed","url":"sdf/maki-marker-sdf.png"},{"revision":"ae8eb6c1acf90de671f61ebd3c06523d","url":"sdf/map-circle-sdf.png"},{"revision":"e5437d8af78d3b5af20aa7a4bc6c7253","url":"sdf/map-plane-sdf.png"},{"revision":"aede03a01013f77c127e3f79068c9ff2","url":"sdf/map-star-sdf.png"},{"revision":"3cad1d5b1d95fd21e80b7077707b32ee","url":"sdf/map-triangle-sdf.png"}],G={directoryIndex:null,ignoreURLParametersMatching:[/.+Pin$/,/.+Display$/,/.+Color$/,/.+PinPosition$/,/^shortcut$/,/^downloadType$/,/^runShortcut$/]},function(e){R().addToCacheList(e),e.length>0&&(self.addEventListener("install",U),self.addEventListener("activate",E))}(z),N(G);const Q=["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.css","https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css","https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js"],J=["./js/lidojs.1.3.6.min.js","./js/wmo.1.3.6.var.js"],V=Q.concat(J);A(/.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|proj4\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js)$/,new M({cacheName:B.warmup})),A(({url:e})=>"https://api.mapbox.com"===e.origin&&(e.pathname.startsWith("/styles/")||e.pathname.startsWith("/fonts/")||"/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json"===e.pathname),new class{constructor(e={}){if(this._cacheName=r(e.cacheName),this._plugins=e.plugins||[],e.plugins){const t=e.plugins.some(e=>!!e.cacheWillUpdate);this._plugins=t?e.plugins:[k,...e.plugins]}else this._plugins=[k];this._fetchOptions=e.fetchOptions,this._matchOptions=e.matchOptions}async handle({event:e,request:t}){"string"==typeof t&&(t=new Request(t));const s=this._getFromNetwork({request:t,event:e});let n,a=await f({cacheName:this._cacheName,request:t,event:e,matchOptions:this._matchOptions,plugins:this._plugins});if(a){if(e)try{e.waitUntil(s)}catch(n){}}else try{a=await s}catch(e){n=e}if(!a)throw new o("no-response",{url:t.url,error:n});return a}async _getFromNetwork({request:e,event:t}){const s=await m({request:e,event:t,fetchOptions:this._fetchOptions,plugins:this._plugins}),n=p({cacheName:this._cacheName,request:e,response:s.clone(),event:t,plugins:this._plugins});if(t)try{t.waitUntil(n)}catch(e){}return s}}({cacheName:B.mapbox})),A(({url:e})=>e.pathname.endsWith("/data/airports.2013.geojson"),new M({cacheName:B.airports,plugins:[new H({maxEntries:2})]})),A(({url:e})=>e.pathname.endsWith("/data/fir-reg.2013.geojson"),new M({cacheName:B["fir-reg"],plugins:[new H({maxEntries:2})]})),A(({url:e})=>"https://editolido.alwaysdata.net"===e.origin&&e.pathname.startsWith("/proxy_gramet"),new M({cacheName:B.gramet,plugins:[new H({maxEntries:5,maxAgeSeconds:172800})]})),A(({url:e})=>e.href.match(new RegExp("https://editolido.alwaysdata.net/i/"+$.north+"/[0-3]/.*")),new M({cacheName:B.north})),A(({url:e})=>e.href.match(new RegExp("https://editolido.alwaysdata.net/i/"+$.south+"/[0-3]/.*")),new M({cacheName:B.south})),A(({url:e})=>e.href.match(new RegExp("https://editolido.alwaysdata.net/i/"+$.pacific+"/[0-3]/.*")),new M({cacheName:B.pacific,plugins:[new H({maxAgeSeconds:324e4})]})),A(({url:e})=>e.href.match(new RegExp("https://editolido.alwaysdata.net/i/[^/]+/4/.*")),new M({cacheName:B.zoom4,plugins:[new H({maxEntries:128})]})),A(({url:e})=>e.href.match(new RegExp("https://editolido.alwaysdata.net/i/[^/]+/[5-9]/.*")),async()=>new Response("",{status:404,statusText:"sw says nope!"}));self.addEventListener("install",e=>{e.waitUntil(caches.open("lido-warmup").then(e=>function(e,t=[],s=[]){if(!(e instanceof Cache&&Array.isArray(t)&&Array.isArray(s)))return Promise.reject();let n=[];return Promise.all(t.map((function(t){return caches.match(t).then((function(s){return s?e.put(t,s):(n.push(t),Promise.resolve())}))}))).then((function(){return e.addAll(n.concat(s))}))}(e,V)))});const X=e=>-1!==["northv3","northv2","northv1","southv3","southv2","southv1","pacificv1"].indexOf(e)||!!e.startsWith("lido-")&&-1===Object.values(B).indexOf(e),Y=e=>{if(-1!==Q.indexOf(e.url))return!1;for(const t of J)if(t.startsWith("http")){if(e.url===t)return!1}else if(-1!==e.url.indexOf(t.replace(/^\./,"")))return!1;return!0};self.addEventListener("activate",(function(e){e.waitUntil(caches.keys().then((function(e){return e.filter(X).map(e=>caches.delete(e))})).then(()=>caches.open("lido-warmup")).then((function(e){return e.keys().then((function(t){return Promise.all(t.filter(Y).map(t=>e.delete(t)))}))})).then(()=>self.clients.claim()))})),self.addEventListener("message",e=>{"SKIP_WAITING"===e.data&&self.skipWaiting()})}();
//# sourceMappingURL=sw.js.map
