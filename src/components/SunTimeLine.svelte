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
</script>
<script>
    import {aurora, Kp} from "./KpUpdater.svelte";
    import {flightProgress, landingTime, takeOffTime} from "../stores";
    import {solar} from "./solarstore";

    export let departureSun;
    export let arrivalSun;

    const relpos = (date) => {
        if (!$takeOffTime || !$landingTime) return 0;
        const tots = $takeOffTime.getTime()
        const flightTime = $landingTime.getTime() - tots;
        return Math.round(10000 * (date.getTime() - tots) / flightTime) / 100;
    };
    const xpos = (rel) => 5 + (0.9 * rel);
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
</script>
<div>
    {#if !$Kp}
        <p>Les prédictions de Kp sont indisponibles.</p>
    {/if}
    {#if $aurora.length > 0}
        <div class="aurora-legend">zone favorable aux aurores boréales (Kp={Math.max(...$aurora.map(s => s.predictedKp))})</div>
    {/if}
    <svg width="100%" height="60px" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="SunTimeLine">
                <stop offset="0%"  stop-color="{eventColor(departureSun.state)}"/>
                {#each $solar.sun as event}
                    <stop offset="{relpos(event.date)}%"  stop-color="{eventColor(event.type)}"/>
                {/each}
                <stop offset="100%"  stop-color="{eventColor(arrivalSun.state)}"/>
            </linearGradient>
        </defs>
        {#each $solar.sun as event}
            {#if !['sunriseEnd', 'sunsetStart', 'astronomicalDawn', 'astronomicalDusk'].includes(event.type)}
                <line stroke="gray" stroke-width="1"
                    x1="{xpos(relpos(event.date))}%"
                    y1="30"
                    x2="{xpos(relpos(event.date))}%"
                    y2="32" />
            {/if}
            {#if event.type.startsWith('civil')}
                <text fill="{(event.type === 'civilDawn') ? '#FCBF49' : '#000B18'}" text-anchor="middle"
                    x="{xpos(relpos(event.date))}%"
                    y="44">✹</text>
            {/if}
        {/each}
        {#each $solar.moon as event}
            <line stroke="gray" stroke-width="1"
                x1="{xpos(relpos(event.date))}%"
                y1="18"
                x2="{xpos(relpos(event.date))}%"
                y2="20" />
            <text fill="{(event.type==='moonrise') ? '#FCBF49' : '#000B18'}"text-anchor="middle" 
                x="{xpos(relpos(event.date))}%"
                y="16">☽</text>
        {/each}
        {#each $aurora as period}
            <rect stroke="lime" stroke-opacity="60%" fill="transparent" stroke-width="3"
                x="{xpos(relpos(period.period[0]))}%"
                y="18"
                width="{0.9 * (relpos(period.period[1]) - relpos(period.period[0]))}%"
                height="14"/>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos(period.period[0]) + (relpos(period.period[1]) - relpos(period.period[0])) / 2)}%"
                y="15">{format(period.period[0])}</text>
            <text fill="green"text-anchor="middle" font-size="0.7em"
                x="{xpos(relpos(period.period[0]) + (relpos(period.period[1]) - relpos(period.period[0])) / 2)}%"
                y="42">{format(period.period[1])}</text>
        {/each}
        <rect fill="url(#SunTimeLine)"
            x="5%"
            y="20"
            width="90%"
            height="10px"
            rx="0"/>
        <circle fill="#FCBF49" stroke="#FCBF49"
            cx="{ 5 + 0.9 * $flightProgress}%" 
            cy="25" r="2" />
        <text fill="black"text-anchor="middle"
            x="5%"
            y="56">{format($takeOffTime)}</text>
        <text fill="black" text-anchor="middle"
            x="95%" 
            y="56">{format($landingTime)}</text>
    </svg>
</div>
<style>
    .aurora-legend {
        margin-left: 5%;
    }
    .aurora-legend::before {
        content: "";
        height: 1em;
        width: 1em;
        display: inline-block;
        border: 3px solid lime;
        opacity: 50%;
        margin-right: 0.5em;
        vertical-align: text-bottom;
    }
</style>