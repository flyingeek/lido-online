<script>
    import Overlay from 'svelte-overlay';
    import {grametThumbAction, grametStatus} from '../actions/grametAction';
    import Link from '../components/Link.svelte';
    import {showGramet, ofpPromise, isFakeOfp, route, grametPosition} from '../stores';

    const toggleGramet = () => {
        if ($grametStatus === 'success') $showGramet = !$showGramet;
    }
</script>

{#if  ($ofpPromise && !$isFakeOfp)}
    {#await $ofpPromise then ofp}
        {#if $grametStatus !== 'error'}
            <div class="gramet-thumbnail" class:open={$showGramet} class:invisible={$route !== '/map'} use:grametThumbAction={{ofp, pos: $grametPosition}} on:click={toggleGramet}>
                <svg id="gt-plane" width="4" fill="red" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="50"/>
                </svg>
                {#if ($showGramet)}
                    <svg class="gramet-close"><use xlink:href="#close-symbol"/></svg>
                {/if}
            </div>
        {:else}
            <Overlay  position="bottom-center" >
                <button slot="parent" class="btn btn-light" let:toggle on:click={toggle}>
                    <svg class="gramet-error"><use xlink:href="#info-symbol"/></svg>
                </button>
            
                <div slot="content" let:close>
                    <div class="popover" role="tooltip" style="width: 330px; max-width: 330px;">
                    <h3 class="popover-header">😱: Erreur de récupération du Gramet<button type="button" class="close" aria-label="Close" on:click={close}><svg><use xlink:href="#close-symbol"/></svg></button></h3>
                    <div class="popover-body">
                        <p><a href="." on:click|preventDefault={() => $grametStatus = 'loading'}>essayez à nouveau</a> ou allez sur <Link href={ofp.ogimetData.url} target="_blank">ogimet</Link>.</p>
                        <p>A certaines heures le site ogimet est saturé, il faut essayer 2 ou 3 fois.
                            Parfois le site est indisponible, avec la mention "no grib data" sur leur page web, dans ce cas il est inutile de faire une nouvelle tentative.</p>
                    </div>
                    </div>
                </div>
            </Overlay>
        {/if}
    {/await}
{/if}

<style>
.gramet-thumbnail{
    --gramet-thumb-height: 39px;
    height: var(--gramet-thumb-height);
    margin-right: 2em;
    overflow: hidden;
    position: relative;
    flex: 0 1 70px; /* a cdg-dub flight is 78px*/
    border-radius: 3px;
    align-self: baseline;
}
.gramet-error {
    --height: 20px;
    height: var(--height);
    width: 20px;
    stroke: red;
    transform: rotate(180deg);
    margin-top: calc((var(--gramet-thumb-height) - var(--height)) / 2);
}
.gramet-thumbnail .gramet-close{
    stroke: var(--white);
    width: 100%;
    height: 100%;
    position: relative;
    top: 0;
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
    vertical-align: text-bottom;
}
.gramet-thumbnail :global(img){
    transition: opacity 0.5s ease-in;
}
#gt-plane {
    position: absolute;
    z-index: 1;
    display: none;
}
</style>