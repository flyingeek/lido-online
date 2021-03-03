<script>
    import FormSettings from "./FormSettings.svelte";
    import {createMap, token, blankStyle, updateMapLayers} from './mapboxgl.js';
    import {online} from "../store.js";
    import {updateKml} from './kml.js';
    import {promiseTimeout, lat2tile, lon2tile, getBounds} from './utils';
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
    let cacheMaxValue = 100;
    let cacheValue = 0;
    let cacheButton;
    let cacheError = false;
    const caches = {};
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
    const query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
    const tilesResolution = (matchMedia(query).matches) ? 256 : 512;
    const options = [
        {
            'label': 'Mercator',
            'id': 'atlas',
            'mapboxOptions': {
                //'style': 'mapbox://styles/flyingeek/ckc4yge17166a1ip66rkf0zhr',
                'style': 'mapbox://styles/flyingeek/cklgh38ep0xsr17qsvlrhth1e',
                'renderWorldCopies': false,
                'maxZoom': 12
            },
            'cacheZoom': 6
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
            'tiles': ['CONF_NORTH_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
            'cacheZoom': 4,
            'tileSize': tilesResolution
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
            'tiles': ['CONF_SOUTH_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
            'cacheZoom': 4,
            'tileSize': tilesResolution
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
            'tiles': ['CONF_PACIFIC_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
            'cacheZoom': 4,
            'tileSize': tilesResolution
        },
        {
            'label': 'The World',
            'id': 'jb_theworld',
            // for wide map
            //'ratio': [16358, 10084], /* width, height, but we use affineTransform instead */
            //'affineTransform': [1.314746085506463, -40260.546626176685, 1.3145 ,6475000],
            //1.314746085506463 -40260.546626176685 1.316835790740793 6484333.360029304
            //'affineTransform': [1.314746085506463, -45260.546626176685, 1.3162291881 ,6490582],
            'affineTransform': [1.314746085506463, -45260.546626176685, 1.315 ,6480000],
            "extent": [-15201502.45260082, -8478963.56607166, 15262747.04890729, 10300929.57326125],
            //
            // 10000x10000 px map adjust
            //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3435451202037834, -1086726.777713921],
            //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3425, -1095092],
            //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3421, -1100000],
            //"extent": [-14923314.11241390, -14113585.79413393, 14921557.93320679, 15731286.25148677],
            "proj4": "+proj=times +ellps=sphere +no_defs +wktext +lon_0=0 +x_0=0 +y_0=0",
            'mapboxOptions': {
                'style': blankStyle,
                'renderWorldCopies': false,
                'maxZoom': 5
            },
            'tiles': ['CONF_THEWORLD_TILES_BASE_URL/{z}/{x}/{y}.webp'],
            'matrix': [[1, 1], [2, 2], [4, 3], [8, 5], [16, 10], [32, 20]],
            'cacheZoom': 5,
            'tileSize': tilesResolution
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
        cacheValue = 0;
        cacheError = false;
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
    const cacheMap = async (e) => {
        let disabled;
        cacheButton.blur();
        if (disabled) return false;
        disabled = true;
        try {
            await promiseTimeout(4000, fetch(`./manifest.json?dummy=${Date.now()}`, {cache: "no-store"}));
        } catch (err) {
            console.error(err);
            disabled = false;
            cacheButton.blur();
            cacheError = true;
            return false;
        }
        let bbox = undefined;

        const affineAndClamp = map.affineAndClamp;
        const mapOptions = options[selected];

        let points = [];
        if (!ofp.isFake) {
            for (const track of ofp.tracks) {
                points = points.concat(track.points);
            }
            points = points.concat(ofp.route.points, ofp.wptCoordinatesAlternate());
            bbox = getBounds(points, affineAndClamp);
            const [sw, ne] = [[bbox[0], bbox[1]], [bbox[2], bbox[3]]];
            const tiles = [];
            for (let zoom=1; zoom <= mapOptions.cacheZoom; zoom++) {
                const swXY={x: lon2tile(sw[0], zoom), y: lat2tile(sw[1], zoom)};
                const neXY={x: lon2tile(ne[0], zoom), y: lat2tile(ne[1], zoom)};
                const max = Math.pow(2,zoom);
                let maxX, maxY;
                if (mapOptions.matrix) {
                    [maxX, maxY] = mapOptions.matrix[zoom];
                }else{
                    [maxX, maxY] = [max, max];
                }
                for (let x=swXY.x; x<=neXY.x; x++) {
                    for (let y=neXY.y; y<=swXY.y; y++) {
                        if(x>=0 && y>=0 && x<maxX && y<maxY)tiles.push([zoom, x, y]);
                    }
                }
            }
            if(mapOptions.tiles) {
                cacheMaxValue = tiles.length;
                for (const [z, x, y] of tiles){
                    try{
                        await fetch(mapOptions.tiles[0].replace('{z}', z).replace('{x}', x).replace('{y}', y));
                        cacheValue += 1;
                    }catch (err){}
                }
            }else{
                cacheMaxValue = tiles.length * 2;
                for (const [z, x, y] of tiles){
                    let url = `https://api.mapbox.com/v4/denizotjb.63g5ah66/${z}/${x}/${y}@2x.webp?sku=${map._requestManager._skuToken}&access_token=${token}`;
                    try{
                        await fetch(url);
                        cacheValue += 1;
                    }catch (err){}
                    url = `https://api.mapbox.com/v4/denizotjb.9001lcsf,denizotjb.494jxmoa,mapbox.mapbox-streets-v8,denizotjb.bifqeinj,denizotjb.cz0kdfpx,mapbox.mapbox-terrain-v2/${z}/${x}/${y}.vector.pbf?sku=${map._requestManager._skuToken}&access_token=${token}`;
                    try{
                        await fetch(url);
                        cacheValue += 1;
                    }catch (err){}
                }
            }
            if (cacheValue>=cacheMaxValue){
                caches[mapOptions.id] = true;
                caches=caches;
            }
        }
        disabled = false;
    }
    onMount(() => {
        mapboxgl.accessToken = token;
        map = createMap(id, options[selected], ofp, kmlOptions, aircraftSelect);
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
    {#if (selected >= 0 && !ofp.isFake && (navigator && navigator.standalone === true) && $online && caches[options[selected].id]!==true)}
    <button bind:this={cacheButton} type="button" class="btn btn-outline-info" class:error={cacheError} on:click={cacheMap}>
        <div><svg viewBox="0 0 100 100">
        <path d="M50,5A45 45 0 1 1 49.9999 5" />
        <path d="{progressPath()}" />
      </svg></div><div><span>↓</span></div></button>
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
  .mapmenu button {
        border: none;
        padding: 0;
        margin-left: 10px;
  }
  .mapmenu .btn-outline-info:hover {
    color: var(--yellow);
    background-color: transparent;
    border-color: transparent;
}
:global(.mapmenu .btn-outline-info.error) {
    color: var(--red) !important;
}
:global(.mapmenu .btn-outline-info.error:hover) {
    color: var(--red) !important;
}
  .mapmenu button div {
    height: 100%;
    position: relative;
    width: 100%;
  }
  .mapmenu button div ~ div{
      top: -12px;
  }
  .mapmenu button span {
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
</style>
