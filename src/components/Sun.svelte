<script context="module">
    import {derived} from "svelte/store";
    import Overlay from "svelte-overlay";
    import {slide} from "svelte/transition";
    import {sun, moon} from "./suncalc";
    import {ofp, takeOffTime, landingTime} from "../stores";

    function* iterateSegment({prev, next, takeOffTime, segmentLength, getState, stateMap, increment=30000 /* 30sec */}){
        let prevState = prev.state;
        const min2ms = 60000;
        const lowerLimit = prev.sum * min2ms;
        const upperLimit = next.sum * min2ms; 
        for(let m = lowerLimit + increment; m <= upperLimit; m= m + increment){
            let fl = prev.fl;
            if (m >= upperLimit) fl = next.fl;
            const date = new Date(takeOffTime + m);
            let pos;
            const segmentTime = upperLimit - lowerLimit;
            if (segmentTime === 0) {
                pos = next.p;
            }else{
                const fraction = (m - lowerLimit) / segmentTime;
                pos = prev.p.atFraction(next.p, fraction, segmentLength);
            }
            const [state] = getState({date, latitude:pos.latitude, longitude:pos.longitude}, fl);
            if (state !== prevState) {
                //const nightKp = (['night', 'astronomicalDusk', 'astronomicalDawn', 'nauticalDusk'].includes(type)) ? minKp : 100;
                const type =  stateMap.get(prevState)([prevState, state]);
                yield({position: pos, type, date, fl});
                if (state === next.state) break;
            }
            prevState = state;
        }
    }
    const getSolarDefault = () => {
        return {[moon.name]: [], [sun.name]: []};
    };
    export const solar = derived(
        [ofp, takeOffTime],
        ([$ofp, $takeOffTime]) => {
            if (!$takeOffTime || !$ofp || $ofp.timeMatrix.length === 0) return getSolarDefault();
            const takeOffTime = $takeOffTime.getTime();
            const results = getSolarDefault();
            const timeMatrix = $ofp.timeMatrix;
            const flightTime = timeMatrix[timeMatrix.length - 1][1] * 60000;
            const distanceMatrix = $ofp.distanceMatrix;
            let last = timeMatrix.length - 1;
            for (const object of [sun, moon]) {
                const matrix = [];
                let prev = null;
                for (const [i, [p, sum, level]] of timeMatrix.entries()) {
                    let fl = level;
                    if (i === 0 || i === last) fl = 0;
                    const date = new Date(takeOffTime + sum * 60000);
                    const [state] = object.getState({date, latitude:p.latitude, longitude:p.longitude}, fl);
                    const next = {p, sum, fl, state};
                    if (prev && state !== prev.state) {
                        const segmentLength = distanceMatrix[i][1] - distanceMatrix[i-1][1];
                        const params = {
                            prev, 
                            next, 
                            takeOffTime, 
                            segmentLength, 
                            getState: object.getState, 
                            stateMap: object.stateMap, 
                            increment: (object.name === 'sun') ? 30000 : 60000
                        };
                        for (const data of iterateSegment(params)) {
                            data['relpos'] = Math.round(10000 * (data.date.getTime() - takeOffTime) / flightTime) / 100;
                            matrix.push(data);
                        }
                    }
                    prev = next;
                }
                results[object.name] = matrix;
            }
            //console.log(results);
            return results;
        },
        getSolarDefault() // initial value
    );
</script>
<script>
    import {getMoonIllumination} from "./suncalc";
    const departureState = (ofp) => {
        if (!ofp || !$takeOffTime) return '';
        //TODO departure fl in timeMatrix
        const [point, sum, fl] = ofp.timeMatrix[0];
        return sun.getState({date: $takeOffTime, latitude: point.latitude, longitude: point.longitude}, 0)[0];
    };
    const arrivalState = (ofp) => {
        if (!ofp || !$landingTime) return '';
        //TODO arrival fl in timeMatrix
        const [point, sum, fl] = ofp.timeMatrix[ofp.timeMatrix.length - 1];
        return sun.getState({date: $landingTime, latitude: point.latitude, longitude: point.longitude}, 0)[0];
    };
    const format = (date, withSeconds=false) => {
        if (!date) return (withSeconds) ? '--:--:--' : '--:--';
        if (withSeconds) {
            return date.toJSON().slice(11, 19);
        } else if (date.getUTCSeconds(date) < 30) {
            return date.toJSON().slice(11, 16);
        }
        return (new Date(date.getTime() + 60000)).toJSON().slice(11, 16);
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
    const getMoonIlluminationPercent = () => Math.round(moonIllumination.fraction * 100);
    const getMoonName = () => {
        //https://en.wikipedia.org/wiki/Lunar_phase
        //rounded to the nearest % integer
        const phase = moonIllumination.phase;
        const fraction = getMoonIlluminationPercent();
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
    const getMoonEmoji = () => {
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
    const getWidgetEmoji = (ofp, takeOffTime) => {
        if (!ofp || !takeOffTime) return '🔭';
        const point = ofp.route.points[0];
        let [state] = sun.getState({date: takeOffTime, latitude: point.latitude, longitude: point.longitude});
        if (state === 'day') return '☀️';
        [state] = moon.getState({date: takeOffTime, latitude: point.latitude, longitude: point.longitude});
        if (state||$solar.moon.length>0) return getMoonEmoji();
        return '🔭';
    };
    const getDepartureMoonState = (ofp, takeOffTime) => {
        if (!ofp || !takeOffTime) return '🔭';
        const point = ofp.route.points[0];
        const [state] = moon.getState({date: takeOffTime, latitude: point.latitude, longitude: point.longitude});
        return state;
    };
    const eventColor = (stateOrEvent) => {
        switch(stateOrEvent){
            
            case 'day':
            case 'dayStart':
                return '#89d4ff';
            case 'sunrise end':
            case 'sunsetStart':
            case 'sunriseEnd':
                return 'lightskyblue'; 
            case 'civil twilight':
            case 'sunset':
            case 'sunrise':
                return '#2383C2'
            case 'nautical twilight':
            case 'civilDawn':
            case 'civilDusk':
                return '#0052A2';
            case 'astronomical twilight':
            case 'nauticalDawn':
            case 'nauticalDusk':
                return '#02386E';
            case 'night':
            case 'astronomicalDawn':
            case 'astronomicalDusk':
                return '#000B18';
            default:
                console.error(`#ERREUR ${stateOrEvent}#`);
                return 'red';
        };
    };
    $: sunEvents = $solar.sun.filter(e => ['sunrise', 'sunset'].includes(e.type)).slice(0, 3);
    $: isMoonVisibleDuringFlight = $solar.moon.length > 0 || getDepartureMoonState($ofp, $takeOffTime);
    $: moonIllumination = ($takeOffTime) ? getMoonIllumination($takeOffTime) : {};
    $: widgetEmoji = (sunEvents.length > 0) ? '☀️': getWidgetEmoji($ofp, $takeOffTime); //must be after moonIlluminations

</script>
{#if $ofp && $ofp.timeMatrix.length > 0}
    <Overlay  position="bottom-center" isOpen={false}>
        <div slot="parent" class="sun" let:toggle on:click={toggle}>
            <p class="icon">{widgetEmoji}</p>
            {#if widgetEmoji === '☀️'}
                <div class="details" class:two="{sunEvents.length === 2}" class:three="{sunEvents.length>= 3}">
                    {#each sunEvents as event}
                        <p>{(event.type === 'sunrise') ? '↥' : '↧'} {format(event.date)}</p>
                    {/each}
                </div>
            {:else if widgetEmoji !== '🔭'}
                <div class="details" class:two="{$solar.moon.length === 2}" class:three="{$solar.moon.length>= 3}">
                    {#each $solar.moon.slice(0, 3) as event}
                        <p>{(event.type === 'moonrise') ? '↥' : '↧'} {format(event.date)}</p>
                    {/each}
                </div>
            {/if}
        </div>
        <div slot="content" style="width: 390px; max-width:390px; position:static;" class="popover" let:close in:slide={{ duration: 200 }}>
            <h3 class="popover-header">Éphémérides du vol<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>    
            <div class="popover-body">
                <svg width="100%" height="60px" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="MyGradient">
                            <stop offset="0%"  stop-color="{eventColor(departureState($ofp))}"/>
                            {#each $solar.sun as event}
                                <stop offset="{event.relpos}%"  stop-color="{eventColor(event.type)}"/>
                            {/each}
                            <stop offset="100%"  stop-color="{eventColor(arrivalState($ofp))}"/>
                        </linearGradient>
                    </defs>
                    {#each $solar.sun as event, i}
                        {#if event.type !== 'sunriseEnd' && event.type !== 'sunsetStart'}
                            <line x1="{ 5 + 0.9 * event.relpos}%" y1="30" x2="{5 + 0.9 * event.relpos}%" y2="32" stroke="gray" stroke-width="1"/>
                        {/if}
                        {#if event.type.startsWith('civil')}
                            <circle fill="{(event.type.endsWith('Dawn')) ? '#FCBF49' : '#000B18'}" cx="{ 5 + 0.9 * event.relpos}%" cy="40" r="5"/>
                        {/if}
                    {/each}
                    {#each $solar.moon as event}
                        <line x1="{ 5 + 0.9 * event.relpos}%" y1="18" x2="{5 + 0.9 * event.relpos}%" y2="20" stroke="gray" stroke-width="1"/>
                        <text x="{ 5 + 0.9 * event.relpos}%" y="16" fill="{(event.type==='moonrise') ? '#FCBF49' : '#000B18'}"text-anchor="middle" >☽</text>
                    {/each}
                    <rect fill="url(#MyGradient)" x="5%" y="20" width="90%" height="10px" rx="0"/>
                    <text x="5%" y="56" fill="black"text-anchor="middle" >{format($takeOffTime)}</text>
                    <text x="95%" y="56" fill="black" text-anchor="middle">{format($landingTime)}</text>
                </svg>
                <table class="table">
                    <thead>
                        <tr>
                            <th scope="col">Soleil</th>
                            <th scope="col" class="color"></th><!-- color -->
                            <th scope="col">Heure</th>
                            <th scope="col">FL</th>
                            <!--<th scope="col" class="kp"></th> minKp -->
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar.sun.filter(e => e.type !== 'sunriseEnd' && e.type !== 'sunsetStart') as event}
                        <tr>
                            <td>{nightEventsFR[event.type] || event.type}
                            {#if event.type === 'civilDawn'}
                                <span class="pin pin-day"></span>
                            {:else if event.type === 'civilDusk'}
                                <span class="pin pin-night"></span>
                            {/if}
                            </td>
                            <td class="color {event.type}-color"></td>
                            <td>{format(event.date)}</td>
                            <td>FL{event.fl}</td>
                            <!-- <td class="kp" class:kp-ok={event.nightKp < 99}>{(event.nightKp < 99) ? Math.floor(event.nightKp) : ''}</td> -->
                        </tr>
                        {:else}
                            <tr><td colspan="4">Aucun événement</td></tr>
                        {/each}
                    </tbody>
                    <thead>
                        <tr>
                            <th scope="col" colspan="4" class:border-bottom-0={$solar.moon.length === 0}>Lune {getMoonEmoji()} {getMoonName()} {getMoonIlluminationPercent()}% {(isMoonVisibleDuringFlight) ? '' : 'non visible'}</th>
                            <!--<th scope="col" class="kp"></th> minKp -->
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar.moon as event}
                        <tr>
                            <td>{nightEventsFR[event.type] || event.type} <span class:moonrise={event.type==='moonrise'}>☽</span></td>
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
    .sun, .details {
        display: none;
    }
    .sun {
        margin-right: 2em;
    }
    @media (min-width: 1024px){
        .sun, .details {
            display: flex;
        }
    }
    .details{
        flex-direction: column;
    }
    .sun p {
        margin: 0;
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
    .moonrise {
        color: #FCBF49;
    }
    /* .table .kp {
        width: 1em;
        padding-left: 0;
        padding-right: 0;
        text-align: center;
    }
    .kp-ok {
        background-color: green;
        color: white;
        transform: translateY(-50%);
    } */
</style>