<script>
    import FormSettings from "./FormSettings.svelte";
    import {createMap, token, blankStyle, updateMapLayers} from './mapboxgl.js';
    import {updateKml} from './kml.js';
    import { createEventDispatcher, onMount } from 'svelte';
    //import proj4 from 'proj4';
    const dispatch = createEventDispatcher();
    export let kmlOptions;
    export let ofp;
    export let route;
    let map = undefined;
    let selected = -1;
    let selectedAircraft = -1;
    let aircraftSelect;
    const aircraftTypes = [
        "???",
        "318",
        "319",
        "320",
        "321",
        "330",
        "340",
        "350",
        "380",
        "787",
        "772",
        "773",
        "77F"
    ];
    // Pour réaliser les tiles dans Map Tiler
    // - Choisir Andvanced Tiles -> Continue
    // - Choisir le TIF geo-référencé -> Continue
    // - choisir Custom dans presets
    // - choisir "from output" et 512px x 512px
    // - choisir Zoom: 0 à 4
    // - choisir "Advanced Options" -> séléctionner JPEG, laisser sur Sparse Output et OpenGIS -> Close
    // - choisir "Folder" -> Render
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
            'label': 'Lambert North',
            'id': 'jb_north',
            'extent': [-7441575.32982940, -5719574.16449270, 7383398.17621086, 9105399.34154755],
            //'affineTransform': [2.63206100208865, -323662.179369435, 2.63502996130431, -10626687.7639946],
            'proj4': '+proj=lcc +lat_1=30 +lat_2=65 +lat_0=47.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 5
            },
            'tiles': ['https://editolido.alwaysdata.net/i/CONF_NORTH/{z}/{x}/{y}.jpg'],
            'tileSize': 512
        },
        {
            'label': 'Lambert South',
            'id': 'jb_south',
            'extent': [-12613000.20107552, -12796118.19556621, 13437104.14597977, 13253986.15148908],
            'validity': [-12613903.56963206, -9420000.1608799, 13437054.51836624, 5862747.38325809],
            'proj4': '+proj=lcc +lat_1=-15 +lat_2=30 +lat_0=7.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 5
            },
            'tiles': ['https://editolido.alwaysdata.net/i/CONF_SOUTH/{z}/{x}/{y}.jpg'],
            'tileSize': 512
        },
        {
            'label': 'Lambert Pacific',
            'id': 'jb_pacific',
            'extent': [-8306365.14297095, -7788164.66141786, 6519185.45830619, 7037385.93985927],
            'proj4': '+proj=lcc +lat_1=-15 +lat_2=30 +lat_0=7.5 +lon_0=-140 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 5
            },
            'tiles': ['https://editolido.alwaysdata.net/i/CONF_PACIFIC/{z}/{x}/{y}.jpg'],
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
    
    const name = 'map-style';
    export let id = 'map';

    function destroyMap() {
        if (map) map.remove();
    }

    function styleChange(e) {
        e.target.blur(); // to avoid zoom problem in standalone mode
        destroyMap();
        map = createMap(id, options[selected], ofp, kmlOptions, aircraftSelect);
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
  onMount(() => {
        mapboxgl.accessToken = token;
        map = createMap(id, options[selected], ofp, kmlOptions, aircraftSelect);
  });

</script>
<div id={id} use:mapbox={{route}}></div>
<div class="mapmenu">
    <select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change={styleChange}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{(option.proj4 && mapContainsOfp(option)) ? `${option.label.toUpperCase()}`: option.label}</option>
        {/each}
    </select>
</div>
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
        margin-left: 10px;
        z-index: 2;
        padding: 0px 15px;
        -webkit-appearance: none;
    }
    :global(.mapboxgl-ctrl-attrib-inner select[name=aircraftType]){
        display: inline-block !important;
    }
    @media (max-width: 767px), (max-height: 700px) {
        #map {
            width: 100%;
            height: 400px;
            margin: 1rem 0;
        }
    }
</style>
