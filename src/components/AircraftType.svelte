<script>
    import {aircraftTypes} from './OfpInput.svelte';
    import {onMount} from 'svelte';

    export let selectedAircraft = '???';
    export let aircraftTypeSelectElement = null;
    //const aircraftTypes = ['???', ...aircrafts];
    export let ofp;

    onMount(() =>{
        if (selectedAircraft === '???' && ofp) {
            selectedAircraft = (ofp.isFake) ? ofp.isFake :ofp.infos.aircraft;
        }
        if (aircraftTypes.indexOf(selectedAircraft) === -1) selectedAircraft = '???';
    });
</script>

<!-- svelte-ignore a11y-no-onchange -->
<select bind:this={aircraftTypeSelectElement} name="aircraftType" bind:value={selectedAircraft} on:change>
    {#if selectedAircraft === '???'}
        <option value="???" selected={true}>???</option>
    {/if}
    {#each aircraftTypes as aircraftType}
        <option value="{aircraftType}" selected={aircraftType === selectedAircraft}>{aircraftType}</option>
    {/each}
</select>

<style>
    select[name=aircraftType] {
        background-color: rgba(255,255,255,0.3);
        border: none;
        font-size: 12px;
        display: none;
        margin-right: 5px;
        z-index: 2;
        padding: 0px 10px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
    }
</style>