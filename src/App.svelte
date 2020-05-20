<script>
    import { slide } from 'svelte/transition';
    import OfpInput from './components/OfpInput.svelte';
    import LidoRoute from './components/LidoRoute.svelte';
    import FormSettings from './components/FormSettings.svelte';
    import Kml from './components/Kml.svelte';
    import {updateKml, kmlDefaultOptions} from './kml.js';
    //import 'bulma/css/bulma.css';
    export let promise = undefined;
    export let kmlOptions = {...kmlDefaultOptions};

    const update = (e) => {
        updateKml(e.detail.name, e.detail.value);
        kmlOptions = {...kmlOptions};
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
        <FormSettings bind:kmlOptions on:change={update}/>
        {:catch error}
        <p>😱: {error.message}</p>
        {/await}
    {/if}

</main>

<style>

</style>
