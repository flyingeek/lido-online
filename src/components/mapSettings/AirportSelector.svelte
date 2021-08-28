<script context="module">
    const options = [
        {label: 'statuts', id: 0},
        {label: 'vert/rouge', id: 1},
        {label: 'bleu/vert/rouge', id: 3},
        {label: 'médical', id: 2},
    ];
    const labels = [
        {label: 'ICAO'},
        {label: 'IATA'},
    ]
    export const isStatusStyle = (style) => style === 0;
    export const isRedGreenStyle = (style) => style === 1;
    export const isMedicalStyle = (style) => style === 2;
    export const isBlueGreenRedStyle = (style) => style === 3;
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import blurAction from '../../actions/blurAction';
    const dispatch = createEventDispatcher();
    export let selectedPin = 0;
    export let selectedLabel = 0;
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
                {#each labels as option, index}
                <option value="{index}" selected={index === selectedLabel}>{option.label}</option>
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