<script>
    import {slide} from "svelte/transition";
    import Overlay from "svelte-overlay";
    import KpUpdater, {aurora} from "./KpUpdater.svelte";
    import SunTimeLine, {format} from "./SunTimeLine.svelte";
    import {sun, moon, getMoonIllumination, sunStateAndRising} from "./suncalc";
    import {ofp, takeOffTime, landingTime} from "../stores";
    import {solar} from "./solarstore";

    const stateAsText = (point, date, {state, isRising}) => {
        if (!point || !date) return '';
        if (state === 'day' || state === 'sunrise end') {
            return  'de jour';
        } else if (state === 'night' || state === 'astronomical twilight') {
            return 'de nuit';
        } else if (state === 'nautical twilight') {
            return (isRising) ? "durant l'aube nautique" : "durant le crépuscule nautique";
        }else if (state === 'civil twilight') {
            return (isRising) ? "durant l'aube civile" : "durant le crépuscule civil";
        }
        return `#ERREUR ${state}#`;
    };

    const nightEventsFR = {
        'astronomicalDawn': 'Aube astronomique',
        'astronomicalDusk': 'Nuit astronomique',
        'nauticalDawn': 'Aube nautique',
        'nauticalDusk': 'Nuit nautique',
        'civilDawn': 'Aube civile',
        'civilDusk': 'Nuit civile',
        'sunrise': 'Lever du soleil',
        'sunset': 'Coucher du soleil',
        'day': 'Jour',
        'night': 'Nuit',
        'moonrise': 'Lever de lune',
        'moonset': 'Coucher de lune'
    };
    const getMoonIlluminationPercent = (moonIllumination) => Math.round(moonIllumination.fraction * 100);
    const getMoonName = (moonIllumination) => {
        //https://en.wikipedia.org/wiki/Lunar_phase
        //rounded to the nearest % integer
        const phase = moonIllumination.phase;
        const fraction = getMoonIlluminationPercent(moonIllumination);
        if(fraction <= 0) {
            return 'Nouvelle lune';
        }else if (phase < 0.5 && fraction < 50) {
            return 'Premier croissant';
        }else if (phase < 0.5 && fraction === 50) {
            return 'Premier quartier';
        }else if ((phase < 0.5 && fraction < 100)){
            return 'Gibbeuse croissante';
        }else if (fraction === 100){
            return 'Pleine Lune';
        }else if (phase >= 0.5 && fraction > 50){
            return 'Gibbeuse décroissante';
        }else if (phase >= 0.5 && fraction === 50){
            return 'Dernier quartier';
        }else{
            return 'Dernier croissant';
        }
    };
    const getMoonEmoji = (moonIllumination) => {
        //https://fr.wikipedia.org/wiki/Phase_de_la_Lune
        const phase = moonIllumination.phase;
        const fraction = moonIllumination.fraction;
        if (!phase || !fraction) return "☽";
        if(fraction <= 0.02) {
            return '🌑';
        }else if (phase < 0.5 && fraction <= 0.34){
            return '🌒';
        }else if (phase < 0.5 && fraction <= 0.65){
            return '🌓';
        }else if (phase < 0.5 && fraction < 0.97){
            return '🌔';
        }else if (fraction >= 0.97){
            return '🌕';
        }else if (phase >= 0.5 && fraction > 0.65){
            return '🌖';
        }else if (phase >= 0.5 && fraction > 0.34){
            return '🌗';
        }else{
            return '🌘';
        }
    };
    const getWidgetEmojiWhenNoSunEvent = (departureSun, departureMoon, moonIllumination) => {
        if (departureSun.state === 'day') return '☀️';
        if (departureMoon.state||$solar.moon.length>0) return getMoonEmoji(moonIllumination);
        return '🔭';
    };

    $: departureSun = ($ofp && $takeOffTime) ? sun.getState($takeOffTime, $ofp.departure, 0) : '';
    $: departureMoon = ($ofp && $takeOffTime) ? moon.getState($takeOffTime, $ofp.departure) : '';
    $: arrivalSun = ($ofp && $landingTime) ? sunStateAndRising($landingTime, $ofp.arrival, 0) : '';
    $: sunEvents = $solar.sun.filter(e => ['sunrise', 'sunset'].includes(e.type));
    $: isMoonVisibleDuringFlight = $solar.moon.length > 0 || departureMoon;
    $: moonIllumination = ($takeOffTime) ? getMoonIllumination($takeOffTime) : {};
    $: widgetEmoji = (sunEvents.length > 0) ? '☀️': getWidgetEmojiWhenNoSunEvent(departureSun, departureMoon, moonIllumination); //after moonIllumination
    $: widgetEvents = (widgetEmoji === '☀️') ? sunEvents : (widgetEmoji === '🔭') ? [] : $solar.moon;

</script>
<KpUpdater/>
{#if $ofp && $ofp.timeMatrix.length > 0}
    <Overlay  position="bottom-center" isOpen={false}>
        <div slot="parent" class="sun" class:aurora={$aurora.length > 0} let:toggle on:click={toggle}>
            <p class="icon">{widgetEmoji}</p>
            <div class="details" class:two="{widgetEvents.length === 2}" class:three="{widgetEvents.length>= 3}">
                {#each widgetEvents.slice(0, 3) as event}
                    <p>{(event.type.includes('rise')) ? '↥' : '↧'} {format(event.date)}</p>
                {/each}
            </div>
        </div>
        <div slot="content" style="width: 390px; max-width:390px; position:static;" class="popover" let:close in:slide={{ duration: 200 }}>
            <h3 class="popover-header">Éphémérides du vol<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>    
            <div class="popover-body">
                <SunTimeLine {arrivalSun} {departureSun}/>
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Soleil</th>
                            <th scope="col" class="color"></th>
                            <th scope="col">Heure</th>
                            <th scope="col">FL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar.sun.filter(e => !['sunriseEnd', 'sunsetStart', 'astronomicalDawn', 'astronomicalDusk'].includes(e.type)) as event}
                        <tr>
                            {#if event.fl !== 0}
                                <td>{nightEventsFR[event.type] || event.type}
                                    {#if event.type.startsWith('civil')}
                                        <span class:rise={event.type==='civilDawn'}>✹</span>
                                    {/if}
                                </td>
                                <td class="color {event.type}-color"></td>
                                <td>{format(event.date)}</td>
                                <td>FL{event.fl}</td>
                            {:else}
                                <td colspan="4">Atterrissage {stateAsText($ofp.arrival, $landingTime, arrivalSun)}</td>
                            {/if}
                        </tr>
                        {:else}
                            <tr><td colspan="4">Aucun événement</td></tr>
                        {/each}
                    </tbody>
                    <thead>
                        <tr>
                            <th scope="col" colspan="4" class:border-bottom-0={$solar.moon.length === 0}>
                                Lune {getMoonEmoji(moonIllumination)} {getMoonName(moonIllumination)} {getMoonIlluminationPercent(moonIllumination)}% {(isMoonVisibleDuringFlight) ? '' : 'non visible'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar.moon as event}
                        <tr>
                            <td>{nightEventsFR[event.type] || event.type} <span class:rise={event.type==='moonrise'}>☽</span></td>
                            <td class="color"></td>
                            <td>{format(event.date)}</td>
                            <td>FL{event.fl}</td>
                            <!-- <td class="kp" class:kp-ok={event.nightKp < 99}>{(event.nightKp < 99) ? Math.floor(event.nightKp) : ''}</td> -->
                        </tr>
                        {:else}
                            <tr><td colspan="4">Aucun événement</td></tr>
                        {/each}
                    </tbody>
                </table>
            </div>
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
    .sun.aurora::before{
        content: "";
        position: absolute;
        top: -8px;
        left: -15px;
        width: 50px;
        height: 38px;
        background-image: url(/images/65x70_northern-lights.webp);
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center;
        filter: blur(3px) opacity(40%);
        z-index: -1;
    }
    .details.two p {
        font-size: small;
    }
    .details.three p {
        font-size: xx-small;
    }
    .icon{
        align-self: center;
    }
    .table th {
        border-top: none;
    }
    button.close svg{
        height: 20px;
        width: 20px;
        stroke: black;
        top: -5px;
        position: relative;
        z-index: 2;
    }
    .table th {
        text-align: left;
    }
    .table .color {
        width: 0.75rem;
        padding: 0;
    }
    .table :global(.sunrise-color) {
        background: linear-gradient(#2383C2 0% 50%, lightskyblue 50% 100%);
        border-top-color: #2383C2;
        border-bottom-color: lightskyblue;
    }
    .table :global(.civilDawn-color) {
        background: linear-gradient( #0052A2 0% 50%, #2383C2 50% 100%);
        border-top-color: #0052A2;
        border-bottom-color: #2383C2;
    }
    .table :global(.nauticalDawn-color) {
        background: linear-gradient(#02386E 0% 50%, #0052A2 50% 100%);
        border-top-color: #02386E;
        border-bottom-color: #0052A2;
    }
    .table :global(.astronomicalDawn-color) {
        background: linear-gradient(#000B18 0% 50%, #02386E 50% 100%);
        border-top-color: #000B18;
        border-bottom-color: #02386E;
    }
    .table :global(.astronomicalDusk-color) {
        background: linear-gradient(#02386E 0% 50%, #000B18 50% 100%);
        border-top-color: #02386E;
        border-bottom-color: #000B18;
    }
    .table :global(.nauticalDusk-color) {
        background: linear-gradient(#0052A2 0% 50%, #02386E 50% 100%);
        border-top-color: #0052A2;
        border-bottom-color: darkskyblue;
    }
    .table :global(.civilDusk-color) {
        background: linear-gradient(#2383C2 0% 50%, #0052A2 50% 100%);
        border-top-color: #2383C2;
        border-bottom-color: #0052A2;
    }
    .table :global(.sunset-color) {
        background: linear-gradient(lightskyblue 0% 50%, #2383C2 50% 100%);
        border-top-color: lightskyblue;
        border-bottom-color: #2383C2;
    }
    .pin {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 5px;
        background-color: #000B18;
    }
    .pin-day {
        background-color: #FCBF49;
    }
    .rise {
        color: #FCBF49;
    }
    :global(.overlay .content.bottom-bottom) { /*fix overlay misplacement*/
        left: 50%;
        transform: translateX(-50%);
        top: 100%;
    }

</style>