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
    import {slide} from 'svelte/transition';
    export let ofp;
    export let show = false;
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
<p>👍 {`${ofp.infos['flight']} : ${ofp.infos['departure']} -> ${ofp.infos['destination']}`}.
{#if copyPermission}
    {#if runningOnIpad}
        Vous pouvez <a role="button" on:click={click} href='lhs-mpilot://'>ouvrir mPilot et y coller la route</a> ou 
    {:else}
        Vous pouvez <a role="button" on:click={click} href='lhs-mpilot://'>copier</a> ou 
    {/if}
{:else}
    Vous pouvez 
{/if}
<a role="button" href="." on:click|preventDefault={toggle}>{(show) ? "masquer" : "afficher"}</a> la route Lido.
{#if copied}
    <span out:fade>copié!</span>
{/if}
</p>
{#if show}
    <div contenteditable="true" class="text-monospace" transition:slide >{lidoRoute}</div>
{/if}
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