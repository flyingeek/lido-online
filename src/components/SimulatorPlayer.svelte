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
<label for="{name}" on:click={toggle} class:btn-simulator-play={$simulate < 0} class:btn-simulator-stop={$simulate >= 0}>
<input bind:this={input} name="{name}" type="checkbox" checked={$simulate>=0} on:change={toggle}>
</label>
<style>
    input{
        display: none;
    }
    label{
        position: absolute;
        top: 0;
        left: 5px;
        font-size: 45px;
    }
    :global(.btn-simulator-play), :global(.btn-simulator-stop){
        --stroke-width: 3px;
    }
    :global(.btn-simulator-play)::before, :global(.btn-simulator-stop)::before {
        color: var(--plane-color);
        -webkit-text-stroke-width: var(--stroke-width);
        -webkit-text-stroke-color: black;
        font-family: monospace;
    }
    :global(.btn-simulator-play)::before {
        content:"▶︎";
    }
    :global(.btn-simulator-stop)::before {
        content:"◼︎";
    }
</style>