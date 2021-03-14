<script context="module">
    import {debounce} from '../utils.js';
    export const kmlRegex = /^[A-F0-9]{8}$/i;
    export const splitKmlColor = (v) => {
        return [v.slice(6,8), v.slice(4,6), v.slice(2, 4), v.slice(0, 2)]
    }
    export const kml2hexa = (v) => {
        const [r, g, b, a] = splitKmlColor(v);
        return "#" + r + g + b + a;
    }
    export const kml2rgba = (v) => {
        let [r, g, b, a] = splitKmlColor(v).map((v) => parseInt(v, 16));
        return `rgba(${r}, ${g}, ${b}, ${a / 255.0})`;
    }
    export const kml2mapColor = (v) => {
        let [hex, range] = kml2swatch(v);
        return [hex, range / 255.0];
    }
    export const defaultSwatch = ["#FF0000", 255];
    export const kml2swatch = (v) => {
        try{
            const range = parseInt(v.slice(0,2), 16);
            const hex = "#" + v.slice(6,8) + v.slice(4,6) + v.slice(2,4);
            return [hex, range];
        }catch(err){
            console.error(`invalid KML color ${v}`);
            return defaultSwatch;
        }
    };
    export const pickerStyle = (hex) => {
        const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((v) => parseInt(v, 16));
        return `--range-red: ${r}; --range-green: ${g}; --range-blue: ${b};`;
    };
    export const swatchStyle = (swatch) => {
        return `background-color: ${swatch[0]}; opacity: ${swatch[1]/255.0}`
    };
    const options = [
        {label: 'Aucun repère', color: '#FFFFFF'},
        {label: 'Bleu', color: '#6699FF'},
        {label: 'Jaune', color: '#FFFF00'},
        {label: 'Marron* (Rouge pour Avenza)', color: '#CC9966'},
        {label: 'Orange', color:'#FF9922'},
        {label: 'Rose* (Rouge pour Avenza)', color: '#DD5599'},
        {label: 'Rouge', color: '#FF0000'},
        {label: 'Vert', color: '#22DD44'},
        {label: 'Violet', color: '#BB11EE'}
    ];
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let kmlColor = "FF0000FF";
    export let selected = 0;
    export let name;
    const colorName = name + '-color';
    const pinName = name + '-pin';
    const debounceDelay = 500;
    let swatch = defaultSwatch;

    const debounceDispatch = (debounceDelay > 0) ? debounce(dispatch, debounceDelay) : dispatch;
    function changeKmlColor(node) {
        return {
            update(swatch) { /* color was changed */
                const [hex, range] = swatch;
                /* kmlColor is abgr */
                kmlColor = (range.toString(16) + hex.slice(5,7) + hex.slice(3,5) + hex.slice(1, 3)).toUpperCase();
                debounceDispatch("change", {"name": colorName, "value": kmlColor});
            }
        }
    }
    function changeSwatch(node) {
        swatch = kml2swatch(kmlColor);
        return {
            update(kmlColor) { /* kmlColor was changed */
                swatch = kml2swatch(kmlColor);
                debounceDispatch("change", {"name": colorName, "value": kmlColor.toUpperCase()});
            }
        }
    }
</script>

<kmlcolor class="input-group" use:changeSwatch={kmlColor}>
    <pin class="form-control">
        <svg>
            <use xlink:href="#marker-symbol" style="stroke: {(selected === 0) ? '#fff': options[selected].color }; fill: {options[selected].color};"></use>
        </svg>
    </pin>
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="{pinName}" bind:value={selected} class="custom-select" on:change={(e) => {e.target.blur(); dispatch("change", {name: pinName, 'value': selected})}}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{option.label}</option>
        {/each}
    </select>
    <picker class="form-control" style="{pickerStyle(swatch[0])}">
        <label use:changeKmlColor={swatch} style="{swatchStyle(swatch)}">
            <input bind:value={swatch[0]} type="color"/>
        </label>
        <input bind:value={swatch[1]} type="range" min="30" max="255">
    </picker>

</kmlcolor>

<style>
    :global(picker input[type="color"]) {
        opacity: 0;
        width: 0;
        height: 0;
    }
    :global(picker input[type="range"]) {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        width: var(--color-swatch-width);
        padding: 0;
        height: 14px;
        align-self: center;
    }
    :global(picker input[type=range]:focus) {
        outline: none;
    }
    :global(picker input[type=range]::-webkit-slider-runnable-track) {
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    :global(picker input[type=range]::-webkit-slider-thumb) {
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
    :global(picker input[type=range]:focus::-webkit-slider-runnable-track) {
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    :global(picker input[type=range]::-moz-range-track){
        width: 100%;
        height: 4px;
        cursor: pointer;
        background: linear-gradient(90deg, rgba(var(--range-red), var(--range-green), var(--range-blue), 0.12), rgba(var(--range-red), var(--range-green), var(--range-blue), 1));
    }
    :global(picker input[type=range]::-moz-range-thumb) {
        box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
        border: 1px solid #cccccc;
        height: 12px;
        width: 15px;
        border-radius: 3px;
        background:transparent;
        cursor: pointer;
    }

    :global(kmlcolor) {
        --color-swatch-width: 3em;
        --color-swatch-height: 1.1em;
    }

    :global(picker) {
        --range-red: 255;
        --range-green: 0;
        --range-blue: 255;

    }
    :global(.input-group>picker.form-control) {
        flex: 0 0 90px;
        display: flex;
        flex-direction: column;
        padding: 0;
        justify-content: space-between;
    }
    /* label is used because it triggers the color input everywhere */
    :global(kmlcolor picker > label) {
        align-self: center;
        height: var(--color-swatch-height);
        width: var(--color-swatch-width);
        border: 1px solid #ccc;
        border-radius: 2px;
        margin-bottom: 0;
    }
    :global(kmlcolor select, kmlpin select) {
        border-left: 20px solid #FFFFFF !important;
        padding-left: 0.2rem !important;
    }
    :global(kmlcolor pin, kmlpin pin) {
        background-color: white !important;
        padding: 0 0 0 0.2rem !important;
        border-right: 0px !important;
    }
    pin {
        flex:0 0 20px !important;
        padding: 0 2px !important;
        align-items: center !important;
        display: flex !important;
        position: absolute !important;
        width: 20px !important;
        z-index: 4;
    }
    :global(kmlcolor pin svg, kmlpin pin svg){
        stroke: white;
        fill: white;
        height: 1.1rem;
        width: 1.1rem;
    }

</style>
