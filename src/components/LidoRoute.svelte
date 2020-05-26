<script context="module">
    import {runningOnIpad} from "./utils.js";
    let copyPermission = false;
    try {
        navigator.permissions.query({name: "clipboard-write"}).then((result) => {
            if (result.state == "granted" || result.state == "prompt") {
                copyPermission = true;
            }
        });
    }catch(err) {
        console.log(err);
    }

    function copyText(text) {
        let success = true;
        try {
            navigator.clipboard.writeText(text);
        } catch (err) {
            console.log(err);
            success = false;
        }
        return success;
    }
</script>
<script>
    import { fade } from 'svelte/transition';
    export let ofp;
    const lidoRoute = (ofp) ? ofp.lidoRoute().join(' ') : '';
    let copied = false;
    const click = (e) => {
        e.target.classList.remove("hasactive");
        const success = copyText(lidoRoute);
        if (!runningOnIpad) {
            copied = success;
            setTimeout(function () {
                copied = false;
            }, 1500);
            e.preventDefault();
        }
    };
    const toggle = (e) => {
        e.target.classList.remove("hasactive");
        show = !show;
    }
</script>
<div class="card mb-3">
  <!-- <img class="card-img-top" src="./lido1.jpg" alt="Card image cap"> -->
  <div class="card-body">
    <h5 class="card-title">Route Lido</h5>
    <p class="card-text">Cette route est optimisée par rapport à celle de PilotMission car elle utilise les airways. Utiliser cette route permet
d'avoir une application Lido plus réactive.</p>
    {#if copyPermission}
        {#if true || runningOnIpad}
            <a role="button" class="btn btn-primary" on:click={click} href='lhs-mpilot://'>ouvrir mPilot <sup>*</sup></a>
        {:else}
            <a role="button" class="btn btn-primary" on:click={click} href='lhs-mpilot://'>copier la route</a>
        {/if}
    <p class="card-text"><small class="text-muted"><sup>*</sup> Une fois dans l'application mPilot, il vous suffit de faire un coller: la route aura été copiée automatiquement.</small></p>
    {/if}

    <div contenteditable="true" class="text-monospace">{lidoRoute}</div>
{#if copied}
    <span out:fade>copié!</span>
{/if}
  </div>
</div>


<style>
    span {
        padding: 2px 2px;
        color: #fff;
        background-color: #1ea840;
        border-radius: 3px;
    }
    div.text-monospace {
        text-align: left;
    }
</style>