<script>

  import LidoRoute from "./components/LidoRoute.svelte";
  import FormSettings from "./components/FormSettings.svelte";
  import { kmlRegex } from "./components/KmlColor.svelte";
  import Export from "./components/Export.svelte";
  import Gramet from "./components/Gramet.svelte";
  import Home from "./components/Home.svelte";
  import Map from "./components/Map.svelte";
  import Navbar from "./components/Navbar.svelte";
  import OfpInput from './components/OfpInput.svelte';
  import Page from "./components/Page.svelte";
  import { updateKml } from "./components/kml.js";
  import {storage, stores, validate, saved, storeSettingsFromURL} from "./components/storage.js";

  export let promise = undefined;
  storeSettingsFromURL(window.location.search);
  export let kmlOptions = validate(storage.getItem(stores.optionsKML) || {});
  let permalink = window.location.href;
  let route;
  window.onhashchange = () => {
    route = window.location.hash.substr(1) || "/";
  };
  window.onhashchange();

  const setHistory = e => {
    const stateObj = saved(kmlOptions);
    let query = Object.entries(stateObj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    permalink =
      window.location.origin +
      window.location.pathname +
      (query ? "?" + query : "");
    history.replaceState(stateObj, "Mon Convertisseur d'OFP", permalink);
  };
  setHistory();
  const update = e => {
    updateKml(e.detail.name, e.detail.value);
    setHistory();
  };
</script>

<main class="container">
  <div class="content">
    <Navbar {promise} {route}>
        <form class:invisible={route === '/help'} class="form-inline my-2 my-lg-0" on:submit|preventDefault>
          <OfpInput bind:promise {kmlOptions} />
        </form>
    </Navbar>
    {#if promise && route !== '/help'}
      {#await promise}
        <Page><div style="margin: auto;">traitement en cours...</div></Page>
      {:then ofp}
        {#if route === '/gramet'}
            <Page><Gramet {ofp}/></Page>
        {:else if route === '/route'}
            <Page><LidoRoute {ofp}/></Page>
        {/if}
        {#if route === '/'}
            <Page>
                <Map {kmlOptions} />
                <Export {ofp} on:save={setHistory} />
            </Page>
        {/if}
      {:catch error}
        <p>😱: {error.message}</p>
      {/await}
    {:else if route === '/'}
        <Page>
            <Home />
        </Page>
    {/if}
  </div>
  {#if route === '/'}
      <FormSettings bind:kmlOptions on:change={update} on:save={setHistory} />
  {/if}
</main>


<style>

  @media (min-width: 768px) and (min-height: 700px) {
    :global(html, body) {
      height: 100%;
      min-height: 100%;
      width: 100%;
      position: fixed;
    }
    main {
      display: flex;
      margin-left: 0;
      margin-right: 0;
      padding-left: 0;
      padding-right: 0;
      overflow-x: hidden;
      max-width: 1366px;
      min-height: 100%;
    }
    .content {
      width: 100%;
      padding: 0 10px 10px 10px;
      flex-direction: column;
      display: flex;
    }
    form {
        margin-right: 25px; /* for hamburger */
    }
  }
  @media (min-width: 1366px) {
    main {
      width: 100%;
      margin-right: auto;
      margin-left: auto;
    }
  }
</style>
