<script>
    import {ofp, route} from '../stores';
</script>
<nav class="navbar navbar-expand-md navbar-light bg-light">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item" class:active={$route === '/'}>
      <a class="nav-link" href="#/"><svg><use xlink:href="#home-symbol"/></svg>{#if 'process.env.NODE_ENV' === '"development"'}<sup>dev</sup>{/if}</a>
    </li>
    {#if ($ofp) || $route === '/map'}
    <li class="nav-item" class:active={$route === '/map'}>
      <a class="nav-link" href="#/map">
      <svg class="f"><use xlink:href="#map-symbol"/></svg>
      <span>CARTE</span></a>
    </li>
    {/if}
    {#if  ($ofp && !$ofp.isFake) || $route === '/export'}
    <li class="nav-item" class:active={$route === '/export'}>
      <a class="nav-link" href="#/export">
      <svg class="f"><use xlink:href="#share-symbol"/></svg>
      <span>EXPORT</span></a>
    </li>
    {/if}
    <li class="nav-item" class:active={$route === '/help'}>
      <a class="nav-link" href="#/help">
      <svg class="f"><use xlink:href="#info-symbol"/></svg>
      <span>AIDE</span></a>
    </li>
  </ul>
  <slot></slot>
</nav>

<style>

    sup {
        background-color: var(--red);
        color: var(--white);
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: normal;
        margin-left: 4px;
        font-size: xx-small;
    }
    svg {
      width: 20px;
      height: 20px;
      margin-top: -2px;
      fill: rgba(0,0,0,.5);
      stroke: rgba(0,0,0,.5);
    }
    svg.f{
      display: none;
    }
    span{
      display: inline-block;
    }
    .active svg {
      fill: rgba(0,0,0,.9);
      stroke: rgba(0,0,0,.9);
    }
    nav {
      flex: 0 1 auto;
      position: static; /* for no ofp prompt on home page bottom */
      padding: 2px 10px 0px 10px;
    }
    ul {
      flex-direction: row;
    }
    li {
      margin-right: 10px;
    }
    .nav-item.active {
      border-bottom: 2px solid var(--pink);
    }
    @media (max-width: 500px){
      svg.f {
        display: inline-block;
      }
      span {
        display: none;
      }
      li {
        margin-right: 15px;
      }
    }
</style>