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
        { type: 'link', url: 'CONF_MAPBOXGL_CSS'}
    ];
    //const editolidoSrc = 'https://github.com/flyingeek/lidojs/releases/download/v1.1.2/lidojs.min.js';
    let aircraftTypes = ["318", "319", "320", "321", "330", "340", "350", "380", "787", "772", "773", "77F"];
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
    export let promise = undefined;
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
                                //console.timeLog('start');
                                try {
                                    const kmlGen = KmlGenerator();
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
                    (err) => reject(err)
                );
            };
            reader.onerror = (err) => { reject(Error("Fichier illisible !")) };
            reader.readAsArrayBuffer(file);
        });
    };
    async function process(e) {
        disabled = true;
        preload(); // in case click event not supported or missed

        await ready.promise.then(() => {
            const file = e.target.files[0];
            if (file) {
                label = e.target.value.split(/([\\/])/g).pop();
                dispatch('change', label);
                promise = getOFP(file);
                if (window.location.hash !== '#/gramet') {
                    window.location.hash = '#/map';
                }
            }
        });
        disabled = false;
    };
    async function processAircraftType(e) {
        disabled = true;
        preload(); // in case click event not supported or missed
        await ready.promise.then(() => {
            promise = new Promise((resolve, reject) => {
                let ofp = new editolido.Ofp('_PDFJS_AF 681 KATL/LFPG 11Mar2020/2235zReleased: 11Mar/1724z3Main OFP (Long copy #1)OFP 6/0/1 ATC FLIGHT PLAN (FPL-AFR681-IS -B77W/ -KATL2235 -LFPG0724 LFPO ) FLIGHT SUMMARY 0012 TAXI IN Generated');
                ofp.isFake = e.target.value;
                try {
                    const kmlGen = KmlGenerator();
                    generateKML(ofp, kmlOptions);
                    resolve(ofp);
                } catch (err) {
                    console.log(text);
                    console.log(ofp.infos);
                    reject(err);
                }
            });
            promise.isFakeOfp = true;
            window.location.hash = '#/map';
        });
        disabled = false;
    }

</script>

<div class="custom-file" class:blink={!promise}>
    <input id={name} name={name} type="file" accept="application/pdf" on:change={process} disabled={disabled} on:click|once={preload} class="custom-file-input">
    <label class:ready={readyClass} class="custom-file-label text-truncate" for="{name}">{label}</label>
</div>
{#if !promise}
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
<!-- <svelte:window on:load={preload}/> -->

<style>

input:lang(fr) ~ label::after {
    content: "Sélectionner";
}
.blink label::after {
    background-color: var(--blue);
    color: var(--white);
}

label {
    padding-right: 120px;
    display: inline-block;
    width: auto;
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
@media (max-width: 767px){
    input ~ label::after, input:lang(fr) ~ label::after {
        content: "OFP…" !important;
    }
    label {
        width: 0;
    }
    .custom-file {
        width: 140px;
    }
}
@media (max-width: 380px){
    label {
        padding-right: 70px;
    }
    .custom-file {
        width: 90px;
    }
}
</style>