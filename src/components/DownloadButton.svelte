<script context="module">
    const options = ['KML Mapsme', 'KML Avenza', 'KML Google Earth'];
    const optionColors = ['green', 'purple', 'cyan']
</script>
<script>
    import {KmlGenerator} from './kml.js';
    import {storage, stores} from './mapSettings/storage.js';
    import { createEventDispatcher, onMount } from 'svelte';
    import blurAction from "../actions/blurAction";
    const dispatch = createEventDispatcher();

    export let label;
    const store = stores.downloadType;
    const defaultValue = 1;
    let selected = storage.getItem(store) || defaultValue;
    if (typeof selected === 'string') selected = parseInt(selected, 10);
    if (selected < 0 || selected >= options.length) selected = 0;
    let url = "";
    let filename = "";
    let cssRoot;
    const setCssColor = (value) => {
        cssRoot.style.setProperty('--color', `var(--${optionColors[selected]})`);
    }
    const blobURL = (data, type="application/vnd.google-earth.kml+xml")  => {
        const blob = new Blob( data, { type });
        return URL.createObjectURL(blob);
    }

    const download = function (e) {
        const kmlGen = KmlGenerator();
        const extensions = ['_mapsme.kml', '_avenza.kml', '_googleearth.kml']
        const extension = extensions[selected];
        let str = kmlGen.name;
        if (!str) {
            console.log("can not compute filename");
            filename = "editolido" + extension;
        } else {
            str = str.trim();
            filename = str.replace(/[ \/]/g, "_").replace(/:/g, '') + extension;
        }
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        if (selected === 0) {
            url = blobURL([kmlGen.render()]);
        } else if (selected === 1) {
            url = blobURL([kmlGen.render({
                "template": editolido.avenzaTemplate,
                "styleTemplate": editolido.avenzaStyleTemplate,
                "iconTemplate": editolido.avenzaIconTemplate,
                "icons": editolido.AVENZAICONS
            })]);
        } else if (selected === 2) {
            url = blobURL([kmlGen.render({
                "styleTemplate": editolido.googleEarthStyleTemplate
            })]);
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
    function save(e) {
        e.target.blur();
        if (selected === defaultValue){
            storage.removeItem(store);
        } else {
            storage.setItem(store, selected);
        }
        dispatch("save", [store, selected]);
        setCssColor();
    }
    onMount(() => {
        setCssColor();
        return () => {
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        };
    });
</script>

<div bind:this={cssRoot} class="input-group">
  <!-- svelte-ignore a11y-no-onchange -->
  <select bind:value={selected} class="custom-select choice{selected}"aria-label="Example select with button addon" on:change={save} use:blurAction>
    <option selected={selected === 0} value="{0}">{options[0]}</option>
    <option selected={selected === 1} value="{1}">{options[1]}</option>
    <option selected={selected === 2} value="{2}">{options[2]}</option>
  </select>
  <div class="input-group-append">
      <!-- Using the download attribute in standalone mode makes the app to lost the ofp on return (last check on iPadOS 14.4)-->
    <a class="btn btn-success choice{selected}" download={filename} href={url} on:click={download}>{label}</a>
  </div>
</div>
<style>
    div.input-group {
        --color: var(--green);
    }
    select {
        border-color: var(--color);
    }
    a {
        background-color: var(--color);
        border-color: var(--color);
    }
</style>