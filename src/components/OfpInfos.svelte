<script>
    import {slide} from "svelte/transition";
    import Overlay from "svelte-overlay";
    import { focusMap } from "./utils";
    import {ofp} from '../stores';
    import PluginMenu from "./PluginMenu.svelte";

    $: fuelMarginTime = $ofp.infos.minFuelMarginETOPS / ($ofp.infos.tripFuel/$ofp.infos.flightTime);

</script>

<div class="infos">
    {#if (fuelMarginTime < 20)}<p class="etops">ETOPS</p>{/if}
    <Overlay  position="bottom-center" isOpen={false} on:close={focusMap} closeOnClickOutside>
    <a  href="#top" slot="parent" class="details cursor-pointer" let:toggle on:click|preventDefault={toggle}>
        <p><b>{$ofp.infos.flightNo}</b> {$ofp.infos.depICAO}-{$ofp.infos.destICAO}</p>
        <p>{$ofp.infos.ofpTextDate} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}
        <span class="plugin">🧩</span>
        </p>
    </a>
    <div slot="content" style="cursor: pointer; width: 190px" class="menu" let:close in:slide={{ duration: 200 }}>
        <PluginMenu close={close}/>
    </div>
    </Overlay>
</div>
<div class="pluginonly">
    {#if (fuelMarginTime < 20)}<p class="etops">ETOPS</p>{/if}
    <Overlay  position="bottom-center" isOpen={false} on:close={focusMap} closeOnClickOutside>
        <a slot="parent" class="details cursor-pointer" href="#top" let:toggle on:click|preventDefault={toggle}>
            <span class="plugin">🧩</span>
        </a>
        <div slot="content" style="cursor: pointer; width: 190px; translate: -50%;" class="menu" let:close in:slide={{ duration: 200 }}>
            <PluginMenu close={close} addInfos=true/>
        </div>
    </Overlay>
</div>
<style>
    .infos, .pluginonly{
        font-size: small;
        flex-direction: row;
        max-height: 38px;
        cursor: none;
        align-items: center;
        white-space: nowrap;
    }
    :global(.map .pluginonly){
        display: flex;
    }
    :global(.map .infos) {
        display: none;
    }
    @media (max-width: 499px){
        :global(.map .infos) {
            display: none !important;
        }
        :global(.map .pluginonly) {
            display: flex !important;
        }
    }
    .pluginonly{
        display: none;
        margin-right: 0.5rem;
    }
    .infos{
        display: flex;
        margin-right: 1rem;
    }
    .details{
        display: flex;
        flex-direction: column;
        color: inherit;
        cursor: default;
        -webkit-transition : -webkit-filter 0 linear;
        transition : filter 0 linear;
        filter: brightness(1);
    }
    .details, .details:hover{
        text-decoration: none;
    }
    @media (min-width: 500px){
        .infos {
            display: flex;
        }
        .pluginonly {
            display: none;
        }
    }
    p{
        margin:0
    }
    .cursor-pointer{
        cursor: pointer !important;
    }
    :global(.etops){
        writing-mode: vertical-rl;
        text-orientation: upright;
        font-size: 6px;
        margin-right: 5px;
        margin-left: -1em;
        font-weight: 700;
        background-color: var(--bs-warning);
    }
    .plugin {
        width:20px;
        height: 20px;
        vertical-align: bottom;
        -webkit-transition : transform 0 linear;
        transition : transform 0 linear;
        display: inline-block;
    }
    :global(.details.animate) .plugin {
        transform: rotate(360deg);
        -webkit-transform: rotate(360deg);
        -webkit-transition : transform 0.5s linear;
        transition : transform 0.5s linear;
    }
    :global(.details.animate) {
        -webkit-transition : -webkit-filter 0.1s linear;
        transition : filter 0.1s linear;
        -webkit-filter: brightness(0.8);
        filter: brightness(0.8);
    }
    @keyframes flash {
    0%   {
        filter: brightness(1);
        -webkit-filter: brightness(1);
    }
    50%  {
        filter: brightness(0.6);
        -webkit-filter: brightness(0.6);
    }
    100% {
        filter: brightness(1);
        -webkit-filter: brightness(1);
    }
}
</style>
