<script>
    import FormSettings from "./mapSettings/Form.svelte";
    import {createMap, token} from './mapboxgl/mapManagement';
    import {updateMapLayers} from './mapboxgl/layersManagement';
    import {showGramet, simulate, aircraftType, showPlaneOnMap, route} from "../stores.js";
    import {promiseTimeout, fetchSimultaneously, focusMap, savePreviousMapProjection} from './utils';
    import { createEventDispatcher, onMount, onDestroy, tick} from 'svelte';
    import {get} from 'svelte/store';
    import {findMissingCacheTiles, purgeHDCache} from '../tilesCache';
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
    const caches = {};

    let cacheMaxValue, cacheValue, cacheError, tilesMissing;
    const resetTilesMissing = () => {
        tilesMissing = (selectedProjection) ? caches[selectedProjection.id] : undefined;
    }
    const initCacheMap = () => {
        cacheMaxValue = 0;
        cacheValue = -1;
        cacheError = false;
        resetTilesMissing();
    };

    let settings;
    $: mapIsCached = tilesMissing === true || (Array.isArray(tilesMissing) && tilesMissing.length === 0);
    $: {
        if ($route === '/map') {
            tick().then(focusMap);
        }
    }

    export let id = 'map';

    async function afterMapLoad(){
        initCacheMap();
        if (!!ofp) {
            if (tilesMissing === undefined) {
                try {
                    tilesMissing = await findMissingCacheTiles(ofp, mapData);
                    if (Array.isArray(tilesMissing) && selectedProjection){
                        caches[selectedProjection.id] = tilesMissing.length === 0;
                    }
                } catch (err){
                    console.error(`Could not find missing cache tiles`, err);
                }
            }
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
        const showPlaneState = get(showPlaneOnMap);
        if (map) map.remove();

        showPlaneOnMap.set(false); // dom element will be removed by createMap
        savePreviousMapProjection(selectedProjection.id);
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, $aircraftType, afterMapLoad);
        focusMap();
        map = mapData.map;
        resetTilesMissing();
        setTimeout(async () => {
            await tick;
            showPlaneOnMap.set(showPlaneState);
        }, 0);
    }

    function aircraftChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        focusMap();
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
            mapOptions: selectedProjection,
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
            cacheMaxValue = 1; // set the progress class
            cacheError = false; //remove error class
            await promiseTimeout(4000, fetch(`./manifest.json?dummy=${Date.now()}`, {cache: "no-store"}));
            // console.log('online mode confirmed')
            if (selectedProjection.id === 'mercator') {
                await purgeHDCache();
                tilesMissing = await findMissingCacheTiles(ofp, mapData);
            } else if (!Array.isArray(tilesMissing)) {
                tilesMissing = await findMissingCacheTiles(ofp, mapData);
            }
            cacheMaxValue = tilesMissing.length;
            await fetchSimultaneously(tilesMissing, () => {
                if (cacheValue >= 0) cacheValue++; // < 0 means fetch was aborted, so do nothing
            });
            if (cacheValue>=cacheMaxValue){
                caches[selectedProjection.id] = true;
            }else{
                throw new Error('incomplete download of the cache');
            }
        }catch (err){
            console.error(err);
            cacheError = true;
            caches[selectedProjection.id] = false;
        }finally{
            cacheButtonDisabled = false;
            cacheValue = -1;
            caches=caches; //svelte internal
            resetTilesMissing();
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
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, $aircraftType, afterMapLoad, (ofp) ? !ofp.reloaded : true); //initialLoad = true, reloaded = false
        showPlaneOnMap.reset();
        map = mapData.map;
    });
    onDestroy(() => {
        //if (map) map.remove(); /-> map is removed by resize action
        settings.endFocusMode();
        map = undefined;
        mapData = undefined;
    });
</script>

<div id={id} use:mapResizeAction={map}></div>
<div class="mapmenu">
    <div class="projection">
        <MapProjectionSelect bind:selected={selectedProjection} ofp={ofp} on:change={projectionChange} disabled={cacheValue >= 0}></MapProjectionSelect>
        {#if (selectedProjection && window.indexedDB)}
            {#if tilesMissing === undefined && !!ofp}
            <div class="lds-dual-ring"></div>
            {:else}
            <div class="cacheButton"
                class:cacheError={cacheError}
                class:cacheProgress={cacheValue >= 0||cacheMaxValue > 0}
                class:hidden={!ofp || mapIsCached || caches[selectedProjection.id]===true}
                on:click={(cacheButtonDisabled) ? () => false : cacheMap}>
                <CircleProgress value={(cacheValue>=0) ? cacheValue : 0} max={cacheMaxValue}></CircleProgress>
            </div>
            {/if}
        {/if}
    </div>
    {#if cacheValue >= 0}
        <div class="projection-info"><small>Veuillez patienter...</small></div>
    {:else if selectedProjection && selectedProjection.subLabel}
        <div class="projection-info"><small>{selectedProjection.subLabel}</small></div>
    {/if}
    {#if (!supportWebP && mapData && mapData.mapOptions && mapData.mapOptions.tiles && mapData.mapOptions.tiles[0].endsWith('.webp'))}
        <div class="nowebp">Votre navigateur ne supporte pas l'affichage d'images au format .webp</div>
    {/if}
</div>
{#if (mapData && !!ofp  && ($showPlaneOnMap || $simulate >= 0))}<MapPlane {mapData}/>{/if}
<AircraftType bind:aircraftTypeSelectElement on:change={aircraftChange}/>
<FormSettings mapOptions={selectedProjection} bind:this={settings} bind:kmlOptions on:change={update} on:save />
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
    .projection-info {
        margin-right: 24px;
        font-size: 11px;
        color: var(--bs-gray);
        padding: 0 5px;
        position: absolute;
        margin-top: -3px;
        margin-left: 2px;
        background-color: rgba(255,255,255,0.4);
    }
    :global(.mapboxgl-ctrl-attrib-inner select[name=aircraftType]){
        display: inline-block !important;
    }
    .hidden {
        visibility: hidden;
    }
    .cacheButton {
        margin-left: 10px;
    }
    .lds-dual-ring {
        display: inline-block;
    }
    .lds-dual-ring:after {
        content: " ";
        display: block;
        width: 25px;
        height: 25px;
        margin: 0px 0px 0px 10px;
        border-radius: 50%;
        border: 3px solid var(--bs-gray-500);
        border-color: var(--bs-gray-500) transparent var(--bs-gray-500) transparent;
        animation: lds-dual-ring 1.2s linear infinite;
    }
    @keyframes lds-dual-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    :global(.cacheButton) {
        display: inline-block;
        position: relative;
        cursor:pointer;
        --progress-color: var(--bs-yellow);
        --progress-arrowstroke: var(--bs-cyan);
    }

    :global(.cacheButton.cacheError) {
        --progress-arrowstroke: var(--bs-red) !important;
        --progress-trackcolor: var(--bs-gray-500) !important;
    }
    :global(.cacheButton.cacheProgress) {
        --progress-arrowstroke: var(--bs-yellow);
        --progress-trackcolor: black;
    }
    :global(.cacheButton.cacheProgress), :global(.cacheButton.cacheError){
        --progress-circlefill: var(--bs-gray-100);
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
            .mapboxgl-popup-content p.status,
            .mapboxgl-popup-content p.reco) {
        font-variant: all-small-caps;
        font-weight: bold;
        padding: 0.2em 0.4em;
        border-radius: 2px;
    }
    :global(.mapboxgl-popup-content){
        text-align: center;
    }
    :global(.mapboxgl-popup-content h1) {
        font-size: small;
        font-weight: bold;
        margin-left: 5px;
        margin-right: 5px; /* space for close button */
    }
    :global(.mapboxgl-popup-content .airport h1){
        display: flex;
        align-items: center;
        column-gap: 1ch;
        margin-left: 5px;
        margin-right: 5px; /* space for close button */
        margin-bottom: 0; /* because the flag uses a xx-large font */
    }
    :global(.mapboxgl-popup-content .airport .title){
        flex: 1 1 auto;
    }
    :global(.mapboxgl-popup-content .tz){
        font-size: smaller;
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
    :global(.mapboxgl-popup-content p.status, .mapboxgl-popup-content p.reco){
        color: black;
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
    :global(.mapboxgl-popup-content :not(.no-ofp) p.reco) {
        margin-left: 1rem;
    }
    :global(.mapboxgl-popup-content p.reco-A, .mapboxgl-popup-content p.reco-B){
        border-color: #7800d5;
    }
    :global(.mapboxgl-popup-content p.reco-C){
        border-color: #7800d5;
        background-color: #7800d5;
        color: white;
    }
    .nowebp {
        background-color: #ff0000;
        color:white;
        max-width: 30vw;
        font-size:small;
        padding: 10px;
        margin-top: 10px;
    }
    :global(.mapboxgl-popup-close-button:focus), :global(.mapboxgl-popup-close-button:focus:not(:focus-visible)){
        outline-offset: -6px;
        outline: 2px solid lightskyblue;
    }
    :global(.mapboxgl-canvas-container:focus-within::after){
        content: "";
        left: 0;
        bottom: 0px;
        width: 30px;
        height: 30px;
        display: block;
        position: absolute;
        border: #4D90FE80 5px solid;
        border-top: none;
        border-right: none;
        line-height: 30px;
        border-bottom-left-radius: 10px;
    }
</style>
