<script>
    import OfpInput from './OfpInput.svelte';
    export let promise=undefined;
    export let route;
    export let kmlOptions;
    export let sidebar;
</script>
<nav class="navbar navbar-expand-md navbar-light bg-light">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item" class:active={route === '/'}>
      <a class="nav-link" href="#/">Convertisseur</a>
    </li>
    <li class="nav-item" class:active={route === '/gramet'}>
      <a class:disabled={!promise} class="nav-link" href="#/gramet">Gramet</a>
    </li>
    <li class="nav-item" class:active={route === '/route'}>
      <a class:disabled={!promise} class="nav-link" href="#/route">Route</a>
    </li>
    <li class="nav-item" class:active={route === '/help'}>
      <a class="nav-link" href="#/help">Aide</a>
    </li>
  </ul>
  <form
    class:invisible={route === '/help'}
    class="form-inline my-2 my-lg-0"
    on:submit|preventDefault>
    <OfpInput bind:promise {kmlOptions} />
  </form>
    {#if route === '/'}
        <a
        class="hamburger"
        role="button"
        href="."
        on:click|preventDefault={() => (sidebar = !sidebar)}>
        <svg>
            <use xlink:href="#bars" />
        </svg>
        </a>
    {/if}
</nav>

<style>
    a.disabled {
        text-decoration: line-through;
    }
    nav {
        margin: 0 -10px;
    }
    svg {
      fill: #555;
      width: 20px;
      height: 20px;
    }
    .hamburger {
        display: none;
        margin: 10px 0px 1em 15px;
    }
    @media (min-width: 768px) and (min-height: 700px) {
        .hamburger {
            display: block;
        }
    }
</style>