<script>
    import { fade } from "svelte/transition";
    export let hidden=undefined;
    export let maxWidth=undefined;
    const fadeif = (node, animation, params) => {
        if(hidden === undefined) {
            return fade(node, animation, params);
        }
    }
</script>

<page in:fadeif style="{(maxWidth) ? `max-width: ${maxWidth}; align-self: center;` : ``}" class:fadein={hidden===false} class:d-none={hidden===true}>
    <slot></slot>
</page>

<style>
    page {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        position: relative;
    }
    :global(page.fadein) {
        display: flex;
        animation: fade 0.4s linear;
    }
    @keyframes fade {
        0%   {opacity: 0}
        100% {opacity: 100}
    }
</style>