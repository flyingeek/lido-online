<script context="module">
    import {semverCompare} from "./utils";
    /**
     * filter or slice the json changelog
     * @param json the json changelog
     * @param {version, limit} if version, returns entries > version, if limit returns at max limit entries
     */
    export const filterChangeLog = (json, {version, limit}={}) => {
        if (!json) return [];
        let filtered = Object.entries(json.CHANGELOG);
        if (version) {
            filtered = filtered.filter(([k,]) => {
                const v = k.match(/\[([^\]]+)\]/);
                return (v) ? semverCompare(v[1], version) > 0 : false;
            });
        }
        return (limit) ? filtered.slice(0, limit + 1) : filtered;
    };
    export function parseMarkdown(markdownText) {
        const htmlText = markdownText
            //.replace(/^### (.*$)/gim, '<h3>$1</h3>')
            //.replace(/^## (.*$)/gim, '<h2>$1</h2>')
            //.replace(/^# (.*$)/gim, '<h1>$1</h1>')
            //.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\*\*(.+?)\*\*/gim, '<b>$1</b>')
            .replace(/\*(.+?)\*/gim, '<i>$1</i>')
            .replace(/~~(.+?)~~/gim, '<s>$1</s>')
            //.replace(/\*(.*)\*/gim, '<i>$1</i>')
            //.replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
            .replace(/\[(.+?)\]\((#.*?)\)/gim, "<a href='$2'>$1</a>")
            .replace(/\[(.+?)\]\((.*?)\)/gim, "<a href='$2' rel='noreferrer' target='_blank'>$1</a>")
            .replace(/^$/g, '<br />')

        return htmlText.trim();
    }
    const translation = {
        "ADDED": "Ajouté",
        "FIXED": "Corrigé",
        "DEPRECATED": "Obsolète",
        "CHANGED": "Modifié",
        "REMOVED": "Supprimé",
        "SECURITY": "Sécurité"
    };
    export const _ = text => translation[text.toUpperCase()] || text;
    export const versionDateRegex = /\[([^\]]+)\].+(\d{4})-(\d{2})-(\d{2})/;
    export const title2html = (text) => {
        return text.replace(/\[([^\]]+)\].+(\d{4})-(\d{2})-(\d{2})/, "<span class='version'>$1</span> <span class='date'>$4/$3/$2</span>");
    }
    const badgeColors = {
        "ADDED": "primary",
        "FIXED": "success",
        "DEPRECATED": "warning",
        "CHANGED": "info",
        "REMOVED": "danger",
        "SECURITY": "secondary"
    }
    const badgeTextColors = {
        "ADDED": "text-white",
        "FIXED": "text-white",
        "DEPRECATED": "text-dark",
        "CHANGED": "text-dark",
        "REMOVED": "text-white",
        "SECURITY": "text-white"
    }
    export const badgeColor = (category) => badgeColors[category.toUpperCase()] || 'light';
    export const badgeTextColor = (category) => badgeTextColors[category.toUpperCase()] || 'text-dark';
</script>
<script>
    import { onMount } from 'svelte';
    export let data;
    export let setHelpLinks = null;
    export let limit = undefined;
    export let version = undefined;
    let changelogElement;
    onMount(() => {
        let removeHelpLinksHandler;
        if (setHelpLinks) {
            removeHelpLinksHandler = setHelpLinks(changelogElement);
        }
            
        return () => {
            if (setHelpLinks) removeHelpLinksHandler();
        }
    });
</script>

<ul bind:this={changelogElement} class="markdown">
{#each filterChangeLog(data, {version, limit}) as [title, section]}
    {#if title !== "raw"}
        <li>
            {#if title.match(versionDateRegex)}
                <h2>{@html title2html(title)}</h2>
            {:else}
            <h2>{title}</h2>
            {/if}
            {#each Object.entries(section) as [category, content]}
                {#if category !== "raw"}
                    {#each content.raw.replace(/^\n\n|\n\n$/, '').split('\n') as item}
                        <div class="item">{@html parseMarkdown(item).replace('- ', `- <span class="badge bg-${badgeColor(category)} ${badgeTextColor(category)}">${_(category)}</span>`)}</div>
                    {/each}
                {:else}
                    <div class="item">{@html parseMarkdown(content)}</div>
                {/if}
            {/each}
        </li>
    {/if}
{/each}
</ul> 

<style>
    ul{
        padding-left: 1em;
    }
    li{
        list-style: square;
    }
    li:not(:first-child) h2{
        margin-top: 1rem;
    }
    h2{
        font-size: 1.5rem;
        border-bottom: 1px solid #eee;
        font-weight: 500;
        text-transform: uppercase;
        font-variant: all-petite-caps;
    }
    h2 :global(.date){
        font-size: 1rem;
        color: grey;
    }
    h2 :global(.version)::before{
        content: "v";
        font-size: 1rem;
    }
    .item {
        margin-bottom: 0.25rem;
        margin-left: 0.5rem;
        text-indent: -0.8em;
    }
    .item :global(.badge) {
        text-indent: 0;
        margin-right: 0.5rem;
        min-width: 8ch;
    }
</style>