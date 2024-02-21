<script>
    import { fade } from "svelte/transition";
    export let hidden=undefined;
    export let maxWidth=undefined;
    export let width=undefined;
    export let overflowY='auto';
    const fadeif = (node, animation, params) => {
        if(hidden === undefined) {
            return fade(node, animation, params);
        }
    }
</script>

<page in:fadeif style="overflow-y: {overflowY};{(maxWidth) ? `max-width: ${maxWidth}; align-self: center;` : ``}{width ? `width: ${width}; align-self: center;` : ''}" class:fadein={hidden===false} class:d-none={hidden===true}>
    <slot></slot>
</page>

<style>
    page {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        position: relative;
        max-height: var(--max-height-without-navbar);
        overflow-x: hidden;
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
