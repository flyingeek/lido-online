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
    export const solar = derived(
        [ofp, takeOffTime],
        ([$ofp, $takeOffTime]) => {
            if (!$takeOffTime || !$ofp || $ofp.timeMatrix.length === 0) return [];
            const takeOffTime = $takeOffTime.getTime();
            const results = {};
            const timeMatrix = $ofp.timeMatrix;
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
        {} // initial value
    );
</script>
<script>
    import {sunAzEl, getMoonIllumination} from "./suncalc";
    const stateAsText = (date, point, fl=0) => {
        const [state, elevation] = sun.getState({date, latitude: point.latitude, longitude: point.longitude});
        if (state === 'day') {
            return  'de jour';
        } else if (state === 'night') {
            return 'de nuit';
        } else {
            // rising or descending ?
            const later = new Date(date.getTime() + 60000); // 1mn later
            const laterElevation = sunAzEl({date: later, latitude: point.latitude, longitude: point.longitude}).elevation;
            const isRising = laterElevation > elevation;
            if (state === 'astronomical twilight') {
                return (isRising) ? "durant l'aube astronomique" : "durant le crépuscule astronomique";
            }else if (state === 'nautical twilight') {
                return (isRising) ? "durant l'aube nautique" : "durant le crépuscule nautique";
            }else if (state === 'civil twilight') {
                return (isRising) ? "durant l'aube civile" : "durant le crépuscule civil";
            }
        }
        return `#ERREUR ${state}#`;
    };
    const departureText = (ofp, takeOffTime) => {
        if (!ofp || !takeOffTime) return '';
        const departure = ofp.route.points[0];
        return stateAsText(takeOffTime, departure);
    };
    const arrivalText = (ofp, landingTime) => {
        if (!ofp || !takeOffTime) return '';
        const arrival = ofp.route.points[ofp.route.points.length - 1];
        return stateAsText(landingTime, arrival);
    };
    const format = (date, withSeconds=false) => {
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
        const [state, elevation] = sun.getState({date: takeOffTime, latitude: point.latitude, longitude: point.longitude});
        if (state === 'day') return '☀️';
        return getMoonEmoji();
    };

    $: sunEvents = ($solar.sun) ? $solar.sun.filter(e => ['sunrise', 'sunset'].includes(e.type)).slice(0, 3) : [];
    $: moonEvents = ($solar.moon) ? $solar.moon.slice(0, 3) : [];
    $: moonIllumination = ($takeOffTime) ? getMoonIllumination($takeOffTime) : {};
    $: widgetEmoji = (sunEvents.length > 0) ? '☀️': getWidgetEmoji($ofp, $takeOffTime); //must be after moonIllumination

</script>
{#if $solar.sun && $solar.moon && $ofp && $ofp.timeMatrix.length > 0}
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
                <div class="details" class:two="{moonEvents.length === 2}" class:three="{moonEvents.length>= 3}">
                    {#each moonEvents as event}
                        <p>{(event.type === 'moonrise') ? '↥' : '↧'} {format(event.date)}</p>
                    {/each}
                </div>
            {/if}
        </div>
        <div slot="content" style="width: 390px; max-width:390px; position:static;" class="popover" let:close in:slide={{ duration: 200 }}>
            <h3 class="popover-header">Éphémérides du vol<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>    
            <div class="popover-body">
                <p>Décollage {departureText($ofp, $takeOffTime)} à {$takeOffTime.toJSON().slice(11, 16)}z</p>
                <table class="table">
                    {#if ($solar.sun.length > 0)}
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
                            {#each $solar.sun as event}
                            <tr>
                                <td>{nightEventsFR[event.type] || event.type}</td>
                                <td class="color {event.type}-color"></td>
                                <td>{format(event.date)}</td>
                                <td>FL{event.fl}</td>
                                <!-- <td class="kp" class:kp-ok={event.nightKp < 99}>{(event.nightKp < 99) ? Math.floor(event.nightKp) : ''}</td> -->
                            </tr>
                            {/each}
                        </tbody>
                    {/if}

                    <thead>
                        <tr>
                            <th scope="col" colspan="4" class:border-bottom-0={$solar.moon.length === 0}>Lune {getMoonEmoji()} {getMoonName()} {getMoonIlluminationPercent()}%</th>
                            <!--<th scope="col" class="kp"></th> minKp -->
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar.moon as event}
                        <tr>
                            <td>{nightEventsFR[event.type] || event.type}</td>
                            <td class="color"></td>
                            <td>{format(event.date)}</td>
                            <td>FL{event.fl}</td>
                            <!-- <td class="kp" class:kp-ok={event.nightKp < 99}>{(event.nightKp < 99) ? Math.floor(event.nightKp) : ''}</td> -->
                        </tr>
                        {/each}
                    </tbody>

                </table>
                <p>Atterrissage {arrivalText($ofp, $landingTime)} à {$landingTime.toJSON().slice(11, 16)}z</p>
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
    p ~ table {
    margin-top: -0.75rem;
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