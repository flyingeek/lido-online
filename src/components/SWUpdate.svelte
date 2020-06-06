<script>
    import {swDismiss} from "../store.js";
    export let loaded = false;
    const install = (reg) => {
        //$swDismiss = true;
        reg.waiting.postMessage('SKIP_WAITING');
    }
</script>

{#await window.isSWUpdateAvailable.promise then registration}
{#if registration && !$swDismiss}
<div class="toast" style="position: absolute; top: 0; right: 0;">   
    <div class="toast-header">
        <strong class="mr-auto"><span>👨🏻‍✈️</span>Mise à jour disponible</strong>
        <button type="button" class="ml-2 mb-1 close" aria-label="Close" on:click={() => $swDismiss=true}>
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
    <div class="toast-body text-center">
        {#if !loaded}
        <p>Celà va recharger l'App</p>
        {:else}
        <p>Il faudra recharger l'OFP</p>
        {/if}
        <button class:btn-primary={!loaded} class:btn-danger={loaded} type="button" class="btn" on:click={() => install(registration)}>Installer</button>
    </div>
</div>
{/if}
{/await}
<style>
    .toast {
        opacity: 1;
        z-index: 5;
    }
    strong>span {
        padding-right: 1em;
    }

</style>