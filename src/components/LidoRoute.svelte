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
    import { fly } from 'svelte/transition';
    import {slide} from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    export let ofp;
    export let show = false;
    const lidoRoute = (ofp) ? ofp.lidoRoute().join(' ') : '';
    let copied = false;
    const onClick = (e) => {
        const success = copyText(lidoRoute);
        if (!runningOnIpad) {
            copied = success;
            setTimeout(function () {
                copied = false;
            }, 1500);
            e.preventDefault();
        }
    };
</script>

<h2><input bind:checked={show} name="show-route" type="checkbox" class="form-check-input position-static"/> Route Lido
    {#if copyPermission}
        <a on:click={onClick} href='lhs-mpilot://'>
        {#if runningOnIpad}
            ouvrir mPilot
        {:else}
            <svg><use xlink:href="#clippy"></use></svg>
        {/if}
        </a>
    {/if}
    {#if copied}
        &nbsp;<span transition:fly="{{delay: 0, duration: 300, x: -30, y: 0, opacity: 0.5, easing: quintOut}}">copié!</span>
    {/if}
</h2>
{#if show}
    <div contenteditable="true" class="text-monospace" transition:slide >{lidoRoute}</div>
{/if}
<style>
    span {
        font-size: 0.4em;
        padding: 2px 3px;
        color: #fff;
        background-color: #1ea840;
        border-radius: 3px;
        display: inline-block;
    }
    svg {
        height: 16px;
        width: 14px;
    }
    div.text-monospace {
        text-align: left;
    }
</style>