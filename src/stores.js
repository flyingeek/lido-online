import { writable, readable, get } from 'svelte/store';

export const wb = writable();
export const swDismiss = writable(false);
export const sidebar = writable(false);
export const ofpPromise = writable();
export const isFakeOfp = writable(false);

let swLastUpdateDate = new Date();
export const checkSWUpdate = () => {
    if ('serviceWorker' in navigator) {
        const timeout = ('process.env.NODE_ENV' !== '"development"') ? 1800000 /* 30 mn */ : 2000;
        if ((new Date() - swLastUpdateDate) > timeout) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    if (!reg.waiting) reg.update();
                    swDismiss.set(false);
                    swLastUpdateDate = new Date();
                }
            }, console.error);
        }
    }
}

export const checkSwOnVisibilityChange = () =>{
    if (document && document.visibilityState && document.visibilityState === 'visible') {
        checkSWUpdate();
    }
}

export const online = readable({}, set => {
    const update_network_status = () => {
        set(navigator.onLine);
    };

    if (
        (typeof navigator !== "undefined") &&
        'onLine' in navigator
    ) {
        update_network_status();
        window.addEventListener('offline', update_network_status);
        window.addEventListener('online', update_network_status);
    } else {
        set(undefined);
    }

    return () => {
        if (
            (typeof navigator !== "undefined") &&
            'onLine' in navigator
        ) {
            window.removeEventListener('offline', update_network_status);
            window.removeEventListener('online', update_network_status);
        }
    };
});

export const route = readable('/', set => {
    const hashchange = () => {
        const meta = document.querySelector( "meta[name=viewport]" );
        const metaContent = (meta) ? meta.getAttribute( "content" ) : '';
        let route = window.location.hash.substr(1) || "/";
        if (route === '/map') {
            sidebar.set(false);
            if (metaContent) meta.setAttribute('content', metaContent + ',maximum-scale=1'); 
        } else {
            if (metaContent) meta.setAttribute('content', metaContent.replace(',maximum-scale=1', ''));
        }
        set(route);
        checkSWUpdate();
    };
    hashchange();
    window.addEventListener('hashchange', hashchange);

    return () => {
        window.removeEventListener('hashchange', hashchange);
    };
});
