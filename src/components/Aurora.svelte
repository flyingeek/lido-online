<script context="module">
    import {derived, writable} from "svelte/store";
    import {solar} from "./solarstore";

    const fetchPredictedKpFn = async () => {    
        return fetch('CONF_NOOA_KP_JSON')
            .then(response => response.json())
            .then(data => {
                const now = Date.now();
                let timetable = [];
                try {
                    for (let i=data.length - 1; i>=1; i--){
                        const [d, k] = data[i];
                        const t = Date.parse(d.replace(' ', 'T') + 'Z'); // Safari needs the T
                        if (t >= now - 172800000 && t <= now + 86400000) { // -48h / +24h
                            timetable.push([t, parseFloat(k)])
                        }
                    }
                } catch (error) {
                    console.error('kp store update error', error);
                }
                console.log(timetable.map(a=>[new Date(a[0]), a[1]]));
                
                const fn = (date) => {
                    const ts = date.getTime();
                    for (let i=0; i<timetable.length; i++){
                        if (ts >= timetable[i][0]) {
                            return timetable[i][1];
                        }
                    }
                    return -1;
                }
                //console.log(timetable.map(a => [new Date(a[0]), a[1]]))
                return fn;
            })
            .catch(function(error) {
                console.log('Could not update Kp store', error);
            });
    }
    export const Kp = writable();
    export const aurora = derived(
        [solar, Kp],
        ([$solar, $Kp]) => {
            if ($solar.route.length === 0 || !$Kp) return [];
            const segments = [];
            let segment = [];
            for (const {/* p, */ date, minKp, state} of $solar.route) {
                const predictedDate = ('process.env.NODE_ENV' === '"development"') ? new Date(Date.now() - $solar.takeOffTs + date.getTime()) : date;
                const predictedKp = $Kp(predictedDate);
                if (minKp <= predictedKp && ['night', 'astronomicalDusk', 'astronomicalDawn'].includes(state)){
                    segment.push({/* p, */ date, predictedKp});
                }else{
                    if (segment.length > 0) segments.push(segment);
                    segment = [];
                }
            }
            if (segment.length > 0) segments.push(segment);
            const periods = [];
            const roundTime = (date, method) => {
                const coeff = 1000 * 60 * 5; // 5min
                return new Date(method(date.getTime() / coeff) * coeff)
            }
            for (const list of segments) {
                let start;
                let end;
                if (list.length === 1) {
                    start = new Date(list[0].date.getTime() - 300000); // -5mn
                    end = new Date(list[list.length - 1].date.getTime() + 300000); // + 5mn
                } else {
                    start = list[0].date;
                    end = list[list.length - 1].date;
                }
                start = roundTime(start, Math.floor);
                end = roundTime(end, Math.ceil);
                periods.push({
                    period: [start, end],
                    //points: [list[0].p, list[list.length - 1].p],
                    predictedKp: Math.max(...list.map(s => s.predictedKp))
                });
            }
            return periods;
        }
    );
</script>
<script>
    import {onMount} from "svelte";
    import {ofp} from "../stores";

    const predictedKpUpdated = async (event) => {
        if (event.data.meta === 'workbox-broadcast-update' && event.data.type === 'CACHE_UPDATED') {
                const {updatedURL} = event.data.payload;
                if (updatedURL === 'CONF_NOOA_KP_JSON') {
                    console.log('loading noaa kp store (sw cache updated)');
                    const fn = await fetchPredictedKpFn();
                    Kp.set(fn);
                }
            }
    };

    onMount(async () => {
        if (navigator && navigator.serviceWorker){
            navigator.serviceWorker.addEventListener('message', predictedKpUpdated);
        }
        const isInCache = async () => {
            let inCache = false;
            if (window.caches) {
                const keys = await window.caches.open('lido-noaa').then(cache => cache.keys());
                for (const req of keys) {
                    if (req.url === 'CONF_NOOA_KP_JSON') {
                        inCache = true;
                        break;
                    }
                }
            }
            return inCache;
        }

        const unsubscribe = ofp.subscribe(async () => {
            const inCache = await isInCache();
            if (inCache) {
                fetch('CONF_NOOA_KP_JSON').catch(() => {return;});
                console.log('ping noaa (ofp change)'); //predictedKpUpdate will do the real load if needed
            }else{
                const fn = await fetchPredictedKpFn();
                console.log('loading noaa kp store (ofp change)');
                Kp.set(fn);
            }
        });
        return () => {
            unsubscribe();
            if (navigator && navigator.serviceWorker){
                navigator.serviceWorker.removeEventListener('message', predictedKpUpdated);
            }
        }
    });
</script>