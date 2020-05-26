<script context="module">
    import loader from './async-script-loader.js';
    import {Deferred} from './utils.js';
    import {generateKML, KmlGenerator} from './kml.js';
    const pdfjsWorkerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js';
    const preloadFiles = [
        { type: 'script', url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js' },
        { type: 'script', url: './lidojs.js' },
        { type: 'script', url: './wmo.var.js' },
        { type: 'script', url: 'https://unpkg.com/mapbox.js@3.3.1/dist/mapbox.js' },
        { type: 'link', url: 'https://unpkg.com/mapbox.js@3.3.1/dist/mapbox.css'},
        { type: 'link', url: 'https://unpkg.com/leaflet-gesture-handling/dist/leaflet-gesture-handling.min.css'},
        { type: 'link', url: pdfjsWorkerSrc, options: {prefetch: true}}
    ];
    //const editolidoSrc = 'https://github.com/flyingeek/lidojs/releases/download/v1.1.2/lidojs.min.js';

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
            }
        }
        return ofpPages.join("\n");
    };
</script>
<script>
    export let promise = undefined;
    export let kmlOptions;
    let disabled = false;
    let ready = new Deferred();
    let name = "file";
    let label = "Choisir un OFP";
    let readyClass = false;

    function preload() {
        loader(preloadFiles, () => !!window['pdfjs-dist/build/pdf'], () => {
            window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;
            ready.resolve(true);
            readyClass = true;
        });
    };
    const getOFP = (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (ev) => {
                getOFPText({ data: ev.target.result })
                .then(
                    (text) => {
                        if (text) {
                            //console.log(text);
                            try {
                                const ofp = new editolido.Ofp("_PDFJS_" + text);
                                try {
                                    const kmlGen = KmlGenerator();
                                    generateKML(ofp, kmlOptions);
                                    resolve(ofp);
                                } catch (err) {
                                    console.log(text);
                                    console.log(ofp.infos);
                                    reject(err);
                                }
                            } catch (err) {
                                console.log(text);
                                reject(err);
                            }
                        } else {
                            reject(Error("OFP non reconnu"));
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
        await ready.promise.then(() => {
            const file = e.target.files[0];
            if (file) {
                label = e.target.value.split(/([\\/])/g).pop();
                promise = getOFP(file);
            }
        });
        disabled = false;
    };
</script>

<div class="custom-file">
    <input id={name} name={name} type="file" accept="application/pdf" on:change={process} disabled={disabled} class="custom-file-input">
    <label class:ready={readyClass} class="custom-file-label text-truncate" for="{name}">{label}</label>
</div>
<svelte:window on:load={preload}/>

<style>

input:lang(fr) ~ label::after {
    content: "Sélectionner";
}
label.ready::after {
    background-color: var(--blue);
    color: var(--white);
}
label {
    padding-right: 120px;
    display: inline-block;
}

</style>