<script>
    import { onDestroy, tick } from "svelte";
    import Overlay from "svelte-overlay";
    import {
        grametThumbAction,
        grametStatus,
        grametResponseStatus,
    } from "../actions/grametAction";
    import Link from "../components/Link.svelte";
    import { showGramet, ofp, position, grametImageTimestamp } from "../stores";
    import { focusMap } from "./utils";
    let grametUpdateAvailable = false;
    const GRAMET_DEBUG = false;

    const stripTakeoff = (url) => {
        const normalizedURL = new URL(url);
        normalizedURL.searchParams.delete("takeoff");
        return normalizedURL.toString();
    };

    const updateGrametTimestampFromCache = async (cacheName, updatedURL) => {
        if (!cacheName || !updatedURL || !("caches" in window)) return;
        try {
            const cache = await caches.open(cacheName);
            let response = await cache.match(updatedURL);
            if (!response) {
                response = await cache.match(stripTakeoff(updatedURL));
            }
            const imageTimestamp = response?.headers?.get("X-Gramet-Timestamp");
            if (GRAMET_DEBUG) {
                console.debug("[gramet] cache update lookup", {
                    cacheName,
                    updatedURL,
                    hit: !!response,
                    grametTimestamp: imageTimestamp || null,
                    etag:
                        response?.headers?.get("ETag") ||
                        response?.headers?.get("X-ETag") ||
                        null,
                });
            }
            if (imageTimestamp) {
                const timestamp = Number.parseInt(imageTimestamp, 10);
                if (!Number.isNaN(timestamp)) {
                    $grametImageTimestamp = timestamp * 1000;
                }
            }
        } catch (error) {
            console.warn(
                "Could not refresh gramet timestamp from cache",
                error,
            );
        }
    };

    const toggleGramet = () => {
        if ($grametStatus === "success") $showGramet = !$showGramet;
        if (!$showGramet) focusMap();
    };
    const reload = () => {
        $grametStatus = "reload";
        $showGramet = false;
        grametUpdateAvailable = false;
        tick().then(() => {
            if ($grametStatus === "reload") $grametStatus = "loading";
        });
        focusMap();
    };
    const orientationChange = (e) => {
        //filter ios orientationchange events (fired 3 times when app going in the background)
        if (document && document.visibilityState === "visible") {
            reload();
        }
    };
    const grametSourceUpdate = async (event) => {
        if (
            event.data.meta === "workbox-broadcast-update" &&
            event.data.type === "CACHE_UPDATED"
        ) {
            const { updatedURL, cacheName } = event.data.payload;
            if (GRAMET_DEBUG) {
                console.debug("[gramet] workbox CACHE_UPDATED", {
                    cacheName,
                    updatedURL,
                    normalizedUpdatedURL: stripTakeoff(updatedURL),
                    currentProxyImg: $ofp?.ogimetData?.proxyImg,
                });
            }
            await updateGrametTimestampFromCache(cacheName, updatedURL);
            if (stripTakeoff(updatedURL) === $ofp.ogimetData.proxyImg) {
                if ($showGramet) {
                    grametUpdateAvailable = true;
                } else {
                    reload();
                }
            }
        }
    };
    if (navigator && navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener("message", grametSourceUpdate);
    }
    onDestroy(() => {
        if (navigator && navigator.serviceWorker) {
            navigator.serviceWorker.removeEventListener(
                "message",
                grametSourceUpdate,
            );
        }
    });
</script>

<svelte:window on:orientationchange={orientationChange} />
{#if $grametStatus !== "error"}
    <div
        class="gramet-thumbnail"
        class:open={$showGramet}
        use:grametThumbAction={{
            ofp: $ofp,
            pos: $position.gramet,
            fl: $position.fl,
        }}
        on:click={toggleGramet}
    >
        <svg
            id="gt-plane"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="50" />
        </svg>
        {#if $showGramet}
            <svg class="gramet-close"><use xlink:href="#close-symbol" /></svg>
        {/if}
    </div>
    <Overlay
        position="bottom-center"
        style="margin-right: 0 !important;"
        isOpen={grametUpdateAvailable}
    >
        <div slot="parent" class="d-none"></div>
        <div slot="content" let:close style="width: 290px;">
            <div
                class="card"
                style="left: calc(-1rem - 35px); max-width: 290px; top: 20px;"
            >
                <div class="card-header">
                    <span>Nouveau GRAMET disponible</span>
                    <button
                        type="button"
                        class="btn-close ms-auto"
                        aria-label="Close"
                        on:click={close}
                    ></button>
                </div>
                <div class="card-body">
                    <p class="text-center mt-3">
                        <button class="btn btn-primary" on:click={reload}
                            >Mettre à jour</button
                        >
                    </p>
                </div>
            </div>
        </div>
    </Overlay>
{:else}
    <Overlay position="bottom-center" on:close={focusMap}>
        <button
            slot="parent"
            class="btn btn-light"
            let:toggle
            on:click={toggle}
        >
            <svg class="gramet-error"><use xlink:href="#info-symbol" /></svg>
        </button>

        <div slot="content" let:close style="width: 350px;">
            <div class="card" style="position: absolute">
                <div class="card-header">
                    <span>😱: Erreur de récupération du Gramet</span>
                    <button
                        type="button"
                        class="btn-close ms-auto"
                        aria-label="Close"
                        on:click={close}
                    ></button>
                </div>
                <div class="card-body">
                    <p>
                        <a
                            href="."
                            on:click|preventDefault={() =>
                                ($grametStatus = "loading")}
                            >essayez à nouveau</a
                        >
                        ou allez sur <Link
                            href={$ofp.ogimetData.url}
                            target="_blank">ogimet</Link
                        >.
                    </p>
                    {#if $grametResponseStatus.status === 409}
                        <p>
                            Erreur construction route GRAMET: Station "<code
                                >{$grametResponseStatus.text}</code
                            >" non reconnue par ogimet, merci de me remonter
                            l'information pour que je corrige l'application.
                            Inutile de réessayer.
                        </p>
                    {:else if $grametResponseStatus.text === "no grib data"}
                        <p>
                            Le serveur ogimet indique qu'il est indisponible (no
                            grib data). Sa mise à jour débute normalement à
                            00:00z et peut durer jusqu'à 05:00z...
                        </p>
                    {:else}
                        <p>
                            A certaines heures le site ogimet est saturé, il
                            faut essayer 2 ou 3 fois en temporisant de 30
                            secondes à chaque essai.
                        </p>
                        {#if $grametResponseStatus.status !== 0}
                            <p>
                                Pour information, le proxy a retourné: <code
                                    >{$grametResponseStatus.text ||
                                        $grametResponseStatus.status}</code
                                >
                            </p>
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
    </Overlay>
{/if}

<style>
    .gramet-thumbnail {
        --gramet-thumb-height: 39px;
        height: var(--gramet-thumb-height);
        margin-right: 1rem;
        overflow: hidden;
        position: relative;
        flex: 0 1 35px; /* a cdg-dub flight is 78px*/
        border-radius: 3px;
        align-self: baseline;
        display: none;
        cursor: pointer;
    }

    @media (min-width: 374px) {
        .gramet-thumbnail {
            display: block;
        }
    }
    @media (min-width: 576px) {
        .gramet-thumbnail {
            flex: 0 1 70px; /* a cdg-dub flight is 78px*/
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
    .gramet-thumbnail .gramet-close {
        stroke: var(--bs-light);
        width: 100%;
        height: 100%;
        position: relative;
        top: 0;
        z-index: 2;
    }

    button[slot="parent"] {
        display: flex;
        padding: 0;
    }
    .gramet-thumbnail :global(img) {
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
