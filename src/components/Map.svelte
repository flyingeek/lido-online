<script>
    import FormSettings from "./FormSettings.svelte";
    import {createMap, token, blankStyle, updateMapLayers} from './mapboxgl.js';
    import {updateKml} from './kml.js';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let kmlOptions;
    export let ofp;
    export let route;
    let map = undefined;
    let selected = 0;

    const options = [
        {
            'label': 'Mercator',
            'id': 'mapbox_streets_v11',
            'mapboxOptions': {
                'style': 'mapbox://styles/mapbox/streets-v11',
                'renderWorldCopies': false
            }
        },
        {
            'label': 'Lambert North (beta)',
            'id': 'jb_north',
            'extent': [-7441961.61694286, -5719116.57599206, 7385706.81468334, 9107027.78651793],
            //'affineTransform': [2.63206100208865, -323662.179369435, 2.63502996130431, -10626687.7639946],
            'proj4': '+proj=lcc +lat_1=30 +lat_2=65 +lat_0=47.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 4
            },
            //'tiles': 'https://editolido.alwaysdata.net/i/tiles/{z}/{x}/{y}.png'
            'tiles': ['https://editolido.alwaysdata.net/i/northv2/{z}/{x}/{y}.jpg'],
            'tileSize': 512
        },
        {
            'label': 'Lambert South (beta)',
            'id': 'jb_south',
            'extent': [-12613903.56963206, -12799864.28766359, 13437054.51836624, 13256450.22227117],
            'viewport': [-12613903.56963206, -5420000.1608799, 13437054.51836624, 5862747.38325809],
            'proj4': '+proj=lcc +lat_1=-15 +lat_2=30 +lat_0=7.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 5
            },
            //'tiles': 'https://editolido.alwaysdata.net/i/tiles/{z}/{x}/{y}.png'
            'tiles': ['https://editolido.alwaysdata.net/i/southv2/{z}/{x}/{y}.jpg'],
            'tileSize': 512
        }
        // ,
        // {
        //     'label': 'JB Mercator',
        //     'id': 'mapbox_jb_mercator',
        //     'mapboxOptions': {
        //         'style': 'mapbox://styles/denizotjb/ckbi1x4ae0vp11jqtfulbtll5'
        //     }
        // }
    ];
    
    $: mapOptions = options[selected];
    const name = 'map-style';
    export let id = 'map';

    function destroyMap() {
        if (map) map.remove();
    }

    function styleChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
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
    const update = (e) => {
        updateMapLayers(map, e.detail.name, e.detail.value, ofp, kmlOptions);
        updateKml(e.detail.name, e.detail.value);
        dispatch('save'); // set History
  };

</script>

<div id={id} use:mapbox={{route}}></div>
<div class="mapmenu">
    <select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change={styleChange}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{option.label}</option>
        {/each}
    </select>
</div>
<FormSettings bind:kmlOptions on:change={update} on:save />
<style>
    #map {
        flex: 1 1 auto;
        height: auto;
        margin: -3px -10px -10px -10px;
    }
    select {
        width: auto;
        font-size: small;
        left: 5px;
        top:5px;
    }
    .mapmenu {
        position: absolute;
        top: 60px;
    }

    @media (max-width: 767px), (max-height: 700px) {
        #map {
            width: 100%;
            height: 400px;
            margin: 1rem 0;
        }
    }
</style>
