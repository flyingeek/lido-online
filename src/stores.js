import { writable, readable, derived } from 'svelte/store';

export const wb = writable();
export const swDismiss = writable(false);
export const swUpdated = writable(false);
export const majorUpdate = writable(false);
export const sidebar = writable(false);

export const showGramet = writable(false);
export const grametPosition = writable(100);
export const simulate = writable(-1);
export const ofp = writable();
export const ofpStatus = writable();
export const takeOffTime = writable(new Date());
export const fl = writable();
export const isFakeOfp = writable(false);
let swLastUpdateDate = new Date();
export const checkSWUpdate = () => {
    if ('serviceWorker' in navigator) {
        // eslint-disable-next-line no-constant-condition
        const timeout = ('process.env.NODE_ENV' !== '"development"') ? 1800000 /* 30 mn */ : 2000;
        if ((new Date() - swLastUpdateDate) > timeout) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    if (!reg.waiting) {
                        reg.update();
                    } else {
                        // service worker quit while in background ?
                        swUpdated.set(true);
                        majorUpdate.set(true); // show immediatly
                    }
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

export const flightProgress = derived(
    [ofp, simulate, takeOffTime],
    ([$ofp, $simulate, $takeOffTime], set) => {
        console.log('fp init')
        let interval;
        const frequency = 60 * 1000;
        const simulatorFrequency = 100;
        if($ofp && !$ofp.isFake){
            const setValue = (value) => {
                if (value < 100) {
                    set(value);
                }else {
                    set(100);
                    clearInterval(interval);
                    interval = undefined;
                    console.log('fp: last update', value);
                    simulate.set(-1); 
                }
            };
            
            if ($simulate >= 0) {
                console.log('start of simulated session');
                let value = $simulate;
                interval = setInterval(() => {
                    setValue(value);
                    value++;
                }, simulatorFrequency);
            } else {
                const ofpTakeOff = $takeOffTime;
                const landing = new Date(ofpTakeOff);
                const duration = $ofp.infos.duration;
                landing.setUTCMinutes(landing.getUTCMinutes() + duration[1]);
                landing.setUTCHours(landing.getUTCHours() + duration[0]);
                const computePosition = () => {
                    let now = new Date();
                    if (now <= ofpTakeOff) {
                        return 0;
                    } else if (now >= landing) {
                        return  100;
                    } else {
                        return (now - ofpTakeOff) / (duration[0] * 3600 + duration[1] * 60) / 10;
                    }
                };
                const pos = computePosition();
                if (pos < 100) {
                    interval = setInterval(() => {
                        const value = computePosition();
                        setValue(value);
                    }, frequency);
                    set(pos);
                }else{
                    set(100);
                    console.log('set to max, no interval set', 100);
                }
            }
        } else {
            set(0);
            console.log('set to zero (no ofp of fakeOfp), no interval set', 0)
        }
        return () => {
            if (interval) clearInterval(interval);
            console.log('closing flight progress')
        }
    },
    0 // initial value
);

