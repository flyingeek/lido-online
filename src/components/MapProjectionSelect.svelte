<script>
    import options from './mapboxgl/mapOptions';
    import blurAction from '../actions/blurAction';
    import {onMount} from 'svelte';
    export let name = 'map-style';
    export let ofp;
    export let selected = options[0];

    function mapContainsOfp(option) {
        if (!option.proj4||!ofp||ofp.isFake) return true;
        const dep = ofp.route.points[0];
        const dest = ofp.route.points[ofp.route.points.length - 1];
        if (option.id === 'jb_north') {
            return (dest.latitude > 30 && dep.latitude > 30);
        } else if (option.id === 'jb_south') {
            if (dest.latitude > 30 && dep.latitude > 30) return false;
        }else if (option.id === 'jb_theworld') {
            return false;
        }
        const bounds = (option.validity) ? option.validity : option.extent;
        for (let p of [dep, dest]) {
            const [x, y] = window.proj4(option.proj4, [p.longitude, p.latitude]);
            if (x < bounds[0] ||  x > bounds[2] || y < bounds[1] || y > bounds[3]) {
                return false;
            }
        }
        return true;
    }
    onMount(() => {
        if (selected.id === options[0].id && ofp && !ofp.isFake) {
            const dep = ofp.route.points[0];
            const dest = ofp.route.points[ofp.route.points.length - 1];
            if (dest.latitude > 30 && dep.latitude > 30){
                selected = options[1]; // north
            }else if (dest.longitude < -80 && dep.longitude < -80) {
                selected = options[3]; // pacific
            }else{
                selected = options[2]; // south
            }
        }
    });
</script>
<!-- svelte-ignore a11y-no-onchange -->
<select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change use:blurAction>
    {#each options as option, index}
    <option value="{option}" selected={option.id === selected.id}>{(option.proj4 && mapContainsOfp(option)) ? `${option.label.toUpperCase()}`: option.label}</option>
    {/each}
</select>

<style>
    select.form-control {
        width: auto;
        font-size: small;
        left: 5px;
        top:5px;
        display: inline;
    }
</style>