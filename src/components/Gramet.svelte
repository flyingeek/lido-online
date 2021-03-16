<script>
    import {showGramet} from '../stores';
    import { fly } from "svelte/transition";
    import {grametWidth, setGramet, setHeight} from '../actions/grametAction';
</script>

{#if $showGramet}
    <div class="pinch-zoom-parent" width="{$grametWidth}" transition:fly="{{y: 380}}" use:setHeight={$grametWidth}>
        <pinch-zoom use:setGramet min-scale="0.3"></pinch-zoom>
    </div>
{/if}
<style>
    pinch-zoom{
        max-height: var(--gramet-inner-height);
    }
    .pinch-zoom-parent{
        /*height:var(--gramet-inner-height);
        min-height: var(--gramet-inner-height);*/
        width: 100%;
        position:absolute;
        bottom: -10px;
        left:50%;
        transform: translateX(-50%);
        background-color: rgba(255,255,255,0.6);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='50px' width='120px'><text x='0' y='15' fill='white' font-size='10'>GRAMET</text></svg>");
    }
</style>