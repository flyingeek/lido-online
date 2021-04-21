<script>
    /* global editolido */
    import options from './mapboxgl/mapOptions';
    import blurAction from '../actions/blurAction';
    import {onMount} from 'svelte';
    export let name = 'map-style';
    export let ofp;
    export let selected = options[0];
    let autoSelectedId = selected.id;
    const authorizedOptions = (!ofp.isFake) ? options : options.filter(o => (!o.id.startsWith('vb_') && o.id !== 'jb_theworld'));

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
        if (selected.id === options[0].id && ofp && !ofp.isFake) {
            const dep = ofp.route.points[0];
            const dest = ofp.route.points[ofp.route.points.length - 1];
            const cbMapOption = options.find(o => o.id === 'vb_2020');
            const northOption = options.find(o => o.id === 'jb_north');
            if (isInBounds(cbMapOption, dep, dest)){
                selected = cbMapOption;
            }else if (dep.distanceTo(dest, editolido.rad_to_nm) <=1500){
                //pass (mercator)
            }else if (dest.latitude > 30 && dep.latitude > 30){
                selected = northOption;
            }else if (dest.longitude < -80 && dep.longitude < -80) {
                selected = options.find(o => o.id === 'jb_pacific');
            }else if ((dest.latitude > 30 || dep.latitude > 30) && isInBounds(northOption, dep, dest)) {
                selected = northOption;
            }else{
                selected = options.find(o => o.id === 'jb_south');
            }
        }
        autoSelectedId = selected.id;
    });
</script>
<!-- svelte-ignore a11y-no-onchange -->
<select name="{name}" bind:value={selected} class="form-control form-control-sm" on:change use:blurAction>
    {#each authorizedOptions as option, index}
    <option value="{option}" selected={option.id === selected.id}>{(option.id === autoSelectedId) ? `${option.label.toUpperCase()}`: option.label}</option>
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