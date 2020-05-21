<script context="module">
    import {debounce} from '../utils.js';
    export const kmlRegex = /^[A-F0-9]{8}$/i;
    const splitKmlColor = (v) => {
        [v.slice(6,8), v.slice(4,6), v.slice(2, 4), v.slice(0, 2)]
    }
    export const kml2hexa = (v) => {
        const [r, g, b, a] = splitKmlColor();
        return "#" + r + g + b + a;
    }
    export const kml2rgba = (v) => {
        let [r, g, b, a] = splitKmlColor().map((v) => parseInt(v, 16));
        return `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
    }
    const kml2swatch = (v) => {
        const range = parseInt(v.slice(0,2), 16);
        const hex = "#" + v.slice(6,8) + v.slice(4,6) + v.slice(2,4);
        return [hex, range];
    };
    const pickerStyle = (hex) => {
        const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((v) => parseInt(v, 16));
        return `--range-red: ${r}; --range-green: ${g}; --range-blue: ${b};`;
    };
    const swatchStyle = (swatch) => {
        return `background-color: ${swatch[0]}; opacity: ${swatch[1]/255.0}`
    };
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
        swatch = ["#FF0000", 255];
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
    <div class="input-group-prepend">
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
    input[type="color"] {
        opacity: 0;
        width: 0;
        height: 0;
    }
    input[type="range"] {
        -webkit-appearance: none;
        position: absolute;
        right: 0;
        bottom: -0.3em; /* max = color-group bottom margin */
        width: var(--color-swatch-width);
        padding: 0;
        margin: 4.3px 0;
        height: 4.3px;
    }
    input[type=range]:focus {
        outline: none;
    }
    input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    input[type=range]::-webkit-slider-thumb {
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        border: 1px solid #cccccc;
        height: 12px;
        width: 15px;
        border-radius: 3px;
        background: transparent;
        cursor: pointer;
        -webkit-appearance: none;
        margin-top: -4.5px;
    }
    input[type=range]:focus::-webkit-slider-runnable-track {
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    input[type=range]::-moz-range-track {
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    input[type=range]::-moz-range-thumb {
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        border: 1px solid #cccccc;
        height: 12px;
        width: 15px;
        border-radius: 3px;
        background:transparent;
        cursor: pointer;
    }
    picker.form-control input[type=range] {
        bottom: 0px;
        right: 10px;
    }
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
    kmlcolor {
        --color-swatch-width: 3em;
        --color-swatch-height: 1.1em;
        --color-spacing: 0.2em; /* swatch range spacing */
        --color-text-margin: calc(((var(--color-swatch-height) - 1.2em) / 2) + var(--color-spacing));
        display: inline-block;
        position: relative;
        margin-bottom: 0.4em;
        padding-right: var(--color-swatch-width);
    }
    kmlcolor.input-group {
        display: flex;
        padding-right: 0;
    }
    picker {
        --range-red: 255;
        --range-green: 0;
        --range-blue: 255;
    }
    picker.form-control {
        border-right: 0px;
        flex-grow: 0;
        width: 69px;
    }
    /* label is used because it triggers the color input everywhere */
    picker > label {
        position: absolute;
        right: 0;
        top: var(--color-spacing);
        height: var(--color-swatch-height);
        width: var(--color-swatch-width);
        border: 1px solid #ccc;
        border-radius: 2px;
    }
    picker.form-control > label {
        top: 1px;
        margin-bottom: 0;
        right: 10px;
    }

</style>
