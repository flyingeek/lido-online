<script>
    import {
        position,
        simulate,
        grametImageTimestamp,
        takeOffTime,
    } from "../stores";
    import SimulatorPlayer from "./SimulatorPlayer.svelte";
    import { fly } from "svelte/transition";
    import { setGramet, setHeight } from "../actions/grametAction";
    const maxHeight = 370;
    const GRAMET_DEBUG = true;
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const formatGrametTime = (timestamp) => {
        const date = new Date(timestamp);
        const day = date.getUTCDate().toString().padStart(2, "0");
        const month = months[date.getUTCMonth()];
        const year = (date.getUTCFullYear() % 100).toString().padStart(2, "0");
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        return `${day}${month}${year} ${hours}:${minutes}`;
    };

    let showTimestampWarning = false;
    let grametFormattedTime;
    let lastWarningDebugKey;

    $: if ($grametImageTimestamp && $takeOffTime) {
        const diffMs = Math.abs($grametImageTimestamp - $takeOffTime.getTime());
        const diffHours = diffMs / (1000 * 60 * 60);
        showTimestampWarning = diffHours > 1;
        grametFormattedTime = formatGrametTime($grametImageTimestamp);
        const debugKey = `${$grametImageTimestamp}-${$takeOffTime.getTime()}-${showTimestampWarning}`;
        if (GRAMET_DEBUG && debugKey !== lastWarningDebugKey) {
            lastWarningDebugKey = debugKey;
            console.debug("[gramet] warning check", {
                grametImageTimestampMs: $grametImageTimestamp,
                grametFormattedTime,
                takeoffTimestampMs: $takeOffTime.getTime(),
                diffHours,
                showTimestampWarning,
            });
        }
    } else {
        showTimestampWarning = false;
        grametFormattedTime = undefined;
        const debugKey = `${$grametImageTimestamp || "none"}-${$takeOffTime ? $takeOffTime.getTime() : "none"}-false`;
        if (GRAMET_DEBUG && debugKey !== lastWarningDebugKey) {
            lastWarningDebugKey = debugKey;
            console.debug("[gramet] warning check missing input", {
                grametImageTimestampMs: $grametImageTimestamp || null,
                takeoffTimestampMs: $takeOffTime
                    ? $takeOffTime.getTime()
                    : null,
            });
        }
    }
</script>

<div
    class="pinch-zoom-parent"
    transition:fly={{ y: maxHeight }}
    data-max-height={maxHeight}
    use:setHeight
>
    <pinch-zoom
        use:setGramet={{ pos: $position.gramet, fl: $position.fl }}
        min-scale="0.1"
    ></pinch-zoom>
    <svg><use xlink:href="#plane-symbol" /></svg>
    {#if showTimestampWarning}
        <div class="timestamp-warning">
            ⚠️ GRAMET time {grametFormattedTime} differs from takeoff time
        </div>
    {/if}
    <!-- {#if (($flightProgress === 0 || $flightProgress === 100) && ogimetParams.get('tref') * 1000 > $ofp.infos.ofpOFF.getTime())}
        <div class="warning">GRAMET pour décollage maintenant</div>
    {/if} -->
    {#if $position.gramet === 0 || $position.gramet === 100 || $simulate >= 0}
        <SimulatorPlayer />
    {/if}
</div>

<style>
    .pinch-zoom-parent {
        width: 100%;
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 255, 255, 0.6);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='120px' width='120px' ><text transform='rotate(45)' x='20' y='7' fill='lightblue' fill-opacity='0.7' font-size='14'>GRAMET</text></svg>");
    }
    svg {
        position: absolute;
        width: 28px;
        height: 28px;
        top: 60px;
        left: 0;
        color: var(--plane-color);
    }
    @media (min-width: 768px) {
        svg {
            width: 40px;
            height: 40px;
        }
    }
    .timestamp-warning {
        position: absolute;
        bottom: 10px;
        left: 10px;
        /* right: 10px; */
        background-color: rgb(248 248 245 / 90%);
        color: #333;
        padding: 4px 12px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
        text-align: center;
        z-index: 10;
        border: 2px solid #ff7200;
    }
    /* .warning {
        position: absolute;
        z-index: 10;
        top: 10px;
        color: white;
        background-color: var(--bs-warning);
        padding: 5px;
        left: 10px;
    } */
</style>
