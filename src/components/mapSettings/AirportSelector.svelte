<script context="module">
    const options = [
        {label: 'statuts'},
        {label: 'vert/rouge'},
        {label: 'médical'},
    ];
    export const isStatusStyle = (style) => style === 0;
    export const isMedicalStyle = (style) => style === 2;
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    export let selected = 0;
    export let name = 'airport';
    export let checked;
    const displayName = name + '-display';
    const pinName = name + '-pin';
</script>

<div class="input-group checkbox-combo">
    <div class="input-group-prepend">
        <label for="{displayName}" class="input-group-text"><input name="{displayName}" checked={checked} type="checkbox" on:change/>Airports</label>
    </div>
    <!-- svelte-ignore a11y-no-onchange -->
    <select name="{pinName}" bind:value={selected} class="custom-select" on:change={(e) => {e.target.blur(); dispatch("change", {name: pinName, 'value': selected})}}>
        {#each options as option, index}
        <option value="{index}" selected={index === selected}>{option.label}</option>
        {/each}
    </select>
</div>

<style>
    select {
        border-left: 1px;
        padding-left: 0.2rem;
    }
</style>