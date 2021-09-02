<script>
    import {online} from '../stores.js';
    export let src;
    export let title;
    export let forcePreview = true;
    export let tabindex = 0;
    const symbols = /[\r\n%#()<>?[\\\]^`{|}]/g;
    const svgThumbnailAsStyle = (line1, line2) => {
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="250" height="100" dominant-baseline="middle" text-anchor="middle" font-size="2rem">
                <text x="0" y="0" style="currentColor">
                    <tspan x="125" y="45">${line1}</tspan>
                    <tspan x="125" y="85">${line2}</tspan>
                </text>
            </svg>
        `
        .replace(/(?:(^\s+)|(\s+)$)/gmu, ' ')
        .replace(/>\s+</gmu,'><')
        .replace(/"/g, `'`)
        .trim()
        .replace(symbols, encodeURIComponent);
        return `background-image: url("data:image/svg+xml,${svg}");`;
    };
    const url = new URL(src)
    if (forcePreview) url.hash='t=0.001'; //https://muffinman.io/blog/hack-for-ios-safari-to-display-html-video-thumbnail/
    url.searchParams.set('dnd',1); // do not track
</script>
{#if $online}
    <!-- svelte-ignore a11y-media-has-caption -->
    <video tabindex="{tabindex}" controls style="{svgThumbnailAsStyle(...title.split('\\n'))}">
        <source src="{url}" type="video/mp4">
    </video>
{/if}
<style>
    video {
        background-position: center 50px;
        background-repeat: no-repeat;
        border: 1px solid var(--bs-gray-300);
        margin-bottom: 1rem;
        max-width: 100%;
        max-height: 400px;
        height: auto;
        width: 575px;
    }
</style>