<script>
    import {shareAppLink} from './utils';
</script>
<div class="row">
    <div class="col-12 col-lg-8">
        <h1><strong class="d-none">OFP2MAP </strong>Cartographie pour l'OFP</h1>
        <img src="svg/Air_France_Logo.svg" alt="logo Air France">
        {#if (navigator.standalone === true || 'process.env.NODE_ENV' === '"development"') && navigator.share}
            <button class="btn btn-link" on:click={shareAppLink}>Partager l'App</button>
        {:else}
            &nbsp;
        {/if}
    </div>
</div>
<style>
    div {
        padding: 0 2rem;
    }
    div>div {
        text-align: center;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        font-variant-caps: all-small-caps;
        color: white;
        display: flex;
        padding: 0.5rem;
        flex-direction: column;
        align-items: center;
        margin-top: 1rem;
        margin-bottom: 15px;
    }
    img{
        width: 100%;
        margin: 0 auto;
        display: block;
    }
    @media (min-width: 992px){
        div>div {
            margin: 3rem auto;
        }
    }
    button.btn{
        outline-color: var(--bs-yellow);
    }
</style>