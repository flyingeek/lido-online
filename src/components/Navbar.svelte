<script>
    export let route;
    export let promise;
    const share = async () => {
      const shareData = {
        'title': 'OFP2MAP',
        'url': window.location.pathname
      };
      try {
        await navigator.share(shareData)
      } catch(err) {
        console.log(err);
      }
      return false;
    }
</script>
<nav class="navbar navbar-expand-md navbar-light bg-light">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item" class:active={route === '/'}>
      <a class="nav-link" href="#/"><svg><use xlink:href="#home"/></svg></a>
    </li>
    {#if (promise) || route === '/map'}
    <li class="nav-item" class:active={route === '/map'}>
      <a class:disabled={!promise} class="nav-link" href="#/map">
      <svg class="f"><use xlink:href="#marker"/></svg>
      <span>CARTE</span></a>
    </li>
    {/if}
    {#if  (promise && !promise.isFakeOfp) || route === '/gramet'}
    <li class="nav-item" class:active={route === '/gramet'}>
      <a class:disabled={!promise} class="nav-link" href="#/gramet">
      <svg class="f"><use xlink:href="#cloud"/></svg>
      <span>GRAMET</span></a>
    </li>
    {/if}
    {#if  (promise && !promise.isFakeOfp) || route === '/export'}
    <li class="nav-item" class:active={route === '/export'}>
      <a class:disabled={!promise} class="nav-link" href="#/export">
      <svg class="f"><use xlink:href="#export"/></svg>
      <span>EXPORT</span></a>
    </li>
    {/if}
    <li class="nav-item" class:active={route === '/help'}>
      <a class="nav-link" href="#/help">
      <svg class="f"><use xlink:href="#info"/></svg>
      <span>AIDE</span></a>
    </li>
    {#if (promise && navigator.share)}
    <li class="nav-item optional">
      <a class="nav-link" href="." on:click|preventDefault={share}>PARTAGER</a>
    </li>
    {/if}
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
    svg.f{
      display: none;
    }
    span{
      display: inline-block;
    }
    .active svg {
      fill: rgba(0,0,0,.9);
    }
    nav {
      flex: 0 1 auto;
      margin: 0 -10px;
      position: static; /* for no ofp prompt */
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
    @media (max-width: 767px) {
      li.optional {
        display: none;
      }
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