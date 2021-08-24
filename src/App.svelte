<script>
  import {onMount} from 'svelte';
  import LidoRoute from "./components/LidoRoute.svelte";
  import Export from "./components/Export.svelte";
  import Home from "./components/Home.svelte";
  import Map from "./components/Map.svelte";
  import Navbar from "./components/Navbar.svelte";
  import OfpInput from './components/OfpInput.svelte';
  import Page from "./components/Page.svelte";
  import Help from "./components/Help.svelte";
  import SWUpdate from "./components/SWUpdate.svelte";
  import {storage, stores, validate, setHistory, storeSettingsFromURL} from "./components/mapSettings/storage.js";
  import {swDismiss, sidebar, route, checkSwOnVisibilityChange, ofp, ofpStatus, aircraftType, isHelpRoute} from "./stores.js";
  import HomePwaInstall from './components/HomePwaInstall.svelte';
  import {runningOnIpad} from './components/utils';

  const redirect = (requestedRoute) => {
    console.log(`unkwnown route ${requestedRoute}, redirecting to #/`, !!$ofp, $ofpStatus); 
    window.location.hash = '#/';
  }

  if (storage.getItem(stores.optionsKML) === null) storeSettingsFromURL(window.location.search);
  let kmlOptions = validate(storage.getItem(stores.optionsKML) || {}); //include default
  setHistory(kmlOptions, $route);

  const ofpChange = () =>{
    $sidebar = false;
    $swDismiss = false;
    //$showGramet = false; // this one is set in OfpInput instead
  };
  onMount(() => {
        document.addEventListener("visibilitychange", checkSwOnVisibilityChange, false);
        return () => document.removeEventListener("visibilitychange", checkSwOnVisibilityChange);
  });
</script>

<main class="container {$route.substr(1) || 'home'}">
  <div class="content">
    {#if ($route === '/install' || (navigator && navigator.standalone === false && runningOnIpad))}
      <HomePwaInstall/>
    {:else}
      <Navbar>
        <OfpInput {kmlOptions} on:change={ofpChange} />
      </Navbar>
      <SWUpdate prompt={!!$ofp}/>
      {#if ($ofp || $aircraftType) && $ofpStatus === 'success'}
        <Page hidden={$route !== '/map'}>
          <Map id="map" bind:kmlOptions ofp={$ofp} on:save={() => setHistory(kmlOptions, $route)}/>
        </Page>
      {/if}

      {#if ($ofpStatus === 'loading')}
        <Page><div style="margin: auto;">traitement en cours...</div></Page>
      {:else if $ofpStatus && $ofpStatus !== 'success' && $route === '/map'}
        <Page><p class="ofpError">😱: {$ofpStatus}</p></Page>
      {:else if ($route === '/export') && $ofpStatus === 'success'}
        <Page maxWidth="1400px">
          <Export {kmlOptions} on:save={() => setHistory(kmlOptions, $route)} />
          <LidoRoute />
        </Page>
      {:else if $route === '/'}
        <Page maxWidth="1400px">
          <Home />
        </Page>
      {:else if $isHelpRoute}
        <Page  maxWidth="1400px"><Help /></Page>
      {:else if !(($ofp || $aircraftType) && $route === '/map')}
        <!-- redirect -->
        { redirect($route) }
      {/if}
    {/if}
  </div>
</main>

<style>
  :global(html, body) {
    height: 100%;
    min-height: 100%;
    width: 100%;
    position: fixed;
    --blueaf: #002157; /* --royal-blue-dark */
    --blueaf_rgb: 9,34,84; /* rgba(var(--blueaf_rgb), 0.5) is valid */
    --redaf:#FA3C35; /* --tart-orange */
    --blood-red: #6B0504; /* for visited links */
    /*--green: #2CA58D; /* #28a745 */;
    --snow: #FFFBFF;
    --minion-yellow: #ECD444;
    --light-grey: #eee; /* used to print tables */
    --maximum-yellow-red: #FCBF49; /* used for warnings in LogWindow */
    --electric-blue: #87F1FF;
    --gramet-inner-height: 384px;
    --plane-color: var(--bs-yellow);
    --plane-halo-color: var(--plane-color);
    --bs4-cyan: #17a2b8;
    --bs4-info: #17a2b8;
  }
  .content{
    background-color: var(--blueaf);
    background-image: url("../svg/worldmap.svg");
    background-attachment: fixed;
    background-size: cover;
    transition:background-position 0.3s ease;
    width: 100%;
    padding: 0;
    flex-direction: column;
    display: flex;
  }
  main.map > .content {
    background-color: var(--bs-white);
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
    max-width: 100%;
    min-height: 100%;
    position: relative;
  }
  @media (max-width: 575px), (max-height: 575px)  { /* allow scrolling long pages */
    :global(html, body) {
      position: relative;
    }
    main.home, main.gramet, main.export {
      display:block;
    }
  }
  @media (min-width: 1400px) {
    main {
      width: 100%;
      margin-right: auto;
      margin-left: auto;
    }
  }
  .form-inline {
    padding-bottom: 2px;
  }
  :global(.btn) {
    text-transform: uppercase
  }
  :global(.form-control, .mapboxgl-ctrl-attrib, .btn) {
    user-select: none; /* supported by Chrome and Opera */
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    touch-action: manipulation;
  }
  .ofpError {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    background-color: var(--snow);
  }
  :global(.table td){
        padding: 0.5rem 0.75rem;
  }
  :global(label.input-group-text, label.form-control,.input-group-sm >.btn) {
    font-variant-caps: all-small-caps;
  }
  @media (hover:none), (hover:on-demand) {
    /* suppress hover effect on devices that don't support hover fully */
    :global(.focusmode .btn-outline-info:hover,.focusmode .btn-outline-info:active) { 
      color: var(--bs-info);
      background-color: white;
    }
    :global(.mapboxgl-ctrl button.mapboxgl-ctrl-layers:not(:disabled):hover){
      background-color: transparent;
    }
    :global(.btn-outline-secondary:not(:disabled):hover, .btn-outline-secondary:active){
      background-color: transparent;
      color: var(--bs-secondary);
    }
  }
  :global(a) {
    text-decoration: none;
  }
  :global(a:hover){
    text-decoration: underline;
  }
  :global(.overlay .card-header) {
    display:flex;
    align-items: center;
    padding: .5rem .75rem
  }
  :global(.overlay .card-body) {
    padding: .5rem .75rem;
    font-size: 0.875rem;
  }

</style>
