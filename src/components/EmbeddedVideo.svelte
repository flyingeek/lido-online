<script>
    import {online} from '../stores.js';
    export let src;
    export let title;
    export let figcaption = "";
    export let topcaption = "";
    export let forcePreview = true;
    export let tabindex = 0;
    const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
    const svgThumbnailAsStyle = (line1, line2) => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="574" height="400" dominant-baseline="middle" text-anchor="middle" font-size="2rem">
                <text x="0" y="0" style="currentColor">
                    <tspan x="282" y="115">${line1}</tspan>
                    <tspan x="282" y="155">${line2}</tspan>
                </text>
            </svg>
        `
        .replace(/(?:(^\s+)|(\s+)$)/gmu, ' ')
        .replace(/>\s+</gmu,'><')
        .replace(/"/g, `'`)
        .trim()
        .replace(symbols, encodeURIComponent);
        return `data:image/svg+xml,${svg}`;
    };
    const url = new URL(src);
    let poster = svgThumbnailAsStyle(...title.split('\\n'));
    if (forcePreview) {
        url.hash='t=0.001'; //https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
        poster = false;
    }
    url.searchParams.set('dnd',1); // do not track
</script>
{#if $online}
    <figure>
    {#if topcaption}<figcaption>{topcaption}</figcaption>{/if}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video {tabindex} controls style="background-image: url({svgThumbnailAsStyle(...title.split('\\n'))});" {poster}>
        <source src="{url}" type="video/mp4">
    </video>
    {#if figcaption}<figcaption>{figcaption}</figcaption>{/if}
    </figure>
{/if}
<style>
    video {
        background-position: center 50px;
        background-repeat: no-repeat;
        border: 1px solid var(--bs-gray-300);
        margin: 0 auto;
        display: block;
        max-width: 100%;
        max-height: 400px;
        height: auto;
    }
</style>
