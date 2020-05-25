<script>
    let src = "https://editolido.alwaysdata.net/proxy_gramet/AF681_KATL-LFPG_11Mar2020_2235z_OFP_6_0_1INTE.png?url=http%3A//www.ogimet.com/display_gramet.php%3Flang%3Den%26hini%3D0%26tref%3D1590133391%26hfin%3D8%26fl%3D350%26hl%3D3000%26aero%3Dyes%26wmo%3DKATL_72215_KGSP_KNHK_KNEL_EGHE_EGJJ_LFPC_LFPG%26submit%3Dsubmit";
    let status = 'loading';
</script>

<div>
    {#if status === 'error'}
        <p class="alert alert-info" role="alert">Erreur de récupération du Gramet, essayez ce lien.</p>
    {:else}
        <img {src} on:error={() => status = "error"} on:load={() => status = "success"} alt="gramet demo" class="img-fluid"/>
        <small class="form-text text-muted">
        Gramet généré par <a href="http://www.ogimet.com/display_gramet.php?lang=en&amp;hini=0&amp;tref=1589809631&amp;hfin=8&amp;fl=350&amp;hl=3000&amp;aero=yes&amp;wmo=KATL_72215_KGSP_KNHK_KNEL_EGHE_EGJJ_LFPC_LFPG&amp;submit=submit" target="_blank">www.ogimet.com</a>,
        à partir d'une <span title="KATL_72215_KGSP_KNHK_KNEL_EGHE_EGJJ_LFPC_LFPG">route proche</span> de celle de l'OFP.
        <a href="http://www.ogimet.com/guia_gramet.phtml.en" target="_blank">Guide d'interprétation</a>.
        </small>
    {/if}
</div>


<style>
    img {
        min-height: 320px;
    }
</style>