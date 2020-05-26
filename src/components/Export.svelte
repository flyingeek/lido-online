<script>
  import ShortcutsLink from "./ShortcutsLink.svelte";
  import DownloadButton from "./DownloadButton.svelte";
  export let ofp;
</script>

<div class="row">
    <div class="col-12 col-sm-6 col-md-6">
        <DownloadButton label="Télécharger" on:save />
        <small class="text-muted">Le fichier est généré en fonction des options choisies.</small>
    </div>
    <div class="col-12 col-sm-6 col-md-6">
        <ShortcutsLink {ofp} on:save />
        <small class="text-muted">Sur iOS on peut lancer un raccourci.
            <a href="https://www.icloud.com/shortcuts/8833e7fb6e484ec7be86ab9bd8c056d7" target="_blank">
                Exemple de raccourci
            </a>
        </small>
    </div>
</div>

<style>
    .row > div {
        margin-top: 1em;
        flex: 0 1 auto;
    }
    @media (min-width: 768px) and (min-height: 700px) {
        .row, small {
            flex: 0 1 auto;
        }
    }
</style>