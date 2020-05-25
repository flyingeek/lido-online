<script>
  import { fade } from "svelte/transition";
  //import { quintOut } from "svelte/easing";

  import LidoRoute from "./components/LidoRoute.svelte";
  import FormSettings from "./components/FormSettings.svelte";
  // import Kml from './components/Kml.svelte';
  // import GeoJSON from './components/GeoJSON.svelte';
  import { kmlRegex } from "./components/KmlColor.svelte";
  import ShortcutsLink from "./components/ShortcutsLink.svelte";
  import DownloadButton from "./components/DownloadButton.svelte";
  import Gramet from "./components/Gramet.svelte";
  import Home from "./components/Home.svelte";
  import Map from "./components/Map.svelte";
  import Navbar from "./components/Navbar.svelte";
  import { updateKml } from "./components/kml.js";
  import {storage, stores, validate, saved, storeSettingsFromURL} from "./components/storage.js";
  import Permalink from "./components/Permalink.svelte";
  import Spinner from "./components/Spinner.svelte";
//   import { Circle2 } from 'svelte-loading-spinners';
  export let promise = undefined;
  storeSettingsFromURL(window.location.search);
  export let kmlOptions = validate(storage.getItem(stores.optionsKML) || {});
  let permalink = window.location.href;
  let sidebar = false;
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

<main class:sidebar class="container">
  <div class="content">
    <Navbar {route} {kmlOptions} bind:promise bind:sidebar />
    {#if promise}
      {#await promise}
        <div class="page" in:fade><div style="margin: auto;">traitement en cours...</div></div>
        <!-- <Spinner size="60" colorOuter="#FF3E00" colorCenter="#40B3FF" colorInner="#676778" unit="px"></Spinner> -->
        <!-- <Home /> -->
      {:then ofp}
        {#if route === '/gramet'}
        <div transition:fade class="page">
          <Gramet /></div>
        {:else if route === '/route'}
            <div in:fade class="page"><LidoRoute {ofp} show={false} /></div>
        {/if}
        {#if route === '/'}
          <div in:fade class="page">
          <Map {kmlOptions} />
          <!-- <Kml {kmlOptions}/> -->
          <!-- <GeoJSON {kmlOptions}/> -->
          <div class="row download">
            <div class="col-12 col-sm-6 col-md-6">
              <DownloadButton label="Télécharger" on:save={setHistory} />
            </div>
            <div class="col-12 col-sm-6 col-md-6">
              <ShortcutsLink {ofp} on:save={setHistory} />
            </div>
          </div>
          <small class="form-text text-muted">
            Il est possible de modifier dynamiquement le KML généré en modifiant
            les options ci-dessous.
            <span>
              Sur iOS, on peut préciser le nom d'un raccourci à exécuter.
              <a
                href="https://www.icloud.com/shortcuts/8833e7fb6e484ec7be86ab9bd8c056d7"
                target="_blank">
                Exemple de raccourci
              </a>
            </span>
          </small>
          </div>
        {/if}
        <!-- <FormSettings bind:kmlOptions on:change={update} on:save={setHistory}/> -->
      {:catch error}
        <p>😱: {error.message}</p>
      {/await}
    {:else}
        <div class="page">
        <!-- <Spinner size="60" colorOuter="#FF3E00" colorCenter="#40B3FF" colorInner="#676778" unit="px"></Spinner> -->
        <Home />
        </div>
    {/if}
  </div>
  {#if route === '/'}
    <div class="settings">
      <FormSettings bind:kmlOptions on:change={update} on:save={setHistory} />
      <!-- <Permalink {permalink}/> -->
    </div>
  {/if}
</main>


<style>

  .row.download > div {
    margin-top: 1em;
  }
  main.sidebar .settings {
    margin-right: 0;
  }
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
    .page {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
    }
    :global(.page > div, .page > small, .content > nav) {
      flex: 0 1 auto;
    }
    :global(#map) {
      flex: 1 1 auto;
    }
    .settings {
      margin-right: -260px;
      transition: margin-right 0.15s ease-out;
      background-color: #eee;
      padding: 5px;
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
