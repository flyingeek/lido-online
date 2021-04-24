<script>
  import ShortcutsLink from "./ShortcutsLink.svelte";
  import DownloadButton from "./DownloadButton.svelte";
</script>
<div class="card mb-3">
  <div class="card-body">
    <h5 class="card-title">Export</h5>
    <div class="row">
        <div class="col-12 col-sm-6 col-md-6">
            <DownloadButton label="Télécharger" on:save />
            <small class="text-muted">Le fichier est généré en fonction des options choisies sur la carte.</small>
        </div>
        <div class="col-12 col-sm-6 col-md-6">
            <ShortcutsLink on:save /> 
            <small class="text-muted">Sur iOS on peut lancer un raccourci.
                <a href="https://www.icloud.com/shortcuts/886cc07d24d74d83bb0859643242c2df" target="_blank">
                    Exemple de raccourci à installer
                </a>
            </small>
        </div>
    </div>
  </div>
</div>

<style>
    .card {
        margin: 2rem 1rem 1rem 1rem;
        background-color: rgba(255,255,255,0.89);
    }
</style>