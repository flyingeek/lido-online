<script>
    import {slide} from "svelte/transition";
    import Overlay from "svelte-overlay";
    import KpUpdater, {aurora} from "./KpUpdater.svelte";
    import {format} from "./SunTimeLine.svelte";
    import SunPopOver from "./SunPopOver.svelte";
    import Moon, {getMoonEmoji} from "./Moon.svelte";
    import {sun, moon, getMoonIllumination} from "./suncalc";
    import {ofp, takeOffTime, position} from "../stores";
    import {solar} from "./solarstore";

    
    const getWidgetEmojiWhenNoSunEvent = (departureSun, isMoonVisibleDuringFlight) => {
        if (departureSun.state === 'day') return '☀️';
        if (isMoonVisibleDuringFlight) return 'moon';
        return '🔭';
    };

    $: departureSun = ($ofp && $takeOffTime) ? sun.getState($takeOffTime, $ofp.departure, 0) : '';
    $: departureMoon = ($ofp && $takeOffTime) ? moon.getState($takeOffTime, $ofp.departure, 0) : '';
    $: estimatedDate = ($takeOffTime && $position) ? new Date($takeOffTime.getTime() + $position.reltime * 60000) : $takeOffTime  || $ofp.infos.ofpOFF;
    $: sunEvents = $solar.sun.filter(e => ['sunrise', 'sunset'].includes(e.type));
    $: isMoonVisibleDuringFlight = $solar.moon.length > 0 || departureMoon.state;
    $: widgetEmoji = (sunEvents.length > 0) ? '☀️': getWidgetEmojiWhenNoSunEvent(departureSun, isMoonVisibleDuringFlight); //after isMoonVisibleDuringFlight
    $: widgetEvents = (widgetEmoji === '☀️') ? sunEvents : (widgetEmoji === 'moon') ? $solar.moon : [];
    $: moonIllumination = (estimatedDate) ? getMoonIllumination(estimatedDate) : {};
    $: moonEmoji = getMoonEmoji(moonIllumination);

</script>
<KpUpdater/>
{#if $ofp && $ofp.timeMatrix.length > 0}
    <Overlay  position="bottom-center" isOpen={false}>
        <div slot="parent" class="sun" class:aurora={$aurora.length > 0} let:toggle on:click={toggle}>
            <p class="icon">
                {#if (widgetEmoji === 'moon')}
                    <Moon position="{$position.map}" date={estimatedDate}>{moonEmoji}</Moon>
                {:else}
                    {widgetEmoji}
                {/if}
            </p>
            <div class="details" class:two="{widgetEvents.length === 2}" class:three="{widgetEvents.length>= 3}">
                {#each widgetEvents.slice(0, 3) as event}
                    <p>{(event.type.includes('rise')) ? '↥' : '↧'} {format(event.date)}</p>
                {/each}
            </div>
        </div>
        <div slot="content" style="width: 390px;" class="overlay card" let:close in:slide={{ duration: 200 }}>
            <h6 class="card-header">
                <span>Éphémérides du vol</span>
                <button type="button" class="btn-close ms-auto" aria-label="Close" on:click={close}></button></h6>
            <SunPopOver {departureSun} {moonEmoji} {estimatedDate} {moonIllumination}/>
        </div>
    </Overlay>
{/if}
<style>
    .sun {
        cursor: pointer;
        display: none;
        position: relative;
    }
    @media (min-width: 320px){
        .sun {
            display: flex;
        }
    }
    .details{
        flex-direction: column;
        display: none;
    }
    @media (min-width: 1024px){
        .details {
            display: flex;
        }
    }
    .sun p {
        margin: 0;
    }
    .sun.aurora::before, :global(.markdown .aurora::before){
        content: "";
        position: absolute;
        background-image: url(/images/65x70_northern-lights.webp);
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        filter: blur(3px) opacity(40%);
        z-index: -1;
    }
    .sun.aurora::before{
        top: -8px;
        left: -15px;
        width: 50px;
        height: 38px;
    }
    .two p {
        font-size: small;
    }
    .three p {
        font-size: xx-small;
    }
    .icon{
        align-self: center;
    }

    :global(.overlay .content.bottom-bottom) { /*fix overlay misplacement*/
        left: 50%;
        transform: translateX(-50%);
        top: 100%;
    }

</style>