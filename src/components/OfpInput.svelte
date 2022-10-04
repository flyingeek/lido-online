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
    export const ready = new Deferred();
    let pdfWorker;
    export function preload() {
        loader(preloadFiles, () => !!window['pdfjs-dist/build/pdf'], () => {
            const pdfjsLib = window["pdfjs-dist/build/pdf"];
            pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
            if (!pdfWorker || pdfWorker.destroyed) {
                    pdfWorker = new pdfjsLib.PDFWorker();
            }
            ready.resolve(true);
        });
    };

</script>
<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import {showGramet, ofp as ofpStore, ofpStatus, selectedAircraftType, takeOffTime} from '../stores';
    import {focusMap, savePreviousOFP, deletePreviousOFP, getPreviousOFPText, getPreviousTakeOFF} from './utils';
    export let kmlOptions;
    let disabled = false;

    let name = "file";
    let label = "Choisir un OFP";

    const dispatch = createEventDispatcher();

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
                                try {
                                    //console.log(ofp.text);
                                    ofpPostInit(ofp);
                                    savePreviousOFP(ofp);
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
    function process(e) {
        disabled = true;
        $showGramet = false; // must be set here and not in App.svelte (why ?)
        preload(); // in case click event not supported or missed
        const target = e.target;
        const file = target.files[0];
        //label = target.value.split(/([\\/])/g).pop();
        const form = target.closest('form');
        if (!file) {
            disabled = false;
            return;
        }
        ready.promise.then(() => {
            $ofpStatus = 'loading';
            dispatch('change');
            window.location.hash = '#/map'; //TODO must be here and not in the then promise below to avoid map centering issues. Why ?
            return getOFP(file).then((ofp) => {
                $ofpStore = ofp;
                $selectedAircraftType = ofp.infos.aircraftType;
                $ofpStatus = 'success';
                $takeOffTime = new Date(ofp.infos.ofpOFF.getTime());
            }).catch((err) => {
                $ofpStatus = err;
                $ofpStore = undefined;
                deletePreviousOFP();
                console.trace(err);
            }).finally(() => {
                form.blur();
                form.reset();
                target.blur();
                focusMap();
                disabled = false;
            });
        });
    };
    function reload(text) {
        $showGramet = false; // must be set here and not in App.svelte (why ?)
        preload();
        ready.promise.then(() => {
            $ofpStatus = 'loading';
            dispatch('change');
            window.location.hash = '#/map';//TODO must be here and not in the then promise below to avoid map centering issues. Why ?
            return new Promise((resolve, reject) => {
                setTimeout( () => {
                    try {
                        const ofp = new editolido.Ofp(text);
                        ofpPostInit(ofp);
                        ofp.reloaded = true;
                        resolve(ofp);
                    }catch(err) {
                        reject(err);
                    }
                }, 100);//TODO uses setTimeout to avoid map centering issues
            }).then(ofp => {
                $ofpStore = ofp;
                $selectedAircraftType = undefined;
                $ofpStatus = 'success';
                const previousTakeOFF = getPreviousTakeOFF(ofp);
                $takeOffTime = (previousTakeOFF) ? new Date(previousTakeOFF) : new Date(ofp.infos.ofpOFF.getTime());
            }).catch(err => {
                console.log(text);
                $ofpStatus = err;
                $ofpStore = undefined;
                deletePreviousOFP();
                console.trace(err);
            }).finally(() => {
                focusMap();
            });
        });
    };
    function simulateClickOnInput(e) {
        if (e.key === "Enter") {
            const input = e.target.querySelector('input[type="file"]');
            if (input) {
                input.click();
                return false; // preventDefault
            }else{
                console.error('input[type="file"] not found');
            }
        }
        return true;
    }
    function ofpPostInit(ofp) {
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
        ofp.reloaded = false;
        KmlGenerator();
        generateKML(ofp, kmlOptions);
    }
    onMount(() => {
        const ofpText = getPreviousOFPText();
        if (ofpText) reload(ofpText);
    });
</script>
<form class="form-inline" on:submit|preventDefault>
    {#if (!$ofpStore)}
    <div class="input-group" class:blink={!$ofpStore}>
        <span class="input-group-text" on:click={e => simulateClickOnInput({key: "Enter", target: e.target.closest('div').querySelector('label')})}>
            <span class="d-block d-sm-none">Choisir</span>
            <span class="d-none d-sm-block">Choisir un OFP</span>
        </span>
        <label on:keydown="{simulateClickOnInput}" tabindex="0" class="input-group-text btn btn-primary" for="{name}">
            <span class="d-block d-sm-none">OFP…</span>
            <span class="d-none d-sm-block">Sélectionner</span>
            <input id={name} name={name} type="file" accept="application/pdf" on:change={process} disabled={disabled} on:click|once={preload} hidden>
        </label>
    </div>
    {:else}
        <label on:keydown="{simulateClickOnInput}" tabindex="0" class="input-group-text btn btn-outline-secondary btn-sm">
            <span class="d-block d-sm-none">OFP…</span>
            <span class="d-none d-sm-block">Changer</span>
            <input id={name} name={name} type="file" accept="application/pdf" on:change={process} hidden>
        </label>
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
</style>
