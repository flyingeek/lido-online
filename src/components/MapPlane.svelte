<script>
    import { ofp, flightProgress } from "../stores";
    import { onMount, onDestroy } from "svelte";

    let distanceMatrix;
    let timeMatrix;
    let planeMarker;
    export let mapData;

    $: {
        let sum = 0;
        distanceMatrix = $ofp.route.segments.map(([p1, p2]) => {
            sum += p1.distanceTo(p2);
            return [p2, sum];
        });
        distanceMatrix.unshift([$ofp.route.points[0], 0]);
        try{
            timeMatrix = $ofp.wptNamesEET($ofp.route.points);
        }catch(err){
            console.error(err);
            timeMatrix = [];
        }
        if (timeMatrix.length === 0) {
            document.body.style.setProperty('--plane-halo-color', 'red');
        } else {
            document.body.style.setProperty('--plane-halo-color', 'var(--plane-color)');
        }
        //console.log(timeMatrix)
    }

    const findPosition = (flightProgress) => {
        if (timeMatrix.length !== 0) {
            const routeTime = timeMatrix[timeMatrix.length - 1][1];
            const posTime = (flightProgress * routeTime) / 100;
            const last = timeMatrix[timeMatrix.length - 1][0];

            for (const [i, [p, sum]] of timeMatrix.entries()) {
                // console.log(i, p, d)
                if (sum >= posTime) {
                    if (posTime - sum === 0) return p;
                    const previous = timeMatrix[i - 1];
                    if (previous) {
                        return p.atFraction(
                            previous[0],
                            (sum - posTime) / (sum - previous[1])
                        );
                    }
                    return p;
                }
            }
            return last;
        } else {
            const routeDistance = distanceMatrix[distanceMatrix.length - 1][1];
            const posDistance = (flightProgress * routeDistance) / 100;
            const last = distanceMatrix[distanceMatrix.length - 1][0];
            for (const [i, [p, sum]] of distanceMatrix.entries()) {
                // console.log(i, p, d)
                if (sum >= posDistance) {
                    if (posDistance - sum === 0) return p;
                    const previous = distanceMatrix[i - 1];
                    if (previous) {
                        const segmentLength = sum - previous[1];
                        return p.atFraction(
                            previous[0],
                            (sum - posDistance) / segmentLength,
                            segmentLength
                        );
                    }
                    return p;
                }
            }
            return last;
        }
    };
    const planeElement = window.document.createElement("div");
    planeElement.classList.add("mapboxgl-user-location-dot", "map-plane");
    const placePlane = (geoPoint) => {
        if (planeMarker) {
            const affine = mapData.affine;
            const [lng, lat] = affine
                ? affine([geoPoint.longitude, geoPoint.latitude])
                : [geoPoint.longitude, geoPoint.latitude];
            planeMarker.setLngLat([lng, lat]);
        }
    };

    $: placePlane(findPosition($flightProgress));

    onMount(() => {
        if (!ofp.isFake) {
            planeMarker = new mapboxgl.Marker(planeElement);
            placePlane(findPosition($flightProgress));
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
    :global(.mapboxgl-user-location-dot.map-plane, .mapboxgl-user-location-dot.map-plane:before) {
        background-color: var(--plane-color);
    }
    /* :global(.map-plane) {
        width: 20px;
        height:20px;
        border: 2px solid var(--plane-color);
        border-radius: 50%;
    } */
    :global(.mapboxgl-user-location-dot.map-plane:before) {
        /* content: ""; */
        /* position: absolute; */
        -webkit-animation: mapboxgl-map-plane-dot-pulse 2s infinite;
        -moz-animation: mapboxgl-map-plane-dot-pulse 2s infinite;
        -ms-animation: mapboxgl-map-plane-dot-pulse 2s infinite;
        animation: mapboxgl-map-plane-dot-pulse 2s infinite;
        /* align-content: baseline; */
    }
    @keyframes -global-mapboxgl-map-plane-dot-pulse {
        0%   { transform: scale(1); opacity: 1; background-color: var(--plane-color);}
        70%  { transform: scale(3); opacity: 0; background-color: var(--plane-halo-color);}
        100% { transform: scale(1); opacity: 0; background-color: var(--plane-color);}
    }
</style>
