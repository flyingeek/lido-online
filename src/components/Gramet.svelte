<script>
    import {showGramet, grametPosition, ofp} from '../stores';
    import { fly } from "svelte/transition";
    import {setGramet, setHeight} from '../actions/grametAction';
    const ogimetParams = (!$ofp.isFake) ? (new URL($ofp.ogimetData.url)).searchParams : {};
    const maxHeight = 370;
    if(!$ofp.isFake){
        const takeOff = $ofp.infos.datetime2;
        const landing = $ofp.infos.datetime2;
        const duration = $ofp.infos.duration;
        landing.setMinutes(takeOff.getMinutes() + duration[1]);
        landing.setHours(takeOff.getHours() + duration[0]);
        const now = new Date();
        if (now < takeOff) {
            $grametPosition = 0;
        } else if (now > landing) {
            $grametPosition = 100;
        } else {
            $grametPosition = (now - takeOff) / (duration[0] * 3600 + duration[1] * 60) / 1000;
        }
        //console.log($ofp.infos.datetime2, new Date(), $ofp.infos.duration)
    }
</script>

{#if $showGramet}
    <div class="pinch-zoom-parent" transition:fly="{{y: maxHeight}}" data-max-height={maxHeight} use:setHeight>
        <pinch-zoom use:setGramet={{pos: $grametPosition, fl: ogimetParams.get('fl')}} min-scale="0.3"></pinch-zoom>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">

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
        width: 10px;
        top:60px;
        left: 0;
        fill: var(--plane-color);
    }
</style>