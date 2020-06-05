<script>
$: lidojsVersion = (window.editolido) ? ' / lidojs: v' + window.editolido.version : '';
$: sw = window.serviceWorker;
$: control = navigator.serviceWorker && navigator.serviceWorker.controller;
$: status = getStatus(sw)

const getStatus = (reg) => {
    if (!reg) return '';
    if (reg.installing) return "installing";
    if (reg.waiting) return "waiting";
    if (reg.active) return "active";
}
const skipWaiting = () => {
    if (sw.waiting) {
        sw.waiting.postMessage('SKIP_WAITING');
    }
}
const reload = () => {
    window.location.reload;
}

</script>

<div>
<p>Aplication version: APP_VERSION{lidojsVersion}</p>
{#if navigator.serviceWorker}
    {#if control}
    <p>La page est controllée par le service worker.</p>
    {:else}
    <p>La page n'est pas controllée par le service worker. <a href="." on:click|preventDefault={reload}>Installer</a></p>
    {/if}
    {#if status === 'waiting'}
    <p>Service Worker status: <a href="." on:click|preventDefault={skipWaiting}>{status}</a></p>
    {:else}
    <p>Service Worker status: {status} </p>
    {/if}
{/if}
</div>

<style>
    div {
        background-color: white;
        margin-top: 2em;
    }
</style>