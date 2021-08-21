<script context="module">
    import {storage, stores} from './mapSettings/storage.js';
    const store = stores.changelogOnUpdate;
    export const showChangelogOnUdate = () => {
        return (storage.getItem(store) === null) ? true : !!storage.getItem(store);
    }
</script>
<script>
    import { fade } from 'svelte/transition';
    import ChangeLog from "./ChangeLog.svelte";
    import clickOutside from '../actions/clickOutsideAction';
    export let visible = false;
    export let title = 'CHANGELOG';
    export let version = undefined;
    let promise;
    let checked = showChangelogOnUdate();

    export const show = async () => {
        visible = true;
        promise = fetch('./CHANGELOG.json').then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('CHANGELOG.json not available');
            }
        });
    };
    export const close = () => {
        visible = false;
    };
    if (version && checked) show();
</script>

{#if visible}
    <div class="modal" tabindex="-1" role="dialog" in:fade>
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document" use:clickOutside  on:click_outside={close}>
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{title}
                        <small class="d-inline-block ms-4 form-check form-switch">
                            <input bind:checked id="display-on-update" class="form-check-input" type="checkbox" on:change={() => storage.setItem(store, checked)}>
                            <label for="display-on-update"class="form-check-label">Afficher lors des mises à jour</label>
                        </small>
                    </h5>
                    <button type="button" class="btn-close" data-dismiss="modal" aria-label="Close" on:click={close}></button>
                </div>
                <div class="modal-body" class:expanded={!version}>
                    {#await promise}
                    <p>chargement...</p>
                    {:then data}
                    <ChangeLog {data} {version}/>
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