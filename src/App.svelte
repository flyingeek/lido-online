<script>

  import LidoRoute from "./components/LidoRoute.svelte";
  import { kmlRegex } from "./components/KmlColor.svelte";
  import Export from "./components/Export.svelte";
  import Gramet from "./components/Gramet.svelte";
  import Home from "./components/Home.svelte";
  import Map from "./components/Map.svelte";
  import Navbar from "./components/Navbar.svelte";
  import OfpInput from './components/OfpInput.svelte';
  import Page from "./components/Page.svelte";
  import Help from "./components/Help.svelte";
  import SWUpdate from "./components/SWUpdate.svelte";
  import {storage, stores, validate, saved, storeSettingsFromURL} from "./components/storage.js";
  import {swDismiss, sidebar} from "./store.js";

  let route = "/";
  let permalink = window.location.href;
  let promise = undefined;
  storeSettingsFromURL(window.location.search);
  let kmlOptions = validate(storage.getItem(stores.optionsKML) || {}); //include default
  const hashchange = (e) => {
    const meta = document.querySelector( "meta[name=viewport]" );
    const metaContent = (meta) ? meta.getAttribute( "content" ) : '';
    route = window.location.hash.substr(1) || "/";
    if (!promise && (route === '/map' || route === '/gramet' || route === '/export')) {
      route = '/';
    }
    if (route === '/map') {
      if ($sidebar) $sidebar = false;
      if (metaContent) meta.setAttribute('content', metaContent + ',maximum-scale=1'); 
    } else {
      if (metaContent) meta.setAttribute('content', metaContent.replace(',maximum-scale=1', ''));
    }
  };
  hashchange();

  const setHistory = (e) => {
    const stateObj = saved(kmlOptions);
    let query = Object.entries(stateObj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    permalink =
      window.location.origin +
      window.location.pathname +
      (query ? "?" + query : "") +
      '#' + route;
    history.replaceState(stateObj, "Mon OFP2MAP", permalink);
  };
  setHistory();

  const ofpChange = () => {
    if ($sidebar) $sidebar = false;
    if ($swDismiss) $swDismiss = false;
    if (window.serviceWorker && window.serviceWorker.update) window.serviceWorker.update().catch((err) => console.log('failed to update sw'));
  }
</script>

<main class="container {route.substr(1) || 'home'}">
  <div class="content">
    <Navbar {promise} {route}>
        <form class:invisible={route === '/help'} class="form-inline" on:submit|preventDefault>
          <OfpInput bind:promise {kmlOptions} on:change={ofpChange} />
        </form>
    </Navbar>
    <SWUpdate loaded={!!promise}/>
    <!-- START We do not want the map element to disappear from the dom -->
    {#if promise}
      {#await promise}
        <!-- this cause the map to reinitialize-->
        <Page hidden={route !== '/map'}><div style="margin: auto;">traitement en cours...</div></Page>
      {:then ofp}
        <Page hidden={route !== '/map'}>
          <Map id="map" bind:kmlOptions {ofp} {route} on:save={setHistory}/>
        </Page>
      {:catch error}
        <p class:d-none={route !== '/map'}>😱: {error.message}</p>
      {/await}
    {/if}
    <!-- END of We do not want the map element to disappear from the dom (to keep cache)-->
    {#if (route === '/gramet' || route === '/export')}
      {#await promise}
        <Page><div style="margin: auto;">traitement en cours...</div></Page>
      {:then ofp}
        {#if route === '/gramet'}
            <Page><Gramet {ofp}/></Page>
        {:else if route === '/export'}
            <Page>
            <Export {ofp} on:save={setHistory} />
            <LidoRoute {ofp}/>
            </Page>
        {/if}
      {:catch error}
        <p>😱: {error.message}</p>
      {/await}
    {:else if route === '/'}
      <Page>
        <Home />
      </Page>
    {:else if route === '/help'}
      <Page><Help /></Page>
    {/if}
  </div>
</main>
<svelte:window on:hashchange={hashchange}/>

<style>
  :global(html, body) {
    height: 100%;
    min-height: 100%;
    width: 100%;
    position: fixed;
    --blueaf: #002157
  }
  .content{
    background-color:var(--blueaf);
    background-image: url("../svg/worldmap.svg");
    background-attachment: fixed;
    background-size: cover;
    transition:background-position 0.3s ease;
    width: 100%;
    padding: 0 10px 10px 10px;
    flex-direction: column;
    display: flex;
  }
  main.map > .content {
    background-color: var(--white);
    background-image: none;
  }
  main.help >.content {
    background-position-x: center;
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
    position: relative;
  }
  form {
      margin-right: 30px; /* for hamburger */
  }
  @media (max-width: 767px), (max-height: 700px) {
    :global(html, body) {
      position: relative;
    }
    main.map {
      display:block;
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
