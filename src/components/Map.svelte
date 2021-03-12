<script>
    import FormSettings from "./mapSettings/Form.svelte";
    import {createMap, token} from './mapboxgl/mapManagement';
    import {updateMapLayers} from './mapboxgl/layersManagement';
    import {online, route} from "../stores.js";
    import {updateKml} from './kml.js';
    import {promiseTimeout, fetchSimultaneously} from './utils';
    import { createEventDispatcher, onMount } from 'svelte';
    import {findMissingCacheTiles} from '../tilesCache';
    import CircleProgress from "./CircleProgress.svelte";
    import AircraftType from "./AircraftType.svelte";
    import MapProjectionSelect from "./MapProjectionSelect.svelte";
    import mapResizeAction from '../actions/mapResizeAction';

    const dispatch = createEventDispatcher();
    export let kmlOptions;
    export let ofp;
    let map;
    let mapData;
    let selectedProjection;
    let selectedAircraft;
    let aircraftTypeSelectElement;
    let cacheMaxValue = 0;
    let cacheValue = 0;
    let cacheError = false;
    let tilesMissing = [];
    $: mapIsCached = tilesMissing.length === 0;
    const caches = {};


    export let id = 'map';

    async function afterMapLoad(){
        tilesMissing = await findMissingCacheTiles(ofp, mapData);
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
        cacheValue = 0;
        cacheError = false;
        tilesMissing = [];
        cacheMaxValue = 0;
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, afterMapLoad);
        map = mapData.map;
    }

    function aircraftChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        update({detail: {value: selectedAircraft, name: "airport-change"}});
    }

    const update = (e) => {
        updateMapLayers({
            map,
            mapData,
            name: e.detail.name,
            value: e.detail.value,
            ofp,
            kmlOptions,
            aircraftType: selectedAircraft
        });
        updateKml(e.detail.name, e.detail.value);
        dispatch('save'); // set History
    };

    let cacheButtonDisabled = false;
    const cacheMap = async (e) => {
        if (cacheButtonDisabled) return false;
        cacheButtonDisabled = true;
        try {
            cacheMaxValue = tilesMissing.length; // set the progress class
            cacheError = false; //remove error class
            try {
                await promiseTimeout(4000, fetch(`./manifest.json?dummy=${Date.now()}`, {cache: "no-store"}));
            } catch (err) {
                console.error(err);
                cacheButtonDisabled = false;
                cacheError = true;
                return false;
            }
            cacheValue = 0;
            await fetchSimultaneously(tilesMissing, () => cacheValue++);
            if (cacheValue>=cacheMaxValue){
                caches[selectedProjection.id] = true;
                caches=caches;
                tilesMissing = [];
                cacheMaxValue = 0;
            }
        }finally{
            cacheButtonDisabled = false;
        }
    }

    onMount(() => {
        mapboxgl.accessToken = token;
        mapData = createMap(id, selectedProjection, ofp, kmlOptions, afterMapLoad);
        map = mapData.map;
    });

</script>

<div id={id} use:mapResizeAction={map}></div>
<div class="mapmenu">
    <MapProjectionSelect bind:selected={selectedProjection} {ofp} on:change={projectionChange}/>
    {#if (selectedProjection && !ofp.isFake && window.indexedDB && $online && caches[selectedProjection.id]!==true && !mapIsCached)}
        <div class="cacheButton" class:cacheError={cacheError} class:cacheProgress={cacheValue > 0||cacheMaxValue > 0} on:click={(cacheButtonDisabled) ? () => false : cacheMap}>
            <CircleProgress value={cacheValue} max={cacheMaxValue}>
                <slot><span>↓</span></slot>
            </CircleProgress>
        </div>
    {/if}
</div>
<AircraftType bind:selectedAircraft bind:aircraftTypeSelectElement {ofp} on:change={aircraftChange}/>
<FormSettings bind:kmlOptions on:change={update} on:save />
<style>

    #map {
        flex: 1 1 auto;
        height: auto;
        margin: 0px -10px -10px -10px;
    }
    .mapmenu {
        position: absolute;
        top: 10px;
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
    .cacheButton {
        display: inline-block;
        position: relative;
        color: var(--cyan);
        margin-left: 10px;
        cursor:pointer;
        --progress-color: var(--yellow);
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
    :global(.mapboxgl-ctrl button.mapboxgl-ctrl-layers .mapboxgl-ctrl-icon){
        background-size: 20px;
        background-image: url("data:image/svg+xml,%3Csvg version='1.1' id='Capa_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' viewBox='0 0 512 512' xml:space='preserve'%3E%3Cpath style='fill:%2334D6C1;' d='M508.736,354.283L264.625,251.414c-5.515-2.324-11.735-2.324-17.25,0L3.264,354.283 c-4.351,1.834-4.353,8-0.002,9.835l244.104,102.986c5.52,2.329,11.747,2.329,17.267,0l244.104-102.986 C513.088,362.282,513.087,356.116,508.736,354.283z'/%3E%3Cpath style='fill:%231AC4AE;' d='M508.74,364.112l-244.105,102.99c-5.518,2.327-11.752,2.327-17.27,0l-11.997-5.059l232.097-97.93 c4.355-1.825,4.355-7.995,0-9.83L235.368,256.47l12.008-5.059c5.518-2.316,11.73-2.316,17.248,0L508.74,354.282 C513.084,356.118,513.084,362.287,508.74,364.112z'/%3E%3Cpath style='fill:%23FFD071;' d='M508.736,252.904L264.625,150.035c-5.515-2.324-11.735-2.324-17.25,0L3.264,252.904 c-4.351,1.834-4.353,8-0.002,9.835l244.104,102.986c5.52,2.329,11.747,2.329,17.267,0l244.104-102.986 C513.088,260.904,513.087,254.738,508.736,252.904z'/%3E%3Cpath style='fill:%23F7B657;' d='M508.74,262.734l-244.105,102.99c-5.518,2.327-11.752,2.327-17.27,0l-11.997-5.059l232.097-97.93 c4.355-1.825,4.355-7.995,0-9.83l-232.097-97.813l12.008-5.059c5.518-2.316,11.73-2.316,17.248,0L508.74,252.904 C513.084,254.74,513.084,260.909,508.74,262.734z'/%3E%3Cpath style='fill:%23FF6E5E;' d='M508.736,147.762L264.625,44.893c-5.515-2.324-11.735-2.324-17.25,0L3.264,147.762 c-4.351,1.834-4.353,8-0.002,9.835l244.104,102.986c5.52,2.329,11.747,2.329,17.267,0l244.104-102.986 C513.088,155.761,513.087,149.596,508.736,147.762z'/%3E%3Cpath style='fill:%23F4584D;' d='M508.74,157.592L264.635,260.581c-5.518,2.327-11.752,2.327-17.27,0l-11.997-5.059l232.097-97.93 c4.355-1.825,4.355-7.995,0-9.83L235.368,49.948l12.008-5.059c5.518-2.316,11.73-2.316,17.248,0L508.74,147.761 C513.084,149.597,513.084,155.766,508.74,157.592z'/%3E%3C/svg%3E");
    }
</style>
