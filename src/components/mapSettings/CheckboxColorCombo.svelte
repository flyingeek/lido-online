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
    <label for="{displayName}" class="form-control"><input name="{displayName}" checked={checked} type="checkbox" on:change/><slot>Couleur</slot></label>
    <picker class="form-control" style="{pickerStyle(swatch[0])}">
        <label use:changeKmlColor={swatch} style="{swatchStyle(swatch)}">
            <input bind:value={swatch[0]} type="color" />
        </label>
        <input bind:value={swatch[1]} type="range" min="30" max="255">
    </picker>
</kmlcolor>

<style>
:global(.checkbox-combo label.form-control){
    display:flex;
    align-items: center;
    flex: 1;
    padding-left: 0rem;
    flex-grow: 1;
    background-color: white;
    width:auto;
}
:global(.checkbox-combo input[type=checkbox]) {
    margin-left: -1px;
}
:global(.checkbox-combo) {
    padding-bottom: 5px;
}
</style>