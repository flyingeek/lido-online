<script>
    import { slide } from 'svelte/transition';
    import OfpInput from './components/OfpInput.svelte';
    import LidoRoute from './components/LidoRoute.svelte';
    import FormSettings from './components/FormSettings.svelte';
    import Kml from './components/Kml.svelte';
    import GeoJSON from './components/GeoJSON.svelte';
    import {kmlRegex} from './components/KmlColor.svelte';
    import ShortcutsLink from "./components/ShortcutsLink.svelte";
    import DownloadButton from "./components/DownloadButton.svelte";
    import {updateKml, kmlDefaultOptions} from './components/kml.js';
    //import 'bulma/css/bulma.css';
    export let promise = undefined;
    const validate = (options) => {
        const validated = {};
        for (let [key, value] of Object.entries(options)) {
            if (key in kmlDefaultOptions) { 
                if (key.endsWith('Pin')) {
                    value *= 1; // coalesce to number or NaN
                    if (!isNaN(value)) {
                        validated[key] = value;
                    }
                } else if (key.endsWith('Color') && value.match(kmlRegex)) {
                    validated[key] = value.toUpperCase();
                } else if (key.endsWith('Display')) {
                    validated[key] = !!(value); //coerce to boolean
                }
            }
        }
        return {...kmlDefaultOptions, ...validated};
    };
    export let kmlOptions = validate(JSON.parse(localStorage.getItem("optionsKML")) || {});

    const update = (e) => {
        updateKml(e.detail.name, e.detail.value);
    };
</script>

<main class="container">
    <h1>Convertisseur OFP</h1>
    <OfpInput bind:promise {kmlOptions}/>
    <p></p>

    {#if promise}
        {#await promise}
        <p>processing...</p>
        {:then ofp}
        <p>👍 {`${ofp.infos['flight']} : ${ofp.infos['departure']} -> ${ofp.infos['destination']}`}</p>
        <LidoRoute {ofp} show={false}/>
        <Kml {kmlOptions}/>
        <GeoJSON {kmlOptions}/>
        <div class="row download">
            <div class="col-12 col-md-6"><DownloadButton label="Télécharger KML"/></div>
            <div class="col-12 col-md-6"><ShortcutsLink {ofp} /></div>
        </div>
        <small class="form-text text-muted">Il est possible de modifier dynamiquement le KML généré en modifiant les options
            ci-dessous.<span> Sur iOS, on peut préciser le nom d'un raccourci à exécuter. <a
            href="https://www.icloud.com/shortcuts/8833e7fb6e484ec7be86ab9bd8c056d7" target="_blank">Exemple de raccourci</a></span>
        </small>
        <FormSettings bind:kmlOptions on:change={update}/>
        {:catch error}
        <p>😱: {error.message}</p>
        {/await}
    {/if}

</main>

<style>
.row.download > div {
    margin-top: 1em;
}
</style>
