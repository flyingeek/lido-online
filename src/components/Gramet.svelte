<script>
    import {position, simulate} from '../stores';
    import SimulatorPlayer from './SimulatorPlayer.svelte';
    import { fly } from "svelte/transition";
    import {setGramet, setHeight} from '../actions/grametAction';
    const maxHeight = 370;
</script>

<div class="pinch-zoom-parent" transition:fly="{{y: maxHeight}}" data-max-height={maxHeight} use:setHeight>
    <pinch-zoom use:setGramet={{pos: $position.gramet, fl: $position.fl}} min-scale="0.3"></pinch-zoom>
    <svg><use xlink:href="#plane-symbol"/></svg>
    <!-- {#if (($flightProgress === 0 || $flightProgress === 100) && ogimetParams.get('tref') * 1000 > $ofp.infos.ofpOFF.getTime())}
        <div class="warning">GRAMET pour décollage maintenant</div>
    {/if} -->
    {#if (($position.gramet === 0 || $position.gramet === 100 || $simulate>=0))}
        <SimulatorPlayer/>
    {/if}
</div>

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
        width: 40px;
        height: 40px;
        top:60px;
        left: 0;
        fill: var(--plane-color);
    }
    /* .warning {
        position: absolute;
        z-index: 10;
        top: 10px;
        color: white;
        background-color: var(--warning);
        padding: 5px;
        left: 10px;
    } */
    div :global(label) {
        position: absolute;
        color: var(--plane-color);
        top: 0px;
        left: 5px;
        font-size: 45px;
        -webkit-text-stroke-width: 3px;
        -webkit-text-stroke-color: black;
    }
</style>