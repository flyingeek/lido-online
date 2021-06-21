<script context="module">
    import {derived, writable, get} from "svelte/store";
    import {takeOffTime} from "../stores";
    import {solar} from "./solarstore";

    const devTimeDelta = (tsref) => Math.round((Date.now() - tsref)/86400000) * 86400000;
    export const kpColor = (kp) => {
        switch(kp){ 
            case 0:
            case 1:
            case 2:
                return '#69B34C';
            case 3:
                return '#ACB334'; 
            case 4:
                return '#FAB733'
            case 5:
                return '#FF8E15';
            case 6:
                return '#FF4E11';
            case 7:
            case 8:
            case 9:
                return '#FF0D0D';
            default:
                return 'lightgray';
        };
    };

    export const Kp = writable();
    const setKp = async () => {    
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
                const getTimeTableIndex = (ts) => {
                    for (let i=0; i<timetable.length; i++){
                        if (ts >= timetable[i][0]) {
                            return i;
                        }
                    }
                    return -1;
                };
                const fn = (date, endDate) => {
                    if (endDate) {
                        let res = [];
                        const takeOffTime = date.getTime();
                        const landingTime = endDate.getTime();
                        const flightTime = landingTime - takeOffTime;
                        let timeDelta = 0;
                        if ('process.env.NODE_ENV' === '"development"') {
                            timeDelta = devTimeDelta(date);
                        }
                        //timetable in reverse order so end -> takeOff, start -> landing
                        const end = getTimeTableIndex(takeOffTime + timeDelta);
                        const start = getTimeTableIndex(landingTime + timeDelta);
                        if (end === -1 || start === -1) {
                            res = [];
                        }else{
                            res = timetable.slice(start, end + 1);
                        }
                        return res.map(a => ({
                            date: new Date(a[0] - timeDelta),
                            kp: a[1],
                            relpos: Math.round(10000 * (a[0] - timeDelta - takeOffTime) / flightTime) / 100 //relpos might be < 0 or > 100
                        }));
                    }else{
                        const ts = (date) ? date.getTime() : 0;
                        for (let i=0; i<timetable.length; i++){
                            if (ts >= timetable[i][0]) {
                                return timetable[i][1];
                            }
                        }
                        return -1;
                    }
                }
                //console.log(timetable.map(a => [new Date(a[0]), a[1]]))
                //console.log(`setting Kp stores, timetable as ${timetable.length} entries${(timetable.length > 0) ? ' start:' + timetable[timetable.length - 1][0]: ''}`);
                Kp.set(fn);
            })
            .catch(function(error) {
                console.log('Could not update Kp store', error);
            });
    }

    export const aurora = derived(
        [solar, Kp],
        ([$solar, $Kp]) => {
            if ($solar.route.length === 0 || !$Kp) return [];
            const segments = [];
            let segment = [];
            const timeDelta = ('process.env.NODE_ENV' === '"development"') ? devTimeDelta(get(takeOffTime).getTime()) : 0;
            for (const {position, date, type, relpos} of $solar.route) {
                const predictedDate = (timeDelta !== 0) ? new Date( timeDelta + date.getTime()) : date;
                const predictedKp = $Kp(predictedDate);
                if (['night', 'astronomicalDusk', 'astronomicalDawn'].includes(type) && Math.round(minKpAtPoint(position)) <= predictedKp){ //TODO Math.floor/ceil/round ?
                    segment.push({position, date, predictedKp, relpos});
                }else{
                    if (segment.length > 0) segments.push(segment);
                    segment = [];
                }
            }
            if (segment.length > 0) segments.push(segment);
            const periods = [];
            const rounding = 1000 * 60 * 5; // 5min
            for (const list of segments) {
                const last = list.length - 1;
                const start = list[0].date.getTime();
                const end = list[last].date.getTime();
                const offset = (list.length === 1) ? 300000 : 0; //5mn or 0
                const roundedStart = Math.floor((start - offset) / rounding) * rounding; // -5mn
                const roundedEnd = Math.ceil((end + offset) / rounding) * rounding; // +5mn
                const relpos1 = (list.length === 1) ? (roundedStart / start) * list[0].relpos : list[0].relpos;
                const relpos2 = (list.length === 1) ? (roundedEnd / end) * list[last].relpos: list[last].relpos;

                periods.push({
                    period: [new Date(roundedStart), new Date(roundedEnd)],
                    relpos: [relpos1, relpos2],
                    points: [list[0].position, list[last].position],
                    predictedKp: Math.max(...list.map(s => s.predictedKp))
                });
            }
            return periods;
        }
    );

    // export const getGeoMagneticPole = (date) => {
    //     let year = date.getUTCFullYear();
    //     if (year < 2016) year = 2016;
    //     if (year > 2025) year = 2025;
    //     // from http://wdc.kugi.kyoto-u.ac.jp/poles/polesexp.html
    //     const poleLatLngByYear = {
    //         '2016': [80.4, -72.6],
    //         '2017': [80.5, -72.6],
    //         '2018': [80.5, -72.7],
    //         '2019': [80.6, -72.7],
    //         '2020': [80.7, -72.7],
    //         '2021': [80.7, -72.7],
    //         '2022': [80.7, -72.7],
    //         '2023': [80.8, -72.7],
    //         '2024': [80.8, -72.6],
    //         '2025': [80.9, -72.6]
    //     };
    //     return poleLatLngByYear[year.toString()];
    // }
    export const geoMagneticPoleLatLng = [80.7, -72.7]; // sufficent precision for us
    export const minKpAtPoint = (p) => {
        if (p.latitude <= 40) return [-90, 99]; // no need to compute
        const mlat = 90 - p.distanceTo(new editolido.GeoPoint(geoMagneticPoleLatLng), editolido.rad_to_deg);
        const Kp = (mlat - 66.5) / 2 // https://www.swpc.noaa.gov/content/tips-viewing-aurora
        return (Kp > 0) ? 0 : -Kp;
    };
</script>
<script>
    import {onMount} from "svelte";
    import {ofp} from "../stores";

    const predictedKpUpdated = async (event) => {
        if (event.data.meta === 'workbox-broadcast-update' && event.data.type === 'CACHE_UPDATED') {
            const {updatedURL} = event.data.payload;
            if (updatedURL === 'CONF_NOOA_KP_JSON') {
                console.log('loading noaa kp store (sw cache updated)');
                setKp();
            }
        }
    };

    onMount(() => {
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
            if (inCache && $Kp !== undefined) { // if offline we still need to load the predictions if not loaded yet
                console.log('ping noaa (ofp change)'); //predictedKpUpdate will do the real load if needed
                fetch('CONF_NOOA_KP_JSON').catch(() => {return;});
            }else{
                console.log('loading noaa kp store (ofp change)');
                setKp();
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