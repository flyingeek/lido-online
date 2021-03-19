<script>
    import {simulate} from '../stores';
    export let name = "simulator";
    let input;
    const toggle = () => {
        input.checked = !input.checked
        $simulate = (input.checked) ? 0 : -1;
    }
</script>

<!-- <input bind:value={$fl} type="range" min=200 max=450 step=1/>{$fl} -->
<!-- <input bind:value={$grametPosition} type="range" min=0 max=100 step=1/> -->
<label for="{name}" on:click={toggle}>{($simulate >= 0) ? '◼︎' :'▶︎'}
<input bind:this={input} name="{name}" type="checkbox" checked={$simulate>=0} on:change={toggle}>
</label>
<style>
    input{
        display: none;
    }
    label{
        margin-right: 1rem;
        font-size: large;
        font-family: monospace;
    }
</style>