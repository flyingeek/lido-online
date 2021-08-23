<script context="module">
    import {showPlaneOnMap} from '../stores';

    const showPlane = (e) => {
        if('BACKGROUND' !== e.target._watchState) showPlaneOnMap.set(true);
        //console.log('show plane', e.target._watchState);
    };
    const hidePlane = (e) => {
        showPlaneOnMap.set(false);
        //if (e) console.log('hide plane', e.target._watchState);
    }
</script>
<script>
    import FormSettings from "./mapSettings/Form.svelte";
    import {createMap, token} from './mapboxgl/mapManagement';
    import {updateMapLayers} from './mapboxgl/layersManagement';
    import {online, showGramet, simulate, aircraftType} from "../stores.js";
    import {promiseTimeout, fetchSimultaneously} from './utils';
    import { createEventDispatcher, onMount, onDestroy, tick} from 'svelte';
    import {get} from 'svelte/store';
    import {findMissingCacheTiles} from '../tilesCache';
    import CircleProgress from "./CircleProgress.svelte";
    import AircraftType from "./AircraftType.svelte";
    import MapPlane from "./MapPlane.svelte";
    import MapProjectionSelect from "./MapProjectionSelect.svelte";
    import Gramet from './Gramet.svelte';
    import mapResizeAction from '../actions/mapResizeAction';

    const dispatch = createEventDispatcher();
    export let kmlOptions;
    export let ofp;
    let map;
    let mapData;
    let selectedProjection;
    let aircraftTypeSelectElement;
    let cacheMaxValue = 0;
    let cacheValue = -1;
    let cacheError = false;
    let tilesMissing = [];
    let settings;
    $: mapIsCached = tilesMissing.length === 0;
    const caches = {};


    export let id = 'map';

    async function afterMapLoad(){
        if (!!ofp) {
            try {
                tilesMissing = await findMissingCacheTiles(ofp, mapData);
            } catch (err){
                tilesMissing = [];
                console.error(`Could not find missing cache tiles`, err);
            }
        }else{
            tilesMissing = [];
        }
        //console.log(tilesMissing);
        const attribution = document.querySelector(`#${id} .mapboxgl-ctrl-attrib-inner`);
        if (attribution) {
            attribution.appendChild(document.createTextNode(' | '));
            attribution.appendChild(aircraftTypeSelectElement);
            attribution.appendChild(document.createTextNode(`${"CONF_AIRAC".substring(0,2)}.${"CONF_AIRAC".substring(2,4)}`));
        }
    }

    function projectionChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        if (map) map.remove();
        cacheValue = -1;
        cacheError = false;
        tilesMissing = [];
        cacheMaxValue = 0;
        if (mapData && mapData.geolocate) {
            mapData.geolocate.off('trackuserlocationstart', hidePlane);
            //mapData.geolocate.off('trackuserlocationend', showPlane);
        }
        const showPlaneState = get(showPlaneOnMap);
        hidePlane(); // dom element will be removed by createMap
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, $aircraftType, afterMapLoad);
        map = mapData.map;
        mapData.geolocate.on('trackuserlocationstart', hidePlane);
        //mapData.geolocate.on('trackuserlocationend', showPlane);
        setTimeout(async () => {
            await tick;
            showPlaneOnMap.set(showPlaneState);
        }, 0);
    }

    function aircraftChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        update({detail: {value: $aircraftType, name: "airport-change"}});
    }

    const update = (e) => {
        updateMapLayers({
            map,
            mapData,
            name: e.detail.name,
            value: e.detail.value,
            ofp: ofp,
            kmlOptions,
            aircraftType: $aircraftType
        });
        dispatch('save'); // set History
    };

    let cacheButtonDisabled = false;
    const cacheMap = async (e) => {
        if (cacheButtonDisabled) return false;
        cacheButtonDisabled = true;
        cacheValue = 0;
        try {
            cacheMaxValue = tilesMissing.length; // set the progress class
            cacheError = false; //remove error class
            try {
                await promiseTimeout(4000, fetch(`./manifest.json?dummy=${Date.now()}`, {cache: "no-store"}));
            } catch (err) {
                console.error(err);
                cacheButtonDisabled = false;
                cacheError = true;
                cacheValue = -1;
                return false;
            }
            await fetchSimultaneously(tilesMissing, () => cacheValue++);
            if (cacheValue>=cacheMaxValue){
                caches[selectedProjection.id] = true;
                caches=caches;
                tilesMissing = [];
                cacheMaxValue = 0;
                cacheValue = -1;
            }
        }finally{
            cacheButtonDisabled = false;
            cacheValue = -1;
        }
    }
    let supportWebP = true;
    const canUseWebP = async () => {
        const handler = (event) => {
            supportWebP = event && event.type === 'load' ? image.width == 1 : false;
        }
        const image = new Image();
        image.onerror = handler;
        image.onload = handler;
        image.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    };
    canUseWebP();

    onMount(() => {
        mapboxgl.accessToken = token;
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, $aircraftType, afterMapLoad, true); //initialLoad = true
        hidePlane(); // dom element was removed by createMap
        showPlaneOnMap.reset();
        map = mapData.map;
        mapData.geolocate.on('trackuserlocationstart', hidePlane);
        //mapData.geolocate.on('trackuserlocationend', showPlane);

    });
    onDestroy(() => {
        mapData.geolocate.off('trackuserlocationstart', hidePlane);
        //mapData.geolocate.off('trackuserlocationend', showPlane);
        settings.endFocusMode();
        map = undefined;
        mapData = undefined;
    });
</script>

<div id={id} use:mapResizeAction={map}></div>
<div class="mapmenu">
    <div class="projection">
    <MapProjectionSelect bind:selected={selectedProjection} ofp={ofp} on:change={projectionChange}></MapProjectionSelect>
    {#if (selectedProjection && window.indexedDB)}
    <div class="cacheButton"
        class:cacheError={cacheError}
        class:cacheProgress={cacheValue >= 0||cacheMaxValue > 0}
        class:hidden={!ofp || mapIsCached|| !$online || caches[selectedProjection.id]===true}
        on:click={(cacheButtonDisabled) ? () => false : cacheMap}>
        <CircleProgress value={(cacheValue>=0) ? cacheValue : 0} max={cacheMaxValue}></CircleProgress>
    </div>
    {/if}
    </div>
    {#if (!supportWebP && mapData && mapData.mapOptions && mapData.mapOptions.tiles && mapData.mapOptions.tiles[0].endsWith('.webp'))}
        <div class="nowebp">Votre navigateur ne supporte pas l'affichage d'images au format .webp</div>
    {/if}
</div>
{#if (mapData && !!ofp  && ($showPlaneOnMap || $simulate >= 0))}<MapPlane {mapData}/>{/if}
<AircraftType bind:aircraftTypeSelectElement on:change={aircraftChange}/>
<FormSettings bind:this={settings} bind:kmlOptions on:change={update} on:save />
{#if $showGramet}<Gramet/>{/if}

<style>

    #map {
        flex: 1 1 auto;
        height: auto;
    }
    .mapmenu {
        position: absolute;
        top: 10px;
        left: 10px;
        width: 180px;
        user-select: none; /* supported by Chrome and Opera */
        -webkit-user-select: none; /* Safari */
        -moz-user-select: none; /* Firefox */
    }
    .projection {
        display:flex;
        align-items: center;
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
    .hidden {
        visibility: hidden;
    }
    .cacheButton {
        display: inline-block;
        position: relative;
        color: var(--bs-cyan);
        margin-left: 10px;
        cursor:pointer;
        --progress-color: var(--bs-yellow);
    }

    .cacheButton.cacheError {
        color: var(--bs-red) !important;
        --progress-trackcolor: var(--bs-gray-500) !important;
    }
    .cacheButton.cacheProgress {
        color: var(--bs-yellow);
        --progress-trackcolor: black;
    }
    .cacheButton.cacheProgress, .cacheButton.cacheError{
        --progress-circlefill: var(--bs-gray-100);
    }
    .cacheButton::after{
        content: "↓";
        display:inline-block;
        text-align: center;
        height: 24px;
        width: 24px;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    }
    :global(.mapboxgl-ctrl button.mapboxgl-ctrl-layers){
        display:flex;
        align-items:center;
        justify-content: center;
    }
    :global(.mapboxgl-ctrl button.mapboxgl-ctrl-layers svg){
        width: 22px;
        height: 22px;
    }
    :global(.map page) {
        overflow: hidden;
    }
    :global(.mapboxgl-popup-content .airport) {
        min-width: 180px;
    }
    :global(.mapboxgl-popup-content .airport p){
        margin: 0 auto;
        display: inline-block;
        line-height: 1em;
    }
    :global(.mapboxgl-popup-content .track p strong){ /* LVLS EB highlight */
        font-weight: normal;
        background-color: #EEFAE3; /*very light green */
    }
    :global(.mapboxgl-popup-content .track p strong.error){ /* LVLS EB highlight if FL not found*/
        background-color: #FAE3EE; /*very light pink */
    }
    :global(.mapboxgl-popup-content .security-1,
            .mapboxgl-popup-content .security-2,
            .mapboxgl-popup-content p.status) {
        font-variant: all-small-caps;
        font-weight: bold;
        padding: 0.2em 0.4em;
        border-radius: 2px;
    }
    :global(.mapboxgl-popup-content){
        text-align: center;
    }
    :global(.mapboxgl-popup-content h1){
        display: flex;
        align-items: center;
        column-gap: 1ch;
        font-size: small;
        font-weight: bold;
        margin-left: 5px;
        margin-right: 5px; /* space for close button */
        margin-bottom: 0; /* because the flag uses a xx-large font */
    }
    :global(.mapboxgl-popup-content .flag){
        font-size: 1.78rem;
        margin-left: auto;
    }
    :global(.mapboxgl-popup-content .cc){
        text-overflow: ellipsis;
        overflow: hidden;
        font-weight: normal;
        white-space: nowrap;
    }
    :global(.mapboxgl-popup-content h2){
        font-size: small;
        font-weight: normal;
    }
    :global(.mapboxgl-popup-content h2 b){
        color: #062DF8;
        font-weight: 900;
        margin-left: 0.25rem;
    }
    :global(.mapboxgl-popup-content .track p){
        text-align: left;
        margin-bottom: 0;
    }
    :global(.mapboxgl-popup-content p.security-1){
        color:black;
        background-color: orange;
        border: 1px solid orange;
        margin-left: 1rem;
    }
    :global(.mapboxgl-popup-content p.security-2){
        color:white;
        background-color: red;
        border: 1px solid red;
        margin-left: 1rem;
    }
    :global(.mapboxgl-popup-content p.status){
        color: black;
        font-variant: all-small-caps;
        font-weight: bold;
        padding: 0.2em 0.4em;
        border: 1px solid;
    }
    :global(.mapboxgl-popup-content p.status-1){
        background-color: #ea80d8;
        border-color: #ea80d8;
    }
    :global(.mapboxgl-popup-content p.status-2){
        background-color:#fbfe98;
        border-color:#fbfe98;
    }
    :global(.mapboxgl-popup-content p.status-3){
        background-color:#00b0f1;
        border-color:#00b0f1;
    }
    :global(.mapboxgl-popup-content p.status-0){
        border:1px solid #ff0000;
    }
    :global(.mapboxgl-popup-content p.status-text){
        color: #aaa;
        display: block;
        margin-top: 0.3em;
    }
    .nowebp {
        background-color: #ff0000;
        color:white;
        max-width: 30vw;
        font-size:small;
        padding: 10px;
        margin-top: 10px;
    }
</style>
