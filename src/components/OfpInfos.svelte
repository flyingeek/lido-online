<script>
    import {ofp, takeOffTime} from '../stores';
    import plugins from "../plugins.json";
    let shareURL;

    /**
     * standalone app and safari share the same app cache
     * This is an attempt to read a share_cache/share-shortcut fake endpoint
     * 
     * It is not yet functional
     */
    const getShortcutName = async () => {
        const cache = await caches.open("share_cache");
        const response = await cache.match('/share-shortcut');

        if (!response) {
        return null;
        }

        const responseBody = await response.json();
        return responseBody['shortcutName'];
    };
    let shareShortcut;
    getShortcutName()
        .then(name => shareShortcut = name)
        .catch(err => console.error(err));

    $: fuelMarginTime = $ofp.infos.minFuelMarginETOPS / ($ofp.infos.tripFuel/$ofp.infos.flightTime);

    const getOfpRouteExport = (ofp) => {
        if (ofp.timeMatrix.length > 0) {
            return ofp.timeMatrix.map(([p, sum, fl]) => ({
                "name": p.name,
                "tte": sum,
                fl,
                "latitude":  p.latitude.toFixed(6),
                "longitude":  p.longitude.toFixed(6)}));
        }
        return ofp.route.points.map(p => ({
            "name": p.name,
            "latitude":  p.latitude.toFixed(6),
            "longitude":  p.longitude.toFixed(6)}));
    };

    export const shareOFP = async (e) => {
        if (!shareShortcut) e.preventDefault();
        if (!(navigator && navigator.share)) {e.preventDefault(); return false;}
        const ofp = $ofp;
        const takeOffTime = $takeOffTime;
        const excluded = ['EEP', 'EXP', 'raltPoints', 'inFlightStart', 'inFlightReleased', 'levels', 'rawFPL'];
        const filteredInfos = Object.fromEntries(
            Object.entries(ofp.infos).filter(([key, val])=> !excluded.includes(key))
        );
        let filteredText;
        try {
            filteredText = (ofp.text.match(/^(?:.+?)Main OFP(?:.+?)(?:--ROUTE\/FL)/s).pop()||'') + '\n\n' + ofp.infos.rawFPL;
        }catch(err){
            console.error(err);
            filteredText = ofp.text;
        }
        const shareData = {
            'title': 'OFP2MAP',
            'text': JSON.stringify({
                ...filteredInfos,
                lidoFPL: ofp.lidoRoute(false).join(' '),
                'realOFF': takeOffTime,
                "altnETOPS": ofp.infos.ralts,
                'route': getOfpRouteExport(ofp),
                plugins,
                rawText: filteredText
            })//.replace(/"(?:lati|longi)tude":"([0-9.]+)"/gu, (_, p1) => p1)
        }

        if (shareShortcut) {
            shareURL = "shortcuts://run-shortcut?name=" + encodeURIComponent(shareShortcut) + "&input=text&text=" + encodeURIComponent(JSON.stringify(shareData));
            return true;
        }else{
            try {
                await navigator.share(shareData)
            } catch(err) {
                console.log(err);
            }
            return false;
        }
    };

</script>

<div class="infos">
    {#if (fuelMarginTime < 20)}<p class="etops">ETOPS</p>{/if}
    <a  href="{shareURL}" class="details"  class:cursor-pointer={(navigator && navigator.share)} on:click={shareOFP}>
    <p><b>{$ofp.infos.flightNo}</b> {$ofp.infos.depICAO}-{$ofp.infos.destICAO}</p>
    <p>{$ofp.infos.ofpTextDate} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}
        {#if (navigator && navigator.share)}<span class="plugin">🧩</span>{/if}
    </p>
    </a>
</div>
<div class="pluginonly">
    {#if (fuelMarginTime < 20)}<p class="etops">ETOPS</p>{/if}
    <a class="details" href="{shareURL}" class:cursor-pointer={(navigator && navigator.share)} on:click={shareOFP}>
        {#if (navigator && navigator.share)}<span class="plugin">🧩</span>{/if}
    </a>
</div>
<style>
    .infos, .pluginonly{
        font-size: small;
        flex-direction: row;
        max-height: 38px;
        cursor: none;
        align-items: center;
    }
    .pluginonly{
        display: flex;
        margin-right: 0.5rem;
    }
    .infos{
        display: none;
        margin-right: 1rem;
    }
    .details{
        display: flex;
        flex-direction: column;
        color: inherit;
        cursor: default;
    }
    .details, .details:hover{
        text-decoration: none;
    }
    @media (min-width: 500px){
        .infos {
            display: flex;
        }
        .pluginonly {
            display: none;
        }
    }
    p{
        margin:0
    }
    .cursor-pointer{
        cursor: pointer !important;
    }
    :global(.etops){
        writing-mode: vertical-rl;
        text-orientation: upright;
        font-size: 6px;
        margin-right: 5px;
        margin-left: -1em;
        font-weight: 700;
        background-color: var(--bs-warning);
    }
    .plugin {
        width:20px;
        height: 20px;
        vertical-align: bottom;
    }
</style>