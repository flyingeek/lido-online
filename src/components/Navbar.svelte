<script>
    export let route;
    export let promise;
</script>
<nav class="navbar navbar-expand-md navbar-light bg-light">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item" class:active={route === '/'}>
      <a class="nav-link" href="#/">CONVERTISSEUR</a>
    </li>
    <li class="nav-item" class:active={route === '/gramet'}>
      <a class:disabled={!promise} class="nav-link" href="#/gramet">GRAMET</a>
    </li>
    <li class="nav-item" class:active={route === '/route'}>
      <a class:disabled={!promise} class="nav-link" href="#/route">ROUTE</a>
    </li>
    <li class="nav-item" class:active={route === '/help'}>
      <a class="nav-link" href="#/help">AIDE</a>
    </li>
  </ul>
  <slot></slot>
</nav>

<style>
    a.disabled {
        text-decoration: line-through;
    }
    nav {
        margin: 0 -10px;
    }
    @media (min-width: 768px) and (min-height: 700px) {
      nav {
        flex: 0 1 auto;
      }
    }
</style>