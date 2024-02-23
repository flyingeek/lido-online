<script>
    import {ofp, pairing} from "../stores";

    const minuteToString = minutes => {
        const date = new Date(Date.UTC(2019, 0, 1));
        date.setUTCMinutes(minutes);
        return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
    };
</script>
{#if ! $pairing}
<div class="fatal-error">
<p>Rotation CDB absente de l'OFP ou erreur de traitement</p>
</div>
{:else}
<div class="scrollContainer">
<div class="duty {$pairing.duty.rules} PEQ{$pairing.pilotCount} {$pairing.duty.steps.some(str => str.includes('class="error"')) ? 'invalid' : ''}">
<h2> ( {$ofp.infos.depIATA} > {$ofp.infos.destIATA} vol {$pairing.duty.isCargo ? 'CARGO' : 'PAX'} )</h2>
<table>
<tr>
    <th colspan="2">Programmé</th>
    <th colspan="2">OFP bloc</th>
    <th colspan="2">OFP vol</th>
</tr>
<tr>
    <td>STD</td><td>{$pairing.textOfpOut}z</td>
    <td>OUT</td><td>{$pairing.textOfpOut}z</td>
    <td>OFF</td><td>{$pairing.textOfpOff}z</td></tr>
<tr>
    <td>STA</td><td>{$pairing.textScheduledIn}z</td>
    <td>IN</td><td>{$pairing.textOfpIn}z</td>
    <td>ON</td><td>{$pairing.textOfpOn}z</td>
</tr>
<tr>
    <td>Bloc</td><td>{minuteToString($ofp.infos.scheduledBlockTime)}</td>
    <td>Bloc</td><td>{minuteToString($ofp.infos.blockTime)}</td>
    <td>Flight</td><td>{minuteToString($ofp.infos.flightTime)}</td>
</tr>
</table>
<p class="center only_lc">
    Repos mini PNC en vol (<span class="af">AF</span>) : <span class="af">{$pairing.duty.reposPNC.AF.textValue}</span> <cite>MANEX 07.09.05.F</cite>
</p>

<h2> ( Service de vol {$pairing.duty.title} )</h2>

<table>
<tr>
    <th colspan="2"></th>
    <th colspan="2" class="af">TSV AF</th>
    <th colspan="2" class="ftl">TSV FTL</th>
</tr>
<tr>
    <td>STD</td><td>{$pairing.duty.textOUT}z</td>
    <td class="af">Début</td><td class="af">{$pairing.duty.reportingAF.textValue}z</td>
    <td class="ftl">Début</td><td class="ftl">{$pairing.duty.reportingFTL.textValue}z</td>
</tr>
<tr>
    <td>STA</td><td>{$pairing.duty.textIN}z</td>
    <td class="af">Fin</td><td class="af">{$pairing.duty.reportingAF.textEndValue}z</td>
    <td class="ftl">Fin</td><td class="ftl">{$pairing.duty.reportingFTL.textEndValue}z</td>
</tr>
<tr>
    <td rowspan="2">Bloc</td><td rowspan="2">{minuteToString($pairing.duty.scheduledBlockTime)}</td>
    <td class="af">TSV</td>
    <td class="af">{$pairing.duty.textTSVAF}</td>
    <td class="ftl">TSV</td>
    <td class="ftl">{$pairing.duty.textFDP}</td>
</tr>
<tr>
    <td class="af">MAX</td><td class="af"><span class="only_mc">{$pairing.duty.maxTSVAF.PEQ2.textValue}</span><table class="only_lc af">
        <tr class="peq2">
            <td>PEQ2</td>
            <td>{$pairing.duty.maxTSVAF.PEQ2.textValue}</td>
        </tr>
        <tr class="peq3">
            <td>PEQ3</td>
            <td>{$pairing.duty.maxTSVAF.PEQ3.textValue}</td>
        </tr>
        <tr class="peq4">
            <td>PEQ4</td>
            <td>{$pairing.duty.maxTSVAF.PEQ4.textValue}</td>
        </tr>
    </table></td>
    <td class="ftl">MAX</td><td><span class="only_mc">{$pairing.duty.maxTSVFTL.PEQ2.textValue}</span><table class="only_lc ftl">
        <tr class="peq2">
            <td>PEQ2</td>
            <td>{$pairing.duty.maxTSVFTL.PEQ2.textValue}</td>
        </tr>
        <tr class="peq3">
            <td>PEQ3</td>
            <td>{$pairing.duty.maxTSVFTL.PEQ3.textValue}</td>
        </tr>
        <tr class="peq4">
            <td>PEQ4</td>
            <td>{$pairing.duty.maxTSVFTL.PEQ4.textValue}</td>
        </tr>
    </table></td>
</tr>
<tr style="border: none;" class="only_lc"><td colspan="6" style="border: none"><small style="padding: 0 3px; margin-top: -2px">OFP2MAP ne connaît pas la compo PEQ, <span class="highlight">c'est le nombre de 👨‍✈️qui est surligné</span></small></td></tr>
</table>

<p class="center only_lc" style="margin-top: -1px;">
    Repos mini PNC en vol (<span class="ftl">FTL</span>):
    <span class="ftl">{$pairing.duty.reposPNC.FTL.textValue}</span>
    <cite>MANEX 07.05.04.C</cite>
</p>

<h2> ( En cas de retard )</h2>
<p class="center"><small><span class="af">une limitation AF est de couleur bleue</span>; en cas de couleur <span class="warning">orange</span>, consultez les détails.</small></p>
<table>
    <tr><th></th><th>Butée TSV bloc arrivée  {$pairing.duty.destIATA} (STA {$pairing.duty.textIN}z)</th><th>Repos PNC en vol (<span class="ftl">FTL</span>)</th></tr>
    <tr class="peq2"><td>PEQ2</td><td class="{$pairing.duty.maxTSV_PEQ2.rule}">{@html $pairing.duty.maxTSV_PEQ2.textIN}</td><td>{$pairing.duty.maxTSV_PEQ2.reposPNC}</td></tr>
    <tr class="only_lc peq3"><td>PEQ3</td><td class="{$pairing.duty.maxTSV_PEQ3.rule}">{@html $pairing.duty.maxTSV_PEQ3.textIN}</td><td class="ftl">{$pairing.duty.maxTSV_PEQ3.reposPNC}</td></tr>
    <tr class="only_lc peq4"><td>PEQ4</td><td class="{$pairing.duty.maxTSV_PEQ4.rule}">{@html $pairing.duty.maxTSV_PEQ4.textIN}</td><td class="ftl">{$pairing.duty.maxTSV_PEQ4.reposPNC}</td></tr>
    <tr><td>PNC</td><td>non calculée (<span class="af">RADD</span>)<a style="margin-left: 1em" href="#/help_ftl"><svg style="stroke: #0d6efd; height: 20px; width: 20px; margin-right: 0.25em;"><use xlink:href="#info-symbol"/></svg>plus d'infos</a></td><td></td></tr>
    <tr><th></th><th>Bloc départ limite à {$ofp.infos.depIATA} (STD {$pairing.textOfpOut}z)</th></tr>
    <tr class="peq2"><td>PEQ2</td><td class="{$pairing.duty.maxTSV_PEQ2.rule}">{@html $pairing.duty.maxTSV_PEQ2.textOUT}</td></tr>
    <tr class="only_lc peq3"><td>PEQ3</td><td class="{$pairing.duty.maxTSV_PEQ3.rule}">{@html $pairing.duty.maxTSV_PEQ3.textOUT}</td></tr>
    <tr class="only_lc peq4"><td>PEQ4</td><td class="{$pairing.duty.maxTSV_PEQ4.rule}">{@html $pairing.duty.maxTSV_PEQ4.textOUT}</td></tr>
    {#if $pairing.duty.retardPNC}
        <tr class="only_lc"><th></th><th>Butée départ PNC à la base <cite>MANEX 07.09.06.B.b</cite></th></tr>
        <tr class="only_lc"><td>PNC</td><td class="af">{@html $pairing.duty.retardPNC.textOUT}</td></tr>
    {/if}
</table>

<h2 style="page-break-before: always; padding-top:1.5rem;"> ( Détail des calculs  )</h2>

<ol>
<p>Les éléments en gras doivent être vérifiés pour valider le calcul</p>
{#each $pairing.duty.steps as step}
    <li>{@html step}</li>
{/each}
</ol>
</div>
</div>
{/if}
<style>
    .scrollContainer {
        overflow-y: scroll;
        z-index: 1;
        position: relative;
        background-color: white;
    }
    :global(.duty.invalid:before) {
        content: "Erreur détectée (consultez le détail des calculs)";
        color: white;
        text-align: center;
        display: block;
        background-color: red;
        margin: 1rem auto;
        width: 80%;
        font-weight: bold;
     }
     :global(.duty samp) {
        font-size: small;
     }
     .fatal-error {
        display: flex;
        width: 80%;
        height: 200px;
        margin: auto;
        border-radius: 10px;
        border: 3px dashed red;
        align-items:center;
        justify-content:center;
        background-color: white;
        font-size: 1.1rem;
     }
    .duty {
        margin:0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 1rem;
        padding: 0.5rem 1rem 4rem 1rem;
        background-color: white;
    }
    table {border-collapse: collapse;}
    table th, table td{font-size: 1rem; font-weight: 500;}

    table{margin-top:  0.3rem;}
    td > table{margin-left: auto; margin-right: auto;}
    td > table td { border-color: lightgray;}
    tr:not(:first-child)>th{padding-top: 1.2rem}
    td {border: 1px solid black; text-align: center; padding: 5px;}
    th {padding: 5px 10px; text-align: center; font-size: 1rem;}

    :global(.duty cite) {font-size: smaller; font-weight: normal !important; font-style: normal; color: dimgray; white-space: nowrap}
    :global(.duty cite::before) {content: "[";}
    :global(.duty cite::after){content: "]"}
    :global(.duty .af, .duty .AF) {color: darkblue;}
    :global(.duty.MC .only_lc, .duty.LC .only_mc) {display: none;}
    :global(.duty.PEQ2 .not_peq2 small) {display: none;}
    :global(.duty.PEQ2 tr.not_peq2,  .duty.PEQ2 tr.not_peq2 td) {height: 1.2rem;}
    h2 {margin-top: 1.1rem; margin-bottom: 0}
    h2, .center {
        text-align: center;

    }
    ol, .duty>table {margin-left: auto; margin-right: auto; width: 80%; min-width: 480px;}
    ol {margin-top: 2rem;}
    :global(.duty ol .error){color: red;}
    :global(.duty .warning){color: darkorange}
    :global(.duty .formula, .duty .cdb_margin){opacity: 0.3; position: absolute; transform: translate(-105%); font-weight: normal !important;}
    :global(.duty .cdb_margin){transform: translate(5%) !important;}
/*body.PEQ2.LC tr.PEQ2 td:first-child, body.PEQ3.LC tr.PEQ3 td:first-child, body.PEQ4.LC tr.PEQ4:first-child td {border-left-width: 2px;}
body.PEQ2.LC tr.PEQ2 td:last-child, body.PEQ3.LC tr.PEQ3 td:last-child, body.PEQ4.LC tr.PEQ4:last-child td {border-right-width: 2px;}
*/
:global(.duty.PEQ2.LC .peq2 td, .duty.PEQ3.LC .peq3 td, .duty.PEQ4.LC .peq4 td) {font-weight: bold; border-top-width: 1.5px; border-bottom-width: 1.5px;background-color: #FFFFEA; }
.highlight {background-color: #FFFFEA; opacity: 1 !important;}
/*.PEQ2 .PEQ2 tr, .PEQ3 .PEQ3 tr, .PEQ4 .PEQ4 tr {border-style: double; }*/

</style>
