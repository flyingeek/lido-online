<script>
import Helpmarkup from './Help.md';
import {wb} from '../stores';
const version = "APP_VERSION";
let swVersion = '';
const updateVersion = (_wb) => (_wb) ? _wb.messageSW({type: 'GET_VERSION'}).then(v => swVersion = v) : '';
const reload = () => {
    window.location.hash = '#/';
    console.log('reload page');
    window.location.reload();
};

$: updateVersion($wb);
</script>

<div class="markdown">
    <h1><img src="images/ofp2map-icons/icon-128x128.png" alt="logo"> OFP2MAP v{version} 
        <small on:click|once={() => $wb.update() && console.log('updating SW')}>/ ServiceWorker&#8239;: {swVersion}</small>
        {#if navigator.standalone === true || 'process.env.NODE_ENV' === '"development"'}<button class="btn btn-primary btn-sm" on:click={reload}>Recharger l'App</button>{/if}
    </h1>
    <Helpmarkup/>
</div>

<style>
    h1 {
        font-size: 1rem;
        margin-bottom: 1rem;
    }
    h1 img {
        width: 64px;
        height: 64px;
        border-radius: 10px;
    }
    small {
        font-size:x-small;
    }
    button {
        float: right;
    }
    div {
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
</style>