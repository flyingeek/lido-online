<script context="module">
    import {derived, writable} from "svelte/store";
    import {landingTime, takeOffTime} from "../stores";
    import {solar} from "./solarstore";
    import { binarysearch } from "./utils";

    //adjust to the time to be for today
    const devTimeDelta = (tsref) => (Math.trunc(Date.now()/86400000) - Math.trunc(tsref/86400000)) * 86400000;
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
        }
    };
    export const noaaKp = writable();
    const fetchNoaaKpAndSet = async () => {
        return fetch('CONF_NOAA_KP_JSON')
        .then(response => response.json())
        .then(data => {
            try {
                const timetable = [];
                for (let i=data.length - 1; i>=1; i--){
                    const [d, k] = data[i];
                    const t = Date.parse(d.replace(' ', 'T') + 'Z'); // Safari needs the T
                    timetable.push([t, parseFloat(k)])
                }
                noaaKp.set(timetable);
            } catch (error) {
                console.error('kp store update error', error);
            }
        })
        .catch(function(error) {
            console.log('Could not update Kp store', error);
        });
    };
    export const Kp = derived([landingTime, takeOffTime, noaaKp], ([$landingTime, $takeOffTime, $noaaKp]) => {
        if (!$landingTime || !$takeOffTime || !$noaaKp) return undefined;
        let res = [];
        const tots = $takeOffTime.getTime();
        const flightTime = $landingTime - $takeOffTime;
        let timeDelta = 0;
        if ('process.env.NODE_ENV' === '"development"') {
            timeDelta = devTimeDelta($takeOffTime);
        }
        //$noaaKp timetable in reverse order so end -> takeOff, start -> landing
        const startTs = $landingTime.getTime() + timeDelta;
        const start = binarysearch($noaaKp, a => a[0] <= startTs)
        const endTs = tots + timeDelta;
        const end = binarysearch($noaaKp, a => a[0] <= endTs)
        if (end >= 0 && start >= 0) {
            res = $noaaKp.slice(start, end + 1);
        }
        const timetable = res.map(a => ({
            date: new Date(a[0] - timeDelta),
            kp: a[1],
            relpos: Math.round(10000 * (a[0] - timeDelta - tots) / flightTime) / 100 //relpos might be < 0 or > 100
        }));
        const fn = (date) => {
            if (date) { // a linear search is fine here (0-5 entries)
                for (let i=0; i<timetable.length; i++){
                    if (date >= timetable[i].date) {
                        return timetable[i].kp;
                    }
                }
            }
            return -1;
        }
        return {
            timetable,
            get: fn
        };
    });

    export const aurora = derived(
        [solar, Kp],
        ([$solar, $Kp]) => {
            if ($solar.route.length === 0 || !$Kp) return [];
            const segments = [];
            let points = [];
            for (const {position, date, type, relpos} of $solar.route) {
                const predictedKp = $Kp.get(date);
                if (['night', 'astronomicalDusk', 'astronomicalDawn'].includes(type) && Math.round(minKpAtPoint(position)) <= predictedKp){ //TODO Math.floor/ceil/round ?
                    points.push({position, date, relpos, predictedKp});
                }else if (points.length > 0) {
                    segments.push(points);
                    points = [];
                }
            }
            if (points.length > 0) segments.push(points);
            const periods = [];
            const rounding = 1000 * 60 * 5; // all times rounded to 5min
            for (const points of segments) {
                const last = points.length - 1;
                const start = points[0].date.getTime();
                const end = points[last].date.getTime();
                const offset = (points.length === 1) ? 300000 : 0; //5mn or 0
                const roundedStart = Math.floor((start - offset) / rounding) * rounding;
                const roundedEnd = Math.ceil((end + offset) / rounding) * rounding;
                const relpos1 = (roundedStart / start) * points[0].relpos;
                const relpos2 = (roundedEnd / end) * points[last].relpos;

                periods.push({
                    period: [new Date(roundedStart), new Date(roundedEnd)],
                    relpos: [relpos1, relpos2],
                    //points: [points[0].position, points[last].position]
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
        return (mlat > 66.5) ? 0 : (66.5 - mlat) / 2; // https://www.swpc.noaa.gov/content/tips-viewing-aurora
    };
</script>
<script>
    import {onMount} from "svelte";
    import {ofp} from "../stores";

    const predictedKpUpdated = async (event) => {
        if (event.data.meta === 'workbox-broadcast-update' && event.data.type === 'CACHE_UPDATED') {
            const {updatedURL} = event.data.payload;
            if (updatedURL === 'CONF_NOAA_KP_JSON') {
                //console.log('loading noaa kp store (sw cache updated)');
                fetchNoaaKpAndSet();
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
                    if (req.url === 'CONF_NOAA_KP_JSON') {
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
                //console.log('ping noaa (ofp change)'); //predictedKpUpdate will do the real load if needed
                fetch('CONF_NOAA_KP_JSON').catch(() => {return;});
            }else{
                //console.log('loading noaa kp store (ofp change)');
                fetchNoaaKpAndSet();
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
