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
    export const xpos = (rel) => 5 + (0.9 * rel);
</script>
<script>
    import {aurora, Kp} from "./KpUpdater.svelte";
    import {flightProgress, landingTime, takeOffTime} from "../stores";
    import {solar} from "./solarstore";
    import {getMoonIllumination, getMoonPosition} from "./suncalc.js";

    export let departureSun;
    export let arrivalSun;

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
                if (stateOrEvent) console.error(`#ERREUR ${stateOrEvent}#`);
                return 'red';
        };
    };
    const moonIconStyle =  (date, point) => {
        const mi = getMoonIllumination(date);
        const iconOrientationCorrection = 132 * Math.PI / 180;
        const oa = mi.angle - getMoonPosition(date, point).parallacticAngle; // observer angle
        //return `transform: rotate(${ -oa + iconOrientationCorrection}rad);`;
        return ''; //not yet supported in safari
    }
</script>
<div>
    {#if !$Kp}
        <p>Les prédictions de Kp sont indisponibles.</p>
    {/if}
    <svg width="100%" height="60px" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="SunTimeLine">
                <stop offset="0%"  stop-color="{eventColor(departureSun.state)}"/>
                {#each $solar.sun as {type, relpos}}
                    <stop offset="{relpos}%"  stop-color="{eventColor(type)}"/>
                {/each}
                <stop offset="100%"  stop-color="{eventColor(arrivalSun.state)}"/>
            </linearGradient>
        </defs>
        {#each $solar.sun as {type, relpos}}
            {#if !['sunriseEnd', 'sunsetStart', 'astronomicalDawn', 'astronomicalDusk'].includes(type)}
                <line stroke="gray" stroke-width="1"
                    x1="{xpos(relpos)}%"
                    y1="30"
                    x2="{xpos(relpos)}%"
                    y2="32" />
            {/if}
            {#if type.startsWith('civil')}
                <text fill="{(type === 'civilDawn') ? '#FCBF49' : '#000B18'}" text-anchor="middle"
                    x="{xpos(relpos)}%"
                    y="44">✹</text>
            {/if}
        {/each}
        {#each $solar.moon as {type, relpos, date, position}}
            <line stroke="gray" stroke-width="1"
                x1="{xpos(relpos)}%"
                y1="18"
                x2="{xpos(relpos)}%"
                y2="20" />
            <text fill="{(type==='moonrise') ? '#FCBF49' : '#000B18'}" text-anchor="middle" 
                x="{xpos(relpos)}%"
                y="16"
                style="{moonIconStyle(date,position)}transform-origin: {xpos(relpos)}% 9px;"
                >☾</text>
        {/each}
        {#each $aurora as {period, relpos}}
            <rect stroke="lime" stroke-opacity="60%" fill="transparent" stroke-width="2"
                x="{xpos(relpos[0])}%"
                y="18"
                width="{0.9 * (relpos[1] - relpos[0])}%"
                height="14"/>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos[0] + (relpos[1] - relpos[0]) / 2)}%"
                y="15">{format(period[0])}</text>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos[0] + (relpos[1] - relpos[0]) / 2)}%"
                y="42">{format(period[1])}</text>
        {/each}
        <rect fill="url(#SunTimeLine)"
            x="5%"
            y="20"
            width="90%"
            height="10px"
            rx="0"/>
        <circle fill="#FCBF49" stroke="black" stroke-width="0.5"
            cx="{ xpos($flightProgress)}%" 
            cy="25" r="2.5" />
        <text fill="black"text-anchor="middle"
            x="5%"
            y="56">{format($takeOffTime)}</text>
        <text fill="black" text-anchor="middle"
            x="95%" 
            y="56">{format($landingTime)}</text>
    </svg>
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