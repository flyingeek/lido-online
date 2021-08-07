import { writable, readable, derived } from 'svelte/store';
import {aircraftTypes} from "./constants";
import {binarysearch} from "./components/utils";

export function resetable(resetValue) {
    const { subscribe, set, update } = writable(resetValue);
    return {
        subscribe,
        set,
        update,
        reset: () => set((typeof resetValue === 'object') ? {...resetValue} : Array.isArray(resetValue) ? [...resetValue] : resetValue)
    };
}

export const wb = writable();
export const swDismiss = writable(false);
export const swUpdated = writable(false);
export const majorUpdate = writable(false);
export const sidebar = writable(false);

export const showGramet = writable(false);
export const showPlaneOnMap = resetable(false);
export const grametPosition = writable(100);
export const simulate = writable(-1);
export const ofp = writable();
export const ofpStatus = writable();
export const takeOffTime = writable();
export const landingTime = derived([ofp, takeOffTime], ([$ofp, $takeOffTime]) => {
    if ($ofp && $takeOffTime) {
        if ($ofp.timeMatrix.length > 0) {
            return new Date($takeOffTime.getTime() + (60000 * $ofp.timeMatrix[$ofp.timeMatrix.length - 1][1]));
        }
        const landing = new Date($takeOffTime.getTime() + $ofp.infos.flightTime * 60000);
        return landing;
    }
    return undefined;
});
export const fl = writable();

export const selectedAircraftType = writable();
export const aircraftType = derived([ofp, selectedAircraftType], ([$ofp, $selectedAircraftType]) => {
    let aircraft;
    if ($selectedAircraftType) {
        aircraft = $selectedAircraftType;
    }else if ($ofp){
        aircraft = $ofp.infos.aircraftType;
    }
    if (!aircraft || aircraftTypes.indexOf(aircraft) === -1) return undefined;
    return aircraft;
});

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
export const visible = readable(true, set => {
    const changeVisibleState = () => {
        if (document && document.visibilityState) {
            if (document.visibilityState === 'visible'){
                //console.log('visibility visible')
                set(true);
            } else {
                //console.log('visibility not visible')
                set(false);
            }
        } else {
            //console.log('visibility not supported, visible')
            set(true);
        }
    };
    document.addEventListener("visibilitychange", changeVisibleState);
    changeVisibleState();
    return () => {
        document.removeEventListener("visibilitychange", changeVisibleState);
    }
});

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
    [ofp, simulate, takeOffTime, showPlaneOnMap, visible],
    ([$ofp, $simulate, $takeOffTime, $showPlaneOnMap, $visible], set) => {
        //console.log('fp init')
        let interval;
        const frequency = ($showPlaneOnMap) ? 10 * 1000 : 60 * 1000;
        const simulatorFrequency = 100;
        if($ofp && $takeOffTime){
            const setValue = (value) => {
                if (value < 100) {
                    set(value);
                }else {
                    set(100);
                    clearInterval(interval);
                    interval = undefined;
                    //console.log('fp: last update', value);
                    simulate.set(-1); 
                }
            };
            
            if ($simulate >= 0) {
                //console.log('start of simulated session');
                let value = $simulate;
                interval = setInterval(() => {
                    setValue(value);
                    value++;
                }, simulatorFrequency);
            } else {
                const takeOff = $takeOffTime;
                const landing = new Date(takeOff.getTime() + $ofp.infos.flightTime * 60000);
                const computePosition = () => {
                    let now = new Date();
                    if (now <= takeOff) {
                        return 0;
                    } else if (now >= landing) {
                        return  100;
                    } else {
                        return (now - takeOff) / ($ofp.infos.flightTime * 60) / 10;
                    }
                };
                const pos = computePosition();
                if (pos < 100) {
                    if ($visible) {
                        interval = setInterval(() => {
                            const value = computePosition();
                            setValue(value);
                        }, frequency);
                    }
                    set(pos);
                }else{
                    set(100);
                    //console.log('set to max, no interval set', 100);
                }
            }
        } else {
            set(0);
            //console.log('set to zero (no ofp of fakeOfp), no interval set', 0)
        }
        return () => {
            if (interval) clearInterval(interval);
            //console.log('closing flight progress')
        }
    },
    0 // initial value
);
export const position = derived([ofp, flightProgress], ([$ofp, $flightProgress]) => {
    if (!$ofp) return { map: {latitude: 0, longitude: 0}, gramet: $flightProgress, fl: 300, reltime: 0};
    const timeMatrix = $ofp.timeMatrix;
    const distanceMatrix = $ofp.distanceMatrix;
    const firstPoint = distanceMatrix[0][0];
    const lastPoint = distanceMatrix[distanceMatrix.length - 1][0];
    const routeDistance = distanceMatrix[distanceMatrix.length - 1][1];
    const firstFL = (timeMatrix.length !== 0) ? timeMatrix[0][2] : distanceMatrix[0][2];
    const lastFL = (timeMatrix.length !== 0) ? timeMatrix[timeMatrix.length - 1][2] : distanceMatrix[distanceMatrix.length - 1][2];
    const routeTime = (timeMatrix.length !== 0) ? timeMatrix[timeMatrix.length - 1][1] : $ofp.infos.flightTime;
    const posTime = ($flightProgress * routeTime) / 100;
    if ($flightProgress <= 0) return {map: firstPoint, gramet: 0, fl: firstFL, reltime: posTime};
    if ($flightProgress >= 100) return {map: lastPoint, gramet: 100, fl: lastFL, reltime: posTime};

    if (timeMatrix.length !== 0) {
        const i = binarysearch(timeMatrix, a => a[1] >= posTime);
        const [p, sum, fl] = timeMatrix[i];
        if (posTime - sum === 0) {
            return {
                reltime: posTime,
                map: p,
                gramet: 100 * distanceMatrix[i][1] / routeDistance,
                fl
            };
        }
        const previous = timeMatrix[i - 1];
        if (previous) {
            const segmentLength = distanceMatrix[i][1] - distanceMatrix[i - 1][1];
            const fraction = (sum - posTime) / (sum - previous[1]);
            return {
                reltime: posTime,
                map: p.atFraction(previous[0], fraction, segmentLength),
                gramet: 100 * ((distanceMatrix[i][1] - (fraction * segmentLength))) / routeDistance,
                fl: previous[2]
            }
        }
        return {
            reltime: posTime,
            map: firstPoint,
            gramet: 0,
            fl: firstFL
        };
    } else if(distanceMatrix.length !== 0){
        const routeDistance = distanceMatrix[distanceMatrix.length - 1][1];
        const posDistance = ($flightProgress * routeDistance) / 100;
        const i = binarysearch(distanceMatrix, a => a[1] >= posDistance);
        const [p, sum, fl] = distanceMatrix[i];
        if (posDistance - sum === 0) return {
            map: p,
            gramet: $flightProgress,
            fl,
            reltime: posTime
        };
        const previous = distanceMatrix[i - 1];
        if (previous) {
            const segmentLength = sum - previous[1];
            return {
                map: p.atFraction(previous[0], (sum - posDistance) / segmentLength, segmentLength),
                gramet: $flightProgress,
                fl: previous[2],
                reltime: posTime
            }
        }
        return {
            map: firstPoint,
            gramet: 0,
            fl: firstFL,
            reltime: posTime
        };
    }
    return {
        map: lastPoint,
        gramet: 100,
        fl: lastFL,
        reltime: posTime
    };

}, { map: {latitude: 0, longitude: 0}, gramet: 0, fl: 300, reltime: 0});