<script>
    import {shareAppLink} from './utils';
</script>
<h1>Cartographie pour l'OFP 
    <img src="svg/Air_France_Logo.svg" alt="logo Air France">
    {#if (navigator.standalone === true || 'process.env.NODE_ENV' === '"development"') && navigator.share}
        <button class="btn btn-link" on:click={shareAppLink}>Partager l'App</button>
    {:else}
        &nbsp;
    {/if}
</h1>
<style>
    h1 {
        margin: 1.2em auto 1em auto;
        font-variant-caps: all-small-caps;
        color: white;
        text-align: center;
        background-color: rgba(0, 0, 0, 0.2);
    }
    h1 img{
        width: 100%;
    }
</style>