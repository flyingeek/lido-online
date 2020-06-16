<script context="module">
    const options = [
        {label: 'statuts'},
        {label: 'vert/rouge'},
    ];
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let selected = 0;
    export let name;
</script>

<div class="input-group">
    <div class="input-group-prepend">
        <label class="input-group-text" for="{name}">Couleur</label>
    </div>
    <select name="{name}" bind:value={selected} class="custom-select" on:change={dispatch("change", {name, 'value': selected})}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{option.label}</option>
        {/each}
    </select>
</div>

<style>
    div.input-group {
        margin-bottom: 0.4em;
    }
    select {
        border-left: 0px;
        padding-left: 0.2rem;
    }
    label {
        width: 5em;
    }
</style>