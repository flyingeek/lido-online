<script>
    import {ofp, takeOffTime} from '../stores';

    const etopsMarkdown = (ofp, takeOff) => {
        let etopsSummary = '';
        const ralts = ofp.infos['ralts'];
        if(ralts.length > 0) {
            try{
                etopsSummary = ofp.text.extract('ETOPS SUMMARY', 'SUMMARY-', false).replace(ofp.removePageFooterRegex,'');
            } catch(err){
                console.error(err);
            }
        }
        const results = [];
        const pattern = String.raw`(EEP\(\S{4}\)|ETP\S+|EXP\(\S{4}\))\s.+?EET (\d{2})\.(\d{2}) .+? ([\d.]+)\/EFOB ([\d.]+)(?:.+?(${ralts.join('|')})\s(\S+).+?\sREQ\s(\d{2})(\d{2})-(\d{2})(\d{2}))?`
        const regex = new RegExp(pattern, 'gm');
        const day = new Date(takeOff);
        const delta = takeOff - ofp.infos['takeoff'];
        day.setUTCHours(0, 0);
        const matches = etopsSummary.matchAll(regex);
        let currentRalt = '';
        const getHours = (data) => data.getUTCHours().toString().padStart(2, '0');
        const getMinutes = (data) => data.getUTCMinutes().toString().padStart(2, '0');
        for (let [,name, hours, minutes, fuelRequired, efob, ralt, rwy, startHours, startMinutes, endHours, endMinutes] of matches) {
            let output;
            const eto = new Date(takeOff.getTime() + (parseInt(hours, 10) * 3600000) + (parseInt(minutes, 10) * 60000));
            const fuelMargin = Math.round((parseFloat(efob) - parseFloat(fuelRequired)) * 10) / 10;
            const startWindow = (startHours !== undefined && startMinutes !== undefined) ? new Date(day.getTime() + (parseInt(startHours, 10) * 3600000) + (parseInt(startMinutes, 10) * 60000) + delta) : undefined;
            const endWindow = (endHours !== undefined && endMinutes !== undefined) ? new Date(day.getTime() + (parseInt(endHours, 10) * 3600000) + (parseInt(endMinutes, 10) * 60000) + delta) : undefined;
            if (name.startsWith('ETP')) {
                name = `**${name}** ${currentRalt}/${ralt}`;
            }else{
                name = `**${name.substring(0,3)}**${name.substring(3)}`
            }
            output = `\n${name} ➔ ETO: **${getHours(eto)}:${getMinutes(eto)}** | ΔFUEL: **${fuelMargin.toFixed(1)}**\n`;
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

<div on:click={(navigator && navigator.share) ? shareOFP : null}>
    <p><b>{$ofp.infos.flight}</b> {$ofp.infos.departure}-{$ofp.infos.destination}</p>
    <p>{$ofp.infos.date} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}
        {#if (navigator && navigator.share)}<svg><use xlink:href="#share-symbol"/></svg>{/if}
    </p>
</div>

<style>
    div{
        display: none;
        flex-direction: column;
        margin-right: 1rem;
        font-size: small;
    }
    @media (min-width: 500px){
        div {
            display: flex;
        }
    }
    p{
        margin:0
    }
    svg {
        width:20px;
        height: 20px;
        vertical-align: bottom;
    }
</style>