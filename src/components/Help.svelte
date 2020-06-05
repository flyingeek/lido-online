<script>
$: lidojsVersion = (window.editolido) ? ' / lidojs: v' + window.editolido.version : '';
let sw = window.serviceWorker;
let control = navigator.serviceWorker && navigator.serviceWorker.controller;
$: status = getStatus(sw)

const getStatus = (reg) => {
    if (!reg) return {'code': 0, 'msg': '🔺 unknown'};
    if (reg.installing) return {'code': 1, 'msg': "🔹 installing"};
    if (reg.waiting) return {'code': 2, 'msg': "🔸 waiting"};
    if (reg.active) return {'code': 3, 'msg': "🟢"};
}
const skipWaiting = () => {
    if (sw.waiting) {
        sw.waiting.postMessage('SKIP_WAITING');
    }
}
const reload = () => {
    window.location.reload();
}
</script>

<div>
<p>Aplication version: APP_VERSION{lidojsVersion}</p>
{#if navigator.serviceWorker}
    {#if control}
    <p>La page est controllée par le service worker.</p>
    {:else}
    <p>La page n'est pas controllée par le service worker. <a href="./index.html" on:click={reload}>Recharger la page</a></p>
    {/if}
    {#if status.code === 2}
    <p>Service Worker status: <span data-status={status.code}>{status.msg}</span> <a href="." on:click|preventDefault={skipWaiting}>Installer</a></p>
    {:else}
    <p>Service Worker status: <span data-status={status.code}>{status.msg}</span> </p>
    {/if}
{/if}
<p>En cas de problème en mode Application: <a class="btn btn-danger" href="./index.html" on:click={reload}>Recharger la page</a></p>
</div>

<style>
    div {
        background-color: white;
        margin-top: 2em;
    }
</style>