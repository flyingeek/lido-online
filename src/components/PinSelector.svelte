<script context="module">
    const options = [
        {label: 'Aucun', color: '#FFFFFF'},
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
    export let selected = 0;
    export let name;
</script>

<div class="input-group">
    <div class="input-group-prepend">
        <label class="input-group-text" for="{name}">Repère</label>
        <span class="input-group-text">
            <svg>
                <use xlink:href="#marker" style="stroke: {(selected === 0) ? '#fff': '#000' }; fill: {options[selected].color};"></use>
            </svg>
        </span>
    </div>
    <!-- svelte-ignore a11y-no-onchange -->
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
    span {
        background-color: white;
        padding: 0 0 0 0.2rem;
        border-right: 0px;
    }
    svg{
        stroke: white;
        fill: white;
        height: 1.1rem;
        width: 1.1rem;
    }
    label {
        width: 5em;
    }
</style>