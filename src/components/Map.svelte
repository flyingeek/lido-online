<script>
    import { onMount, setContext } from 'svelte';
    import {fade} from 'svelte/transition';
    import { token, key, updateMap, makeCustomLayer, addKmlToMap } from './mapbox.js';
    import {GestureHandler} from "./map-gestures.js";
    import {xml2json} from './geojson.js';
    import {KmlGenerator} from "./kml.js";
    setContext(key, {
        getMap: () => map
    });

    let container;
    let map;
    let geoJSON;
    export let kmlOptions;
    export let ofp;
    let customLayer;

    function mapbox(node) {
        L.mapbox.accessToken = token;
        const GestureHandling = GestureHandler(L);
        L.Map.addInitHook("addHandler", "gestureHandling", GestureHandling);
        map = L.mapbox.map('map', false, {
            gestureHandling: true,
            gestureHandlingOptions: {
                text: {},
                duration: 1000
            }
        });
        const layer = L.mapbox.tileLayer('mapbox.streets');
        customLayer = makeCustomLayer(L, kmlOptions);
        let loadedOnce = false;
        layer.on('load', () => {
            if (!loadedOnce) {
                loadedOnce = true;
                new Image().src = ofp.ogimetData.proxyImg;
            }
        });
        layer.addTo(map);
        addKmlToMap(KmlGenerator().render(), map, customLayer);
        map.fitBounds(customLayer.getBounds());
            
        return {
            update(kmlOptions) {
                updateMap(KmlGenerator().render(), map, customLayer);
            },
            destroy() {
                map.remove();
            }
        }
    }
</script>

<div id="map" use:mapbox={kmlOptions} bind:this={container}></div>

<style>
    #map {
        width: 100%;
        height: 400px;
        margin: 1rem 0;
    }
    @media (min-width: 768px) and (min-height: 700px) {
        #map {
            flex: 1 1 auto;
        }
    }
</style>
