<script>
    import FormSettings from "./mapSettings/Form.svelte";
    import {createMap, token} from './mapboxgl/mapManagement';
    import {updateMapLayers} from './mapboxgl/layersManagement';
    import {online, isFakeOfp, showGramet} from "../stores.js";
    import {updateKml} from './kml.js';
    import {promiseTimeout, fetchSimultaneously} from './utils';
    import { createEventDispatcher, onMount } from 'svelte';
    import {findMissingCacheTiles} from '../tilesCache';
    import CircleProgress from "./CircleProgress.svelte";
    import AircraftType from "./AircraftType.svelte";
    import MapProjectionSelect from "./MapProjectionSelect.svelte";
    import Gramet from './Gramet.svelte';
    import mapResizeAction from '../actions/mapResizeAction';
    // import Gramet2 from "./Gramet2.svelte";

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
        if (!$isFakeOfp) {
            tilesMissing = await findMissingCacheTiles(ofp, mapData);
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
            ofp: ofp,
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
    <MapProjectionSelect bind:selected={selectedProjection} ofp={ofp} on:change={projectionChange}/>
    {#if (selectedProjection && !ofp.isFake && window.indexedDB && $online && caches[selectedProjection.id]!==true && !mapIsCached)}
        <div class="cacheButton" class:cacheError={cacheError} class:cacheProgress={cacheValue > 0||cacheMaxValue > 0} on:click={(cacheButtonDisabled) ? () => false : cacheMap}>
            <CircleProgress value={cacheValue} max={cacheMaxValue}>
                <slot><span>↓</span></slot>
            </CircleProgress>
        </div>
    {/if}
</div>
<AircraftType bind:selectedAircraft bind:aircraftTypeSelectElement ofp={ofp} on:change={aircraftChange}/>
<FormSettings bind:kmlOptions on:change={update} on:save />
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
</style>
