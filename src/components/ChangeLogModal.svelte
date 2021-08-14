<script context="module">

</script>
<script>
    import { fade } from 'svelte/transition';
    import ChangeLog from "./ChangeLog.svelte";
    import clickOutside from '../actions/clickOutsideAction';
    let visible = false;
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
    export const close = () => visible = false;
</script>

{#if visible}
    <div class="modal" tabindex="-1" role="dialog" in:fade>
        <div class="modal-dialog modal-xl modal-dialog-centered" role="document" use:clickOutside  on:click_outside={close}>
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">CHANGELOG</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" on:click={close}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    {#await promise}
                    <p>chargement...</p>
                    {:then data}
                    <ChangeLog {data} />
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
        height: calc(90vh - 3.875rem); /* h5 height * line-height = 1.875rem  h5 margin-top = 1rem margin-bottom = 1rem */
    }
</style>