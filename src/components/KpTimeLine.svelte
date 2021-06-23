<script>
    import {Kp, kpColor ,aurora} from "./KpUpdater.svelte";
    import {format, xpos, timelineSize} from "./SunTimeLine.svelte";
    import {landingTime, takeOffTime, flightProgress} from "../stores";

    const minmax = (v) => Math.min(100, Math.max(0, v));
    $: flightKp = ($Kp) ? $Kp.timetable : [];

</script>
<div>
    {#if (flightKp.length > 0)}
        <svg width="100%" height="53px" xmlns="http://www.w3.org/2000/svg">
            {#each flightKp as {date, kp, relpos}, i}
                <rect fill="{kpColor(kp)}"
                    x="{xpos(minmax(relpos))}"
                    y="7"
                    width="{timelineSize * (minmax((i===0) ? 100 : flightKp[i - 1].relpos - 0.2) - minmax(relpos))}%"
                    height="14px"/>

                <text fill="white" stroke="white" text-anchor="middle" font-size="0.7em"
                    x="{xpos((minmax(relpos) + minmax((i===0) ? 100 : flightKp[i - 1].relpos)) / 2)}"
                    y="17">{kp}</text>
                {#if relpos > 5 && relpos < 95}
                    <text fill="gray"text-anchor="middle" font-size="0.7em"
                        x="{xpos(relpos)}"
                        y="31">{format(date)}</text>
                {/if}
            {/each}
            <circle fill="#FCBF49" stroke="black" stroke-width="0.5"
                cx="{xpos($flightProgress)}" 
                cy="20" r="2.5" />
            <text fill="black"text-anchor="middle"
                x="5%"
                y="49">{format($takeOffTime)}</text>
            <text fill="black" text-anchor="middle"
                x="95%" 
                y="49">{format($landingTime)}</text>
            {#if $aurora.length === 0 && !!$Kp}
                <text fill="gray" text-anchor="middle" font-size="0.8em"
                    x="50%" 
                    y="49">aucune aurore boréale prévue sur la route</text>
            {/if}
        </svg>
    {:else if !$Kp}
        <p>Les prévisions de Kp sont indisponibles.</p>
    {:else}
        <p>Les prévisions sont disponibles de J-7 à J+2</p>
    {/if}
</div>
<style>
    p{
        margin-left: 0.75rem;
    }
</style>