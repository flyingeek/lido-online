<script>
  import ShortcutsLink from "./ShortcutsLink.svelte";
  import DownloadButton from "./DownloadButton.svelte";
  import ExportSettings from "./ExportSettings.svelte";
  export let kmlOptions;
</script>
<div class="card mb-3">
  <div class="card-body">
    <div class="row">
        <div class="col-12 col-md-6 d-flex pt-2 pt-md-0">
            <form on:submit|preventDefault class="settings">
                <fieldset class="form">
                    <legend>Réglages pour l'export</legend>
                    <ExportSettings mapOptions={kmlOptions}/>
                </fieldset>
            </form>
        </div>
        <div class="col-12 col-md-6 d-flex export">
            <form on:submit|preventDefault class="settings">
                <fieldset class="form">
                    <legend>Export</legend>
                    <fieldset class="form-group">
                        <legend>KML</legend>
                        <p>Choisissez un format (MapsMe, Avenza Maps ou Google Earth) et téléchargez le fichier KML.</p>
                        <DownloadButton label="Télécharger" on:save />
                    </fieldset>
                    <fieldset class="form-group mt-4">
                        <legend>Raccourcis</legend>
                        <p>Sur iOS on peut lancer un raccourci.
                            <a href="https://www.icloud.com/shortcuts/886cc07d24d74d83bb0859643242c2df" target="_blank">
                                Exemple de raccourci à installer
                            </a>. Le raccourci reçoit le KML, la route Lido et le GRAMET.
                        </p>
                    <ShortcutsLink on:save /> 
                </fieldset>
            </form>
        </div>
    </div>
  </div>
</div>

<style>
    form {
        width: 100%;
    }

    @media (max-width: 575px){
        .col-12 {
            padding-left: 0;
            padding-right: 0;
        }
        .export{
            margin-top: 1.5rem;
        }
    }

    .card {
        margin: 1.5rem 1rem;
        background-color: rgba(255,255,255,0.89);
    }
    fieldset.form {
        border: 1px solid var(--blueaf);
        padding: 5px 10px;
        width: 100%;
        height: 100%;
    }
    fieldset.form > legend {
        background-color: var(--blueaf);
        color: #fff;
        padding: 3px 6px;
        width: auto;
        font-variant: none;
        border-radius: 0.2rem;
    }
</style>