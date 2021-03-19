<script>
    import { ofp, flightProgress } from "../stores";
    import {onMount, onDestroy} from 'svelte';

    let distanceMatrix;
    let planeMarker;
    export let mapData;

    $: {
        let sum = 0;
        distanceMatrix = $ofp.route.segments.map(([p1, p2]) => {
            sum += p1.distanceTo(p2);
            return [p2, sum];
        });
        distanceMatrix.unshift([$ofp.route.points[0], 0]);
        //regex pour waypoint cumulative time
        // /[\s-]{2}([A-Z0-9\/]+)\s+[0-9]{3}\s[A-Z0-9\/.-\s+]+?[0-9]{4}\/([0-9]{4})\s+[0-9]{3}\/[0-9]{3}/g
    }

    const findPosition = (flightProgress) => {
        const routeDistance = distanceMatrix[distanceMatrix.length - 1][1];
        const posDistance = flightProgress * routeDistance / 100;
        const last = distanceMatrix[distanceMatrix.length - 1][0];
        for (const [i, [p, sum]] of distanceMatrix.entries()) {
            // console.log(i, p, d)
            if (sum >= posDistance) {
                if (posDistance - sum === 0) return p;
                const previous = distanceMatrix[i - 1];
                if (previous) {
                    const segmentLength = sum - previous[1];
                    return p.atFraction(previous[0], (sum - posDistance) / segmentLength, segmentLength);
                }
                return p;
            }
        }
        return last;
    }
    const planeElement = window.document.createElement('div');
    planeElement.classList.add('mapboxgl-user-location-dot', 'map-plane');
    const placePlane = (geoPoint) => {
        if(planeMarker) {
            const affine = mapData.affine;
            const [lng, lat] = (affine) ? affine([geoPoint.longitude, geoPoint.latitude]) : [geoPoint.longitude, geoPoint.latitude];
            planeMarker.setLngLat([lng, lat]);
        }
    }

    $: placePlane(findPosition($flightProgress));

    onMount(() => {
        if (!ofp.isFake) {
            planeMarker = new mapboxgl.Marker(planeElement);
            placePlane(findPosition($flightProgress));
            console.log('maplane mount', $flightProgress);
            planeMarker.addTo(mapData.map);
        }
    });
    onDestroy(() => {
        if (planeMarker) {
            planeMarker.remove();
            planeMarker = undefined;
        }
    });
</script>
<style>
    :global(.mapboxgl-user-location-dot.map-plane, .mapboxgl-user-location-dot.map-plane:before){
        background-color: var(--plane-color);
    }
    /* :global(.map-plane) {
        width: 20px;
        height:20px;
        border: 2px solid var(--plane-color);
        border-radius: 50%;
    } */
</style>