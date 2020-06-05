<script context="module">
    const target = (!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) ? '_blank' : null;
    const dataURL = function (str, type = "application/vnd.google-earth.kml+xml") {
        return "data:" + type + ";base64," + btoa(unescape(encodeURIComponent(str)));
    };
    const options = ['KML Mapsme', 'KML Avenza', 'GeoJson'];
</script>
<script>
    import {KmlGenerator} from './kml.js';
    import {xml2json} from './geojson.js';
    import {storage, stores} from './storage.js';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let label;
    const store = stores.downloadType;
    const defaultValue = 0;
    let selected = storage.getItem(store) || defaultValue;
    if (typeof selected === 'string') selected = parseInt(selected, 10);
    let url = "";
    let filename = "";

    const download = function (e) {
        const kmlGen = KmlGenerator();
        const extensions = ['_mapsme.kml', '_avenza.kml', '.geojson']
        const extension = extensions[selected];
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
        } else if (selected === 1) {
            url = dataURL(kmlGen.render({
                "template": editolido.avenzaTemplate,
                "styleTemplate": editolido.avenzaStyleTemplate,
                "iconTemplate": editolido.avenzaIconTemplate,
                "icons": editolido.AVENZAICONS
            }));
        } else if (selected === 2) {
            url = dataURL(JSON.stringify(xml2json(kmlGen.render())), "application/vnd.geo+json");
        } else {
            e.preventDefault();
            return false;
        }
        //This will be interesting with navigator.canShare (Web Share API level 2)
        // if (navigator.share && (selected === 0 || selected === 1)) {
        //     navigator.share({
        //         "title": options[selected],
        //         url
        //     });
        //     e.preventDefault();
        // }
    };
    function save() {
        if (selected === defaultValue){
            storage.removeItem(store);
        } else {
            storage.setItem(store, selected);
        }
        dispatch("save", [store, selected]);
    }
</script>

<div class="input-group">
  <select bind:value={selected} class="custom-select"aria-label="Example select with button addon" on:change={save}>
    <option selected={selected === 0} value="{0}">{options[0]}</option>
    <option selected={selected === 1} value="{1}">{options[1]}</option>
    <option selected={selected === 2} value="{2}">{options[2]}</option>
  </select>
  <div class="input-group-append">
    <a class="btn btn-success" download={filename} href={url} on:click={download} target={target}>{label}</a>
  </div>
</div>
<style>
select {
    border-color: var(--green);
}
</style>