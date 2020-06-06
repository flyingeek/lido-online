<script>
import {swDismiss} from "../store.js";
$: lidojsVersion = (window.editolido) ? ' / lidojs: v' + window.editolido.version : '';
let sw = window.serviceWorker;
if (!sw && navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((reg) => {
        sw = reg;
        return reg;
    });
}
let control = navigator.serviceWorker && navigator.serviceWorker.controller;
const defaultLabel = 'Vérifier Mise à jour';
let updateLabel = defaultLabel;

const getStatus = (reg) => {
    if (!reg) return {'code': 0, 'msg': '🔺 unknown'};
    if (reg.installing) return {'code': 1, 'msg': "🔹 installing"};
    if (reg.waiting) return {'code': 2, 'msg': "🔸 waiting"};
    if (reg.active) return {'code': 3, 'msg': "🟢"};
}

$: status = getStatus(sw);

const skipWaiting = () => {
    if (sw.waiting) {
        $swDismiss = true;
        sw.waiting.postMessage('SKIP_WAITING');
    }
}
const reload = () => {
    window.location.reload();
}
const checkUpdate = () => {
    updateLabel = "Vérification... ";
    $swDismiss = false;
    sw.update().then((reg) => {
        if (getStatus(reg).code !== 3)
        {
            updateLabel = "";
            sw = sw; // force update
        } else {
            updateLabel = "À jour";
        }
    }).catch((err) => updateLabel = err);
}
</script>

<div>
<p>Aplication version: *APP_VERSION{lidojsVersion}</p>
{#if navigator.serviceWorker}
    {#if control}
    <p>La page est controllée par le service worker.</p>
    {:else}
    <p>La page n'est pas controllée par le service worker. <a href="./index.html" on:click={reload}>Recharger la page</a></p>
    {/if}
    {#if status.code === 2}
    <p>Service Worker status: <span data-status={status.code}>{status.msg}</span><a href="." on:click|preventDefault={skipWaiting}>Installer</a></p>
    {:else}
    <p>Service Worker status: <span data-status={status.code}>{status.msg}</span>
        {#if status.code !== 0}
            {#if updateLabel === defaultLabel}
                <a href="." on:click|preventDefault={checkUpdate}>{updateLabel}</a>
            {:else}
                {updateLabel}
            {/if}
        {/if}
     </p>
    {/if}
{/if}
{#if navigator.standalone === true}
<p>En cas de problème: <a class="btn btn-danger" href="./index.html" on:click={reload}>Réinitialiser l'App</a></p>
{/if}
</div>


<style>
    div {
        background-color: white;
        margin-top: 2em;
    }
    span[data-status]{
        padding-right: 4px;
    }
</style>