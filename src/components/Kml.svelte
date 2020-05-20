<script>
    import {tick} from "svelte";
    import {generateKML, KmlGenerator} from '../kml.js';
    import DownloadButton from "./DownloadButton.svelte";
    export let kmlOptions;

    let kml = "";

    function changeKml(node) {
        kml = KmlGenerator().render();
        return {
            async update(kmlOptions) {
                await tick();
                kml = KmlGenerator().render();
            },
            destroy() {
                KmlGenerator().reset();
            }
        }
    }
</script>

<textarea use:changeKml={kmlOptions} class="text-monospace">{kml}</textarea>
<div>
    <DownloadButton label="Télécharger KML MapsMe" type="mapsme"/>
    <DownloadButton label="Télécharger KML Avenza" type="avenza"/>
</div>
<style>
    textarea {
        width: 100%;
        height: 200px;
    }
</style>