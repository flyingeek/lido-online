<script>
import Helpmarkup from './Help.md';
import {wb} from '../stores';
import {shareAppLink} from './utils';
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

$: updateVersion($wb);
</script>

<div class="markdown">
    <h1><div class="app"><img src="images/ofp2map-icons/icon-128x128.png" alt="logo"><span>OFP2MAP</span></div> v{version} 
        <small on:click|once={() => $wb && $wb.update() && console.log('updating SW')}>/ ServiceWorker&#8239;: {swVersion}</small>
        {#if navigator.standalone === true || 'process.env.NODE_ENV' === '"development"'}
            {#if (navigator.share)}<button class="btn btn-outline-secondary btn-sm" on:click={shareAppLink}>Partager l'App</button>{/if}
            <button class="btn btn-outline-secondary btn-sm" on:click={reload}>Recharger l'App</button>
        {/if}
    </h1>
    <Helpmarkup/>
</div>

<style>
    h1 {
        font-size: 1rem;
        margin-bottom: 1rem;
    }
    h1 button {
        margin-left: 1rem;
    }
    small {
        font-size:x-small;
    }
    .markdown {
        background-color: white;
        margin: 0 -10px -10px;
        padding: 0.5em 1em;
        overflow-y: scroll;
        flex: 1 1 auto;
        height: 0;
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
    .app {
        display: inline-block;
        vertical-align: middle;
        text-align: center;
        margin-right: 1em;
    }
    .app span {
        display: block;
        font-variant: all-small-caps;
    }
    .app img {
        width: 64px;
        height: 64px;
        border-radius: 10px;
    }
</style>