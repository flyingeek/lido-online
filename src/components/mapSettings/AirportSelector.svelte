<script context="module">
    export const STATUS = 0;
    export const GREENRED = 1;
    export const MEDICAL = 2;
    export const BLUEGREENRED = 3;
    const options = [
        {label: 'statuts', id: STATUS},
        {label: 'vert/rouge', id: GREENRED},
        {label: 'bleu/vert/rouge', id: BLUEGREENRED},
        {label: 'médical', id: MEDICAL},
    ];
    export const ICAO = 0;
    export const IATA = 1;
    const labels = [
        {label: 'ICAO', id:ICAO},
        {label: 'IATA', id:IATA},
    ];
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import blurAction from '../../actions/blurAction';
    const dispatch = createEventDispatcher();
    export let selectedPin = STATUS;
    export let selectedLabel = ICAO;
</script>

<div class="row g-2">
    <div class="col">
        <div class="form-floating">
            <!-- svelte-ignore a11y-no-onchange -->
            <select use:blurAction name="airport-pin" bind:value={selectedPin} class="form-select" on:change={(e) => {e.target.blur(); dispatch("change", {name: 'airport-pin', 'value': selectedPin})}}>
                {#each options as option (option.id)}
                <option value="{option.id}" selected={option.id === selectedPin}>{option.label}</option>
                {/each}
            </select>
            <label for="airport-pin">Style</label>
        </div>
    </div>
    <div class="col">
        <div class="form-floating">
            <!-- svelte-ignore a11y-no-onchange -->
            <select use:blurAction name="airport-label" bind:value={selectedLabel} class="form-select" on:change={(e) => {e.target.blur(); dispatch("change", {name: "airport-label", 'value': selectedLabel})}}>
                {#each labels as option (option.id)}
                <option value="{option.id}" selected={option.id === selectedLabel}>{option.label}</option>
                {/each}
            </select>
            <label for="airport-label">Noms</label>
        </div>
    </div>
</div>

<style>
    /* select {
        border-left: 1px;
        padding-left: 0.2rem;
    } */
    .col, .row {
        margin-top: 0;
    }
    label {
        width: 5em;
    }
</style>