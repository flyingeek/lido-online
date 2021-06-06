<script>
    import {ofp, takeOffTime} from '../stores';

    function* etopsData(ofp, takeOff){
        let etopsSummary = '';
        const ralts = ofp.infos['ralts'];
        if(ralts.length > 0) {
            try{
                etopsSummary = ofp.text.extract('ETOPS SUMMARY', 'SUMMARY-').replace(ofp.removePageFooterRegex,'');
            } catch(err){
                console.error(err);
            }
        }
        const pattern = String.raw`(EEP\(\S{4}\)|ETP\S+|EXP\(\S{4}\))\s.+?EET (\d{2})\.(\d{2}) .+? ([\d.]+)\/EFOB ([\d.]+)(?:.+?(${ralts.join('|')})\s(\S+).+?\sREQ\s(\d{2})(\d{2})-(\d{2})(\d{2}))?`
        const regex = new RegExp(pattern, 'gm');
        const day = new Date(takeOff);
        const delta = takeOff - ofp.infos['takeoff'];
        day.setUTCHours(0, 0);
        const matches = etopsSummary.matchAll(regex);
        for (let [,name, hours, minutes, fuelRequired, efob, ralt, rwy, startHours, startMinutes, endHours, endMinutes] of matches) {
            const eto = new Date(takeOff.getTime() + (parseInt(hours, 10) * 3600000) + (parseInt(minutes, 10) * 60000));
            const fuelMargin = Math.round((parseFloat(efob) - parseFloat(fuelRequired)) * 10) / 10;
            const startWindow = (startHours !== undefined && startMinutes !== undefined) ? new Date(day.getTime() + (parseInt(startHours, 10) * 3600000) + (parseInt(startMinutes, 10) * 60000) + delta) : undefined;
            const endWindow = (endHours !== undefined && endMinutes !== undefined) ? new Date(day.getTime() + (parseInt(endHours, 10) * 3600000) + (parseInt(endMinutes, 10) * 60000) + delta) : undefined;
            yield([name, eto, parseFloat(fuelRequired), parseFloat(efob), fuelMargin, ralt, rwy, startWindow, endWindow])
        }
    };
    const etopsFuelMargin = (ofp, takeOff) => {
        if (takeOff) {
            const ralts = [];
            for(const [, eto, , efob, fuelMargin] of etopsData(ofp, takeOff)) {
                ralts.push([eto, efob, fuelMargin]);
            }
            if (ralts.length > 1) {
                const consumption = (ralts[0][1] - ralts[ralts.length-1][1]) / (ralts[ralts.length-1][0] - ralts[0][0]) * 60000;
                return Math.min(...ralts.map(a => a[2]/consumption));
            }else if (ralts.length > 0) {
                return (ralts[0][2]/8) * 60; //conso 777 but should never be used
            }
        }
        return 180; // a big enough number
    };
    $: fuelMarginTime = etopsFuelMargin($ofp, $takeOffTime)

    const etopsMarkdown = (ofp, takeOff) => {
        let currentRalt = '';
        const getHours = (data) => data.getUTCHours().toString().padStart(2, '0');
        const getMinutes = (data) => data.getUTCMinutes().toString().padStart(2, '0');
        const results = [];
        for(const [name, eto, , , fuelMargin, ralt, rwy, startWindow, endWindow] of etopsData(ofp, takeOff)) {
            let output;
            let myName;
            if (name.startsWith('ETP')) {
                myName = `**${name}** ${currentRalt}/${ralt}`;
            }else{
                myName = `**${name.substring(0,3)}**${name.substring(3)}`
            }
            output = `\n${myName} ➔ ETO: **${getHours(eto)}:${getMinutes(eto)}** | ΔFUEL: **${fuelMargin.toFixed(1)}**\n`;
            if(ralt) {
                currentRalt = ralt;
                output += `\n**Appui**: ${ralt} ${rwy} - Plage: **${getHours(startWindow)}${getMinutes(startWindow)}-${getHours(endWindow)}${getMinutes(endWindow)}**`;
            }
            results.push(output);
        }
        return results;
    };
    export const shareOFP = async () => {
        const shareData = {
            'title': 'OFP2MAP',
            'text': JSON.stringify({
                ...$ofp.infos,
                text: $ofp.text,
                'ofp2map-takeoff': $takeOffTime,
                'etopsOutput': etopsMarkdown($ofp, $takeOffTime)
            })
        };
        try {
            await navigator.share(shareData)
        } catch(err) {
            console.log(err);
        }
        return false;
    };

</script>

<div class="infos" on:click={(navigator && navigator.share) ? shareOFP : null}>
    {#if (fuelMarginTime < 20)}<p class="etops">ETOPS</p>{/if}
    <div class="details">
    <p><b>{$ofp.infos.flight}</b> {$ofp.infos.departure}-{$ofp.infos.destination}</p>
    <p>{$ofp.infos.date} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}
        {#if (navigator && navigator.share)}<svg><use xlink:href="#share-symbol"/></svg>{/if}
    </p>
    </div>
</div>

<style>
    .infos{
        display: none;
        margin-right: 1rem;
        font-size: small;
        flex-direction: row;
        max-height: 38px;
    }
    .details{
        display: flex;
        flex-direction: column;
    }
    @media (min-width: 500px){
        .infos {
            display: flex;
        }
    }
    p{
        margin:0
    }
    .etops{
        writing-mode: vertical-rl;
        text-orientation: upright;
        font-size: 6px;
        margin-right: 5px;
        margin-left: -1em;
        font-weight: 700;
        align-self: center;
        background-color: var(--warning);
    }
    svg {
        width:20px;
        height: 20px;
        vertical-align: bottom;
    }
</style>