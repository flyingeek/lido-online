<script>
    import {mapbox} from './mapboxgl.js';
    export let kmlOptions;
    export let ofp;
    export let route;
</script>
<div id="map" use:mapbox={{ofp, kmlOptions, route}}></div>

<style>
    #map {
        flex: 1 1 auto;
        height: auto;
        margin: 1rem 0;
    }
    :global(:-webkit-fullscreen button.mapboxgl-ctrl-shrink) {
        display: none;
    }
    @media (max-width: 767px), (max-height: 700px) {
        #map {
            width: 100%;
            height: 400px;
        }
    }
</style>
