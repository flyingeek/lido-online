import App from './App.svelte';
import {Workbox, messageSW} from 'workbox-window';
import {showSkipWaitingPrompt, swRegistration} from './components/SWUpdate.svelte';
import {promiseTimeout} from './components/utils';
import {wb} from './stores';

let app;
let appError = false;
const name = 'OFP2MAP';
try {
    app = new App({
        target: document.body
    });
}catch(err) {
    appError = true;
    try {
        var content = document.createElement("p");
        content.innerHTML =('Erreur: ' + err.message + '<br/><br/>'
            + name + ' a besoin de navigateurs récents: Safari 14 iOS/Mac, Firefox 86, Chrome 87 et Microsoft Edge 87 sont compatibles. <br /><br />'
            + 'Contactez moi sur l\'email AF (erdelord@...) en me donnant le message d\'erreur.'
        );
        document.body.appendChild(content);
    // eslint-disable-next-line no-empty
    }catch(e){} /* catch all here we can not interrupt the startup sequence */ 
}finally{
    // we always register the serviceWorker to be able to unregister it
    // or to force skipWaiting and page reload
    // this way as soon as a new serviceWorker fix the problem, the page will load
    if ('serviceWorker' in navigator) {
        const workbox = new Workbox('./sw.js');
        wb.set(workbox);
        workbox.addEventListener('installed', (event) => {
            if (!event.isUpdate) {
                //console.log('Service worker installed for the first time!');
            }else{
                //console.log('Updated Service worker installed');
            }
            //console.debug('Updated Service worker installed ', event.isUpdate, event.isExternal)
        });
        workbox.addEventListener('activated', (event) => {
            // `event.isUpdate` will be true if another version of the service
            // worker was controlling the page when this version was registered.
            if (!event.isUpdate) {
                //console.log('Service worker activated for the first time!');
                // If your service worker is configured to precache assets, those
                // assets should all be available now.
                // we should be able to remove clients.claim call in sw.js
                // but for now we have both...
                workbox.messageSW({ type: 'CLIENTS_CLAIM' });
            }else{
                //console.log('Updated Service worker activated');
            }
            if (event.isExternal) {
                console.warn('External Service worker activated');
                //window.location.reload();
            }
        });
        workbox.addEventListener('waiting', (event) => {
            //console.log(`A new service worker has installed, but it can't activate` +
            //    ` until all tabs running the current version have fully unloaded.`);
            if (appError) {
                workbox.addEventListener('controlling', () => {
                    console.warn('main.js: appError reload');
                    window.location.reload();
                });
                workbox.messageSkipWaiting();
            }else{
                if (event.isExternal) {
                    console.warn('External Service worker waiting');
                }
                promiseTimeout(400, messageSW(event.sw,{type: 'GET_VERSION'}))
                .then(v => showSkipWaitingPrompt(v))
                .catch(e => {
                    console.warn("SW GET_VERSION:", e);
                    showSkipWaitingPrompt();
                });
            }
        });
        workbox.register().then(reg => {
            if (appError && reg) reg.unregister();
            swRegistration.set(reg);
            //console.debug(reg);
        }, console.error);
    }
}

export default app;