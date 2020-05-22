<script>
    import {KmlGenerator} from './kml.js';
    import {toGeoJSON} from './geojson.js';

    export let kmlOptions;
    let geoJSON = "";

    function xml2json(kml){
        const xml = (new DOMParser()).parseFromString(kml, 'text/xml');
        if (!xml) throw 'Could not parse KML';
        return toGeoJSON.kml(xml);
    }

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