<script>
import {swDismiss} from "../store.js";
$: lidojsVersion = (window.editolido) ? ' / lidojs: v' + window.editolido.version : '';
let sw = window.serviceWorker;
let swRunning = true;

if (!sw && navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((reg) => {
        sw = reg;
        return reg;
    }).catch(err => swRunning = false);
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
$: controlled = control && swRunning;

const skipWaiting = () => {
    if (sw.waiting) {
        $swDismiss = true;
        sw.waiting.postMessage('SKIP_WAITING');
    }
}
const reload = () => {
    window.location.reload();
}
const reinit = (e) => {
    const result = window.confirm("Vous devez être connecté au réseau, ceci ne devrait être utile qu'en cas de bug, Réinitialiser ?");
    if (result) {
        if (sw) sw.unregister();
        reload();
    } else {
        e.preventDefault();
        return false;
    }
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
<p>Application version: APP_VERSION{lidojsVersion}</p>
{#if navigator.serviceWorker}
    {#if !controlled}
    <p>La page n'est pas controllée par le service worker. <a href="./index.html" on:click={reload}>Recharger la page</a></p>
    {:else if status.code === 2}
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
<p>En cas de problème:</p>
<p><a class="btn btn-primary btn-sm" href="./index.html" on:click={reload}>Recharger l'App</a> c'est l'équivalent d'un rechargement de page.</p>
<p><a class="btn btn-danger btn-sm" href="./index.html" on:click={reinit}>Réinitialiser l'App</a> va en plus réinitialiser le service Worker (il faut être connecté).</p>
<p>Dans les 2 cas vos réglages sont conservés mais l'OFP est remis à zéro.</p>
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