<script context="module">
    import {writable} from 'svelte/store';
    import {swDismiss, swUpdated, majorUpdate} from '../stores';
    import {isPatchUpdate} from '../components/utils';
    export const swRegistration = writable();

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
    import {wb, route, ofp} from '../stores';
    import { fade } from 'svelte/transition';
    import ChangeLogModal, {showChangelogOnUdate, getPreviousAppVersion, setPreviousAppVersion} from './ChangeLogModal.svelte';
    import {semverCompare, isPreviousOFPExpired} from './utils';
    let installLabel = 'Installer';
    const isAppUpdated = () => {
        const previous = getPreviousAppVersion();
        if (!previous) return false;
        return semverCompare('APP_VERSION', previous) > 0;
    }

    /* Only show a prompt if an ofp is loaded and if the ofp will not reload automatically */
    const shouldShowPrompt = (ofp) => {
        return !!ofp && isPreviousOFPExpired(10000); // ensure the ofp is valid in the next 10S
    };
    $swDismiss = false;
    export let prompt = false;

    $: showChangeLog = isAppUpdated($swUpdated) && showChangelogOnUdate($swUpdated);
    $: prompt = shouldShowPrompt($ofp);

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
            //This does not fire when Workbox mark event as isExternal (note should be fixed now in v6.2)
            // $wb.addEventListener('controlling', () => {
            //     //console.debug('controlling')
            //     if (refreshing) return;
            //     refreshing = true;
            //     console.debug('SWUpdate: controlling reload');
            //     window.location.reload();
            //     (delay) ? setTimeout(() => window.location.reload(), delay) : window.location.reload();
            // });
            installLabel = "En cours...";
            // only set if not already set (cover multiple updates loop)
            if (!getPreviousAppVersion()) {
                setPreviousAppVersion();
            }
            $swRegistration.waiting.postMessage({type: 'SKIP_WAITING'});
            console.debug('SWUpdate: SKIP_WAITING sent');
            // in a scenario where you dismiss update and manually reload the page we need a fallback
            setTimeout(() => {
                console.debug('SWUpdate: fallback reload');
                window.location.reload();
            }, 5000);//secure a reload after 5s
        }else{ /* update probably done in another tab */
            console.log($wb, $swRegistration, ($swRegistration) ? $swRegistration.waiting : '');
            console.debug('SWUpdate: no waiting reg reload');
            window.location.reload();
        }
    }
</script>

{#if (($swUpdated && !$swDismiss && !prompt))}
<div class="modal" tabindex="-1">
    <div class="modal-dialog" style="margin-top: 15%; max-width: 270px;">
        <div class="modal-content">
            <h6 class="modal-header text-center">
                <span class="modal-title"><span>👨🏻‍✈️</span> Mise à jour détectée</span>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" on:click={() => $swDismiss=true}></button>
            </h6>
            <div class="modal-body text-center">
                <button class="btn" type="button" on:click|preventDefault><span>Mise à jour...</span></button>
            </div>
        </div>
    </div>
</div>{install(700) || ''}
{:else if $swUpdated && !$swDismiss}
    <div class="modal" transition:fade tabindex="-1">
        <div class="modal-dialog" transition:fade style="position: absolute; top:0; right: 1rem; max-width: 350px;">
            <div class="modal-content">
                <h6 class="modal-header pt-2 pb-2">
                    <span class="modal-title text-center"><span>👨🏻‍✈️</span> Mise à jour disponible</span>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" on:click={() => $swDismiss=true}></button>
                </h6>
                <div class="modal-body text-center">
                    <p>Il faudra recharger l'OFP</p>
                    <button class="btn btn-primary" type="button" on:click|once={() => install()}><span class:blinking={installLabel.endsWith('...')}>{installLabel}</span></button>
                </div>
            </div>
        </div>
    </div>
{:else if showChangeLog && !$swUpdated && $route !== "/install"}
    <ChangeLogModal version={getPreviousAppVersion()} title="NOUVEAUTÉS"/>
{/if}

<style>
    .modal {
        background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
        display:block;
    }
    .modal-header {
        background-color: var(--bs-light);
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
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
