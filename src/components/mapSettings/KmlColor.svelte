<script context="module">
    import {debounce} from '../utils.js';
    import {kmlRegex, kml2swatch, pickerStyle, swatchStyle, defaultSwatch} from './ColorPinCombo.svelte';
    const textStyle = (kmlColor) => {
        return (kmlColor.match(kmlRegex)) ? "" : "border-color: #F00;";
    };

</script>
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let kmlColor = "FF0000FF";
    export let name;
    const debounceDelay = 500;
    let swatch;
    try {
        swatch = kml2swatch(kmlColor);
    } catch(err) {
        console.error(`invalid KML color ${kmlColor}`);
        swatch = defaultSwatch;
    }
    const debounceDispatch = (debounceDelay > 0) ? debounce(dispatch, debounceDelay) : dispatch;
    function changeText(node) {
        return {
            update(swatch) { /* color was changed */
                const [hex, range] = swatch;
                /* kmlColor is abgr */
                kmlColor = (range.toString(16) + hex.slice(5,7) + hex.slice(3,5) + hex.slice(1, 3)).toUpperCase();
                debounceDispatch("change", {"name": name, "value": kmlColor});
            }
        }
    }
    function changeSwatch(node) {
        return {
            update(kmlColor) { /* kmlColor was changed */
                if (kmlColor.match(kmlRegex)) {
                    const range = parseInt(kmlColor.slice(0,2), 16);
                    const hex = "#" + kmlColor.slice(6,8) + kmlColor.slice(4,6) + kmlColor.slice(2,4);
                    swatch = [hex, range];
                    debounceDispatch("change", {"name": name, "value": kmlColor.toUpperCase()});
                }
            }
        }
    }
</script>

<kmlcolor class="input-group">
    <div class="input-group-text">
        <label for="{name}" class="input-group-text">Couleur</label>
    </div>
    <picker class="form-control" style="{pickerStyle(swatch[0])}">
        <label use:changeSwatch={kmlColor} style="{swatchStyle(swatch)}">
            <input bind:value={swatch[0]} type="color" />
        </label>
        <input bind:value={swatch[1]} type="range" min="30" max="255">
    </picker>
    <input name="{name}" class="form-control text-monospace" use:changeText={swatch} bind:value={kmlColor} style="{textStyle(kmlColor)}" type="text" maxlength="8"/>

</kmlcolor>

<style>
    input[type="text"] {
        text-transform: uppercase;
        min-width: 10ch; /* 8 chars only, ch is the size of "0" */
        margin: var(--color-text-margin) 0.5em;
    }
    input[type="text"].form-control {
        margin: 0;
        min-width: 0;
        border-left: 0;
        padding-left: 0;
    }
    .input-group>picker.form-control{
        flex-basis: 69px;
    }
    label {
        width: 5em;
    }
</style>
