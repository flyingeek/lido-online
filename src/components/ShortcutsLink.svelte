<script>
    import {KmlGenerator} from "./kml.js";
    import {runningOnIpad} from "./utils.js";
    import {storage, stores} from './mapSettings/storage.js';
    import {ofp} from '../stores';
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    const store = stores.shortcut;
    const defaultValue = "OFP2MAP";
    let shortcutName = storage.getItem(store) || defaultValue;
    $: disabled = !(shortcutName.trim() && runningOnIpad)
    let url;
    const lidoRoute = (!!$ofp) ? $ofp.lidoRoute(false).join(' ') : '';
    function click(e) {
        const name = shortcutName.trim();
        if (name && runningOnIpad) {
            const kmlGen = KmlGenerator();
            const obj = {
                "lidoRoute": lidoRoute,
                "kml": kmlGen.render(),
                "kmlAvenza": kmlGen.render({
                    "template": editolido.avenzaTemplate,
                    "styleTemplate": editolido.avenzaStyleTemplate,
                    "iconTemplate": editolido.avenzaIconTemplate,
                    "icons": editolido.AVENZAICONS
                }),
                "kmlGoogleEarth": kmlGen.render({
                    "styleTemplate": editolido.googleEarthStyleTemplate
                }),
                "grametProxyURL": $ofp.ogimetData.proxyImg
            };
            url = "shortcuts://run-shortcut?name=" + encodeURIComponent(name) + "&input=text&text=" + encodeURIComponent(JSON.stringify(obj));
        } else {
            e.preventDefault();
        }
    };
    function save() {
        const name = shortcutName.trim();
        if (name === defaultValue) {
            storage.removeItem(store);
        } else {
            storage.setItem(store, name);
        }
        dispatch('save', [store, name]);
    };
</script>

<div class="input-group">
    <span class="input-group-text"></span>
    <input class="form-control" placeholder="Nom du raccourci" type="text" bind:value={shortcutName} on:change={save}>
    <div class="input-group-text" class:disabled>
    <a class:disabled href={url} on:click={click} >Lancer</a>
    </div>
</div>

<style>
span {
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    background-color: #1b1e5b;
    border-color: #1b1e5b;
    background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAABK9JREFUSMe1VjuPHEUQrkf3zM7ePm6958dhH2djwGBkIyHeQoiIH0EAIiQg4wcQkTogIoMIRICEQEIgQQASCAJbxsIW+M68hM/n85ndmd2dnemuKgKDEHdrn0FHqYNSd6s+ler7qgqXlp8DQAAzAIQ/bUd/1uXsIPSX//fD7fizLmcHIfifzd3+VzENqgDgiBzSbgIoWFC5a27hxPwiApwbrK2Or3lkQtwFgGjqkV8++viLhx/tpS1D2gjjt3765o3Vr4LKjqlwd/7ELZ6nKouN1qnjzzx/6ASZ1VpPNTiCR/p3Hm3tOf375TxM+ZYYNwUwgFL0iV7/jQeefKy7t5RaIAqIWKw0TGR6R7PzUG9xZXT98rRgJPxXAGIQzF44uP/UfccPJH6qtYKoiUCMFmsNldZFrDzzyd7+PFQ/jYeIgIC3BRANGoSv3tN/5cg+Ro0WDcTgRvRQW6g0lBomUuWxKjUebs8z48+jXExxW9m3FlkN2g5ffyB7ts+l5AYpYGqWKCQCLpqrjSrFUmGsNhYZiuYS7+32BeyLtV+iKd4aoFJ46ZA9u68uwwgwAQhmtWIq4KO5Gl2tXCpMBMdihVghkseYi3TTZKndXh0O+J9JbKcpLmYRSIAULJpFxaAQxHzERsC0YiojjmM1iqEQy6MVIkWUUmWmKrYyjNHeu0yDGL2rlGqlqeJEcBKpClRVHEqWspGMu/OF46KeFLEswnQk1bAu18dj2lbnrUVmhF9K/Danx/vSS7QGE4KIVCNMESZII+Qcfe6bg/beoUKeXx9L/L2OK4PhKMTtbJ3BIoewOqJPN+hYW5fntEKqESvEEnmMnJMfcjqgbOhag95SkbbXr/x6cXNzIjpTC7N1wGAD8J/5fa2GO5ZUFeIEeUJuRElB6ZCzgWsOea7g5sX5+3/o3K1XL3E5AOKZACe3aljNdbL2XXut0/zcetc4O86lEuXsC05zzgaumXN2ndtn+eCPOG/dg7r8MOVXaLgGRDtkYGauk3XuP+BaCTU8Z/6c653383diSBBy1yhco+DsN7fwdbq85nvICSBBoyvLD9P69zTagH+2Jre9NTcPdRsLmQKoc8qOmc/zntdo4TEt+mAD6qz4Axf80gQzDyBACg4MLG3Fe57mtQtbiLkVwMzANO03VE2IhVnJMVNJjU+oB5gKNCPOGZAHFVA1Q0M1Ngc43tx5HhDTaHWzdWS+fd9CFIvIQixEgMBoAiagbCIgYgImZhFMDFP+4Yz/7mNgv9PAQdBa1j5ZkSh7nlpyALURAiICgRIYmqIKWESNqAEhQRH+5kP/xbsQw85FBgBENIXRxc04Du0H+77jzCMmCAmhJ/SMjv48iYe6ho/e5S8/BLDt0W+qA0RAwvLn4eTSYO54L1nMjAw8oEN0SI7IEaZe1zfC2+/AhbPgPdxkPs/Qwd8wTPW1sjh9NT2YZcfawAAMyIAJUYPDmZXJmx/Y+lXw/r/PZGTUMhZfr1uU7N4Wdx161HFVvH+ueOcrmNbg+NZDH5eWn9t5bzHQoMlis3G0Y4bVpTxcGaEj2JW15Qa1KKGwUYa1yY12iJ53f7NDQkgQ/qX9v7upAZBtXZZ30xDwD7OghDZGs+a6AAAAAElFTkSuQmCC");
}

div.input-group-text {
    border-color: #1b1e5b;
    background-color: #1b1e5b;
}
a {
    color: var(--bs-white);
    text-decoration: none;
    display: inline-block;
    text-align: center;
    font-variant-caps: all-small-caps;
    min-width:122px;
    cursor:pointer;
}
a.disabled {
    cursor: not-allowed;
}
input {
    border-color: #1b1e5b;
}
</style>