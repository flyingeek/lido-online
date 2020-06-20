<script>
    export let route;
    export let promise;
</script>
<nav class="navbar navbar-expand-md navbar-light bg-light">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item" class:active={route === '/'}>
      <a class="nav-link" href="#/"><svg><use xlink:href="#home"/></svg></a>
    </li>
    {#if (promise) || route === '/map'}
    <li class="nav-item" class:active={route === '/map'}>
      <a class:disabled={!promise} class="nav-link" href="#/map">CARTE</a>
    </li>
    {/if}
    {#if  (promise && !promise.isFakeOfp) || route === '/gramet'}
    <li class="nav-item" class:active={route === '/gramet'}>
      <a class:disabled={!promise} class="nav-link" href="#/gramet" >GRAMET</a>
    </li>
    {/if}
    {#if  (promise && !promise.isFakeOfp) || route === '/export'}
    <li class="nav-item" class:active={route === '/export'}>
      <a class:disabled={!promise} class="nav-link" href="#/export" >EXPORT</a>
    </li>
    {/if}
    <li class="nav-item" class:active={route === '/help'}>
      <a class="nav-link" href="#/help" >AIDE</a>
    </li>
  </ul>
  <slot></slot>
</nav>

<style>
    a.disabled {
      text-decoration: line-through;
    }
    svg {
      width: 20px;
      height: 20px;
      margin-top: -2px;
      fill: rgba(0,0,0,.5);
    }
    .active svg {
      fill: rgba(0,0,0,.9);
    }
    nav {
      flex: 0 1 auto;
      margin: 0 -10px;
      position: static; /* for no ofp prompt */
    }
    @media (max-width: 767px){
      .nav-item.active {
        border-left: 2px solid var(--pink);
        border-bottom: none !important;
      }
      .nav-item {
        border-left: 2px solid transparent;
        padding-left: 1em;
        margin-left: -1em;
      }
    }
    .nav-item.active {
      border-bottom: 2px solid var(--pink);
    }
</style>