<script>
    import {aircraftType, ofp, route} from '../stores';
    import {grametStatus} from '../actions/grametAction';
    import GrametTrigger from './GrametTrigger.svelte';
    import OfpInfos from './OfpInfos.svelte';
    import TakeOffInput from './TakeOffInput.svelte';
    import ReloadButton from './ReloadButton.svelte';
    import ShareAppButton from './ShareAppButton.svelte';
    import Sun from './Sun.svelte';
    import {getContextualHelpLink} from './Help.svelte';
    import { focusMap } from './utils';

    let menuCheckBox;
    const collapse = (e) => {
        menuCheckBox.checked = false;
        if (e.target.href === '#/map') {
          window.location.hash = '/map';
          e.preventDefault();
          e.stopPropagation();
          focusMap();
        }
    };

    $: contextualHelpLink = getContextualHelpLink($route);

</script>
<nav class="navbar navbar-expand-md navbar-light">
  <div class="container-fluid">
  <input bind:this={menuCheckBox} type="checkbox" id="menu">
  <!-- following items are in reverse order to have the menu collapse nicely -->
  <slot></slot>
  {#if ($ofp) }
    <OfpInfos/>
    {#if $route === '/map'}<TakeOffInput/>{#if $grametStatus != 'reload'}<GrametTrigger/>{/if}<Sun/>{/if}
  {/if}
  <label class="navbar-toggler" for="menu"><span class="navbar-toggler-icon"></span></label>
  <!-- end of items in reverse order -->

  <!-- collapsable menu -->
  <ul class="navbar-nav collapse navbar-collapse" id="navbarToggler">
    <li class="nav-item" class:active={$route === '/'}>
      <a class="nav-link" href="#/" on:click={collapse} style="text-decoration: none; position: relative">
        <strong class="d-none d-lg-inline  ofp2map">OFP2MAP</strong>
        <svg class="d-xxl-none d-xl-none d-lg-none"><use xlink:href="#home-symbol"/></svg>
        {#if 'process.env.NODE_ENV' === '"development"'}<sup>dev</sup>{/if}
    </a>
    </li>
    {#if $ofp|| $aircraftType || $route === '/map'}
    <li class="nav-item" class:active={$route === '/map'}>
      <a class="nav-link" href="#/map" on:click={collapse}>
      <span>CARTE</span></a>
    </li>
    {/if}
    {#if  ($ofp) || $route === '/export'}
    <li class="nav-item" class:active={$route === '/export'}>
      <a class="nav-link" href="#/export" on:click={collapse}>
      <span>EXPORT</span></a>
    </li>
    {/if}
    {#if  ($ofp) || $route === '/ftl'}
    <li class="nav-item" class:active={$route === '/ftl'}>
      <a class="nav-link" href="#/ftl" on:click={collapse}>
      <span>FTL</span></a>
    </li>
    {/if}
    <li class="nav-item" class:active={$route === '/help'}>
      <a class="nav-link" href="{contextualHelpLink.href}" on:click={collapse}>
      <span>AIDE{#if contextualHelpLink.name}<small class="d-none d-lg-inline-block text-small-caps">/{contextualHelpLink.name}</small>{/if}</span></a>
    </li>
    {#if navigator.standalone === true || 'process.env.NODE_ENV' === '"development"'}
    <li class="nav-item reload">
      {#if navigator.share}<ShareAppButton/>{/if}
      <ReloadButton/>
    </li>
    {/if}
  </ul>
  </div>
</nav>

<style>
    #menu {
      display: none;
    }
    sup {
        background-color: var(--redaf);
        color: var(--bs-white);
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: normal;
        font-size: xx-small;
        position: absolute;
        top: 5px;
        right: -10px;
        display: inline-block;
        line-height: 1em;
        /* display: none; */
    }
    svg {
      width: 20px;
      height: 20px;
      margin-top: -2px;
      fill: rgba(0,0,0,.5);
      stroke: rgba(0,0,0,.5);
    }
    .active svg {
      fill: rgba(0,0,0,.9);
      stroke: rgba(0,0,0,.9);
    }
    .navbar {
      padding-top: 0;
      padding-bottom: 0;
    }
    nav > .container-fluid{
      flex: 0 1 auto;
      position: static; /* for no ofp prompt on home page bottom */
      padding: 2px 10px 0 10px;
      background-color: var(--bs-light);
      flex-direction: row-reverse;
    }

    li {
      margin-right: 0;
      padding-left: 10px;
    }
    li.reload {
      margin-top: 10px;
      margin-bottom: 5px;
    }
    @media (min-width: 630px){
        li {
          margin-right: 10px;
        }
        :global(nav > div > div) {
          margin-right: 0.8rem;
        }
    }
    li span{
      display: inline-block;
    }
    .nav-item.active {
      border-left: 2px solid var(--bs-pink);
    }
    @media (min-width: 768px){
      li {
        padding-left: 0;
      }
      li.reload {
        display: none;
      }
      .nav-item.active {
        border-bottom: 2px solid var(--bs-pink);
        border-left: none;
      }
    }
    @media (min-width: 870px){
      :global(nav > div > div) {
        margin-right: 1.6rem !important;
      }
    }
    input:checked ~ .collapse{
        display: block;
    }
    .nav-link small{
      color: rgba(0,0,0,.4);
    }
    .nav-link {
      outline-offset: -3px;
    }
    .ofp2map {
      text-decoration: none !important;
      font-size: 0.875em;
      font-weight: 600;
      letter-spacing: 1px;
    }
</style>
