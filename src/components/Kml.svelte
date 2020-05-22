<script>
    import {KmlGenerator} from './kml.js';

    export let kmlOptions;
    let kml = "";

    function changeKml(node) {
        kml = KmlGenerator().render();
        return {
            update(kmlOptions) {
                kml = KmlGenerator().render();
            }
        }
    }
</script>

<textarea use:changeKml={kmlOptions} class="text-monospace">{kml}</textarea>

<style>
    textarea {
        width: 100%;
        height: 200px;
    }
</style>