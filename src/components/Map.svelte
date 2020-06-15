<script>
    import {createMap, token} from './mapboxgl.js';
    export let kmlOptions;
    export let ofp;
    export let route;
    let map = undefined;
    let selected = 0;
    const options = [
        {label: 'Mapbox', style: 'mapbox://styles/mapbox/streets-v11'},
        {
            label: 'JB North',
            style: 'mapbox://styles/mapbox/streets-v11',
            affineTransform: [1.3432670343811, -7942751.91711542, 1.34349625886583, 9094272.35529213],
            proj4: '+proj=lcc +lat_1=30 +lat_2=65 +lat_0=47.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
        }
    ];
    $: mapOptions = options[selected];
    const name = 'map-style';
    export let id = 'map';

    function destroyMap() {
        if (map) map.remove();
    }

    function styleChange() {
        destroyMap();
        map = createMap(id, mapOptions, ofp, kmlOptions);
    }

    function mapbox(node, parameters) {
        mapboxgl.accessToken = token;
        map = createMap(node.id, mapOptions, ofp, kmlOptions);
        return {
            update(parameters) {
                if (parameters.route === '/map' && map) {
                    map.resize();
                    console.log("map resized");
                }
            },
            destroy() {
                destroyMap();
            }
        }
    }

</script>

<div id={id} use:mapbox={{route}}>
<select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change={styleChange}>
    {#each options as option, index}
    <option value="{index}" selected={index === selected}>{option.label}</option>
    {/each}
</select>
</div>

<style>
    #map {
        flex: 1 1 auto;
        height: auto;
        margin: -3px -10px -10px -10px;
    }
    select {
        z-index: 2;
        position: absolute;
        width: auto;
        font-size: small;
        top: 5px;
        left: 5px;
    }
    :global(:-webkit-fullscreen button.mapboxgl-ctrl-shrink) {
        display: none;
    }
    @media (max-width: 767px), (max-height: 700px) {
        #map {
            width: 100%;
            height: 400px;
            margin: 1rem 0;
        }
    }
</style>
