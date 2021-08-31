<script context="module">
    import {debounce} from '../utils.js';
</script>
<script>
    import { createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    export let name;
    export let label;
    export let value;
    export let min = 0.6;
    export let max = 2.0;
    export let step = 0.1;
    export let decimals = 1;

    const debounceDispatch = debounce(dispatch, 100);

    const increment = () => {
        const previousValue = value;
        value = Math.min(Math.max(parseFloat(value) + step, min), max).toFixed(decimals);
        if (value !== previousValue) {
            debounceDispatch('change', {name, value});
        }
    };
    const decrement = () => {
        const previousValue = value;
        value = Math.min(Math.max(parseFloat(value) - step, min), max).toFixed(decimals);
        if (value !== previousValue) {
            debounceDispatch('change', {name, value});
        }
    };

</script>

<div class="input-group input-group-sm mb-2">
    <label for="{name}" class="input-group-text">{label}</label>
    <button class="form-control" type="button" on:click={decrement}><svg><use xlink:href="#zoom-out-symbol"></use></svg></button>
    <div class="form-control">{value}</div>
    <button class="form-control" type="button" on:click={increment}><svg class="zoomin"><use xlink:href="#zoom-in-symbol"></use></svg></button>
</div>
<style>
    div.form-control {
        text-align: center;
        padding-left: 0;
        padding-right: 0;
        flex: 1;
    }
    button.form-control{
        flex: 0 0 3em;
    }
    label {
        width: 5em;
    }
    svg {
        width: 16px;
        height: 16px;
    }
    /* svg.zoomin{
        width: 16px;
        height: 16px;
    } */
</style>
