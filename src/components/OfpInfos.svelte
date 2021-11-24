<script>
    import {ofp, takeOffTime} from '../stores';
    import plugins from "../plugins.json";
    import {pairingData} from "./pairingParser";
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

    // function* etopsData(ofp, takeOff){
    //     if (!ofp || !takeOff) return [];
    //     let etopsSummary = '';
    //     const ralts = ofp.infos['ralts'];
    //     if(ralts.length > 0) {
    //         try{
    //             etopsSummary = ofp.text.extract('ETOPS SUMMARY', 'SUMMARY-').replace(ofp.removePageFooterRegex,'');
    //         } catch(err){
    //             console.error(err);
    //         }
    //     }
    //     const pattern = String.raw`(EEP\(\S{4}\)|ETP\S+|EXP\(\S{4}\))\s+\d{2}\.\d{2}\s+(\S+)\s+(\S+)\s+EET (\d{2})\.(\d{2}) .+? ([\d.]+)\/EFOB ([\d.]+)(?:.+?(${ralts.join('|')})\s(\S+).+?\sREQ\s(\d{2})(\d{2})-(\d{2})(\d{2}))?`
    //     const regex = new RegExp(pattern, 'gm');
    //     const day = new Date(takeOff);
    //     const delta = takeOff - ofp.infos.ofpOFF;
    //     day.setUTCHours(0, 0);
    //     const matches = etopsSummary.matchAll(regex);
    //     for (let [,name, latString, lngString, hours, minutes, fuelRequired, efob, ralt, rwy, startHours, startMinutes, endHours, endMinutes] of matches) {
    //         const latlng = editolido.dm_normalizer([latString, lngString]);
    //         const eet = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    //         const eto = new Date(takeOff.getTime() + eet * 60000);
    //         const fuelMargin = Math.round((parseFloat(efob) - parseFloat(fuelRequired)) * 10) / 10;
    //         const startWindow = (startHours !== undefined && startMinutes !== undefined) ? new Date(day.getTime() + (parseInt(startHours, 10) * 3600000) + (parseInt(startMinutes, 10) * 60000) + delta) : undefined;
    //         const endWindow = (endHours !== undefined && endMinutes !== undefined) ? new Date(day.getTime() + (parseInt(endHours, 10) * 3600000) + (parseInt(endMinutes, 10) * 60000) + delta) : undefined;
    //         yield([name, eto, parseFloat(fuelRequired), parseFloat(efob), fuelMargin, ralt, rwy, startWindow, endWindow, latlng, eet])
    //     }
    // };
    // note that if $ofp.infos.tripFuel = 0 (bad ofp parsing), fuelMarginTime will be infinity => no alert
    $: fuelMarginTime = $ofp.infos.minFuelMarginETOPS / ($ofp.infos.tripFuel/$ofp.infos.flightTime);

    // const etopsMarkdown = (altnETOPSPoints) => {
    //     const results = [];
    //     const getHours = (data) => data.getUTCHours().toString().padStart(2, '0');
    //     const getMinutes = (data) => data.getUTCMinutes().toString().padStart(2, '0');
    //     for (const data of altnETOPSPoints) {
    //         if (data.description === 'ETOPS') {
    //             results.push(`\n**Appui**: ${data.name} ${data.runway} - Plage: **${getHours(data.startWindow)}${getMinutes(data.startWindow)}-${getHours(data.endWindow)}${getMinutes(data.endWindow)}**`);
    //         }else{
    //             let myName;
    //             if (data.description.startsWith('ETP')) {
    //                 myName = `**${data.description}** ${data.name}`;
    //             }else{
    //                 myName = `**${data.description.substring(0,3)}**${data.description.substring(3)}`
    //             }
    //             results.push(`\n${myName} ➔ ETO: **${getHours(data.ETO)}:${getMinutes(data.ETO)}** | ΔFUEL: **${data.fuelMargin}**\n`);
    //         } 
    //     }
    //     return results;
    // };
    // const etopsList = (ofp, takeOff) => {
    //     let currentRalt = '';
    //     const results = [];
    //     for(const [label, eto, , , fuelMargin, ralt, runway, startWindow, endWindow, latlng, eet] of etopsData(ofp, takeOff)) {
    //         const res = {
    //             "latitude": latlng.latitude,
    //             "longitude": latlng.longitude,
    //             "EET": eet,
    //             "ETO": eto,
    //             "fuelMargin": fuelMargin.toFixed(1)
    //         };
    //         if (label.startsWith('ETP')) {
    //             res.name = `${currentRalt}/${ralt}`;
    //             res.description = label;
    //         }else{
    //             res.name = label.substring(4,8);
    //             res.description = label.substring(0,3);
    //         }
    //         results.push(res);
    //         if(ralt) {
    //             const raltPoint = ofp.infos['raltPoints'].filter(p => p.name === ralt).pop();
    //             let latitude, longitude;
    //             if (raltPoint) {
    //                 latitude = raltPoint.latitude;
    //                 longitude = raltPoint.longitude;
    //             }
    //             results.push({
    //                 "name": ralt,
    //                 "description": "ETOPS",
    //                 latitude,
    //                 longitude,
    //                 runway,
    //                 startWindow,
    //                 endWindow
    //             });
    //             currentRalt = ralt;
    //         }
    //     }
    //     return results;
    // };
    // const getOfpRouteExport = (ofp) => {
    //     if (ofp.timeMatrix.length > 0) {
    //         return ofp.timeMatrix.map(([p, sum, fl]) => ({
    //             "name": p.name,
    //             "tte": sum,
    //             fl,
    //             "latitude":  p.latitude.toFixed(6),
    //             "longitude":  p.longitude.toFixed(6)}));
    //     }
    //     return ofp.route.points.map(p => ({
    //         "name": p.name,
    //         "latitude":  p.latitude.toFixed(6),
    //         "longitude":  p.longitude.toFixed(6)}));
    // };
    function* etopsParser(ofp, realOFF){ 
        const etopsSummaryMatches = ofp.text.match(/FUEL FROM EEP(.+?)-----/s);
        const etopsSummary = (etopsSummaryMatches) ? etopsSummaryMatches[1]: '';
        const ofpOFF = ofp.infos.ofpOFF;
        const ralts =  ofp.infos.ralts;
        const pattern = String.raw`(EEP\(\S{4}\)|ETP\S+|EXP\(\S{4}\))\s+\d{2}\.\d{2}\s+(\S+)\s+(\S+)\s+EET (\d{2})\.(\d{2}) .+? ([\d.]+)\/EFOB\s+([\d.]+)(?:.+?(${ralts.join('|')})\s(\S+).+?\sREQ\s(\d{2})(\d{2})-(\d{2})(\d{2}))?`
        const regex = new RegExp(pattern, 'gm');
        const delta = realOFF - ofpOFF;
        const day = new Date(realOFF);
        day.setUTCHours(0, 0);
        const matches = etopsSummary.matchAll(regex);
        for (let [,name,,, hours, minutes, fuelRequired, efob, ralt, rwy, startHours, startMinutes, endHours, endMinutes] of matches) {
            const eet = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
            const eto = new Date(realOFF.getTime() + eet * 60000);
            const fuelMargin = Math.round((parseFloat(efob) - parseFloat(fuelRequired)) * 10) / 10;
            const startWindow = (startHours !== undefined && startMinutes !== undefined) ? new Date(day.getTime() + (parseInt(startHours, 10) * 3600000) + (parseInt(startMinutes, 10) * 60000) + delta) : undefined;
            const endWindow = (endHours !== undefined && endMinutes !== undefined) ? new Date(day.getTime() + (parseInt(endHours, 10) * 3600000) + (parseInt(endMinutes, 10) * 60000) + delta) : undefined;
            yield([name, eto, fuelMargin, ralt, rwy, startWindow, endWindow])
        }
    };
    const etopsData = (ofp, realOFF) => {
        let currentRalt = '';
        const results = [];
        for(const [label, eto, fuelMargin, ralt, runway, startWindow, endWindow,] of etopsParser(ofp, realOFF)) {
            const res = {
                "ETO": eto,
                "fuelMargin": fuelMargin
            };
            if (label.startsWith('ETP')) {
                res.name = `${currentRalt}/${ralt}`;
                res.description = label;
            }else{
                res.name = label.substring(4,8);
                res.description = label.substring(0,3);
            }
            results.push(res);
            if(ralt) {
                results.push({
                    "name": ralt,
                    "description": "ETOPS",
                    runway,
                    startWindow,
                    endWindow
                });
                currentRalt = ralt;
            }
        }
        return results;
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
        //const filteredText = ofp.text.match(/^(?:.+?)Main OFP(.+?)--ROUTE\/FL/s);
        const pairing = pairingData(ofp)
        const shareData = {
            'title': 'OFP2MAP',
            'text': JSON.stringify({
                ...filteredInfos,
                lidoFPL: ofp.lidoRoute(false).join(' '),
                'realOFF': takeOffTime,
                "altnETOPS": ofp.infos.ralts,
                "etopsData": etopsData(ofp, takeOffTime),
                //'route': getOfpRouteExport(ofp),
                //...pairingData(ofp),
                //deprecated from 07/08/21
                "scheduledTSV": (pairing) ? pairing.scheduledTSV : 0,
                //'registration': ofp.infos.aircraftRegistration,
                //'ralts': ofp.infos.ralts,
                //'etopsOutput': etopsMarkdown(etopsList(ofp, takeOffTime)), //TODO when removing, delete ref to etopsMarkdown, etopsList, etopsData
                //'ofp2map-takeoff': takeOffTime,
                //end of deprecated
                plugins,
                rawText: ''//(filteredText) ? filteredText[1] : ofp.text
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