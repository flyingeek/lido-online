<script>
    import {selectedAircraftType, aircraftType, ofp} from '../stores';
    import {aircraftTypes, discontinuatedAircraftTypes} from '../constants';
    import blurAction from '../actions/blurAction';
    export let aircraftTypeSelectElement = null;
    $: ofpAircraftType = ($ofp) ? $ofp.infos.aircraftType : undefined;
</script>

<!-- svelte-ignore a11y-no-onchange -->
<select tabindex="{(($ofp) ? -1 : 0)}" bind:this={aircraftTypeSelectElement} name="aircraftType" bind:value={$selectedAircraftType} on:change use:blurAction>
    {#if (!$aircraftType)}
        <option value="{undefined}" selected={true}>???</option>
    {/if}
    {#each aircraftTypes as type}
        {#if (type === $aircraftType|| (ofpAircraftType && type === ofpAircraftType) || !discontinuatedAircraftTypes.includes(type))}
            <option value="{type}" selected={type === $aircraftType}>{type}</option>
        {/if}
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