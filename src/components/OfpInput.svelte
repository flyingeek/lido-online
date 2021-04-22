<script context="module">
    import loader from './async-script-loader.js';
    import {Deferred} from './utils.js';
    import {generateKML, KmlGenerator} from './kml.js';
    const pdfjsWorkerSrc = 'CONF_PDFJS_WORKER_JS';
    const preloadFiles = [
        { type: 'script', url: 'CONF_PDFJS_JS' },
        { type: 'script', url: 'CONF_LIDOJS_JS' },
        { type: 'script', url: 'CONF_PROJ4_JS' },
        { type: 'script', url: 'CONF_WMO_JS' },
        { type: 'script', url: 'CONF_MAPBOXGL_JS' },
        { type: 'script', url: 'CONF_PINCHZOOM_JS'},
        { type: 'link', url: 'CONF_MAPBOXGL_CSS'}
    ];
    //const editolidoSrc = 'https://github.com/flyingeek/lidojs/releases/download/v1.1.2/lidojs.min.js';
    export const aircraftTypes = ["318", "319", "320", "321", "330", "340", "350", "380", "787", "772", "773", "77F"];
    const getPageText = async (pdf, pageNo) => {
        const page = await pdf.getPage(pageNo);
        const tokenizedText = await page.getTextContent();
        return tokenizedText.items.map(token => token.str).join("");
    };
    const getOFPText = async (source) => {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        const ofpPages = [];
        let processedPages = 0;
        const pdf = await pdfjsLib.getDocument(source).promise;
        const maxPages = pdf.numPages;
        for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
            const pageText = await getPageText(pdf, pageNo);
            if (pageText.includes("(Long copy #1)")) {
                ofpPages.push(pageText);
                processedPages += 1;
            } else if (processedPages !== 0){
                break;
            } else if (pageText.includes('FPL SUMMARY')) {
                ofpPages.push(pageText); // for ETOPS
            }
        }
        return ofpPages.join("\n");
    };
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import {showGramet, ofp as ofpStore, ofpStatus, isRealOfp} from '../stores';
    export let kmlOptions;
    let disabled = false;
    let ready = new Deferred();
    let name = "file";
    let label = "Choisir un OFP";
    let readyClass = false;
    let pdfWorker;
    const dispatch = createEventDispatcher();

    function preload() {
        loader(preloadFiles, () => !!window['pdfjs-dist/build/pdf'], () => {
            const pdfjsLib = window["pdfjs-dist/build/pdf"];
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
            if (!pdfWorker || pdfWorker.destroyed) {
                    pdfWorker = new pdfjsLib.PDFWorker();
            }
            ready.resolve(true);
            readyClass = true;
        });
    };
    const getOFP = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (ev) => {
                if (!pdfWorker || pdfWorker.destroyed) {
                    const pdfjsLib = window["pdfjs-dist/build/pdf"];
                    pdfWorker = new pdfjsLib.PDFWorker();
                }
                getOFPText({ data: ev.target.result, verbosity: 0, worker: pdfWorker })
                .then(
                    (text) => {
                        if (text) {
                            //console.log(text);
                            try {
                                //console.timeLog('start');
                                const ofp = new editolido.Ofp("_PDFJS_" + text);
                                const wmoGrid = new editolido.GeoGridIndex();
                                wmoGrid.data = window['WMO'];
                                const data = editolido.ogimetData(ofp, wmoGrid);
                                data.proxyImg = `CONF_GRAMET_PROXY`;
                                data.route.description = data.wmo.join(' ');
                                ofp.ogimetData = data;
                                let sum = 0;
                                let fl = ofp.infos['fl'];
                                const distanceMatrix = ofp.route.segments.map(([p1, p2]) => {
                                    sum += p1.distanceTo(p2);
                                    return [p2, sum, fl];
                                });
                                distanceMatrix.unshift([ofp.route.points[0], 0]);
                                ofp.distanceMatrix = distanceMatrix;
                                let timeMatrix = [];
                                try{
                                    timeMatrix = ofp.wptNamesEET(ofp.route.points);
                                }catch(err){
                                    console.error(err);
                                }
                                if (timeMatrix.length === 0) {
                                    document.body.style.setProperty('--plane-halo-color', 'red');
                                } else {
                                    document.body.style.setProperty('--plane-halo-color', 'var(--plane-color)');
                                }
                                ofp.timeMatrix = timeMatrix;
                                //console.log(timeMatrix)
                                //console.timeLog('start');
                                try {
                                    KmlGenerator();
                                    generateKML(ofp, kmlOptions);
                                    //console.timeEnd('start')
                                    resolve(ofp);
                                } catch (err) {
                                    console.log(text);
                                    console.log(ofp.infos);
                                    // throw(err);
                                    reject(err);
                                }
                            } catch (err) {
                                // throw(err);
                                console.log(text);
                                reject(err);
                            }
                        } else {
                            reject(Error("OFP non reconnu, il faut choisir \"Dossier de vol OFP\" dans Pilot Mission."));
                        }
                    },
                    (err) => {
                        reject(err);
                    }
                );
            };
            reader.onerror = (err) => { reject(Error("Fichier illisible !")) };
            reader.readAsArrayBuffer(file);
        });
    };
    async function process(e) {
        disabled = true;
        $showGramet = false; // must be set here and not in App.svelte (why ?)
        preload(); // in case click event not supported or missed

        await ready.promise.then(() => {
            const file = e.target.files[0];
            const form = e.target.closest('form');
            if (file) {
                $ofpStatus = 'loading';
                label = e.target.value.split(/([\\/])/g).pop();
                dispatch('change', label);
                getOFP(file).then((ofp) => {
                    $ofpStore = ofp;
                    $ofpStatus = 'success';
                    form.blur();
                    e.target.blur();
                    form.reset();
                }, (err) => {
                    $ofpStatus = err;
                    form.reset();
                });
                window.location.hash = '#/map';
            }
        });
        disabled = false;
    };
    async function processAircraftType(e) {
        disabled = true;
        $ofpStatus = 'loading';
        preload(); // in case click event not supported or missed
        await ready.promise.then(() => {
            let ofp = new editolido.Ofp('_PDFJS_AF 681 KATL/LFPG 11Mar2020/2235zReleased: 11Mar/1724z3Main OFP (Long copy #1)OFP 6/0/1 ATC FLIGHT PLAN (FPL-AFR681-IS -B77W/ -KATL2235 -LFPG0724 LFPO ) FLIGHT SUMMARY 0012 TAXI IN Generated');
            try {
                KmlGenerator(); // to have a minimum skeleton for map settings
                ofp.isFake = e.target.value;
                $ofpStore = ofp;
                $ofpStatus = 'success';
            } catch (err) {
                console.log(err);
                console.log(ofp.infos);
                $ofpStatus = err;
            }
            window.location.hash = '#/map';
        });
        disabled = false;
    }

</script>
<form class="form-inline" on:submit|preventDefault>
    {#if (!$isRealOfp)}
    <div class="custom-file" class:blink={!$ofpStore}>
        <input id={name} name={name} type="file" accept="application/pdf" on:change={process} disabled={disabled} on:click|once={preload} class="custom-file-input">
        <label class:ready={readyClass} class="custom-file-label text-truncate" for="{name}">{label}</label>
    </div>
    {:else}
        <label class="btn btn-outline-secondary btn-sm">
            Changer<input id={name} name={name} type="file" accept="application/pdf" on:change={process} hidden>
        </label>
    {/if}
    {#if false && !$ofpStore}
        <div class="footer">
        <!-- svelte-ignore a11y-no-onchange -->
        <select class="form-control-sm" on:click|once={preload} disabled={disabled} on:change={processAircraftType}>
            <option value="none">pas d'ofp ?</option>
            {#each aircraftTypes as aircraft}
            <option value={aircraft}>{aircraft}</option>
            {/each}
        </select>
        </div>
    {/if}
</form>

<style>

input:lang(fr) ~ label::after {
    content: "Sélectionner";
    font-variant: all-small-caps;
}
.blink label::after {
    background-color: var(--blue);
    color: var(--white);
}

label {
    justify-content: flex-start
}
.custom-file {
    width: auto
}
.custom-file.blink {
    animation: blink 3s ease infinite;
}
@keyframes blink {
    0% { transform: scale(1.0); }
    75% { transform: scale(1.0); }
    80% { transform: scale(1.03); }
    95% { transform: scale(1.03); }
    100% { transform: scale(1.0); }
}
.footer {
  position: absolute;
  right: 5px;
  bottom: 0;
  text-align: right;
  display: none;
  z-index: 1;
}
:global(.home .footer){
    display: block !important;
}
select {
  background-color: var(--blueaf);
  border-color: var(--blueaf);
  color: #888;
  margin: 5px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
@media (max-width: 576px){
    input ~ label::after, input:lang(fr) ~ label::after {
        content: "OFP…" !important;
    }
    .custom-file {
        width: 155px;
    }
}
label.btn {
    margin-bottom: 0;
    font-variant: all-small-caps;
}
.btn-outline-secondary:hover{
    color: var(--secondary);
    background-color: transparent;
}
/* @media (max-width: 768px){
    label {
        padding-right: 70px;
    }
    .custom-file {
        width: 90px;
    }
} */
</style>