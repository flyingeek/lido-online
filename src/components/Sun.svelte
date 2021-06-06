<script context="module">
    import {derived} from "svelte/store";
    import {sunElevation, isNight} from "./suncalc";
    import {ofp, takeOffTime} from "../stores";
    export const solar = derived(
        [ofp, takeOffTime],
        ([$ofp, $takeOffTime]) => {
            if (!$takeOffTime || !$ofp) return [];
            const solarMatrix = [];
            const timeMatrix = $ofp.timeMatrix;
            const distanceMatrix = $ofp.distanceMatrix;
            let last = timeMatrix.length - 1;
            let previousState = null;
            let previousEntry = null;
            for (const [i, [p, sum, level]] of timeMatrix.entries()) {
                let fl = level;
                if (i === 0 || i === last) fl = 0;
                const date = new Date($takeOffTime);
                date.setUTCMinutes(date.getUTCMinutes() + sum);
                const elevation = sunElevation({date, latitude:p.latitude, longitude:p.longitude});
                const night = isNight(elevation, fl);
                const segmentLength = (i === 0) ? distanceMatrix[i][1] : distanceMatrix[i][1] - distanceMatrix[i - 1][1];
                const entry = [p, sum, fl, night, segmentLength, date];
                if (night !== previousState && previousState !== null) {
                    if (previousEntry) solarMatrix.push(previousEntry);
                    solarMatrix.push(entry);
                    previousEntry = null; // do not push the same twice
                }else{
                    previousEntry = entry;
                }
                previousState = night;
            }
            last = solarMatrix.length - 1;
            const data = [];
            for (const [i, [p, sum, level, nightState, segmentLength]] of solarMatrix.entries()) {
                const type = (nightState) ? 'sunrise' : 'sunset';
                const increment = 1;
                if (i < last) {
                    if (solarMatrix[i+1][3] !== nightState) {
                        for(let m = sum + increment; m<=solarMatrix[i+1][1]; m= m + increment){
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
                            const elevation = sunElevation({date, latitude:pos.latitude, longitude:pos.longitude});
                            const night = isNight(elevation, fl);
                            if (night !== nightState) {
                                data.push({type, date});
                                break;
                            }
                        }
                    }
                } 
            }
            return data;
        },
        [] // initial value
    );
</script>
<script>
    $: eventCount = $solar.length;
</script>
{#if eventCount > 0}
    <div class="sun">
        <p class="icon">☀</p>
        <div class="details" class:two="{eventCount === 2}" class:three="{eventCount >= 3}">
            {#each $solar.slice(0, 3) as event}
                <p>{(event.type === 'sunrise') ? '↥' : '↧'} {event.date.toJSON().slice(11, 16)}</p>
            {/each}
        </div>
    </div>
{/if}
<style>
    div {
        display: none;
    }
    @media (min-width: 1024px){
        div {
            display: flex;
        }
    }
    .details{
        flex-direction: column;
    }
    p {
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
</style>