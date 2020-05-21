<script context="module">
    const target = (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) ? '_blank' : null;
    const dataURL = function (str, type = "application/vnd.google-earth.kml+xml") {
        return "data:" + type + ";base64," + btoa(unescape(encodeURIComponent(str)));
    };
</script>
<script>
    import {KmlGenerator} from '../kml.js';
    export let label;
    let selected = localStorage.getItem("downloadType") || 0;
    if (typeof selected === 'string') selected = parseInt(selected, 10);
    let url = "";
    let filename = "";

    const downloadKml = function () {
        const kmlGen = KmlGenerator();
        const extension = (selected === 0) ? "_mapsme.kml" : "_avenza.kml";
        let str = kmlGen.name;
        if (!str) {
            console.log("can not compute filename");
            filename = "editolido" + extension;
        } else {
            str = str.trim();
            filename = str.replace(/[ \/]/g, "_").replace(/:/g, '') + extension;
        }
        if (selected === 0) {
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
    function save() {
        localStorage.setItem("downloadType", selected);
    }
</script>

<div class="input-group">
  <select bind:value={selected} class="custom-select"aria-label="Example select with button addon" on:change={save}>
    <option selected={selected === 0} value="{0}">KML Mapsme</option>
    <option selected={selected === 1} value="{1}">KML Avenza</option>
  </select>
  <div class="input-group-append">
    <a class="btn btn-success" download={filename} href={url} on:click={downloadKml} target={target}>{label}</a>
  </div>
</div>
<style>
select {
    border-color: var(--green);
}
</style>