<script>
    import {onDestroy, tick} from 'svelte';
    import Overlay from 'svelte-overlay';
    import {grametThumbAction, grametStatus, grametResponseStatus} from '../actions/grametAction';
    import Link from '../components/Link.svelte';
    import {showGramet, ofp, position} from '../stores';
    let grametUpdateAvailable = false;

    const toggleGramet = () => {
        if ($grametStatus === 'success') $showGramet = !$showGramet;
    }
    const reload = async () => {
        $grametStatus = 'reload';
        $showGramet = false;
        grametUpdateAvailable = false;
        await tick;
        $grametStatus = 'loading';
    };
    const grametSourceUpdate = async (event) => {
        if (event.data.meta === 'workbox-broadcast-update' && event.data.type === 'CACHE_UPDATED') {
                const {updatedURL} = event.data.payload;
                if (updatedURL === $ofp.ogimetData.proxyImg) {
                    if ($showGramet) {
                        grametUpdateAvailable = true;
                    }else{
                        reload();
                    }
                }
            }
    };
    if (navigator && navigator.serviceWorker){
            navigator.serviceWorker.addEventListener('message', grametSourceUpdate);
    }
    onDestroy(() => {
        //console.log('destroy gramet trigger');
        if (navigator && navigator.serviceWorker){
            navigator.serviceWorker.removeEventListener('message', grametSourceUpdate);
        }
    });
</script>


{#if $grametStatus !== 'error' && $grametStatus !== 'reload'}
    <div class="gramet-thumbnail" class:open={$showGramet} use:grametThumbAction={{ofp: $ofp, pos: $position.gramet, fl: $position.fl}} on:click={toggleGramet}>
        <svg id="gt-plane" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50"/>
        </svg>
        {#if ($showGramet)}
            <svg class="gramet-close"><use xlink:href="#close-symbol"/></svg>
        {/if}
    </div>
    <Overlay  position="bottom-center" style="margin-right: 0 !important;" isOpen={grametUpdateAvailable}>
        <div slot="parent" class="d-none"></div>
        <div slot="content" let:close style="width: 290px;">
            <div class="popover" role="tooltip" style="left: calc(-1rem - 35px); max-width: 290px; top: 20px;">
                <h3 class="popover-header">Nouveau GRAMET disponible<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>
                <div class="popover-body">
                    <p class="text-center"><button class="btn btn-primary" on:click={reload}>Mettre à jour</button></p>
                </div>
            </div>
        </div>
    </Overlay>
{:else if ($grametStatus !== 'reload')}
    <Overlay  position="bottom-center" >
        <button slot="parent" class="btn btn-light" let:toggle on:click={toggle}>
            <svg class="gramet-error"><use xlink:href="#info-symbol"/></svg>
        </button>
    
        <div slot="content" let:close style="width: 330px;">
            <div class="popover" role="tooltip" style="max-width: 330px;">
            <h3 class="popover-header">😱: Erreur de récupération du Gramet<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>
            <div class="popover-body">
                <p><a href="." on:click|preventDefault={() => $grametStatus = 'loading'}>essayez à nouveau</a> ou allez sur <Link href={$ofp.ogimetData.url} target="_blank">ogimet</Link>.</p>
                {#if $grametResponseStatus.status === 409}
                    <p>Erreur construction route GRAMET: Station "<code>{$grametResponseStatus.text}</code>" non reconnue par ogimet,
                    merci de me remonter l'information pour que je corrige l'application. Inutile de réessayer.</p>
                {:else if $grametResponseStatus.text === "no grib data"}
                    <p>Le serveur ogimet indique qu'il est indisponible (no grib data). Sa mise à jour débute normalement à 00:00z et c'est long...</p>
                {:else}
                    <p>A certaines heures le site ogimet est saturé, il faut essayer 2 ou 3 fois en temporisant de 30 secondes à chaque essai.</p>
                    {#if $grametResponseStatus.status !== 0}
                        <p>Pour information, le proxy a retourné: <code>{$grametResponseStatus.text || $grametResponseStatus.status}</code></p>
                    {/if}
                {/if}
                </div>
            </div>
        </div>
    </Overlay>
{:else if ($grametStatus === 'reload')}
    <div class="gramet-thumbnail updating"><p>↻</p><p>Mise à jour</p></div>
{/if}


<style>

.gramet-thumbnail{
    --gramet-thumb-height: 39px;
    height: var(--gramet-thumb-height);
    margin-right: 1rem;
    overflow: hidden;
    position: relative;
    flex: 0 1 70px; /* a cdg-dub flight is 78px*/
    border-radius: 3px;
    align-self: baseline;
    display: none;
    cursor: pointer;
}
.gramet-thumbnail.updating p {
    margin: 0;
    font-size: small;
    text-align: center;
}
@media (min-width: 576px){
    .gramet-thumbnail {
        display:block;
    }
}
.gramet-error {
    --height: 20px;
    height: var(--height);
    width: 20px;
    stroke: red;
    transform: rotate(180deg);
    vertical-align: text-bottom;
    /* margin-top: calc((var(--gramet-thumb-height) - var(--height)) / 2); */
}
.gramet-thumbnail .gramet-close{
    stroke: var(--light);
    width: 100%;
    height: 100%;
    position: relative;
    top: 0;
    z-index: 2;
}
button.close svg{
    height: 20px;
    width: 20px;
    stroke: black;
    top: -5px;
    position: relative;
    z-index: 2;
}
button[slot=parent]{
    display: flex;
    padding: 0;
}
.gramet-thumbnail :global(img){
    transition: opacity 0.5s ease-in;
}
#gt-plane {
    position: absolute;
    z-index: 1;
    display: none;
    fill: var(--plane-color);
    stroke: black;
    width: 6px;
    stroke-width: 10px;
}
</style>