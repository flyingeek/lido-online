<script context="module">
    export const helpRouteRegex = /^\/help_?/u;
    export const getContextualHelpLink = (route) => {
        let name = "", href;
        switch (route) {
            case '/map':
            href = '#/help_memovisuel';
            break;
            default:
            href = '#/help';
        }
        return {name, href: encodeURI(href)};
    };
</script>
<script>
import Helpmarkup from './Help.md';
import ChangeLogModal from './ChangeLogModal.svelte';
import {wb, route} from '../stores';
import {debounce, Deferred} from './utils';
import {onMount, tick} from "svelte";
import blurAction from '../actions/blurAction';
import ReloadButton from './ReloadButton.svelte';
import ShareAppButton from "./ShareAppButton.svelte";

const version = "APP_VERSION";
let swVersion = '';
const updateVersion = (_wb) => {
    return (_wb) ? _wb.messageSW({type: 'GET_VERSION'}).then(v => swVersion = v) : '';
}
$: updateVersion($wb);
let scrollingElement, tocSelectElement, scrollingElementScrolling;
const toc = [];
let tocNodeList;
let selected;
let observer;
let modal;
let imageMapSelector = '#memovisuel';


$: setAndJumpTo($route);

const scrollEndCondition = (element) => {
    const relativeOffset = element.offsetTop  - scrollingElement.offsetTop;
    const maxOffset = Math.floor(scrollingElement.scrollHeight - scrollingElement.clientHeight);
    return scrollingElement.scrollTop.toFixed() === relativeOffset.toFixed() || (scrollingElement.scrollTop >= maxOffset && relativeOffset >= maxOffset);
}
function scrollTo(element, callback) {
    const onScroll = function () {
        if (scrollEndCondition(element)) {
            callback();
        }
    };
    if (!scrollEndCondition(element)) {
        if (scrollingElementScrolling) scrollingElementScrolling.reset();
        scrollingElement.addEventListener('scroll', onScroll);
        scrollingElement.scrollTo({
            top: element.offsetTop  - scrollingElement.offsetTop,
            behavior: 'smooth' // not supported by Safari
        });
        return {
            reset: () => {
                scrollingElement.removeEventListener('scroll', onScroll);
                scrollingElementScrolling = undefined;
                //console.log('scrollingElementScrolling reset')
            }
        };
    }
}
// called from:
// - the toc select menu
// - setAndJumpTo (without arguments)
const jumpTo = (e) => {
    if (!selected || !tocNodeList) return;
    if (e) e.target.blur(); // the toc select
    const element = document.getElementById(selected);
    if (element) {
        if (!scrollEndCondition(element)) {
            observer.disconnect();
            scrollingElementScrolling = scrollTo(element, () => {
                //console.log('scroll end')
                if (tocNodeList) {
                    tocNodeList.forEach((elt) => {
                        observer.observe(elt);
                    });
                }
                scrollingElementScrolling.reset();
            });
            //if (scrollingElementScrolling) console.log('scrollingElementScrolling set');
        }else{
            if (scrollingElementScrolling) scrollingElementScrolling.reset();
        }
    }
};
// called from:
// - onMount with the route
// - the expanded toc menu
const setAndJumpTo = (optionalRouteOrEvent) => {
    if (optionalRouteOrEvent) {
        if (optionalRouteOrEvent.target) {
            if (optionalRouteOrEvent instanceof MouseEvent) optionalRouteOrEvent.target.blur();
            selected = optionalRouteOrEvent.target.dataset.id;
        }else{
            const decoded = decodeURI(optionalRouteOrEvent);
            if (decoded.startsWith('/help')){
                const id = decoded.replace('/help_', '_'); //we use a _ prefix in section
                if (toc && toc.map(v => v.id).includes(id)) {
                    selected = id;
                    modal.close(); // in case we are reading the changelog
                }
            }
        } 
    }
    if (!selected && toc && toc.length > 0) {
        selected = toc[0].id;
    }
    if (selected) {
        jumpTo();
    }
}
const imagesOnLoadPromise = (selector) => {
    const promises = [];
    document.querySelectorAll(selector).forEach((img) => {
        if (!img.complete) {
            const d = new Deferred();
            img.onload = () => d.resolve(img);
            img.onerror = () =>  d.resolve(img);
            if (!img.complete) {
                promises.push(d.promise);
            }
        }
    });
    //console.log(Promise.all(promises));
    return Promise.all(promises);
};

const resizeImageMap = () => {
    document.querySelectorAll(imageMapSelector).forEach((img) => {
        const xScale = img.clientWidth/img.naturalWidth;
        const yScale = img.clientHeight/img.naturalHeight;
        const px = parseFloat(window.getComputedStyle(img).getPropertyValue('padding-left'));
        const py = parseFloat(window.getComputedStyle(img).getPropertyValue('padding-top'));
        document.querySelectorAll(`map[name="${img.useMap.substring(1)}"] area`).forEach((area) => {
            if(!area.dataset.coords) area.dataset.coords = area.coords;
            const coords = area.dataset.coords
                .split(',')
                .map((v, i) => ((i % 2 === 0) ? xScale * Number(v) + px : yScale * Number(v) + py).toFixed(0))
                .join(',');
                area.coords = coords;
        });
    });
};
onMount(() => {
    tocNodeList = scrollingElement.querySelectorAll('.markdown section[id]');
    const observerRegistry = new Map();
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => observerRegistry.set(entry.target.id, entry.isIntersecting));
        //console.log(observerRegistry)
        let first;
        for (const [id, isIntercepting] of observerRegistry.entries()) {
            if (isIntercepting) {
                first = id;
                break;
            }
        }
        if (first) selected = first;
    }, {
        root: scrollingElement,
        rootMargin: '0px',
        threshold: 0
    });
    //observe all of our markdown sections
    tocNodeList.forEach((elt) => {
        const h2 = elt.querySelector('h2:first-of-type')
        toc.push({id: elt.id, label: h2.innerText, html: h2.innerHTML});
        observer.observe(elt);
    });
    //console.log(toc)

    //remap all internal links
    const remapper = (e) => {
        e.preventDefault();
        const url = new URL(e.target.href);
        setAndJumpTo(url.hash.replace('#_', '/help_'));
    }
    const remapperQueryExpression = 'a[href^="#_"], area[href^="#_"]';
    document.querySelectorAll(remapperQueryExpression).forEach(elt => elt.addEventListener('click', remapper));

    // clicking on help link or navbar triggers a scrollToTop like function
    const jumpToTopQueryExpression  = '.navbar-nav, .nav-link[href="#/help"]';
    document.querySelectorAll(jumpToTopQueryExpression).forEach(elt => elt.addEventListener('click', setAndJumpTo));

    // we have to resize the image's map on load and on resize
    imagesOnLoadPromise(imageMapSelector).then(() => {
        resizeImageMap();
    }).catch((err) => console.error(err));

    tick().then(() => setAndJumpTo($route)); // tick avoid bad positionning in Safari

    return () => {
        observer.disconnect();
        document.querySelectorAll(jumpToTopQueryExpression).forEach(elt => elt.removeEventListener('click', setAndJumpTo));
        document.querySelectorAll(remapperQueryExpression).forEach(elt => elt.removeEventListener('click', remapper));
        if (scrollingElementScrolling) scrollingElementScrolling.reset();
        tocNodeList = undefined;
        observer = undefined;
    }
});
</script>
<svelte:window on:resize={debounce(resizeImageMap, 500)}/>

<ChangeLogModal bind:this={modal} />
<div class="help">
    <aside>
        <h1>
            <div class="appInfos">
                <div class="app"><img src="images/ofp2map-icons/icon-128x128.png" alt="logo"></div>
                <div class="infos"><div>OFP2MAP v{version}</div><small on:click|once={() => $wb && $wb.update() && console.log('updating SW')}>ServiceWorker&#8239;: {swVersion}</small></div>
            </div>
            <div class="actions">
                {#if ((navigator.standalone === true && navigator.share) || 'process.env.NODE_ENV' === '"development"')}
                    <ShareAppButton/>
                {/if}
                {#if navigator.standalone === true || 'process.env.NODE_ENV' === '"development"'}
                    <ReloadButton/>
                {/if}
                <button tabindex="0" class="changelog btn btn-outline-secondary btn-sm" on:click={modal.show}><!-- CHANGELOG --></button>
            </div>
            <!-- svelte-ignore a11y-no-onchange -->
            <select bind:this={tocSelectElement} class="toc form-select form-select-sm" bind:value="{selected}" on:change={jumpTo} use:blurAction>
                {#each toc as {id, label} (id)}
                    <option value={id} selected={id === selected}>{label}</option>
                {/each}
            </select>
        </h1>
        <div class="toc">
            {#each toc as {id, html} (id)}
                <h2 on:keydown="{(e) => e.key === "Enter" && setAndJumpTo(e)}" tabindex="0" class:selected={selected === id} data-id="{id}" on:click={setAndJumpTo}>{@html html}</h2>
            {/each}
        </div>
    </aside>
    <div bind:this={scrollingElement} class="scrollContainer">
        <div class="markdown">
            <button tabindex="0" class="changelog btn btn-outline-secondary btn-sm" on:click={modal.show}><!-- CHANGELOG --></button>
            <Helpmarkup/>
        </div>
    </div>
</div>
<style>
    h1 {
        font-size: 1rem;
        display: flex;
        align-items: center;
    }

    h1 button {
        margin-left: 1rem;
    }
    small {
        font-size:x-small;
    }
    h1, .scrollContainer {
        background-color: white;
    }
    :global(#_memovisuel){
        margin-bottom: 1rem;
    }
    :global(#_memovisuel h2:first-of-type){
        position: relative;
        padding-bottom: 1rem;
    }
    :global(#_memovisuel h2:first-of-type::after){
        content: "\24D8\00A0Vous pouvez cliquer sur les zones"; /* ⓘ + nbsp;*/ 
        font-size: small;
        background-color: var(--bs-teal);
        position: absolute;
        left: 50%;
        bottom: -0.5rem;
        transform: translate(-50%, 0);
        padding: 0.25rem;
        border-radius: 2px;
        width:fit-content;
    }
    .toc {
        display: none;
    }
    .toc :global(svg) {
        height: 1.2rem;
        width: 1.2rem;
    }
    .scrollContainer {
        -webkit-overflow-scrolling: touch;
        overflow-y: scroll;
        flex: 1 1 auto;
        height: 0;
        z-index: 1;
        padding-right: 1rem;
        margin-right: -1rem;
        padding-bottom: 50vh;
    }

    .help {
        margin:0;
        padding: 0.5rem 1rem;
        flex: 1 1 auto;
        height: 0;
        display: flex;
        flex-direction: column;
        background-color: white;
    }
    :global(.markdown svg) {
        height: 24px;
        width: 24px;
        display: inline-block;
    }
    :global(span.flytax){
        color: var(--blueaf);
        text-transform: uppercase;
    }
    :global(span.flytax > span){
        color: var(--redaf);
    }
    :global(.markdown img) {
        max-width: 100%;
        height: auto;
    }
    :global(img#memovisuel) {
        max-height: calc(100vh - 80px + 15px); /* 15px is for the top black part */
    }
    @media (min-width: 576px) {
        :global(.markdown figure){
            width: 300px;
            margin-left: 1rem;
            float: right;
        }
    }
    :global(.markdown figcaption){
        text-align: center;
        font-size: small;
        font-variant: all-small-caps;
    }
    .appInfos {
            display: inline-flex;
            flex-direction: row;
            align-items: center;
    }
    .app {
        vertical-align: middle;
        text-align: center;
        margin-right: 0.5rem;
    }
    .infos {
        display: flex;
        flex-direction: column;
        font-size: 0.85rem;
    }
    .app img {
        width: 32px;
        height: 32px;
        border-radius: 5px;
    }
    .changelog::before{
        content: "Changelog";
    }
    select.toc {
        display: inline-block;
        width: auto;
        text-transform: uppercase;
        color: rgba(0,0,0,.55);
        font-weight: 700;
        margin-left: auto;
        max-width: 20ch;
        text-overflow: ellipsis;
    }
    .actions :global(button.reload), .actions :global(button.share){
            display: none;
    }
    .actions .changelog {
        display: none;
    }
    .markdown .changelog {
        margin: 5px 0 10px 0;
    }
    @media (min-width: 576px) {
        .actions .changelog {
            display: inline-block;
        }
        .markdown .changelog {
            display: none;
        }
        .infos {
            font-size: 1rem;
        }
    }
    @media (min-width: 768px) {
        .actions :global(button.reload), .actions :global(button.share){
            display: inline;
        }
        .actions {
            margin-left: 1rem;
        }
    }
    /**
    * Here we put the menu on the left side
    */
    @media (min-width: 992px) {
        .help {
            flex-direction: row;
            /* gap replaced by a padding-left on the scrollContainer for better focus outline of details element */
            /* column-gap: 1rem; */
        }
        .scrollContainer{
            height: auto;
            padding-left: 0.5rem;
        }
        div.toc {
            display: block;
            margin-top: 1rem;
            margin-left: -8px; /* makes place to put a star */
            margin-right: 3px; /* for outline focus */
        }
        select.toc {
            display: none;
        }
        aside {
            display: block;
            flex: 0 0 auto;
        }
        
        aside h1 {
            flex-direction: column;
            align-items: stretch;
        }
        aside h2 {
            color: var(--bs-gray-600);
            font-size: 1rem;
            cursor: pointer;
            padding: 5px 5px 5px 13px;
            margin-left: -5px;
            border-left: 3px solid transparent;
            border-right: 3px solid transparent;
            outline-offset: -2px;
        }
        aside h2.selected {
            color: black;
            border-left-color: var(--bs-pink);
        }
        :global(h2[data-id="_memovisuel"]::before){
            content: "★";
            color: var(--bs-yellow);
            margin-left: -11px;
            font-size: 10px;
            line-height: 1.2rem;
            position: absolute;
        }
        .actions {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            margin-top: 1rem;
            row-gap: 0.25rem;
        }
        .actions button:not(.reload){
            border: none;
            padding: 0;
            font-size: 1rem;
            margin-top: 0;
            margin-bottom: 0;
            margin-left: 0;
            font-weight: 500;
            line-height: 1.2;
            text-align: left;
        }
        .actions button:not(.reload):hover, .actions button:not(.reload):active{
            color: var(--bs-gray);
            background-color: transparent;
        }
        .actions button:not(.reload):focus{
            box-shadow: none;
        }
        .actions :global(button.reload){
            position: absolute;
            bottom: 1rem;
            margin-left: 0;
        }
        .appInfos {
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        .app {
            display: inline-block;
        }
        .infos {
            display: inline-flex;
        }
        .changelog::after{
            content: "\1F4E3"; /* 📣 */
            margin-left: 1ch;
            display: inline-block;
            /* -webkit-transform: scaleX(-1);
            transform: scaleX(-1); */
        }
        .actions button.changelog{
            text-transform: none;
            border-top: 1px solid var(--bs-gray-200);
            border-bottom: 1px solid var(--bs-gray-200);
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
            width: 100%;
            margin-top: 0.5rem;
        }
    }
    /* smartphones, touchscreens */
    /* @media (hover: none) and (pointer: coarse) {
        div.toc h2 {
            margin-bottom: 0.835rem;
        }
    } */
    :global(.markdown .table th), :global(.markdown .table td){
        padding: 0.25rem 0.75rem;
    }
    :global(.markdown .aurora::before){
        height: 100%;
        width: 100%;
    }
    :global(.markdown .aurora) {
        position:relative;
        display: inline-block;
    }
    :global(.markdown h3) {
        font-size: 1.25rem;
    }
    :global(.markdown blockquote) {
        font-style: italic;
        border-left: 3px solid var(--bs-gray-300);
        padding-left: 1rem;
        background-color: var(--bs-gray-100);
    }
    :global(.markdown details){
        margin-bottom: 1rem; /* extra space otherwise menu might consider the wrong item */
    }
    :global(.markdown li li p) {
        margin-bottom: 0.15rem;
    }
</style>
