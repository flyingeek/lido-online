<script context="module">
    const options = [
        {label: 'Aucun', color: '#FFFFFF'},
        {label: 'Bleu', color: '#6699FF'},
        {label: 'Jaune', color: '#FFFF00'},
        {label: 'Marron* (Rouge pour Avenza/Earth)', color: '#CC9966'},
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
    export let selected = 0;
    export let name;
</script>

<kmlpin class="input-group">
    <label class="input-group-text" for="{name}">Repère</label>
    <pin class="input-group-text">
        <svg>
            <use xlink:href="#marker-symbol" style="stroke: {(selected === 0) ? '#fff': '#000' }; fill: {options[selected].color};"></use>
        </svg>
    </pin>
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="{name}" bind:value={selected} class="form-select" on:change={dispatch("change", {name, 'value': selected})}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{option.label}</option>
        {/each}
    </select>
</kmlpin>

<style>
    kmlpin.input-group {
        margin-bottom: 0.4em;
    }
    label {
        width: 5em;
    }
</style>