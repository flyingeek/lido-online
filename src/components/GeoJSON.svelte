<script>
    import {KmlGenerator} from './kml.js';
    import {xml2json} from './geojson.js';

    export let kmlOptions;
    let geoJSON = "";

    function changeKml(node) {
        geoJSON = xml2json(KmlGenerator().render());
        return {
            update(kmlOptions) {
                geoJSON = xml2json(KmlGenerator().render());
            }
        }
    }
</script>

<textarea use:changeKml={kmlOptions} class="text-monospace">{JSON.stringify(geoJSON)}</textarea>

<style>
    textarea {
        width: 100%;
        height: 200px;
    }
</style>