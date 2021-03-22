<script>
    import { position } from "../stores";
    import { onMount, onDestroy } from "svelte";

    let planeMarker;
    export let mapData;

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

    $: placePlane($position.map);

    onMount(() => {
        planeMarker = new mapboxgl.Marker(planeElement);
        placePlane($position.map);
        planeMarker.addTo(mapData.map);

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
        -webkit-animation: mapboxgl-map-plane-dot-pulse 10s infinite;
        -moz-animation: mapboxgl-map-plane-dot-pulse 10s infinite;
        -ms-animation: mapboxgl-map-plane-dot-pulse 10s infinite;
        animation: mapboxgl-map-plane-dot-pulse 10s infinite;
        /* align-content: baseline; */
    }
    @keyframes -global-mapboxgl-map-plane-dot-pulse {
        0%   { transform: scale(1); opacity: 1; background-color: var(--plane-color);}
        14%  { transform: scale(3); opacity: 0; background-color: var(--plane-halo-color);}
        20% { transform: scale(1); opacity: 0; background-color: var(--plane-color);}
    }
</style>
