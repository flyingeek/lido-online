<script context="module">
    import {debounce} from '../utils.js';
    import {kml2swatch, pickerStyle, swatchStyle, defaultSwatch} from './ColorPinCombo.svelte';

</script>
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let kmlColor = "FF0000FF";
    export let checked;
    export let name;
    export let label = 'Couleur';
    const colorName = name + '-color';
    const displayName = name + '-display';
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

<kmlcolor class="input-group checkbox-combo" use:changeSwatch={kmlColor}>
    <div class="input-group-prepend">
        <label for="{displayName}" class="input-group-text"><input name="{displayName}" checked={checked} type="checkbox" on:change/>{label}</label>
    </div>
    <picker class="form-control" style="{pickerStyle(swatch[0])}">
        <label use:changeKmlColor={swatch} style="{swatchStyle(swatch)}">
            <input bind:value={swatch[0]} type="color" />
        </label>
        <input bind:value={swatch[1]} type="range" min="30" max="255">
    </picker>
</kmlcolor>

<style>
:global(.checkbox-combo .input-group-prepend){
    display:flex;
    align-items: center;
    flex: 1;
}
:global(.checkbox-combo .input-group-prepend > label){
    width:auto;
    padding-left: 0;
    padding-right: 0;
    background-color: white;
}
:global(.checkbox-combo input[type=checkbox]) {
    margin-left: -1px;
}
:global(.checkbox-combo) {
    padding-bottom: 5px;
}
:global(.checkbox-combo .input-group-text) {
    flex-grow: 1;
}
</style>