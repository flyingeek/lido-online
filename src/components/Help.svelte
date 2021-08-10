<script>
import Helpmarkup from './Help.md';
import {wb} from '../stores';
import {shareAppLink} from './utils';
import {onMount} from "svelte";
import blurAction from '../actions/blurAction';

const version = "APP_VERSION";
let swVersion = '';
const updateVersion = (_wb) => {
    return (_wb) ? _wb.messageSW({type: 'GET_VERSION'}).then(v => swVersion = v) : '';
}
const reload = () => {
    window.location.hash = '#/';
    console.log('reload page');
    window.location.reload();
};
const changelog = async () => {
    showChangelog = true;
    changelogPromise = fetch('./CHANGELOG.json').then(response => {
        if(response.ok) {
            return response.json();
        } else {
            throw new Error('CHANGELOG.json not available');
        }
    });
};
const translation = {
    "ADDED": "Ajouté",
    "FIXED": "Corrigé",
    "DEPRECATED": "Obsolète",
    "CHANGED": "Modifié",
    "REMOVED": "Supprimé",
    "SECURITY": "Sécurité"
};
const _ = text => translation[text.toUpperCase()] || text;

$: updateVersion($wb);
let scrollingRoot, scrollingElement;
const toc = [];
let tocNodeList;
let selected;
let observer;
let showChangelog = false;
let changelogPromise = null;
$: style = (selected === undefined || selected === toc[0].id) ? "padding-top: 1rem;" : "padding-top: 0.25rem;";

function scrollTo(offset, callback) {
    const relativeOffset = offset  - scrollingElement.offsetTop - scrollingRoot.clientHeight;
    const fixedOffset = relativeOffset.toFixed();
    const maxOffset = Math.floor(scrollingElement.scrollHeight - scrollingElement.clientHeight);
    const onScroll = function () {
        if (scrollingElement.scrollTop.toFixed() === fixedOffset || scrollingElement.scrollTop >= maxOffset) {
            scrollingElement.removeEventListener('scroll', onScroll);
            if (callback) callback();
        }
    };
    scrollingElement.addEventListener('scroll', onScroll);
    onScroll();
    scrollingElement.scrollTo({
        top: relativeOffset,
        behavior: 'smooth' // not supported by Safari
    })
}
const jumpTo = (e) => {
    e.target.blur();
    observer.disconnect();
    scrollTo(document.getElementById(selected).offsetTop, () => {
        //console.log('scroll end')
        tocNodeList.forEach((elt) => {
            observer.observe(elt);
        });
    })
}

onMount(() => {
    tocNodeList = scrollingElement.querySelectorAll('h2[id]');
    observer = new IntersectionObserver((entries) => {
        const y = scrollingElement.scrollTop;
        const max = Math.floor(scrollingElement.scrollHeight - scrollingElement.clientHeight);
        if (y < max) {
            let current = toc[0].id;
            for (const elt of tocNodeList) {
                if (y < (elt.offsetTop - scrollingElement.offsetTop - scrollingRoot.clientHeight)) break;
                current = elt.id;
            }
            selected = current;
        }
    }, {
        root: scrollingElement,
        rootMargin: `${ 0 - scrollingRoot.clientHeight}px 0px 30px 0px`,
        threshold: 1.0
    });
    tocNodeList.forEach((elt) => {
        toc.push({id: elt.id, label: elt.innerText});
        observer.observe(elt);
    });
    selected = toc[0].id;
    return () => {
        observer.disconnect();
        tocNodeList = undefined;
        observer = undefined;
    }
});

</script>

<div class="markdown" {style}>
    {#if showChangelog}
        <div class="modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">CHANGELOG</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close" on:click={() => showChangelog = false}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        {#await changelogPromise}
                            <p>chargement...</p>
                        {:then json}
                            <ul>
                            {#each Object.entries(json.CHANGELOG) as [title, section]}
                                <li>
                                    <h2>{title}</h2>
                                    {#each Object.entries(section) as [category, content]}
                                        <h3>{_(category)}</h3>
                                        {#each content.raw.split('- ').filter(item => !item.match(/^\s*$/g)) as item}
                                        <div class="changelog">- {item}</div>
                                        {/each}
                                    {/each}
                                </li>
                            {/each}
                            </ul> 
                        {/await}
                    </div>
                </div>
            </div>
        </div>
    {/if}
    <div bind:this={scrollingElement} class="scrollContainer">
        <div><!--prevents safari sticky bug-->
            <h1 bind:this={scrollingRoot}>
                <div class="app"><img src="images/ofp2map-icons/icon-128x128.png" alt="logo"></div>
                <div class="infos"><div>OFP2MAP v{version}</div><small on:click|once={() => $wb && $wb.update() && console.log('updating SW')}>ServiceWorker&#8239;: {swVersion}</small></div>
                {#if navigator.standalone === true || 'process.env.NODE_ENV' === '"development"'}
                    {#if (navigator.share || 'process.env.NODE_ENV' === '"development"')}<button class="btn btn-outline-secondary btn-sm" on:click={shareAppLink}>Partager l'App</button>{/if}
                    <button class="btn btn-outline-secondary btn-sm" on:click={reload}>Recharger l'App</button>
                {/if}
                <button class="btn btn-outline-secondary btn-sm" on:click={changelog}>CHANGELOG</button>
                <!-- svelte-ignore a11y-no-onchange -->
                <select class="custom-select custom-select-sm" bind:value="{selected}" on:change={jumpTo} use:blurAction>
                    {#each toc as {id, label}}
                        <option value={id} selected={id === selected}>{label}</option>
                    {/each}
                </select>
            </h1>
            <Helpmarkup/>
        </div>
    </div>
</div>

<style>
    h1 {
        font-size: 1rem;
        padding-bottom: 0.25rem;
        display: flex;
        top: 0;
    }

    h1 button {
        margin-left: 1rem;
    }
    small {
        font-size:x-small;
    }
    h1 > * {
        align-self: center;
    }
    h1, .scrollContainer {
        background-color: white;
    }
    .scrollContainer {
        -webkit-overflow-scrolling: touch;
        overflow-y: scroll;
        flex: 1 1 auto;
        height: 0;
        z-index: 1;
        padding-right: 1rem;
    }
    .markdown {
        margin:0;
        padding:1rem 0 0.5rem 1rem;
        flex: 1 1 auto;
        height: 0;
        display: flex;
        flex-direction: column;
        background-color: white;
        transition: padding-top 0.5s linear;
    }
    :global(.markdown h2) {
        font-weight: 500;
        /* text-transform: uppercase; */
        /* font-size: 1.5rem; */
        font-variant: all-petite-caps;
    }
    :global(.markdown svg) {
        height: 24px;
        width: 24px;
        display: inline-block;
    }
    :global(span.flytax){
        color: var(--blueaf);
        text-transform: uppercase;
    }
    :global(span.flytax > span){
        color: var(--redaf);
    }
    :global(.markdown img) {
        max-width: 100%;
        height: auto;
    }
    :global(img#memovisuel) {
        max-height: calc(100vh - 80px + 15px); /* 15px is for the top black part */
    }
    :global(.markdown figure){
        width: 300px;
        margin-left: 1rem;
        float: right;
    }
    :global(.markdown figcaption){
        text-align: center;
        font-size: small;
        font-variant: all-small-caps;
    }
    .app {
        display: none;
        vertical-align: middle;
        text-align: center;
        margin-right: 0.5rem;
    }
    .infos {
        display: flex;
        flex-direction: column;
    }
    .app img {
        width: 32px;
        height: 32px;
        border-radius: 5px;
    }
    select {
        display: none;
        width: auto;
        margin-left: auto;
    }
    @media (min-width: 576px) {
        select {
            display: inline-block;
        }
        .app {
            display: inline-block;
        }
        .modal-dialog {
            max-width: 80vw;
        }
    }
    @media (min-width: 576px) and (min-height: 576px) {
        h1 {
            position: sticky;
            position: -webkit-sticky;
        }
    }
    .markdown :global(.table th),.markdown :global(.table td){
        padding: 0.25rem 0.75rem;
    }
    .modal {
        display: block;
    }

    .modal-body {
        overflow-y: auto;
        max-height: 80vh;
    }
    .modal-body li{
        list-style: none;
    }
    .modal-body h3{
        font-size: 1.1rem;
        font-variant: all-petite-caps;
        text-decoration: underline;
    }
    .modal-body h2{
        font-size: 1.5rem;
    }
    .changelog {
        margin-bottom: 0.5rem;
    }
</style>