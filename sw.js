!function(){"use strict";try{self["workbox:core:6.1.1"]&&_()}catch(e){}const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const s={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},n=e=>[s.prefix,e,s.suffix].filter((e=>e&&e.length>0)).join("-"),a=e=>e||n(s.precache),r=e=>e||n(s.runtime);function i(e,t){const s=t();return e.waitUntil(s),s}try{self["workbox:precaching:6.1.1"]&&_()}catch(e){}function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:n}=e;if(!n)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(n,location.href);return{cacheKey:e.href,url:e.href}}const a=new URL(n,location.href),r=new URL(n,location.href);return a.searchParams.set("__WB_REVISION__",s),{cacheKey:a.href,url:r.href}}class c{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class h{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=t&&t.cacheKey||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s):e},this._precacheController=e}}let l;async function u(e,s){let n=null;if(e.url){n=new URL(e.url).origin}if(n!==self.location.origin)throw new t("cross-origin-copy-response",{origin:n});const a=e.clone(),r={headers:new Headers(a.headers),status:a.status,statusText:a.statusText},i=s?s(r):r,o=function(){if(void 0===l){const e=new Response("");if("body"in e)try{new Response(e.body),l=!0}catch(e){l=!1}l=!1}return l}()?a.body:await a.blob();return new Response(o,i)}function d(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class p{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const f=new Set;try{self["workbox:strategies:6.1.1"]&&_()}catch(e){}function m(e){return"string"==typeof e?new Request(e):e}class g{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new p,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}fetch(e){return this.waitUntil((async()=>{const{event:s}=this;let n=m(e);if("navigate"===n.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const a=this.hasCallback("fetchDidFail")?n.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))n=await e({request:n.clone(),event:s})}catch(e){throw new t("plugin-error-request-will-fetch",{thrownError:e})}const r=n.clone();try{let e;e=await fetch(n,"navigate"===n.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:r,response:e});return e}catch(e){throw a&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:a.clone(),request:r.clone()}),e}})())}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}cacheMatch(e){return this.waitUntil((async()=>{const t=m(e);let s;const{cacheName:n,matchOptions:a}=this._strategy,r=await this.getCacheKey(t,"read"),i={...a,cacheName:n};s=await caches.match(r,i);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:n,matchOptions:a,cachedResponse:s,request:r,event:this.event})||void 0;return s})())}async cachePut(e,s){const n=m(e);var a;await(a=0,new Promise((e=>setTimeout(e,a))));const r=await this.getCacheKey(n,"write");if(!s)throw new t("cache-put-with-no-response",{url:(i=r.url,new URL(String(i),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var i;const o=await this._ensureResponseSafeToCache(s);if(!o)return!1;const{cacheName:c,matchOptions:h}=this._strategy,l=await self.caches.open(c),u=this.hasCallback("cacheDidUpdate"),p=u?await async function(e,t,s,n){const a=d(t.url,s);if(t.url===a)return e.match(t,n);const r={...n,ignoreSearch:!0},i=await e.keys(t,r);for(const t of i)if(a===d(t.url,s))return e.match(t,n)}(l,r.clone(),["__WB_REVISION__"],h):null;try{await l.put(r,u?o.clone():o)}catch(e){throw"QuotaExceededError"===e.name&&await async function(){for(const e of f)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:c,oldResponse:p,newResponse:o.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){if(!this._cacheKeys[t]){let s=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))s=m(await e({mode:t,request:s,event:this.event,params:this.params}));this._cacheKeys[t]=s}return this._cacheKeys[t]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),n=n=>{const a={...n,state:s};return t[e](a)};yield n}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve()}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class w{constructor(e={}){this.cacheName=r(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,n="params"in e?e.params:void 0,a=new g(this,{event:t,request:s,params:n}),r=this._getResponse(a,s,t);return[r,this._awaitComplete(r,a,s,t)]}async _getResponse(e,s,n){let a;await e.runCallbacks("handlerWillStart",{event:n,request:s});try{if(a=await this._handle(s,e),!a||"error"===a.type)throw new t("no-response",{url:s.url})}catch(t){for(const r of e.iterateCallbacks("handlerDidError"))if(a=await r({error:t,event:n,request:s}),a)break;if(!a)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))a=await t({event:n,request:s,response:a});return a}async _awaitComplete(e,t,s,n){let a,r;try{a=await e}catch(r){}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:a}),await t.doneWaiting()}catch(e){r=e}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:a,error:r}),t.destroy(),r)throw r}}class y extends w{constructor(e={}){e.cacheName=a(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(y.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let n;if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return n=await s.fetch(e),n}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const n=await s.fetch(e);if(!await s.cachePut(e,n.clone()))throw new t("bad-precaching-response",{url:e.url,status:n.status});return n}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==y.copyRedirectedCacheableResponsesPlugin&&(n===y.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);0===t?this.plugins.push(y.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}y.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},y.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await u(e):e};class b{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new y({cacheName:a(e),plugins:[...t,new h({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const n of e){"string"==typeof n?s.push(n):n&&void 0===n.revision&&s.push(n.url);const{cacheKey:e,url:a}=o(n),r="string"!=typeof n&&n.revision?"reload":"default";if(this._urlsToCacheKeys.has(a)&&this._urlsToCacheKeys.get(a)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(a),secondEntry:e});if("string"!=typeof n&&n.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==n.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:a});this._cacheKeysToIntegrities.set(e,n.integrity)}if(this._urlsToCacheKeys.set(a,e),this._urlsToCacheModes.set(a,r),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return i(e,(async()=>{const t=new c;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const n=this._cacheKeysToIntegrities.get(s),a=this._urlsToCacheModes.get(t),r=new Request(t,{integrity:n,cache:a,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:r,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{updatedURLs:s,notUpdatedURLs:n}}))}activate(e){return i(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),n=[];for(const a of t)s.has(a.url)||(await e.delete(a),n.push(a.url));return{deletedURLs:n}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params={cacheKey:s,...t.params},this.strategy.handle(t))}}let v;const x=()=>(v||(v=new b),v);try{self["workbox:routing:6.1.1"]&&_()}catch(e){}const R=e=>e&&"object"==typeof e?e:{handle:e};class C{constructor(e,t,s="GET"){this.handler=R(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=R(e)}}class U extends C{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class j{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map((t=>{"string"==typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const n=s.origin===location.origin,{params:a,route:r}=this.findMatchingRoute({event:t,request:e,sameOrigin:n,url:s});let i=r&&r.handler;const o=e.method;if(!i&&this._defaultHandlerMap.has(o)&&(i=this._defaultHandlerMap.get(o)),!i)return;let c;try{c=i.handle({url:s,request:e,event:t,params:a})}catch(e){c=Promise.reject(e)}const h=r&&r.catchHandler;return c instanceof Promise&&(this._catchHandler||h)&&(c=c.catch((async n=>{if(h)try{return await h.handle({url:s,request:e,event:t,params:a})}catch(e){n=e}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw n}))),c}findMatchingRoute({url:e,sameOrigin:t,request:s,event:n}){const a=this._routes.get(s.method)||[];for(const r of a){let a;const i=r.match({url:e,sameOrigin:t,request:s,event:n});if(i)return a=i,(Array.isArray(i)&&0===i.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"==typeof i)&&(a=void 0),{route:r,params:a}}return{}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,R(e))}setCatchHandler(e){this._catchHandler=R(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new t("unregister-route-but-not-found-with-method",{method:e.method});const s=this._routes.get(e.method).indexOf(e);if(!(s>-1))throw new t("unregister-route-route-not-registered");this._routes.get(e.method).splice(s,1)}}let E;const q=()=>(E||(E=new j,E.addFetchListener(),E.addCacheListener()),E);function T(e,s,n){let a;if("string"==typeof e){const t=new URL(e,location.href);a=new C((({url:e})=>e.href===t.href),s,n)}else if(e instanceof RegExp)a=new U(e,s,n);else if("function"==typeof e)a=new C(e,s,n);else{if(!(e instanceof C))throw new t("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});a=e}return q().registerRoute(a),a}class L extends C{constructor(e,t){super((({request:s})=>{const n=e.getURLsToCacheKeys();for(const e of function*(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:n=!0,urlManipulation:a}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(n){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(a){const e=a({url:r});for(const t of e)yield t.href}}(s.url,t)){const t=n.get(e);if(t)return{cacheKey:t}}}),e.strategy)}}class k extends w{async _handle(e,s){let n,a=await s.cacheMatch(e);if(!a)try{a=await s.fetchAndCachePut(e)}catch(e){n=e}if(!a)throw new t("no-response",{url:e.url,error:n});return a}}const P={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};function N(e){e.then((()=>{}))}class S{constructor(e,t,{onupgradeneeded:s,onversionchange:n}={}){this._db=null,this._name=e,this._version=t,this._onupgradeneeded=s,this._onversionchange=n||(()=>this.close())}get db(){return this._db}async open(){if(!this._db)return this._db=await new Promise(((e,t)=>{let s=!1;setTimeout((()=>{s=!0,t(new Error("The open request was blocked and timed out"))}),this.OPEN_TIMEOUT);const n=indexedDB.open(this._name,this._version);n.onerror=()=>t(n.error),n.onupgradeneeded=e=>{s?(n.transaction.abort(),n.result.close()):"function"==typeof this._onupgradeneeded&&this._onupgradeneeded(e)},n.onsuccess=()=>{const t=n.result;s?t.close():(t.onversionchange=this._onversionchange.bind(this),e(t))}})),this}async getKey(e,t){return(await this.getAllKeys(e,t,1))[0]}async getAll(e,t,s){return await this.getAllMatching(e,{query:t,count:s})}async getAllKeys(e,t,s){return(await this.getAllMatching(e,{query:t,count:s,includeKeys:!0})).map((e=>e.key))}async getAllMatching(e,{index:t,query:s=null,direction:n="next",count:a,includeKeys:r=!1}={}){return await this.transaction([e],"readonly",((i,o)=>{const c=i.objectStore(e),h=t?c.index(t):c,l=[],u=h.openCursor(s,n);u.onsuccess=()=>{const e=u.result;e?(l.push(r?e:e.value),a&&l.length>=a?o(l):e.continue()):o(l)}}))}async transaction(e,t,s){return await this.open(),await new Promise(((n,a)=>{const r=this._db.transaction(e,t);r.onabort=()=>a(r.error),r.oncomplete=()=>n(),s(r,(e=>n(e)))}))}async _call(e,t,s,...n){return await this.transaction([t],s,((s,a)=>{const r=s.objectStore(t),i=r[e].apply(r,n);i.onsuccess=()=>a(i.result)}))}close(){this._db&&(this._db.close(),this._db=null)}}S.prototype.OPEN_TIMEOUT=2e3;const K={readonly:["get","count","getKey","getAll","getAllKeys"],readwrite:["add","put","clear","delete"]};for(const[e,t]of Object.entries(K))for(const s of t)s in IDBObjectStore.prototype&&(S.prototype[s]=async function(t,...n){return await this._call(s,t,e,...n)});try{self["workbox:expiration:6.1.1"]&&_()}catch(e){}const A="cache-entries",I=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class M{constructor(e){this._cacheName=e,this._db=new S("workbox-expiration",1,{onupgradeneeded:e=>this._handleUpgrade(e)})}_handleUpgrade(e){const t=e.target.result.createObjectStore(A,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1}),(async e=>{await new Promise(((t,s)=>{const n=indexedDB.deleteDatabase(e);n.onerror=()=>{s(n.error)},n.onblocked=()=>{s(new Error("Delete blocked"))},n.onsuccess=()=>{t()}}))})(this._cacheName)}async setTimestamp(e,t){const s={url:e=I(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)};await this._db.put(A,s)}async getTimestamp(e){return(await this._db.get(A,this._getId(e))).timestamp}async expireEntries(e,t){const s=await this._db.transaction(A,"readwrite",((s,n)=>{const a=s.objectStore(A).index("timestamp").openCursor(null,"prev"),r=[];let i=0;a.onsuccess=()=>{const s=a.result;if(s){const n=s.value;n.cacheName===this._cacheName&&(e&&n.timestamp<e||t&&i>=t?r.push(s.value):i++),s.continue()}else n(r)}})),n=[];for(const e of s)await this._db.delete(A,e.id),n.push(e.url);return n}_getId(e){return this._cacheName+"|"+I(e)}}class D{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new M(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const e of t)await s.delete(e,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,N(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){return await this._timestampModel.getTimestamp(e)<Date.now()-1e3*this._maxAgeSeconds}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class O{constructor(e={}){var t;this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:n})=>{if(!n)return null;const a=this._isResponseDateFresh(n),r=this._getCacheExpiration(s);N(r.expireEntries());const i=r.updateTimestamp(t.url);if(e)try{e.waitUntil(i)}catch(e){}return a?n:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&(t=()=>this.deleteCacheAndMetadata(),f.add(t))}_getCacheExpiration(e){if(e===r())throw new t("expire-custom-caches-only");let s=this._cacheExpirations.get(e);return s||(s=new D(e,this._config),this._cacheExpirations.set(e,s)),s}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}const W={north:"northv3",south:"southv3",pacific:"pacificv1",theworld:"theworldv2",mercator:"denizotjbv1"},H="lido-warmup",B="lido-mapbox",F="lido-data",$="lido-fir",z="lido-gramet2",V=["lido-ona-theworldv1","lido-zoom5_ona1","lido-ona-theworldv2","lido-zoom5_ona2","lido-ona-southv3","lido-ona-northv3","lido-ona-pacificv1","lido-zoom4_ona3_ona3_ona1"],G=["swtest"];var Q,J;Q=[{"revision":"ce314e2f82fff06d5acc2e58de7ec07e","url":"index.html"},{"revision":"74188d6ac788a0bd90c0a2354710c229","url":"images/ofp2map-icons/icon-180x180.png"},{"revision":"a2af94b7b7af7491c7443e39862acb75","url":"images/ofp2map-icons/icon-128x128.png"},{"revision":"25e8e9d19fb87eba2e33588d42205df4","url":"css/bundle.css"},{"revision":"faf38b144ba1a873fc3d6f850c8efd43","url":"js/bundle.js"},{"revision":"c91b009cf61317c952c846696614b167","url":"svg/Air_France_Logo.svg"},{"revision":"a71d482d2ab40879af8dcc00b21143b7","url":"svg/worldmap.svg"},{"revision":"bbe6044400b48432202958c1684ac1ed","url":"sdf/maki-marker-sdf.png"},{"revision":"ae8eb6c1acf90de671f61ebd3c06523d","url":"sdf/map-circle-sdf.png"},{"revision":"e5437d8af78d3b5af20aa7a4bc6c7253","url":"sdf/map-plane-sdf.png"},{"revision":"aede03a01013f77c127e3f79068c9ff2","url":"sdf/map-star-sdf.png"},{"revision":"3cad1d5b1d95fd21e80b7077707b32ee","url":"sdf/map-triangle-sdf.png"}],J={directoryIndex:null,ignoreURLParametersMatching:[/.+Pin$/,/.+Display$/,/.+Color$/,/.+PinPosition$/,/^shortcut$/,/^downloadType$/,/^runShortcut$/,/.+Change$/]},function(e){x().precache(e)}(Q),function(e){const t=x();T(new L(t,e))}(J);const X=["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.js","https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.css","https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css","https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js","https://unpkg.com/pinch-zoom-element-js@1.1.2/dist/pinch-zoom-min.js"],Y=["./js/lidojs.1.3.8.min.js","./js/wmo.1.3.8.var.js"],Z=X.concat(Y);T(/.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|proj4\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js)$/,new k({cacheName:H})),T((({url:e})=>"https://api.mapbox.com"===e.origin&&(e.pathname.startsWith("/styles/")||e.pathname.startsWith("/fonts/")||"/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json"===e.pathname||"/v4/denizotjb.63g5ah66.json"===e.pathname||"/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.bifqeinj,denizotjb.cz0kdfpx,mapbox.mapbox-terrain-v2.json"===e.pathname)),new class extends w{constructor(e){super(e),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(P)}async _handle(e,s){const n=s.fetchAndCachePut(e).catch((()=>{}));let a,r=await s.cacheMatch(e);if(r);else try{r=await n}catch(e){a=e}if(!r)throw new t("no-response",{url:e.url,error:a});return r}}({cacheName:B})),T((({url:e})=>e.pathname.endsWith("/data/airports.2102a.geojson")),new k({cacheName:F,plugins:[new O({maxEntries:2})]})),T((({url:e})=>e.pathname.endsWith("/data/fir-reg.2102a.geojson")),new k({cacheName:$,plugins:[new O({maxEntries:2})]})),T((({url:e})=>"https://ofp2map-gramet.vercel.app"===e.origin&&e.pathname.endsWith(".png")),new k({cacheName:z,plugins:[new O({maxEntries:5,maxAgeSeconds:172800})]}));const ee=new class{constructor(e,t,s){this.dbName=e,this.dbPromise=new Promise(((n,a)=>{const r=indexedDB.open(e,t);r.onsuccess=()=>{n(r)},r.onerror=()=>{a("Error while opening DB")},r.onupgradeneeded=s?s.bind(null,r):()=>{}}))}getImageIdFromURL(e){return e.pathname.replace(/[/.]/g,"_")}async fetchImageFromDB(e,t){const s=await this.dbPromise;return new Promise(((n,a)=>{const r=s.result.transaction(t,"readonly").objectStore(t).get(e);r.onsuccess=()=>{n(r.result)},r.onerror=()=>{a("Something went wrong while fetching image from DB ")}}))}async putImageInDB(e,t,s){const n=await this.dbPromise;return new Promise(((a,r)=>{const i=n.result.transaction(t,"readwrite").objectStore(t),o=i.put(s,e);o.onsuccess=()=>{const t=i.get(e);t.onsuccess=()=>{a(t.result)}},o.onerror=()=>{r("Something went wrong while putting image in DB ")}}))}getCacheHandler(e){return this._cacheHandler.bind(this,e)}async isNotCached(e,t){const s=this.getImageIdFromURL(t),n=await this.dbPromise;return new Promise(((a,r)=>{const i=n.result.transaction(e,"readonly").objectStore(e).getKey(s);i.onsuccess=()=>{a(void 0===i.result?t:null)},i.onerror=()=>{r("Something went wrong while checking if cached from DB ")}}))}async countTiles(e){const t=await this.dbPromise;return new Promise(((s,n)=>{const a=t.result.transaction(e,"readonly").objectStore(e).count();a.onsuccess=()=>s(a.result),a.onerror=()=>n("Something went wrong while counting entries from DB")}))}async close(){(await this.dbPromise).result.close()}async _cacheHandler(e,{request:t,url:s}){const n=this.getImageIdFromURL(s);return this.fetchImageFromDB(n,e).then((s=>s?new Response(s):fetch(t).then((e=>e.clone().blob())).then((t=>t.type.startsWith("image/")||"application/x-protobuf"===t.type?this.putImageInDB(n,e,t).then((e=>new Response(e))):new Response("",{status:404,statusText:"invalid image found (sw)"})))))}}("lido-tiles",3,((e,t)=>{t.oldVersion<1&&e.result.createObjectStore(W.theworld),t.oldVersion<2&&(e.result.createObjectStore(W.north),e.result.createObjectStore(W.south),e.result.createObjectStore(W.pacific)),t.oldVersion<3&&e.result.createObjectStore(W.mercator)}));T((({url:e})=>e.href.match(new RegExp("https://ofp2map-northv3.netlify.app/northv3/[0-4]/.*"))),ee.getCacheHandler(W.north)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-southv3.netlify.app/southv3/[0-4]/.*"))),ee.getCacheHandler(W.south)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-theworldv2.netlify.app/theworldv2/[0-5]/.*"))),ee.getCacheHandler(W.theworld));const te=`https://api.mapbox.com/v4/${W.mercator.slice(0,-2)}`;T((({url:e})=>e.href.match(new RegExp(te+"[^/]+/[0-6]/.*"))),ee.getCacheHandler(W.mercator)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-pacificv1.netlify.app/pacificv1/[0-4]/.*"))),ee.getCacheHandler(W.pacific)),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-northv3.netlify.app/northv3|https://ofp2map-southv3.netlify.app/southv3|https://ofp2map-pacificv1.netlify.app/pacificv1)/[5-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-theworldv2.netlify.app/theworldv2)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"})));self.addEventListener("install",(e=>{e.waitUntil(caches.open("lido-warmup").then((e=>function(e,t=[],s=[]){if(!(e instanceof Cache&&Array.isArray(t)&&Array.isArray(s)))return Promise.reject();let n=[];return Promise.all(t.map((function(t){return caches.match(t).then((function(s){return s?e.put(t,s):(n.push(t),Promise.resolve())}))}))).then((function(){return e.addAll(n.concat(s))}))}(e,Z))))}));const se=e=>!!["northv3","northv2","northv1","southv3","southv2","southv1","pacificv1"].includes(e)||V.includes(e),ne=e=>{if(-1!==X.indexOf(e.url))return!1;for(const t of Y)if(t.startsWith("http")){if(e.url===t)return!1}else if(-1!==e.url.indexOf(t.replace(/^\./,"")))return!1;return!0};self.addEventListener("activate",(function(e){e.waitUntil(caches.keys().then((function(e){return e.filter(se).map((e=>caches.delete(e)))})).then((()=>caches.open("lido-warmup"))).then((function(e){return e.keys().then((function(t){return Promise.all(t.filter(ne).map((t=>e.delete(t))))}))})).then((()=>{try{G.forEach((e=>{indexedDB.deleteDatabase(e)}))}catch(e){}self.clients.claim()})))})),self.addEventListener("message",(e=>{!e.data||"SKIP_WAITING"!==e.data&&"SKIP_WAITING"!==e.data.type?e.data&&"GET_VERSION"===e.data.type?e.ports[0].postMessage("1.6.5"):e.data&&"CLIENTS_CLAIM"===e.data.type&&self.clients.claim():self.skipWaiting()}))}();
//# sourceMappingURL=sw.js.map
