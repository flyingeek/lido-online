<script>
    import {kpColor} from "./KpUpdater.svelte";
    import SunTimeLine, {format} from "./SunTimeLine.svelte";
    import KpTimeLine from "./KpTimeLine.svelte";
    import Moon, {getMoonEmoji, getMoonName, getMoonIlluminationPercent} from "./Moon.svelte";
    import {moonState, getMoonIllumination, sunStateAndRising} from "./suncalc";
    import {ofp, takeOffTime, landingTime, position} from "../stores";
    import {solar} from "./solarstore";

    export let departureSun;

    $: arrivalSun = ($ofp && $landingTime) ? sunStateAndRising($landingTime, $ofp.arrival, 0) : '';
    $: isMoonVisible = ($position && estimatedDate) ? moonState(estimatedDate, $position.map, $position.fl).state : '';
    $: estimatedDate = ($takeOffTime && $position) ? new Date($takeOffTime.getTime() + $position.reltime * 60000) : $takeOffTime;
    $: moonIllumination = (estimatedDate) ? getMoonIllumination(estimatedDate) : {};
    $: moonEmoji = getMoonEmoji(moonIllumination);

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
    const _ = (t) =>  nightEventsFR[t] || t;
</script>   
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
            {#each $solar.sun.filter(e => ['sunrise', 'sunset', 'civilDawn', 'civilDusk', 'nauticalDawn', 'nauticalDusk'].includes(e.type)) as event, i}
            <tr>
                {#if event.fl !== 0}
                    <td>{_(event.type)}
                        {#if event.type.startsWith('civil')}
                            <span class:rise={event.type==='civilDawn'}>✹</span>
                        {/if}
                    </td>
                    <td class="color {event.type}-color"></td>
                    <td>{format(event.date)}</td>
                    <td>FL{event.fl}</td>
                {:else if i===0}
                    <td colspan="4">{_(event.type)} en montée
                        {#if event.type.startsWith('civil')}
                            <span class:rise={event.type==='civilDawn'}>✹</span>
                        {/if}
                    </td>
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
                <th scope="col" colspan="4">
                    Lune <Moon date={estimatedDate} position={$position.map}>{moonEmoji}</Moon> {getMoonName(moonIllumination)} {getMoonIlluminationPercent(moonIllumination)}% {(isMoonVisible) ? '' : 'non visible'}
                </th>
            </tr>
        </thead>
        <tbody>
            {#each $solar.moon as event, i}
            <tr>
                {#if event.fl !== 0}
                    <td>{_(event.type)} <Moon position={event.position} type={event.type} date={event.date}>{moonEmoji}</Moon></td>
                    <td class="color"></td>
                    <td>{format(event.date)}</td>
                    <td>FL{event.fl}</td>
                {:else}
                    <td colspan="4">{_(event.type)} en {(i === 0) ? 'montée' : 'descente'} <Moon position={event.position} type={event.type} date={event.date}>{moonEmoji}</Moon></td>
                {/if}
            </tr>
            {:else}
                <tr><td colspan="4">Aucun événement</td></tr>
            {/each}
        </tbody>
        <thead>
            <tr>
                <th scope="col" colspan="4" class="kp">Prévisions de Kp
                    <svg width="150px" height="13px" xmlns="http://www.w3.org/2000/svg">
                        {#each [0, 1, 2 ,3, 4, 5, 6, 7, 8, 9] as data}
                        <rect stroke="{kpColor(data)}" stroke-width="1" fill="transparent"
                            x="{2 + data * 15}"
                            y="2"
                            width="12"
                            height="12"/>
                            <text fill="gray"text-anchor="middle" font-size="0.7em"
                                x="{8 + data * 15}"
                                y="11.5">{data}</text>
                    {/each}
                    </svg>
                </th>
            </tr>
        </thead>
    </table>
    <KpTimeLine/>
</div>
<style>
    .table th {
        border-top: none;
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
    .moon {
        display: inline-block;
        transform-origin: center;
    }
    .rise {
        color: #FCBF49;
    }
    th[scope=col]{
        padding-bottom: 5px;
    }
    th.kp {
        position: relative;
    }
    th.kp svg{
        right: 5%;
        position: absolute;
        bottom: 0;
    }
</style>