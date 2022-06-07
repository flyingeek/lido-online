!function(){"use strict";try{self["workbox:core:6.4.1"]&&_()}catch(e){}const e=(e,...t)=>{let s=e;return t.length>0&&(s+=` :: ${JSON.stringify(t)}`),s};class t extends Error{constructor(t,s){super(e(t,s)),this.name=t,this.details=s}}const s={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:"undefined"!=typeof registration?registration.scope:""},a=e=>[s.prefix,e,s.suffix].filter((e=>e&&e.length>0)).join("-"),n=e=>e||a(s.precache),r=e=>e||a(s.runtime);function i(e,t){const s=t();return e.waitUntil(s),s}try{self["workbox:precaching:6.4.1"]&&_()}catch(e){}function o(e){if(!e)throw new t("add-to-cache-list-unexpected-type",{entry:e});if("string"==typeof e){const t=new URL(e,location.href);return{cacheKey:t.href,url:t.href}}const{revision:s,url:a}=e;if(!a)throw new t("add-to-cache-list-unexpected-type",{entry:e});if(!s){const e=new URL(a,location.href);return{cacheKey:e.href,url:e.href}}const n=new URL(a,location.href),r=new URL(a,location.href);return n.searchParams.set("__WB_REVISION__",s),{cacheKey:n.href,url:r.href}}class c{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if("install"===e.type&&t&&t.originalRequest&&t.originalRequest instanceof Request){const e=t.originalRequest.url;s?this.notUpdatedURLs.push(e):this.updatedURLs.push(e)}return s}}}class h{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:e,params:t})=>{const s=(null==t?void 0:t.cacheKey)||this._precacheController.getCacheKeyForURL(e.url);return s?new Request(s,{headers:e.headers}):e},this._precacheController=e}}let l;async function u(e,s){let a=null;if(e.url){a=new URL(e.url).origin}if(a!==self.location.origin)throw new t("cross-origin-copy-response",{origin:a});const n=e.clone(),r={headers:new Headers(n.headers),status:n.status,statusText:n.statusText},i=s?s(r):r,o=function(){if(void 0===l){const e=new Response("");if("body"in e)try{new Response(e.body),l=!0}catch(e){l=!1}l=!1}return l}()?n.body:await n.blob();return new Response(o,i)}function p(e,t){const s=new URL(e);for(const e of t)s.searchParams.delete(e);return s.href}class d{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}const f=new Set;function m(e){return new Promise((t=>setTimeout(t,e)))}try{self["workbox:strategies:6.4.1"]&&_()}catch(e){}function g(e){return"string"==typeof e?new Request(e):e}class w{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new d,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const e of this._plugins)this._pluginStateMap.set(e,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:s}=this;let a=g(e);if("navigate"===a.mode&&s instanceof FetchEvent&&s.preloadResponse){const e=await s.preloadResponse;if(e)return e}const n=this.hasCallback("fetchDidFail")?a.clone():null;try{for(const e of this.iterateCallbacks("requestWillFetch"))a=await e({request:a.clone(),event:s})}catch(e){if(e instanceof Error)throw new t("plugin-error-request-will-fetch",{thrownErrorMessage:e.message})}const r=a.clone();try{let e;e=await fetch(a,"navigate"===a.mode?void 0:this._strategy.fetchOptions);for(const t of this.iterateCallbacks("fetchDidSucceed"))e=await t({event:s,request:r,response:e});return e}catch(e){throw n&&await this.runCallbacks("fetchDidFail",{error:e,event:s,originalRequest:n.clone(),request:r.clone()}),e}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=g(e);let s;const{cacheName:a,matchOptions:n}=this._strategy,r=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},n),{cacheName:a});s=await caches.match(r,i);for(const e of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await e({cacheName:a,matchOptions:n,cachedResponse:s,request:r,event:this.event})||void 0;return s}async cachePut(e,s){const a=g(e);await m(0);const n=await this.getCacheKey(a,"write");if(!s)throw new t("cache-put-with-no-response",{url:(r=n.url,new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),""))});var r;const i=await this._ensureResponseSafeToCache(s);if(!i)return!1;const{cacheName:o,matchOptions:c}=this._strategy,h=await self.caches.open(o),l=this.hasCallback("cacheDidUpdate"),u=l?await async function(e,t,s,a){const n=p(t.url,s);if(t.url===n)return e.match(t,a);const r=Object.assign(Object.assign({},a),{ignoreSearch:!0}),i=await e.keys(t,r);for(const t of i)if(n===p(t.url,s))return e.match(t,a)}(h,n.clone(),["__WB_REVISION__"],c):null;try{await h.put(n,l?i.clone():i)}catch(e){if(e instanceof Error)throw"QuotaExceededError"===e.name&&await async function(){for(const e of f)await e()}(),e}for(const e of this.iterateCallbacks("cacheDidUpdate"))await e({cacheName:o,oldResponse:u,newResponse:i.clone(),request:n,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let a=e;for(const e of this.iterateCallbacks("cacheKeyWillBeUsed"))a=g(await e({mode:t,request:a,event:this.event,params:this.params}));this._cacheKeys[s]=a}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if("function"==typeof t[e]){const s=this._pluginStateMap.get(t),a=a=>{const n=Object.assign(Object.assign({},a),{state:s});return t[e](n)};yield a}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const e of this.iterateCallbacks("cacheWillUpdate"))if(t=await e({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&200!==t.status&&(t=void 0),t}}class y{constructor(e={}){this.cacheName=r(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s="string"==typeof e.request?new Request(e.request):e.request,a="params"in e?e.params:void 0,n=new w(this,{event:t,request:s,params:a}),r=this._getResponse(n,s,t);return[r,this._awaitComplete(r,n,s,t)]}async _getResponse(e,s,a){let n;await e.runCallbacks("handlerWillStart",{event:a,request:s});try{if(n=await this._handle(s,e),!n||"error"===n.type)throw new t("no-response",{url:s.url})}catch(t){if(t instanceof Error)for(const r of e.iterateCallbacks("handlerDidError"))if(n=await r({error:t,event:a,request:s}),n)break;if(!n)throw t}for(const t of e.iterateCallbacks("handlerWillRespond"))n=await t({event:a,request:s,response:n});return n}async _awaitComplete(e,t,s,a){let n,r;try{n=await e}catch(r){}try{await t.runCallbacks("handlerDidRespond",{event:a,request:s,response:n}),await t.doneWaiting()}catch(e){e instanceof Error&&(r=e)}if(await t.runCallbacks("handlerDidComplete",{event:a,request:s,response:n,error:r}),t.destroy(),r)throw r}}class b extends y{constructor(e={}){e.cacheName=n(e.cacheName),super(e),this._fallbackToNetwork=!1!==e.fallbackToNetwork,this.plugins.push(b.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&"install"===t.event.type?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,s){let a;const n=s.params||{};if(!this._fallbackToNetwork)throw new t("missing-precache-entry",{cacheName:this.cacheName,url:e.url});{const t=n.integrity,r=e.integrity,i=!r||r===t;a=await s.fetch(new Request(e,{integrity:r||t})),t&&i&&(this._useDefaultCacheabilityPluginIfNeeded(),await s.cachePut(e,a.clone()))}return a}async _handleInstall(e,s){this._useDefaultCacheabilityPluginIfNeeded();const a=await s.fetch(e);if(!await s.cachePut(e,a.clone()))throw new t("bad-precaching-response",{url:e.url,status:a.status});return a}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,a]of this.plugins.entries())a!==b.copyRedirectedCacheableResponsesPlugin&&(a===b.defaultPrecacheCacheabilityPlugin&&(e=s),a.cacheWillUpdate&&t++);0===t?this.plugins.push(b.defaultPrecacheCacheabilityPlugin):t>1&&null!==e&&this.plugins.splice(e,1)}}b.defaultPrecacheCacheabilityPlugin={cacheWillUpdate:async({response:e})=>!e||e.status>=400?null:e},b.copyRedirectedCacheableResponsesPlugin={cacheWillUpdate:async({response:e})=>e.redirected?await u(e):e};class v{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new b({cacheName:n(e),plugins:[...t,new h({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const s=[];for(const a of e){"string"==typeof a?s.push(a):a&&void 0===a.revision&&s.push(a.url);const{cacheKey:e,url:n}=o(a),r="string"!=typeof a&&a.revision?"reload":"default";if(this._urlsToCacheKeys.has(n)&&this._urlsToCacheKeys.get(n)!==e)throw new t("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(n),secondEntry:e});if("string"!=typeof a&&a.integrity){if(this._cacheKeysToIntegrities.has(e)&&this._cacheKeysToIntegrities.get(e)!==a.integrity)throw new t("add-to-cache-list-conflicting-integrities",{url:n});this._cacheKeysToIntegrities.set(e,a.integrity)}if(this._urlsToCacheKeys.set(n,e),this._urlsToCacheModes.set(n,r),s.length>0){const e=`Workbox is precaching URLs without revision info: ${s.join(", ")}\nThis is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(e)}}}install(e){return i(e,(async()=>{const t=new c;this.strategy.plugins.push(t);for(const[t,s]of this._urlsToCacheKeys){const a=this._cacheKeysToIntegrities.get(s),n=this._urlsToCacheModes.get(t),r=new Request(t,{integrity:a,cache:n,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:s},request:r,event:e}))}const{updatedURLs:s,notUpdatedURLs:a}=t;return{updatedURLs:s,notUpdatedURLs:a}}))}activate(e){return i(e,(async()=>{const e=await self.caches.open(this.strategy.cacheName),t=await e.keys(),s=new Set(this._urlsToCacheKeys.values()),a=[];for(const n of t)s.has(n.url)||(await e.delete(n),a.push(n.url));return{deletedURLs:a}}))}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s){return(await self.caches.open(this.strategy.cacheName)).match(s)}}createHandlerBoundToURL(e){const s=this.getCacheKeyForURL(e);if(!s)throw new t("non-precached-url",{url:e});return t=>(t.request=new Request(e),t.params=Object.assign({cacheKey:s},t.params),this.strategy.handle(t))}}let x;const R=()=>(x||(x=new v),x);try{self["workbox:routing:6.4.1"]&&_()}catch(e){}const C=e=>e&&"object"==typeof e?e:{handle:e};class E{constructor(e,t,s="GET"){this.handler=C(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=C(e)}}class j extends E{constructor(e,t,s){super((({url:t})=>{const s=e.exec(t.href);if(s&&(t.origin===location.origin||0===s.index))return s.slice(1)}),t,s)}}class q{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",(e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)}))}addCacheListener(){self.addEventListener("message",(e=>{if(e.data&&"CACHE_URLS"===e.data.type){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map((t=>{"string"==typeof t&&(t=[t]);const s=new Request(...t);return this.handleRequest({request:s,event:e})})));e.waitUntil(s),e.ports&&e.ports[0]&&s.then((()=>e.ports[0].postMessage(!0)))}}))}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const a=s.origin===location.origin,{params:n,route:r}=this.findMatchingRoute({event:t,request:e,sameOrigin:a,url:s});let i=r&&r.handler;const o=e.method;if(!i&&this._defaultHandlerMap.has(o)&&(i=this._defaultHandlerMap.get(o)),!i)return;let c;try{c=i.handle({url:s,request:e,event:t,params:n})}catch(e){c=Promise.reject(e)}const h=r&&r.catchHandler;return c instanceof Promise&&(this._catchHandler||h)&&(c=c.catch((async a=>{if(h)try{return await h.handle({url:s,request:e,event:t,params:n})}catch(e){e instanceof Error&&(a=e)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw a}))),c}findMatchingRoute({url:e,sameOrigin:t,request:s,event:a}){const n=this._routes.get(s.method)||[];for(const r of n){let n;const i=r.match({url:e,sameOrigin:t,request:s,event:a});if(i)return n=i,(Array.isArray(n)&&0===n.length||i.constructor===Object&&0===Object.keys(i).length||"boolean"==typeof i)&&(n=void 0),{route:r,params:n}}return{}}setDefaultHandler(e,t="GET"){this._defaultHandlerMap.set(t,C(e))}setCatchHandler(e){this._catchHandler=C(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new t("unregister-route-but-not-found-with-method",{method:e.method});const s=this._routes.get(e.method).indexOf(e);if(!(s>-1))throw new t("unregister-route-route-not-registered");this._routes.get(e.method).splice(s,1)}}let D;const L=()=>(D||(D=new q,D.addFetchListener(),D.addCacheListener()),D);function T(e,s,a){let n;if("string"==typeof e){const t=new URL(e,location.href);n=new E((({url:e})=>e.href===t.href),s,a)}else if(e instanceof RegExp)n=new j(e,s,a);else if("function"==typeof e)n=new E(e,s,a);else{if(!(e instanceof E))throw new t("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});n=e}return L().registerRoute(n),n}class U extends E{constructor(e,t){super((({request:s})=>{const a=e.getURLsToCacheKeys();for(const n of function*(e,{ignoreURLParametersMatching:t=[/^utm_/,/^fbclid$/],directoryIndex:s="index.html",cleanURLs:a=!0,urlManipulation:n}={}){const r=new URL(e,location.href);r.hash="",yield r.href;const i=function(e,t=[]){for(const s of[...e.searchParams.keys()])t.some((e=>e.test(s)))&&e.searchParams.delete(s);return e}(r,t);if(yield i.href,s&&i.pathname.endsWith("/")){const e=new URL(i.href);e.pathname+=s,yield e.href}if(a){const e=new URL(i.href);e.pathname+=".html",yield e.href}if(n){const e=n({url:r});for(const t of e)yield t.href}}(s.url,t)){const t=a.get(n);if(t){return{cacheKey:t,integrity:e.getIntegrityForCacheKey(t)}}}}),e.strategy)}}class k extends y{async _handle(e,s){let a,n=await s.cacheMatch(e);if(!n)try{n=await s.fetchAndCachePut(e)}catch(e){e instanceof Error&&(a=e)}if(!n)throw new t("no-response",{url:e.url,error:a});return n}}const I={cacheWillUpdate:async({response:e})=>200===e.status||0===e.status?e:null};class N extends y{constructor(e={}){super(e),this.plugins.some((e=>"cacheWillUpdate"in e))||this.plugins.unshift(I)}async _handle(e,s){const a=s.fetchAndCachePut(e).catch((()=>{}));let n,r=await s.cacheMatch(e);if(r);else try{r=await a}catch(e){e instanceof Error&&(n=e)}if(!r)throw new t("no-response",{url:e.url,error:n});return r}}try{self["workbox:cacheable-response:6.4.1"]&&_()}catch(e){}class S{constructor(e={}){this._statuses=e.statuses,this._headers=e.headers}isResponseCacheable(e){let t=!0;return this._statuses&&(t=this._statuses.includes(e.status)),this._headers&&t&&(t=Object.keys(this._headers).some((t=>e.headers.get(t)===this._headers[t]))),t}}class P{constructor(e){this.cacheWillUpdate=async({response:e})=>this._cacheableResponse.isResponseCacheable(e)?e:null,this._cacheableResponse=new S(e)}}try{self["workbox:broadcast-update:6.4.1"]&&_()}catch(e){}const O=["content-length","etag","last-modified"],A=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);function M(e){return{cacheName:e.cacheName,updatedURL:e.request.url}}class K{constructor({generatePayload:e,headersToCheck:t,notifyAllClients:s}={}){this._headersToCheck=t||O,this._generatePayload=e||M,this._notifyAllClients=null==s||s}async notifyIfUpdated(e){var t,s,a;if(e.oldResponse&&(t=e.oldResponse,s=e.newResponse,(a=this._headersToCheck).some((e=>t.headers.has(e)&&s.headers.has(e)))&&!a.every((e=>{const a=t.headers.has(e)===s.headers.has(e),n=t.headers.get(e)===s.headers.get(e);return a&&n})))){const t={type:"CACHE_UPDATED",meta:"workbox-broadcast-update",payload:this._generatePayload(e)};if("navigate"===e.request.mode){let t;e.event instanceof FetchEvent&&(t=e.event.resultingClientId);await async function(e){if(!e)return;let t=await self.clients.matchAll({type:"window"});const s=new Set(t.map((e=>e.id)));let a;const n=performance.now();for(;performance.now()-n<2e3&&(t=await self.clients.matchAll({type:"window"}),a=t.find((t=>e?t.id===e:!s.has(t.id))),!a);)await m(100);return a}(t)&&!A||await m(3500)}if(this._notifyAllClients){const e=await self.clients.matchAll({type:"window"});for(const s of e)s.postMessage(t)}else if(e.event instanceof FetchEvent){const s=await self.clients.get(e.event.clientId);null==s||s.postMessage(t)}}}}function B(e){e.then((()=>{}))}class W{constructor(e){this.cacheDidUpdate=async e=>{B(this._broadcastUpdate.notifyIfUpdated(e))},this._broadcastUpdate=new K(e)}}let H,F;const z=new WeakMap,$=new WeakMap,V=new WeakMap,G=new WeakMap,Q=new WeakMap;let J={get(e,t,s){if(e instanceof IDBTransaction){if("done"===t)return $.get(e);if("objectStoreNames"===t)return e.objectStoreNames||V.get(e);if("store"===t)return s.objectStoreNames[1]?void 0:s.objectStore(s.objectStoreNames[0])}return Z(e[t])},set:(e,t,s)=>(e[t]=s,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function X(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(F||(F=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(ee(this),t),Z(z.get(this))}:function(...t){return Z(e.apply(ee(this),t))}:function(t,...s){const a=e.call(ee(this),t,...s);return V.set(a,t.sort?t.sort():[t]),Z(a)}}function Y(e){return"function"==typeof e?X(e):(e instanceof IDBTransaction&&function(e){if($.has(e))return;const t=new Promise(((t,s)=>{const a=()=>{e.removeEventListener("complete",n),e.removeEventListener("error",r),e.removeEventListener("abort",r)},n=()=>{t(),a()},r=()=>{s(e.error||new DOMException("AbortError","AbortError")),a()};e.addEventListener("complete",n),e.addEventListener("error",r),e.addEventListener("abort",r)}));$.set(e,t)}(e),t=e,(H||(H=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some((e=>t instanceof e))?new Proxy(e,J):e);var t}function Z(e){if(e instanceof IDBRequest)return function(e){const t=new Promise(((t,s)=>{const a=()=>{e.removeEventListener("success",n),e.removeEventListener("error",r)},n=()=>{t(Z(e.result)),a()},r=()=>{s(e.error),a()};e.addEventListener("success",n),e.addEventListener("error",r)}));return t.then((t=>{t instanceof IDBCursor&&z.set(t,e)})).catch((()=>{})),Q.set(t,e),t}(e);if(G.has(e))return G.get(e);const t=Y(e);return t!==e&&(G.set(e,t),Q.set(t,e)),t}const ee=e=>Q.get(e);const te=["get","getKey","getAll","getAllKeys","count"],se=["put","add","delete","clear"],ae=new Map;function ne(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(ae.get(t))return ae.get(t);const s=t.replace(/FromIndex$/,""),a=t!==s,n=se.includes(s);if(!(s in(a?IDBIndex:IDBObjectStore).prototype)||!n&&!te.includes(s))return;const r=async function(e,...t){const r=this.transaction(e,n?"readwrite":"readonly");let i=r.store;return a&&(i=i.index(t.shift())),(await Promise.all([i[s](...t),n&&r.done]))[0]};return ae.set(t,r),r}J=(e=>({...e,get:(t,s,a)=>ne(t,s)||e.get(t,s,a),has:(t,s)=>!!ne(t,s)||e.has(t,s)}))(J);try{self["workbox:expiration:6.4.1"]&&_()}catch(e){}const re="cache-entries",ie=e=>{const t=new URL(e,location.href);return t.hash="",t.href};class oe{constructor(e){this._db=null,this._cacheName=e}_upgradeDb(e){const t=e.createObjectStore(re,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&function(e,{blocked:t}={}){const s=indexedDB.deleteDatabase(e);t&&s.addEventListener("blocked",(()=>t())),Z(s).then((()=>{}))}(this._cacheName)}async setTimestamp(e,t){const s={url:e=ie(e),timestamp:t,cacheName:this._cacheName,id:this._getId(e)},a=(await this.getDb()).transaction(re,"readwrite",{durability:"relaxed"});await a.store.put(s),await a.done}async getTimestamp(e){const t=await this.getDb(),s=await t.get(re,this._getId(e));return null==s?void 0:s.timestamp}async expireEntries(e,t){const s=await this.getDb();let a=await s.transaction(re).store.index("timestamp").openCursor(null,"prev");const n=[];let r=0;for(;a;){const s=a.value;s.cacheName===this._cacheName&&(e&&s.timestamp<e||t&&r>=t?n.push(a.value):r++),a=await a.continue()}const i=[];for(const e of n)await s.delete(re,e.id),i.push(e.url);return i}_getId(e){return this._cacheName+"|"+ie(e)}async getDb(){return this._db||(this._db=await function(e,t,{blocked:s,upgrade:a,blocking:n,terminated:r}={}){const i=indexedDB.open(e,t),o=Z(i);return a&&i.addEventListener("upgradeneeded",(e=>{a(Z(i.result),e.oldVersion,e.newVersion,Z(i.transaction))})),s&&i.addEventListener("blocked",(()=>s())),o.then((e=>{r&&e.addEventListener("close",(()=>r())),n&&e.addEventListener("versionchange",(()=>n()))})).catch((()=>{})),o}("workbox-expiration",1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class ce{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new oe(e)}async expireEntries(){if(this._isRunning)return void(this._rerunRequested=!0);this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-1e3*this._maxAgeSeconds:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const e of t)await s.delete(e,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,B(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){const t=await this._timestampModel.getTimestamp(e),s=Date.now()-1e3*this._maxAgeSeconds;return void 0===t||t<s}return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}class he{constructor(e={}){this.cachedResponseWillBeUsed=async({event:e,request:t,cacheName:s,cachedResponse:a})=>{if(!a)return null;const n=this._isResponseDateFresh(a),r=this._getCacheExpiration(s);B(r.expireEntries());const i=r.updateTimestamp(t.url);if(e)try{e.waitUntil(i)}catch(e){}return n?a:null},this.cacheDidUpdate=async({cacheName:e,request:t})=>{const s=this._getCacheExpiration(e);await s.updateTimestamp(t.url),await s.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&function(e){f.add(e)}((()=>this.deleteCacheAndMetadata()))}_getCacheExpiration(e){if(e===r())throw new t("expire-custom-caches-only");let s=this._cacheExpirations.get(e);return s||(s=new ce(e,this._config),this._cacheExpirations.set(e,s)),s}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(null===t)return!0;return t>=Date.now()-1e3*this._maxAgeSeconds}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),s=new Date(t).getTime();return isNaN(s)?null:s}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}const le={north:"northv3",south:"southv3",pacific:"pacificv1",theworld:"theworldv2",mercator:"denizotjbv2",eqephysicalfr:"eqephysicalfrv1",eqepoliticalfr:"eqepoliticalfrv1",cb202x:"cb2022v1",namphysicalmeters:"namphysicalmetersv1",artic:"articv1"},ue="lido-warmup",pe="lido-mapbox",de="lido-data",fe="lido-fir",me="lido-noaa",ge="lido-gramet2",we=["lido-ona-theworldv1","lido-zoom5_ona1","lido-ona-theworldv2","lido-zoom5_ona2","lido-ona-southv3","lido-ona-northv3","lido-ona-pacificv1","lido-zoom4_ona3_ona3_ona1"],ye=["swtest"];var be,_e;be=[{"revision":"d1786ccaca658e8ead1dc2437a8b6013","url":"index.html"},{"revision":"74188d6ac788a0bd90c0a2354710c229","url":"images/ofp2map-icons/icon-180x180.png"},{"revision":"a2af94b7b7af7491c7443e39862acb75","url":"images/ofp2map-icons/icon-128x128.png"},{"revision":"bf1a18f3b441cb30c7d06e94ab7a57a6","url":"images/map-help.webp"},{"revision":"452ac1de129a72ba380efb65e8b92a5c","url":"images/layers-settings.webp"},{"revision":"e8c1f85c1101aed24e3f166a5a20f4d6","url":"images/ephemerides.webp"},{"revision":"b096903a12e454c5b46042ed3d16bf05","url":"images/65x70_northern-lights.webp"},{"revision":"28c11cacaedf2a33bc5824e88f9c312e","url":"images/stripe-orange.png"},{"revision":"eb18468c687bdf56e77661078085f5d1","url":"images/stripe-red.png"},{"revision":"59e5de1caabb49c51eb9fe4c53bbf5df","url":"css/bundle.css"},{"revision":"d6f4b3647e24921721f28e3a15354c78","url":"js/bundle.js"},{"revision":"6a4bb11b48872d9e94e2d11cd5d240b3","url":"svg/Air_France_Logo.svg"},{"revision":"a71d482d2ab40879af8dcc00b21143b7","url":"svg/worldmap.svg"},{"revision":"72bd661eaa1f8e8e7ba4d055b880ef7b","url":"sdf/maki-camera-sdf.png"},{"revision":"ae8eb6c1acf90de671f61ebd3c06523d","url":"sdf/map-circle-sdf.png"},{"revision":"e5437d8af78d3b5af20aa7a4bc6c7253","url":"sdf/map-plane-sdf.png"},{"revision":"aede03a01013f77c127e3f79068c9ff2","url":"sdf/map-star-sdf.png"},{"revision":"3cad1d5b1d95fd21e80b7077707b32ee","url":"sdf/map-triangle-sdf.png"},{"revision":"7cff120e979ecf7d6440f8ec0583adbf","url":"CHANGELOG.json"}],_e={ignoreURLParametersMatching:[/.+Pin$/,/.+Display$/,/.+Color$/,/.+PinPosition$/,/^shortcut$/,/^downloadType$/,/^runShortcut$/,/.+Change$/,/.+Label$/,/.+Hide$/]},function(e){R().precache(e)}(be),function(e){const t=R();T(new U(t,e))}(_e);const ve=["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js","https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js","https://unpkg.com/mapbox-gl@1.13.2/dist/mapbox-gl.js","https://unpkg.com/mapbox-gl@1.13.2/dist/mapbox-gl.css","https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.1.3/css/bootstrap.min.css","https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js","https://unpkg.com/pinch-zoom-element-js@1.1.2/dist/pinch-zoom-min.js"],xe=["./js/lidojs.1.6.36.min.js","./js/wmo.1.6.36.var.js"],Re=ve.concat(xe);T(/.+\/(bootstrap\.min\.css|pdf\.min\.js|pdf\.worker\.min\.js|proj4\.min\.js|mapbox-gl\.js|mapbox-gl\.css|lidojs.+\.js|wmo.+\.var\.js|pinch-zoom-min\.js)$/,new k({cacheName:ue})),T((({url:e})=>"https://api.mapbox.com"===e.origin&&(e.pathname.startsWith("/styles/")||e.pathname.startsWith("/fonts/")||"/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json"===e.pathname||"/v4/denizotjb.6nts91f3.json"===e.pathname||"/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.1x3i1g8r,denizotjb.bifqeinj,denizotjb.cz0kdfpx,denizotjb.aop85z8z,mapbox.mapbox-terrain-v2.json"===e.pathname)),new N({cacheName:pe})),T((({url:e})=>e.pathname.endsWith("/data/airports.2205.geojson")),new k({cacheName:de,plugins:[new he({maxEntries:2})]})),T((({url:e})=>e.pathname.endsWith("/data/fir-reg.2205.geojson")),new k({cacheName:fe,plugins:[new he({maxEntries:2})]})),T((({url:e})=>"https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"===e.href),new N({cacheName:me,plugins:[new P({statuses:[200]}),new W,new he({maxEntries:1,maxAgeSeconds:86400})]})),T((({url:e})=>"https://cjq5hglsy6.execute-api.eu-west-3.amazonaws.com"===e.origin&&e.pathname.endsWith(".png")),new N({cacheName:ge,fetchOptions:{cache:"default"},plugins:[new P({statuses:[200]}),new W({headersToCheck:["X-ETag"]}),new he({maxEntries:5,maxAgeSeconds:172800})]}));const Ce=new class{constructor(e,t,s){this.dbName=e,this.dbPromise=new Promise(((a,n)=>{const r=indexedDB.open(e,t);r.onsuccess=()=>{a(r)},r.onerror=()=>{n("Error while opening DB")},r.onupgradeneeded=s?s.bind(null,r):()=>{}}))}getImageIdFromURL(e){return e.pathname.replace(/[/.]/g,"_")}async fetchImageFromDB(e,t){const s=await this.dbPromise;return new Promise(((a,n)=>{const r=s.result.transaction(t,"readonly").objectStore(t).get(e);r.onsuccess=()=>{a(r.result)},r.onerror=()=>{n("Something went wrong while fetching image from DB ")}}))}async putImageInDB(e,t,s){const a=await this.dbPromise;return new Promise(((n,r)=>{const i=a.result.transaction(t,"readwrite").objectStore(t),o=i.put(s,e);o.onsuccess=()=>{const t=i.get(e);t.onsuccess=()=>{n(t.result)}},o.onerror=()=>{r("Something went wrong while putting image in DB ")}}))}getCacheHandler(e){return this._cacheHandler.bind(this,e)}async isNotCached(e,t){const s=this.getImageIdFromURL(t),a=await this.dbPromise;return new Promise(((n,r)=>{const i=a.result.transaction(e,"readonly").objectStore(e).getKey(s);i.onsuccess=()=>{n(void 0===i.result?t:null)},i.onerror=()=>{r("Something went wrong while checking if cached from DB ")}}))}async countTiles(e){const t=await this.dbPromise;return new Promise(((s,a)=>{const n=t.result.transaction(e,"readonly").objectStore(e).count();n.onsuccess=()=>s(n.result),n.onerror=()=>a("Something went wrong while counting entries from DB")}))}async close(){(await this.dbPromise).result.close()}async _cacheHandler(e,{request:t,url:s}){const a=this.getImageIdFromURL(s);return this.fetchImageFromDB(a,e).then((s=>s?new Response(s):fetch(t).then((e=>e.clone().blob())).then((t=>t.type.startsWith("image/")||"application/x-protobuf"===t.type?this.putImageInDB(a,e,t).then((e=>new Response(e))):new Response("",{status:404,statusText:"invalid image found (sw)"})))))}}("lido-tiles",10,((e,t)=>{t.oldVersion<1&&e.result.createObjectStore(le.theworld),t.oldVersion<2&&(e.result.createObjectStore(le.north),e.result.createObjectStore(le.south),e.result.createObjectStore(le.pacific)),t.oldVersion<3&&e.result.createObjectStore("denizotjbv1"),t.oldVersion<4&&e.result.createObjectStore(le.eqephysicalfr),t.oldVersion<5&&e.result.createObjectStore("cb2020v1"),t.oldVersion<6&&(e.result.deleteObjectStore("denizotjbv1"),e.result.createObjectStore("denizotjbv2")),t.oldVersion<7&&e.result.createObjectStore(le.namphysicalmeters),t.oldVersion<8&&e.result.createObjectStore(le.eqepoliticalfr),t.oldVersion<9&&e.result.createObjectStore(le.artic),t.oldVersion<10&&(e.result.deleteObjectStore("cb2020v1"),e.result.createObjectStore(le.cb202x))}));T((({url:e})=>e.href.match(new RegExp("https://ofp2map-northv3.netlify.app/northv3/[0-4]/.*"))),Ce.getCacheHandler(le.north)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-southv3.netlify.app/southv3/[0-4]/.*"))),Ce.getCacheHandler(le.south)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-theworldv2.netlify.app/theworldv2/[0-5]/.*"))),Ce.getCacheHandler(le.theworld)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-eqephysicalfrv1.netlify.app/eqephysicalfrv1/[0-5]/.*"))),Ce.getCacheHandler(le.eqephysicalfr)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-eqepoliticalfrv1.netlify.app/eqepoliticalfrv1/[0-6]/.*"))),Ce.getCacheHandler(le.eqepoliticalfr)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-cb2022v1.netlify.app/cb2022v1/[0-5]/.*"))),Ce.getCacheHandler(le.cb202x)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-namphysicalmetersv1.netlify.app/namphysicalmetersv1/[0-5]/.*"))),Ce.getCacheHandler(le.namphysicalmeters)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-articv1.netlify.app/articv1/[0-5]/.*"))),Ce.getCacheHandler(le.artic));const Ee=`https://api.mapbox.com/v4/${le.mercator.slice(0,-2)}`;T((({url:e})=>e.href.match(new RegExp(Ee+"[^/]+/[0-6]/.*"))),Ce.getCacheHandler(le.mercator)),T((({url:e})=>e.href.match(new RegExp("https://ofp2map-pacificv1.netlify.app/pacificv1/[0-4]/.*"))),Ce.getCacheHandler(le.pacific)),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-northv3.netlify.app/northv3|https://ofp2map-southv3.netlify.app/southv3|https://ofp2map-pacificv1.netlify.app/pacificv1)/[5-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-theworldv2.netlify.app/theworldv2)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-eqephysicalfrv1.netlify.app/eqephysicalfrv1)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-eqepoliticalfrv1.netlify.app/eqepoliticalfrv1)/[7-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-namphysicalmetersv1.netlify.app/namphysicalmetersv1)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-cb2022v1.netlify.app/cb2022v1)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"}))),T((({url:e})=>e.href.match(new RegExp("(https://ofp2map-articv1.netlify.app/articv1)/[6-9]/.*"))),(async()=>new Response("",{status:404,statusText:"sw says nope!"})));self.addEventListener("install",(e=>{e.waitUntil(caches.open("lido-warmup").then((e=>function(e,t=[],s=[]){if(!(e instanceof Cache&&Array.isArray(t)&&Array.isArray(s)))return Promise.reject();let a=[];return Promise.all(t.map((function(t){return caches.match(t).then((function(s){return s?e.put(t,s):(a.push(t),Promise.resolve())}))}))).then((function(){return e.addAll(a.concat(s))}))}(e,Re))))}));const je=e=>!!["northv3","northv2","northv1","southv3","southv2","southv1","pacificv1"].includes(e)||we.includes(e),qe=e=>{if(-1!==ve.indexOf(e.url))return!1;for(const t of xe)if(t.startsWith("http")){if(e.url===t)return!1}else if(-1!==e.url.indexOf(t.replace(/^\./,"")))return!1;return!0};self.addEventListener("activate",(function(e){e.waitUntil(caches.keys().then((function(e){return e.filter(je).map((e=>caches.delete(e)))})).then((()=>caches.open("lido-warmup"))).then((function(e){return e.keys().then((function(t){return Promise.all(t.filter(qe).map((t=>e.delete(t))))}))})).then((()=>{try{ye.forEach((e=>{indexedDB.deleteDatabase(e)}))}catch(e){}self.clients.claim()})))})),self.addEventListener("message",(e=>{!e.data||"SKIP_WAITING"!==e.data&&"SKIP_WAITING"!==e.data.type?e.data&&"GET_VERSION"===e.data.type?e.ports[0].postMessage("1.18.2"):e.data&&"GET_BUILD_VERSION"===e.data.type?e.ports[0].postMessage("1.18.2/220607b60"):e.data&&"CLIENTS_CLAIM"===e.data.type&&self.clients.claim():self.skipWaiting()}))}();
//# sourceMappingURL=sw.js.map
