<script context="module">
    const target = (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) ? '_blank' : null;
    const dataURL = function (str, type = "application/vnd.google-earth.kml+xml") {
        return "data:" + type + ";base64," + btoa(unescape(encodeURIComponent(str)));
    };
</script>
<script>
    import {KmlGenerator} from '../kml.js';
    export let type = "mapsme";
    export let label;
    let url = "";
    const kmlGen = KmlGenerator();
    const filename = function (extension = ".kml") {
        let str = kmlGen.name;
        if (!str) {
            console.log("can not compute filename");
            return "editolido" + '_' + type + extension;
        }
        str = str.trim();
        return str.replace(/[ \/]/g, "_").replace(/:/g, '') + '_' + type + extension;
    };
    const downloadKml = function () {
        if (type === "mapsme") {
            url = dataURL(kmlGen.render());
        } else {
            url = dataURL(kmlGen.render({
                "template": editolido.avenzaTemplate,
                "styleTemplate": editolido.avenzaStyleTemplate,
                "iconTemplate": editolido.avenzaIconTemplate,
                "icons": editolido.AVENZAICONS
            }));
        }
    };
</script>

<a class="btn btn-success mb-2" download={filename()} href={url} on:click={downloadKml} target={target}>{label}</a>

<style>
</style>