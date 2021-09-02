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

    const getPageText = async (pdf, pageNo) => {
        const page = await pdf.getPage(pageNo);
        const tokenizedText = await page.getTextContent();
        return tokenizedText.items.map(token => token.str).join((pageNo === 1) ? " ": "");
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
            } else if (pageText.includes('CREW PAIRING')) {
                ofpPages.push(pageText); // for ROSTERING and TSV
            }
        }
        return ofpPages.join("\n");
    };
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import {showGramet, ofp as ofpStore, ofpStatus, selectedAircraftType, takeOffTime} from '../stores';
    import {aircraftTypes, discontinuatedAircraftTypes} from '../constants';
    import clickOnEnterKey from '../actions/clickOnEnterKey';
    import {focusMap} from './utils';
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
                                let averageFL = ofp.infos.averageFL;
                                const distanceMatrix = ofp.route.segments.map(([p1, p2]) => {
                                    sum += p1.distanceTo(p2);
                                    return [p2, sum, averageFL];
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
                                ofp.departure =  ofp.route.points[0];
                                ofp.arrival = ofp.route.points[ofp.route.points.length - 1];

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
                            reject(Error("OFP non reconnu. Attention il y a 2 OFP dans PilotMission, il faut bien choisir celui nommé « Dossier de vol OFP »."));
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
                //label = e.target.value.split(/([\\/])/g).pop();
                dispatch('change', label);
                window.location.hash = '#/map'; //TODO must be here and not in the then promise below to avoid map centering issues. Why ?
                getOFP(file).then((ofp) => {
                    $ofpStore = ofp;
                    $selectedAircraftType = undefined;
                    $ofpStatus = 'success';
                    $takeOffTime = new Date(ofp.infos.ofpOFF.getTime());
                    form.blur();
                    e.target.blur();
                    focusMap();
                }).catch((err) => {
                    $ofpStatus = err;
                    $ofpStore = undefined;
                    console.trace(err);
                }).finally(() => {
                    form.reset(); 
                });
            }
        });
        disabled = false;
    };
    async function processAircraftType(e) {
        disabled = true;
        $ofpStatus = 'loading';
        preload(); // in case click event not supported or missed
        await ready.promise.then(() => {
            $ofpStore = undefined;
            try {
                KmlGenerator(); // to have a minimum skeleton for map settings
                $selectedAircraftType = e.target.value;
                $ofpStatus = 'success';
            } catch (err) {
                console.log(err);
                $ofpStatus = err;
            }
            window.location.hash = '#/map';
        });
        disabled = false;
    }

</script>
<form class="form-inline" on:submit|preventDefault>
    {#if (!$ofpStore)}
    <div class="input-group" class:blink={!$ofpStore}>
        <span class="input-group-text">
            <span class="d-block d-sm-none">Choisir</span>
            <span class="d-none d-sm-block">Choisir un OFP</span>
        </span>
        <label use:clickOnEnterKey tabindex="0" class="input-group-text btn btn-primary" for="{name}">
            <span class="d-block d-sm-none">OFP…</span>
            <span class="d-none d-sm-block">Sélectionner</span>
            <input id={name} name={name} type="file" accept="application/pdf" on:change={process} disabled={disabled} on:click|once={preload} hidden>
        </label>
    </div>
    {:else}
        <label use:clickOnEnterKey tabindex="0" class="btn btn-outline-secondary btn-sm">
            Changer<input id={name} name={name} type="file" accept="application/pdf" on:change={process} hidden>
        </label>
    {/if}
    {#if !$ofpStore && !$selectedAircraftType}
        <div class="footer">
        <!-- svelte-ignore a11y-no-onchange -->
        <select tabindex="-1" class="form-control-sm" on:click|once={preload} disabled={disabled} on:change={processAircraftType}>
            <option value="{undefined}">pas d'ofp ?</option>
            {#each aircraftTypes.filter(v => !discontinuatedAircraftTypes.includes(v)) as aircraft}
            <option value={aircraft}>{aircraft}</option>
            {/each}
        </select>
        </div>
    {/if}
</form>

<style>
    span.input-group-text{
        background-color: var(--bs-white);
        padding-right: 0.5rem;
    }
    label {
        font-variant-caps: all-small-caps;
    }
    @media (min-width: 576px){
        span.input-group-text {
            padding-right: 50px;
        }
    }
    .blink {
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
        top: calc( 100vh - 41px);
        text-align: right;
        display: none;
        z-index: 1;
    }
    @media (min-width: 768px){
        :global(.home .footer){
            display: block !important;
        }
    }
    select {
        background-color: var(--blueaf);
        border-color: var(--blueaf);
        color: rgba(255,255,255,  0.18);
        margin: 5px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
    }
</style>