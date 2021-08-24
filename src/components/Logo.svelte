<script>
    import {shareAppLink} from './utils';
</script>
<div>
    <h1><strong class="d-none">OFP2MAP </strong>Cartographie pour l'OFP</h1>
    <img src="svg/Air_France_Logo.svg" alt="logo Air France">
    {#if (navigator.standalone === true || 'process.env.NODE_ENV' === '"development"') && navigator.share}
        <button class="btn btn-link" on:click={shareAppLink}>Partager l'App</button>
    {:else}
        &nbsp;
    {/if}
</div>
<style>
    div {
        text-align: center;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 1em;
        margin: 1.2em auto 1em auto;
        font-variant-caps: all-small-caps;
        color: white;
        min-width: 50vw;
    }
    img{
        width: 40vw;
        margin: 0 auto;
        display: block;
    }
</style>