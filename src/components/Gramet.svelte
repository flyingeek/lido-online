<script>
    import LidoRoute from "./LidoRoute.svelte";
    let status = 'loading';
    export let ofp
    $: src = "https://editolido.alwaysdata.net/proxy_gramet/" + ofp.ogimetData.route.name.replace(/[^a-z0-9\-_]/giu, '_') + ".png?url=" + encodeURIComponent(ofp.ogimetData.url)
</script>

<div>
    {#if status === 'error'}
        <p class="alert alert-info" role="alert">Erreur de récupération du Gramet, essayez ce lien.</p>
    {:else}
        <img {src} on:error={() => status = "error"} on:load={() => status = "success"} alt="gramet demo" class="img-fluid"/>
        <small class="form-text text-muted">
        Gramet généré par <a href={ofp.ogimetData.url} target="_blank">www.ogimet.com</a>,
        à partir d'une <span title="KATL_72215_KGSP_KNHK_KNEL_EGHE_EGJJ_LFPC_LFPG">route proche</span> de celle de l'OFP.
        <a href="http://www.ogimet.com/guia_gramet.phtml.en" target="_blank">Guide d'interprétation</a>.
        </small>
    {/if}
</div>
<LidoRoute {ofp} />

<style>
    img {
        min-height: 320px;
    }
</style>