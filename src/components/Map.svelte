<script>
    import {token, key, loadMap} from './mapboxgl.js';
    import {addToSWCache} from "./utils.js";
    export let map = undefined;
    export let kmlOptions;
    export let ofp;
    export let route;

    function mapbox(node) {
        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
            'container': node.id, // container id
            'style': 'mapbox://styles/mapbox/streets-v11', // stylesheet location
            'center': [0, 49], // starting position
            'zoom': 2 // starting zoom
        });
        map.loadImage('maki-marker-sdf.png', function(error, image) {
            if (error) {
                console.log(error);
            } else {
                map.addImage('sdf-marker-15', image, { pixelRatio: 2, sdf: true});
            }
        });
        map.loadImage('map-triangle.png', function(error, image) {
            if (error) {
                console.log(error);
            } else {
                map.addImage('sdf-pin0', image, { pixelRatio: 2, sdf: true});
            }
        });
        map.on('load', function() {
            loadMap(ofp, kmlOptions, map);
            addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet');
        });
        let bbox = undefined;
        const getBounds = (points, result=[Infinity, Infinity, -Infinity, -Infinity]) => {
            for (const p of points) {
                if (result[0] > p.longitude) { result[0] = p.longitude; }
                if (result[1] > p.latitude) { result[1] = p.latitude; }
                if (result[2] < p.longitude) { result[2] = p.longitude; }
                if (result[3] < p.latitude) { result[3] = p.latitude; }
            }
            result[0] -= 1;
            result[1] -= 1;
            result[2] += 1;
            result[3] += 1;
            return result;
        }
        let points = [];
        for (const track of ofp.tracks) {
            points = points.concat(track.points);
        }
        points = points.concat(ofp.route.points, ofp.wptCoordinatesAlternate());
        bbox = getBounds(points);

        map.fitBounds(bbox, {padding: {top: 30, bottom:80, left: 30, right: 30}});
        map.addControl(new mapboxgl.FullscreenControl());
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: false
            },
            fitBoundsOptions: {maxZoom: 3},
            trackUserLocation: false
        });
        map.addControl(geolocate);
        //console.log(geolocate);
        // geolocate.on('geolocate', function(e) {
        //     console.log('geolocated');
        //     const zoom = map.getZoom();
        //     geolocate.options['fitBoundsOptions'] = {maxZoom: zoom};
        //     //map.setZoom(8);
        // });
        // geolocate.on('trackuserlocationstart', function() {
        //     console.log('A trackuserlocationstart event has occurred.');
        //     const zoom = map.getZoom();
        //     geolocate.options['fitBoundsOptions'] = {maxZoom: zoom};
        // });
        document.addEventListener("webkitfullscreenchange", function( event ) {
            if ( document.webkitfullscreen ) {
                console.log('fullscreen element', document.fullscreenElement);
                map.resize();
            }else {
                console.log('fullscreen exit');
                map.resize();
            }

        });
        return {
            update(parameters) {
                if (route === '/map' && map) {
                    map.resize();
                    console.log("map resized");
                }
            },
            destroy() {
                map.remove();

            }
        }
    }
</script>
<div id="map" use:mapbox={route}></div>

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
