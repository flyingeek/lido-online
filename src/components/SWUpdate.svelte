<script context="module">
    import {writable} from 'svelte/store';
    import {swDismiss} from '../stores';
    import {isPatchUpdate} from '../components/utils';
    export const swUpdated = writable(false);
    export const swRegistration = writable();
    export const majorUpdate = writable(false);
    export const showSkipWaitingPrompt = (nextVersion) => {
        swUpdated.set(true);
        swDismiss.set(false);
        if (nextVersion) {
            majorUpdate.set(!isPatchUpdate('APP_VERSION', nextVersion));
        } else {
            majorUpdate.set(true); // we consider missing version problem as major
        }
    };
</script>
<script>
    import {wb} from '../stores';
    import { fade } from 'svelte/transition';
    let installLabel = 'Installer';
    $swDismiss = false;
    export let prompt = false;
    const install = (delay=0) => {
        if (delay) console.debug('automatic install ')
        // $swRegistration.waiting check is needed to the 'reload the page' fallback
        let refreshing;
        if ($wb && $swRegistration && $swRegistration.waiting) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                //console.debug('controller change')
                if (refreshing) return;
                refreshing = true;
                console.debug('SWUpdate: controllerchange reload');
                (delay) ? setTimeout(() => window.location.reload(), delay) : window.location.reload();
            });
            //This does not fire when Workbox mark event as isExternal
            // $wb.addEventListener('controlling', () => {
            //     //console.debug('controlling')
            //     if (refreshing) return;
            //     refreshing = true;
            //     console.debug('SWUpdate: controlling reload');
            //     window.location.reload();
            //     (delay) ? setTimeout(() => window.location.reload(), delay) : window.location.reload();
            // });
            installLabel = "En cours...";
            $swRegistration.waiting.postMessage({type: 'SKIP_WAITING'});
        }else{ /* update probably done in another tab */
            console.log($wb, $swRegistration, $swRegistration.waiting);
            console.debug('SWUpdate: no waiting reg reload');
            window.location.reload();
        }
    }
</script>

{#if (($swUpdated && !$swDismiss && !prompt))}
<div class="modal">
    <div class="toast">   
        <div class="toast-header">
            <strong><span>👨🏻‍✈️</span>Mise à jour détectée</strong>
        </div>
        <div class="toast-body text-center">
            <button class="btn" type="button" on:click|preventDefault><span>Mise à jour...</span></button>
        </div>
    </div>
</div>{install(700) || ''}
{:else if $swUpdated && !$swDismiss}
    <div class="toast" transition:fade style="position: fixed; top: 0; right: 0;">   
        <div class="toast-header">
            <strong><span>👨🏻‍✈️</span>Mise à jour disponible</strong>
            <button type="button" class="close" aria-label="Close" on:click={() => $swDismiss=true}>
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="toast-body text-center">
            <p>Il faudra recharger l'OFP</p>
            <button class="btn btn-primary" type="button" on:click|once={() => install()}><span class:blinking={installLabel.endsWith('...')}>{installLabel}</span></button>
        </div>
    </div>
{/if}

<style>
    /* The Modal (background) */
    .modal {
        background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
        display:block;
    }

    /* Modal Content/Box */
    .modal .toast {
        margin: 15% auto 0 auto; /* 15% from the top and centered */
    }
    .modal .toast-header {
        justify-content: center;
    }
    .modal .toast-header strong {
        margin-right: 0;
    }
    .toast {
        opacity: 1;
        z-index: 20;
    }
    .toast-header strong {
        margin-right: auto;
    }
    button.close {
        padding: 0;
        background-color: transparent;
        border: 0;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        margin-bottom: .25rem;
        margin-left: 0.5rem;
    }
    strong>span {
        padding-right: 1em;
    }

    .blinking{
        animation:blink 1s infinite;
    }
    @keyframes blink 
    {  
        0% { opacity: 1.0; }
        50% { opacity: 0.0; }
        100% { opacity: 1.0; }
    }


</style>