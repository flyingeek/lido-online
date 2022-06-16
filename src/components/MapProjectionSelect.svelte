<script>
    /* global editolido */
    import {mapZoom} from '../stores';
    import options from './mapboxgl/mapOptions';
    import blurAction from '../actions/blurAction';
    import {onMount} from 'svelte';
    import { getPreviousMapProjection, savePreviousMapProjection} from './utils';
    export let name = 'map-style';
    export let ofp;
    export let selected = options[0];
    export let disabled;
    let autoSelectedId = selected.id;
    const authorizedOptions = (ofp) ? options : options.filter(o => (!o.id.startsWith('vb_') && o.id !== 'jb_theworld'));

    function isInBounds(option, dep, dest) {
        if (!option.proj4) return false;
        try{
            const bounds = (option.validity) ? option.validity : option.extent;
            for (let p of [dep, dest]) {
                const [x, y] = window.proj4(option.proj4, [p.longitude, p.latitude]);
                if (x < bounds[0] ||  x > bounds[2] || y < bounds[1] || y > bounds[3]) {
                    return false;
                }
            }
        }catch(err){
            console.log(err);
            return false;
        }
        return true;
    }

    onMount(() => {
        if (selected.id === options[0].id && ofp) {
            const dep = ofp.route.points[0];
            const dest = ofp.route.points[ofp.route.points.length - 1];
            const cbMapOption = options.find(o => o.id === 'vb_2022');
            const northOption = options.find(o => o.id === 'jb_north');
            if (isInBounds(cbMapOption, dep, dest)){
                selected = cbMapOption;
            }else if (dep.distanceTo(dest, editolido.rad_to_nm) <=1500){
                //pass (mercator)
            }else if (ofp.route.points.filter(p => p.latitude >= 75).length > 0) { //above N75
                selected = options.find(o => o.id === 'jb_stereo');
            }else if (dest.latitude > 30 && dep.latitude > 30){
                selected = northOption;
            }else if (dest.longitude < -80 && dep.longitude < -80) {
                selected = options.find(o => o.id === 'jb_pacific');
            }else if ((dest.latitude > 30 || dep.latitude > 30) && (dep.atFraction(dest, 0.5)).latitude >= 30 && isInBounds(northOption, dep, dest)) {
                selected = northOption;
            }else{
                selected = options.find(o => o.id === 'jb_south');
            }
        }
        autoSelectedId = selected.id;
        const previousSavedId = getPreviousMapProjection(ofp);
        if (previousSavedId) {
            selected = options.filter(o => o.id === previousSavedId).pop() || selected;
        }else{
            savePreviousMapProjection(selected.id);
        }
    });
</script>
<div class="input-group">
    <!-- svelte-ignore a11y-no-onchange -->
    <select id="{name}" name="{name}" bind:value={selected}
        class="form-select form-select-sm" class:extend={autoSelectedId === 'mercator' && selected.id === 'mercator'}
        aria-label="Choix de la projection"
        on:change use:blurAction {disabled}>
        {#each authorizedOptions as option (option.id)}
        <option value="{option}" selected={option.id === selected.id}>
            {(option.id === autoSelectedId) ? `${option.label.toUpperCase()}`: option.label}
        </option>
        {/each}
    </select>
    {#if selected.id==='mercator'}
        <label for="{name}">{$mapZoom.toFixed(1)}</label>
    {/if}
</div>
<style>
    label {
        position: absolute;
        right: 2.25rem;
        top: 50%;
        transform: translate(0, -50%);
        background-color: var(--bs-gray-100);
        font-size: small;
        min-width: 30px;
        z-index: 3; /* same as .input-group:focus*/
    }
    select {
        width: auto !important;
        font-size: small;
        display: inline-block;
        background-color: var(--bs-gray-100);
    }
    select.extend{
        padding-right: 3.5rem !important;
    }
</style>
