<script context="module">
    import {storage, stores} from './mapSettings/storage.js';
    import {previousAppVersionKey} from '../stores';
    const store = stores.changelogOnUpdate;
    export const showChangelogOnUdate = () => {
        return (storage.getItem(store) === null) ? true : !!storage.getItem(store);
    }
    export const setPreviousAppVersion = () => {
        if (localStorage) {
            localStorage.setItem(previousAppVersionKey, 'APP_VERSION');
            return 'APP_VERSION';
        }
    };
    export const getPreviousAppVersion = () => {
        if (localStorage){
            return localStorage.getItem(previousAppVersionKey);
        }
    };
    const fetchChangelog = () => {
        return fetch('./CHANGELOG.json').then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('CHANGELOG.json not available');
            }
        });
    };
</script>
<script>
    import { fade } from 'svelte/transition';
    import ChangeLog from "./ChangeLog.svelte";
    import clickOutside from '../actions/clickOutsideAction';
    import {noop} from './utils';

    export let title = 'CHANGELOG';
    export let version = undefined;
    export let setHelpLinks = null;
    let visible = !!version;
    let promise;
    let checked;
    export const show = () => {
        checked = showChangelogOnUdate();
        visible = true;
        promise = fetchChangelog();
    };
    export const close = () => {
        visible = false;
        setPreviousAppVersion();
    };
    export const save = () => {
        storage.setItem(store, checked);
    }
    if (visible) show();
</script>

{#if visible}
    <div class="modal" tabindex="-1" role="dialog" in:fade>
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document" use:clickOutside  on:click_outside={(!version) ? close : noop}>
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{title}
                        <small class="d-inline-block ms-4 form-check form-switch">
                            <input bind:checked id="display-on-update" class="form-check-input" type="checkbox" on:change={save}>
                            <label for="display-on-update"class="form-check-label">Afficher lors des mises à jour</label>
                        </small>
                    </h5>
                    <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close" on:click={close}></button>
                </div>
                <div class="modal-body" class:expanded={!version}>
                    {#await promise}
                    <p>chargement...</p>
                    {:then data}
                    <ChangeLog {data} {version} {setHelpLinks}/>
                    {/await}
                </div>
            </div>
        </div>
    </div>
    <div class="modal-backdrop show" in:fade></div>
{/if}

<style>
    .modal {
        display: block;
    }
    .modal-body {
        overflow-y: auto;
        max-height: calc(90vh - 3.875rem); /* h5 height * line-height = 1.875rem  h5 margin-top = 1rem margin-bottom = 1rem */
    }
    .expanded {
        height: calc(90vh - 3.875rem); /* h5 height * line-height = 1.875rem  h5 margin-top = 1rem margin-bottom = 1rem */
    }
</style>