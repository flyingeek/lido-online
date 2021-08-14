<script context="module">
    export const previousAppVersionKey = 'previousAppVersion';
</script>
<script>
    import { fade } from 'svelte/transition';
    import ChangeLog from "./ChangeLog.svelte";
    import clickOutside from '../actions/clickOutsideAction';
    export let visible = false;
    export let title = 'CHANGELOG';
    export let version;
    let promise;
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
        if (sessionStorage) sessionStorage.removeItem(previousAppVersionKey);
        visible = false;
    }
    if (version) show();
</script>

{#if visible}
    <div class="modal" tabindex="-1" role="dialog" in:fade>
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document" use:clickOutside  on:click_outside={close}>
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" on:click={close}>
                        <span aria-hidden="true">&times;</span>
                    </button>
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