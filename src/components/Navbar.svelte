<script>
    import {aircraftType, ofp, route} from '../stores';
    import GrametTrigger from './GrametTrigger.svelte';
    import OfpInfos from './OfpInfos.svelte';
    import TakeOffInput from './TakeOffInput.svelte';
</script>
<nav class="navbar navbar-expand-md navbar-light">
  <input type="checkbox" id="menu">
  <label class="navbar-toggler" for="menu"><span class="navbar-toggler-icon"></span></label>
  <ul class="navbar-nav collapse navbar-collapse" id="navbarToggler">
    <li class="nav-item" class:active={$route === '/'}>
      <a class="nav-link" href="#/"><strong class="d-none">OFP2MAP </strong><svg><use xlink:href="#home-symbol"/></svg>{#if 'process.env.NODE_ENV' === '"development"'}<sup>dev</sup>{/if}</a>
    </li>
    {#if $ofp|| $aircraftType || $route === '/map'}
    <li class="nav-item" class:active={$route === '/map'}>
      <a class="nav-link" href="#/map">
      <span>CARTE</span></a>
    </li>
    {/if}
    {#if  ($ofp) || $route === '/export'}
    <li class="nav-item" class:active={$route === '/export'}>
      <a class="nav-link" href="#/export">
      <span>EXPORT</span></a>
    </li>
    {/if}
    <li class="nav-item" class:active={$route === '/help'}>
      <a class="nav-link" href="#/help">
      <span>AIDE</span></a>
    </li>
  </ul>
  {#if ($ofp) }
    {#if $route === '/map'}<GrametTrigger/>{/if}
    <TakeOffInput/>
    <OfpInfos/>
  {/if}
  <slot></slot>
</nav>

<style>
    #menu {
      display: none;
    }
    sup {
        background-color: var(--redaf);
        color: var(--white);
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: normal;
        font-size: xx-small;
        top: -10px;
        left: -3px;
        display: inline-block;
        line-height: 1em;
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
    nav {
      flex: 0 1 auto;
      position: static; /* for no ofp prompt on home page bottom */
      padding: 2px 10px 0px 10px;
      background-color: var(--light);
    }

    li {
      margin-right: 0px;
    }
    @media (min-width: 630px){
        li {
          margin-right: 10px;
        }
    }
    li span{
      display: inline-block;
    }
    @media (min-width: 768px){
      .nav-item.active {
        border-bottom: 2px solid var(--pink);
      }
    }
    @media (min-width: 830px){
      :global(nav > div) {
        margin-right: 2rem !important;
      }
      :global(nav > div.overlay) {
        margin-right: 0 !important;
      }
    }
    input:checked ~ .collapse{
        display: block;
    }
</style>