<script>
    import {showGramet, grametPosition, fl} from '../stores';
    import { fly } from "svelte/transition";
    import {setGramet, setHeight} from '../actions/grametAction';
    export let ofp;
    const ogimetParams = (new URL(ofp.ogimetData.url)).searchParams;

    const maxHeight = 370;
    $fl = ogimetParams.get('fl')
</script>

{#if $showGramet}
    <div class="pinch-zoom-parent" transition:fly="{{y: maxHeight}}" data-max-height={maxHeight} use:setHeight>
        <pinch-zoom use:setGramet={{pos: $grametPosition, fl:$fl}} min-scale="0.3"></pinch-zoom>
        <svg width="10" fill="red" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

            <circle cx="50" cy="50" r="50"/>
          
          </svg>
    </div>
{/if}
<style>
    .pinch-zoom-parent{
        width: 100%;
        position:absolute;
        bottom: -10px;
        left:50%;
        transform: translateX(-50%);
        background-color: rgba(255,255,255,0.6);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='120px' width='120px' ><text transform='rotate(45)' x='20' y='7' fill='lightblue' fill-opacity='0.7' font-size='14'>GRAMET</text></svg>");
    }
    svg {
        position:absolute;
        top:60px;
        left: 0;
    }
</style>