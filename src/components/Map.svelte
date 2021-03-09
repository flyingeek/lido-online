<script>
    import FormSettings from "./FormSettings.svelte";
    import {createMap, token, updateMapLayers} from './mapboxgl.js';
    import {online} from "../stores.js";
    import {updateKml} from './kml.js';
    import {promiseTimeout, lat2tile, lon2tile, getBounds, fetchSimultaneously} from './utils';
    import { createEventDispatcher, onMount } from 'svelte';
    import {TilesCache} from '../tiles-cache';
    import options from './MapOptions';
    import {aircraftTypes as aircrafts} from './OfpInput.svelte';

    const dispatch = createEventDispatcher();
    export let kmlOptions;
    export let ofp;
    export let route;
    let map;
    let affineAndClamp;
    let selected = -1;
    let selectedAircraft = -1;
    let aircraftSelect;
    const aircraftTypes = ['???', ...aircrafts];
    let cacheMaxValue = 0;
    let cacheValue = 0;
    let cacheError = false;
    let tilesMissing = [];
    $: mapIsCached = tilesMissing.length === 0;
    const caches = {};

    const name = 'map-style';
    export let id = 'map';

    function destroyMap() {
        if (map) map.remove();
    }

    function styleChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        destroyMap();
        cacheValue = 0;
        cacheError = false;
        tilesMissing = [];
        cacheMaxValue = 0;
        [map, affineAndClamp] = createMap(id, options[selected], ofp, kmlOptions, aircraftSelect, findMissingCacheTiles);
    }

    function aircraftChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        updateMapLayers(map, "aircraftType", aircraftTypes[e.target.value], ofp, kmlOptions, aircraftTypes[e.target.value]);
    }

    function mapbox(node, parameters) {
        if (selected === -1 && ofp && !ofp.isFake) {
            const dep = ofp.route.points[0];
            const dest = ofp.route.points[ofp.route.points.length - 1];
            if (dest.latitude > 30 && dep.latitude > 30){
                selected = 1; // north
            }else if (dest.longitude < -80 && dep.longitude < -80) {
                selected = 3; // pacific
            }else{
                selected = 2; // south
            }
        }
        if (selected === -1) selected = 0;
        if (selectedAircraft === -1 && ofp) {
            selectedAircraft = (ofp.isFake) ? aircraftTypes.indexOf(ofp.isFake) :aircraftTypes.indexOf(ofp.infos.aircraft); 
        }
        if (selectedAircraft === -1) selectedAircraft = 0;



        return {
            update(parameters) {
                if (parameters.route === '/map' && map) {
                    map.resize();
                    //console.log("map resized");
                }
            },
            destroy() {
                destroyMap();
            }
        }
    }
    function mapContainsOfp(option) {
        if (!option.proj4||!ofp||ofp.isFake) return true;
        const dep = ofp.route.points[0];
        const dest = ofp.route.points[ofp.route.points.length - 1];
        if (option.id === 'jb_north') {
            return (dest.latitude > 30 && dep.latitude > 30);
        } else if (option.id === 'jb_south') {
            if (dest.latitude > 30 && dep.latitude > 30) return false;
        }else if (option.id === 'jb_theworld') {
            return false;
        }
        const bounds = (option.validity) ? option.validity : option.extent;
        for (let p of [dep, dest]) {
            const [x, y] = window.proj4(option.proj4, [p.longitude, p.latitude]);
            if (x < bounds[0] ||  x > bounds[2] || y < bounds[1] || y > bounds[3]) {
                return false;
            }
        }
        return true;
    }

    const update = (e) => {
        updateMapLayers(map, e.detail.name, e.detail.value, ofp, kmlOptions, aircraftTypes[selectedAircraft]);
        updateKml(e.detail.name, e.detail.value);
        dispatch('save'); // set History
    };
    const orientationChange = (e) => {
        if (route === '/map' && map) {
            map.resize();
            //console.log('orientation changed');
        }
    };
    $: progressPath = () => {
        if (cacheValue <= 0) {
            return "";
        } else if (cacheValue >= cacheMaxValue) {
            return "M50,5A45 45 0 1 1 49.9999 5";
        } else {
            const angle = Math.PI * 2 * (cacheValue / cacheMaxValue);
            const x = 50 + Math.cos(angle - Math.PI / 2) * 45;
            const y = 50 + Math.sin(angle - Math.PI / 2) * 45;
            let path = "M50,5";
            if (angle > Math.PI) {
                path += "A45 45 0 0 1 50 95";
            }
            path += `A45 45 0 0 1 ${x} ${y}`;
            return path;
        }
    };

    const findMissingCacheTiles = async () => {
        if (ofp.isFake || map === undefined) {
            tilesMissing = [];
            return;
        }

        const mapOptions = options[selected];
        const tilesCaches = new TilesCache('CONF_TILES_DB');

        if (mapOptions.cacheAll) {
            const tilesCount = await tilesCaches.countTiles(mapOptions.cacheName);
            let tilesMax;
            if (mapOptions.matrix) {
                tilesMax = mapOptions.matrix.map(([w, h]) => w * h);
            } else {
                tilesMax = [...Array(mapOptions.cacheZoom + 1).keys()].map(v => Math.pow(2, v) * Math.pow(2, v));
            }
            if (tilesCount >= tilesMax.reduce((a, b) => a + b, 0)) {
                tilesCaches.close();
                console.log('map is fully cached', tilesMax);
                caches[mapOptions.id] = true;
                return [];
            }
        }
        let bbox = undefined;
        let points = [];
        for (const track of ofp.tracks) {
            points = points.concat(track.points);
        }
        points = points.concat(ofp.route.points, ofp.wptCoordinatesAlternate());
        bbox = getBounds(points, affineAndClamp);
        const [sw, ne] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
        const promises = [];
        for (let zoom=0; zoom <= mapOptions.cacheZoom; zoom++) {
            let swXY, neXY;
            const max = Math.pow(2,zoom);
            if (mapOptions.cacheAll) {
                swXY={x: 0, y: max - 1};
                neXY={x: max - 1, y: 0};
            } else {
                swXY={x: lon2tile(sw[0], zoom), y: lat2tile(sw[1], zoom)};
                neXY={x: lon2tile(ne[0], zoom), y: lat2tile(ne[1], zoom)};
            }
            let maxX, maxY;
            if (mapOptions.matrix) {
                [maxX, maxY] = mapOptions.matrix[zoom];
            }else{
                [maxX, maxY] = [max, max];
            }

            for (let x=swXY.x; x<=neXY.x; x++) {
                for (let y=neXY.y; y<=swXY.y; y++) {
                    if(x>=0 && y>=0 && x<maxX && y<maxY){
                        let url;
                        if(mapOptions.tiles) {
                            url = new URL(mapOptions.tiles[0].replace('{z}', zoom).replace('{x}', x).replace('{y}', y));
                            promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                        } else {
                            url = new URL(`https://api.mapbox.com/v4/denizotjb.63g5ah66/${zoom}/${x}/${y}@2x.webp?sku=${map._requestManager._skuToken}&access_token=${token}`);
                            promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                            url = new URL(`https://api.mapbox.com/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.bifqeinj,denizotjb.cz0kdfpx,mapbox.mapbox-terrain-v2/${zoom}/${x}/${y}.vector.pbf?sku=${map._requestManager._skuToken}&access_token=${token}`);
                            promises.push(tilesCaches.isNotCached(mapOptions.cacheName, url));
                        }
                    }
                }
            }
        }
        Promise.all(promises).then((values) => {
            tilesMissing = values.filter(url => url !== null);
            //console.log(tilesMissing);
            tilesCaches.close();
        })

    };

    const cacheMap = async (e) => {
        let disabled;
        if (disabled) return false;
        disabled = true;
        cacheMaxValue = tilesMissing.length; // set the progress class
        cacheError = false; //remove error class
        try {
            await promiseTimeout(4000, fetch(`./manifest.json?dummy=${Date.now()}`, {cache: "no-store"}));
        } catch (err) {
            console.error(err);
            disabled = false;
            cacheError = true;
            return false;
        }
        const mapOptions = options[selected];
        cacheValue = 0;
        await fetchSimultaneously(tilesMissing, () => cacheValue++);
        if (cacheValue>=cacheMaxValue){
            caches[mapOptions.id] = true;
            caches=caches;
            tilesMissing = [];
            cacheMaxValue = 0;
        }
        disabled = false;
    }
    onMount(() => {
        mapboxgl.accessToken = token;
        [map, affineAndClamp] = createMap(id, options[selected], ofp, kmlOptions, aircraftSelect, findMissingCacheTiles);
    });

</script>
<svelte:window on:orientationchange={orientationChange}/>
<div id={id} use:mapbox={{route}}></div>
<div class="mapmenu">
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change={styleChange}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{(option.proj4 && mapContainsOfp(option)) ? `${option.label.toUpperCase()}`: option.label}</option>
        {/each}
    </select>
    {#if (selected >= 0 && !ofp.isFake && window.indexedDB && $online && caches[options[selected].id]!==true && !mapIsCached)}
        <div class="cacheButton" class:cacheError={cacheError} class:cacheProgress={cacheValue > 0||cacheMaxValue > 0} on:click={cacheMap}>
            <svg viewBox="0 0 100 100">
                <path d="M50,5A45 45 0 1 1 49.9999 5" />
                <path d="{progressPath()}" />
            </svg>
            <span>↓</span>
        </div>
    {/if}
</div>
<!-- svelte-ignore a11y-no-onchange -->
<select bind:this={aircraftSelect} name="aircraftType" bind:value={selectedAircraft} on:change={aircraftChange}>
    {#each aircraftTypes as aircraftType, index}
    {#if aircraftType !== '???' || (selectedAircraft === '???' && aircraftType==='???')}
    <option value="{index}" selected={index === selectedAircraft}>{aircraftType}</option>
    {/if}
    {/each}
</select>
<FormSettings bind:kmlOptions on:change={update} on:save />
<style>

    #map {
        flex: 1 1 auto;
        height: auto;
        margin: -3px -10px -10px -10px;
    }
    select.form-control {
        width: auto;
        font-size: small;
        left: 5px;
        top:5px;
        display: inline;
    }
    .mapmenu {
        position: absolute;
        top: 60px;
    }
    select[name=aircraftType] {
        background-color: rgba(255,255,255,0.3);
        border: none;
        font-size: 12px;
        display: none;
        margin-right: 5px;
        z-index: 2;
        padding: 0px 10px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
    }
    :global(.mapboxgl-ctrl-attrib-inner select[name=aircraftType]){
        display: inline-block !important;
    }
    @media (max-width: 330px), (max-height: 720px) {
        #map {
            width: 100%;
            height: 90vh;
            margin: 0;
        }
        :global(main.map page) {
            position: relative;
        }
        .mapmenu {
            top :5px;
        }
    }
    .mapmenu svg {
    fill: var(--progress-fill, transparent);
    height: 24px;
    stroke-linecap: var(--progress-linecap, round);
    width: 24px;
  }
  .mapmenu path:first-child {
    stroke: var(--progress-trackcolor, grey);
    stroke-width: var(--progress-trackwidth, 9px);
  }
  .mapmenu path:last-child {
    stroke: var(--yellow);
    stroke-width: var(--progress-width, 12px);
  }
  .cacheButton {
    display: inline-block;
    position: relative;
    color: var(--cyan);
    margin-left: 10px;
    cursor:pointer;
  }

  .cacheButton.cacheError {
    color: var(--red) !important;
}
.cacheButton.cacheProgress {
    color: var(--yellow);
}
.cacheButton span {
    display:inline-block;
    text-align: center;
    height: 24px;
    width: 24px;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>
