<script context="module">
    import {derived} from "svelte/store";
    import Overlay from "svelte-overlay";
    import {slide} from "svelte/transition";
    import {sunElevation, nightState, nightEvents, nightEventNames, isRising} from "./suncalc";
    import {ofp, takeOffTime, landingTime} from "../stores";

    export const solar = derived(
        [ofp, takeOffTime],
        ([$ofp, $takeOffTime]) => {
            if (!$takeOffTime || !$ofp) return [];
            const solarMatrix = [];
            const timeMatrix = $ofp.timeMatrix;
            if (timeMatrix.length === 0) return [];
            const distanceMatrix = $ofp.distanceMatrix;
            let last = timeMatrix.length - 1;
            let previousState = null;
            let previousEntry = null;
            let maxLatitude = -90;
            for (const [i, [p, sum, level]] of timeMatrix.entries()) {
                let fl = level;
                if (i === 0 || i === last) fl = 0;
                const date = new Date($takeOffTime);
                date.setUTCMinutes(date.getUTCMinutes() + sum);
                const elevation = sunElevation({date, latitude:p.latitude, longitude:p.longitude});
                const daylightState = nightState(elevation, fl);
                const segmentLength = (i === last) ? null : distanceMatrix[i+1][1] - distanceMatrix[i][1];
                if (p.latitude >= maxLatitude) maxLatitude = p.latitude
                const entry = [p, sum, fl, daylightState, segmentLength, elevation, date, maxLatitude, editolido.rad_to_nm(segmentLength)];
                if (daylightState !== previousState && previousState !== null) {
                    if (previousEntry) solarMatrix.push(previousEntry);
                    solarMatrix.push(entry);
                    previousEntry = null; // do not push the same twice
                    maxLatitude = -90;
                }else{
                    previousEntry = entry;
                }
                previousState = daylightState;
            }
            last = solarMatrix.length - 1;
            //console.log(solarMatrix);
            const data = [];
            for (const [i, [p, sum, level, daylightState, segmentLength, elevation]] of solarMatrix.entries()) {
                const increment = 1;
                if (i < last) {
                    if (solarMatrix[i+1][3] !== daylightState) {
                        let prevState = daylightState;
                        for(let m = sum + increment; m<=solarMatrix[i+1][1]; m= m + increment){
                            const type = (isRising(prevState, solarMatrix[i+1][3])) ? nightEvents[prevState][0] : nightEvents[prevState][1];
                            let fl = level;
                            if (m >= solarMatrix[i+1][1]) fl = solarMatrix[i+1][2];
                            const date = new Date($takeOffTime);
                            date.setUTCMinutes(date.getUTCMinutes() + m);
                            let pos;
                            const segmentTime = solarMatrix[i+1][1] - sum;
                            if (segmentTime === 0) {
                                pos = solarMatrix[i+1][0];
                            }else{
                                const fraction = (m - sum) / segmentTime;
                                pos = p.atFraction(solarMatrix[i+1][0], fraction, segmentLength)
                            }
                            const elev = sunElevation({date, latitude:pos.latitude, longitude:pos.longitude});
                            const state = nightState(elev, fl);
                            //console.log(elev, state);
                            if (state !== prevState) {
                                //console.log(1.15 * Math.sqrt(fl * 100) / 60);
                                //console.log(p, elev);
                                data.push({position: pos, type, date, elevation: elev, fl});
                                prevState = state;
                                if (state === solarMatrix[i+1][3]) break;
                            }
                        }
                    }
                } 
            }
            //console.log(data);
            return data;
        },
        [] // initial value
    );
    const stateNameWithPrefix = (date, point) => {
        const elevation = sunElevation({date, latitude: point.latitude, longitude: point.longitude});
        const state = nightState(sunElevation({date, latitude: point.latitude, longitude: point.longitude}));

        if (state === 'day') {
            return  'de jour';
        } else if (state === 'night') {
            return 'de nuit';
        } else {
            // rising or descending ?
            const later = new Date(date);
            later.setUTCMinutes(later.getUTCMinutes() + 10);
            const laterElevation = sunElevation({date: later, latitude: point.latitude, longitude: point.longitude});
            const isRising = laterElevation > elevation;
            if (state === 'astronomical twilight') {
                return (isRising) ? "à l'aube astronomique" : "durant le crépuscule astronomique";
            }else if (state === 'nautical twilight') {
                return (isRising) ? "à l'aube nautique" : "durant le crépuscule nautique";
            }else if (state === 'civil twilight') {
                return (isRising) ? "à l'aube civile" : "durant le crépuscule civil";
            }
        }
        return `#ERREUR ${state}#`;
    }
    const departureState = (ofp, takeOffTime) => {
        if (!ofp || !takeOffTime) return '';
        const departure = ofp.route.points[0];
        return stateNameWithPrefix(takeOffTime, departure);
    }
    const arrivalState = (ofp, landingTime) => {
        if (!ofp || !takeOffTime) return '';
        const arrival = ofp.route.points[ofp.route.points.length - 1];
        return stateNameWithPrefix(landingTime, arrival);
    }
</script>
<script>
    $: events = $solar.filter(e => ['sunrise', 'sunset'].includes(e.type)).slice(0, 3);
</script>
{#if $solar.length > 0 && $ofp && $ofp.timeMatrix.length > 0}
    <Overlay  position="bottom-center" isOpen={false}>
        <div slot="parent" class="sun" let:toggle on:click={toggle}>
            <p class="icon">☀</p>
            <div class="details" class:two="{events.length === 2}" class:three="{events.length>= 3}">
                {#each events as event}
                    <p>{(event.type === 'sunrise') ? '↥' : '↧'} {event.date.toJSON().slice(11, 16)}</p>
                {/each}
            </div>
        </div>
        <div slot="content" style="width: 390px; max-width:390px; position:static;" class="popover" let:close in:slide={{ duration: 200 }}>
            <h3 class="popover-header">Éphéméride du vol<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>    
            <div class="popover-body">
                <p>Décollage {departureState($ofp, $takeOffTime)} à {$takeOffTime.toJSON().slice(11, 16)}z</p>
                <table class="table">
                    <thead>
                        <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Heure</th>
                        <th scope="col">FL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each $solar as event}
                        <tr>
                            <td>{nightEventNames[event.type]}</td>
                            <td>{event.date.toJSON().slice(11, 16)}</td>
                            <td>FL{event.fl}</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
                <p>Atterrissage {arrivalState($ofp, $landingTime)} à {$landingTime.toJSON().slice(11, 16)}z</p>
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
</style>