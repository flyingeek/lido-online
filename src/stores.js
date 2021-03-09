import { writable, readable } from 'svelte/store';

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

export const handleVisibilityChange = () =>{
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
