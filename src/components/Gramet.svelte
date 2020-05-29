<script>
    import LidoRoute from "./LidoRoute.svelte";
    let status = 'loading';
    export let ofp
</script>

<div>
    {#if status === 'error'}
        <p>😱: Erreur de récupération du Gramet, essayez de voir sur <a href={ofp.ogimetData.url} target="_blank">ogimet</a> pourquoi.</p>
    {:else}
        <h1>Le GRAMET est un météogramme représentant le temps et l'espace. Il indique, en tout point de la route,
        et à l'heure de passage estimée, une coupe verticale de la météo prévue.
        <a class="text-warning" href="http://www.ogimet.com/guia_gramet.phtml.en" target="_blank">Guide d'interprétation</a></h1>
        <div class="text-center">
            {#if status === 'loading'}
            <div class="spinner-border text-warning" role="status">
              <span class="sr-only">Loading...</span>
            </div>
            {/if}
            <img src={ofp.ogimetData.proxyImg} on:error={() => status = "error"} on:load={() => status = "success"} alt="gramet demo" class="img-fluid"/>
        </div>
        <div class="row">
            <div class="card-deck">
                <div class=" col-12 col-sm-6 col-md-6 col-xl-6"><div class="card ogimet">
                <div class="card-header">Route Ogimet</div>
                <div class="card-body">
                    <p class="card-text">Le GRAMET est réalisé par <a class="text-warning" href={ofp.ogimetData.url} target="_blank">www.ogimet.com</a> à partir
        d'une route calculée. Il est possible d'afficher la route sur la carte. Celà est
        particulièrement utile lors des vols océaniques car il n'y a aucune station en mer.</p>
                </div>
                </div></div>
                <div class="col-12 col-sm-6 col-md-6 col-xl-6"><div class="card ogimet2">
                <div class="card-header">Algorithme de calcul</div>
                <div class="card-body">
                    <p class="card-text">Après avoir sélectionner les stations météo proches de la route (13000 dans le monde), 
                    une minimisation du "cross track error" est effectué pour réduire le nombre de points. 21 points est la
                    limite maximale pour Ogimet.</p>
                </div>
                </div></div>
            </div>
        </div>
    {/if}
</div>
<style>
    img {
        min-height: 320px;
        max-height: 360px;
    }
    h1{
        padding: 1em;
        color: white;
        background-color: rgba(0, 0, 0, 0.5);
        font-size: 1.2rem;
        font-weight: normal;
        margin: 1em;
    }
    .card-header {
        font-variant-caps: all-small-caps;
    }
    .card {
        color: white;
        background-color: rgba(0, 0, 0, 0.2);
        margin: 15px;
    }
    .ogimet .card-header {
        background-color: var(--yellow);
    }
    .ogimet2 .card-header {
        background-color: var(--pink);
    }
</style>