<script context="module">
    export const format = (date, withSeconds=false) => {
        if (!date) return (withSeconds) ? '--:--:--' : '--:--';
        if (withSeconds) {
            return date.toJSON().slice(11, 19);
        } else if (date.getUTCSeconds(date) < 30) {
            return date.toJSON().slice(11, 16);
        }
        return (new Date(date.getTime() + 60000)).toJSON().slice(11, 16);
    };
    //xpos computes svg x coordinnate using relative position, if a fixed width is given, returns abolute position, else percent
    export const timelineSize = 0.9;
    export const xpos = (rel, fixed) => (fixed) ? `${fixed * (5 + (timelineSize * rel)) / 100}` : `${5 + (timelineSize * rel)}%`;
    export const civilIcon = "✽";
</script>
<script>
    import {aurora, Kp} from "./KpUpdater.svelte";
    import {flightProgress, landingTime, takeOffTime} from "../stores";
    import {solar} from "./solarstore";
    import {getMoonIllumination, getMoonPosition} from "./suncalc.js";



    const eventColor = (stateOrEvent) => {
        switch(stateOrEvent){
            
            case 'day':
            case 'dayStart':
            case 'sunriseEnd':
                return '#89d4ff';
            case 'sunrise end':
            case 'sunsetStart':
            case 'sunrise':
                return 'lightskyblue'; 
            case 'civil twilight':
            case 'sunset':
            case 'civilDawn':
                return '#2383C2'
            case 'nautical twilight':
            case 'nauticalDawn':
            case 'civilDusk':
                return '#0052A2';
            case 'astronomical twilight':
            case 'astronomicalDawn':
            case 'nauticalDusk':
                return '#02386E';
            case 'night':
            case 'astronomicalDusk':
                return '#000B18';
            default:
                if (stateOrEvent) console.error(`#ERREUR ${stateOrEvent}#`);
                return 'red';
        };
    };
    //Safari does not accept transform-origin in inline svg style
    //SVG do not allow transform origin using % unit
    //alternative => bind clientWidth  of the div wrapping the svg
    let svgClientWidth = 364;
    // const moonIconStyle =  (date, point) => { //not yet supported in safari
    //     const mi = getMoonIllumination(date);
    //     const iconOrientationCorrection = 132 * Math.PI / 180;
    //     const oa = mi.angle - getMoonPosition(date, point).parallacticAngle; // observer angle
    //     return `transform: rotate(${ -oa + iconOrientationCorrection}rad);`;
    // }
    const moonIconTransform =  (date, point, x0, y0) => {
        const mi = getMoonIllumination(date);
        const iconOrientationCorrection = 132;
        const oa = mi.angle - getMoonPosition(date, point).parallacticAngle; // observer angle
        return `rotate(${ (-oa * 180 / Math.PI) + iconOrientationCorrection}, ${x0}, ${y0})`;
    }
    export let departureSun;
    export let arrivalSun;
</script>
<div>
    {#if !$Kp}
        <p>Les prédictions de Kp sont indisponibles.</p>
    {/if}
    <div bind:clientWidth={svgClientWidth}><svg width="100%" height="60px" xmlns="http://www.w3.org/2000/svg">
        <!-- <defs>
            <linearGradient id="SunTimeLine">
                <stop offset="0%"  stop-color="{eventColor(departureSun.state)}"/>
                {#each $solar.sun as {type, relpos}}
                    <stop offset="{relpos}%"  stop-color="{eventColor(type)}"/>
                {/each}
                <stop offset="100%"  stop-color="{eventColor(arrivalSun.state)}"/>
            </linearGradient>
        </defs> -->
        <rect
            x="{xpos(0)}"
            width="{timelineSize * 100}%"
            fill="{eventColor(arrivalSun.state)}"
            y="20" height="10px"/>
        {#each $solar.sun as event, i}
            {#if ['sunrise', 'sunset', 'civilDawn', 'civilDusk', 'nauticalDawn', 'nauticalDusk'].includes(event.type)}
                <line stroke="gray" stroke-width="1"
                    x1="{xpos(event.relpos)}"
                    y1="30"
                    x2="{xpos(event.relpos)}"
                    y2="32" />
                {#if (event.type === 'civilDawn' || event.type === 'civilDusk')}
                    <text fill="{(event.type === 'civilDawn') ? '#FCBF49' : '#000B18'}" text-anchor="middle"
                        x="{xpos(event.relpos)}"
                        y="44">{civilIcon}</text>
                {/if}
            {/if}
            {#if (i === 0)}
                <rect 
                    x="{xpos(0)}"
                    width="{timelineSize * (event.relpos)}%"
                    fill="{eventColor(departureSun.state)}"
                    y="20" height="10px"/>
            {:else}
                <rect 
                    x="{xpos($solar.sun[i-1].relpos)}" 
                    width="{timelineSize * (event.relpos - $solar.sun[i-1].relpos)}%"
                    fill="{eventColor($solar.sun[i-1].type)}"
                    y="20" height="10px"/>
            {/if}
        {/each}
        {#each $solar.moon as {type, relpos, date, position}}
            <line stroke="gray" stroke-width="1"
                x1="{xpos(relpos)}"
                y1="18"
                x2="{xpos(relpos)}"
                y2="20" />
            <text fill="{(type==='moonrise') ? '#FCBF49' : 'gray'}" text-anchor="middle" 
                x="{xpos(relpos)}"
                y="16"
                transform="{moonIconTransform(date, position, xpos(relpos, svgClientWidth), 9)}"
                >☾</text>
        {/each}
        {#each $aurora as {period, relpos}}
            <rect stroke="lime" stroke-opacity="60%" fill="transparent" stroke-width="2"
                x="{xpos(relpos[0])}"
                y="18"
                width="{timelineSize * (relpos[1] - relpos[0])}%"
                height="14"/>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos[0] + (relpos[1] - relpos[0]) / 2)}"
                y="15">{format(period[0])}</text>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos[0] + (relpos[1] - relpos[0]) / 2)}"
                y="42">{format(period[1])}</text>
        {/each}
        <circle fill="#FCBF49" stroke="black" stroke-width="0.5"
            cx="{ xpos($flightProgress)}" 
            cy="25" r="2.5" />
        <text fill="black"text-anchor="middle"
            x="5%"
            y="56">{format($takeOffTime)}</text>
        <text fill="black" text-anchor="middle"
            x="95%" 
            y="56">{format($landingTime)}</text>
    </svg></div>
    {#if $aurora.length > 0}
        <div class="aurora-legend"><span>zone favorable aux aurores boréales</span></div>
    {/if}
</div>
<style>
    .aurora-legend {
        margin: 0 auto;
        width: 75%;
        margin-top: -0.9em;
        font-size: 0.7rem;
        color: gray;
        text-align: center;
    }
    .aurora-legend span{
        border-bottom: 2px solid #00FF007F;
    }
</style>