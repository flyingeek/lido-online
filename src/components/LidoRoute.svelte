<script context="module">
    import {runningOnIpad} from "./utils.js";
    let copyPermission = false;
    if (navigator.permissions) {
        try {
            navigator.permissions.query({name: "clipboard-write"}).then((result) => {
                if (result.state == "granted" || result.state == "prompt") {
                    copyPermission = true;
                }
            });
        }catch(err) {
            console.log(err);
        }
    }
</script>
<script>
    import { tick, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import {ofp} from '../stores';
    let valueCopy = null;
    let areaDom;
    const lidoRoute = (!!$ofp) ? $ofp.lidoRoute(false).join(' ') : '';
    let copied = false;
    let timeOut;
    const click = (e) => {
        const success = copyText(lidoRoute);
        if (!runningOnIpad) {
            copied = success;
            timeOut = setTimeout(function () {
                copied = false;
                if (timeOut) clearTimeout(timeOut);
            }, 3000);
            e.preventDefault();
        }
    };

    async function copyText(text) {
        let success = true;
        if (copyPermission) {
            navigator.clipboard.writeText(text).then(() => success = true, () => success = false) ;
        }
        else {
            valueCopy = text;
            await tick();
            areaDom.focus();
            areaDom.select();
            try {
                success = document.execCommand('copy');
                if (!success) {
                    console.log('copy command failed');
                }
            } catch (err) {
                success = false;
                console.log('failed to copy');
            }
            valueCopy = null;
        }
        return success;
    }
    onDestroy(() => {
        if (timeOut) clearTimeout(timeOut);
    });
</script>
{#if valueCopy != null}
    <textarea bind:this={areaDom}>{valueCopy}</textarea>
{/if}
<div class="card mb-3">
    <div class="card-body">
        <h5 class="card-title">Route Lido</h5>
        <div class="row mb-3">
            <div class="col-12 col-md-9">
                <p class="card-text">Cette route est optimisée par rapport à celle de PilotMission car elle utilise les airways. Utiliser cette route permet
                    d'avoir une application Lido plus réactive.</p>
            </div>
            <div class="text-md-right col align-self-center col-12 col-md-3 py-3 py-md-0">
                {#if runningOnIpad}
                    <a role="button" class="btn btn-primary" on:click={click} href='lhs-mpilot://'>ouvrir mPilot <sup>*</sup></a>
                {:else}
                    <a role="button" class="btn btn-primary" on:click={click} href='lhs-mpilot://'>copier la route</a>
                {/if}
            </div>
        </div>
        {#if runningOnIpad}
            <div class="card-text">
                <small class="text-muted"><sup>*</sup> Une fois dans l'application mPilot,
                il vous suffira de faire un coller (la route aura été copiée automatiquement).</small>
            </div>
        {/if}
        <div class="text-monospace">{lidoRoute}
            {#if copied}
                <span out:fade>copié!</span>
            {/if}
        </div>
    </div>
</div>


<style>
    .card {
        flex: 0 1 auto;
        min-height: 1px;
        margin: 0.5rem 1rem;
    }
    span {
        padding: 2px 2px;
        color: #fff;
        background-color: #1ea840;
        border-radius: 3px;
        position: absolute;
        right: 0;
        top: 0;
    }
    div.text-monospace {
        text-align: left;
        position: relative;
        padding: 0.5em 1em 0.3em 1em;
        border: 1px dashed #ccc;
        max-height: 150px;
        overflow-y: auto;
    }
    textarea {
        position: fixed;
        top: 0;
        left: 0;
        width: 2em;
        height: 2em;
        padding: 0;
        border: none;
        outline: none;
        box-shadow: none;
        background: transparent;
    }
</style>