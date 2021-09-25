<script>
    const reload = () => {
    window.location.hash = '#/';
    console.log('reload page');
    window.location.reload();
};
</script>

<button class="reload btn btn-outline-secondary btn-sm" on:click={reload}><!-- Recharger --></button>

<style>
    .reload::before {
        content: "Recharger";
    }
    @media (min-width: 992px) {
        .reload::before{
                content: "Recharger l'App";
        }
    }
</style>