<script context="module">
    const getOfpRouteExport = (ofp) => {
        if (ofp.timeMatrix.length > 0) {
            return ofp.timeMatrix.map(([p, sum, fl]) => ({
                "name": p.name,
                "tte": sum,
                fl,
                "latitude":  p.latitude.toFixed(6),
                "longitude":  p.longitude.toFixed(6)}));
        }
        return ofp.route.points.map(p => ({
            "name": p.name,
            "latitude":  p.latitude.toFixed(6),
            "longitude":  p.longitude.toFixed(6)}));
    };
</script>
<script>
    import {ofp, takeOffTime, route} from '../stores';
    import plugins from "../plugins.json";
    export let close;

    export const shareOFP = async (e) => {
        if (!(navigator && navigator.share)) {e.preventDefault(); return false;}
        const linkElement = (e.target.closest('a') || e.target);
        linkElement.classList.add('animate');
        const ofp = $ofp;
        const takeOffTime = $takeOffTime;
        const excluded = ['EEP', 'EXP', 'raltPoints', 'inFlightStart', 'inFlightReleased', 'levels', 'rawFPL'];
        const filteredInfos = Object.fromEntries(
            Object.entries(ofp.infos).filter(([key, val])=> !excluded.includes(key))
        );
        let filteredText;
        try {
            filteredText = (ofp.text.match(/^(?:.+?)Main OFP(?:.+?)(?:--ROUTE\/FL)/s).pop()||'') + '\n\n' + ofp.infos.rawFPL;
        }catch(err){
            console.error(err);
            filteredText = ofp.text;
        }
        const shareData = {
            'title': 'OFP2MAP',
            'text': JSON.stringify({
                ...filteredInfos,
                lidoFPL: ofp.lidoRoute(false).join(' '),
                'realOFF': takeOffTime,
                "altnETOPS": ofp.infos.ralts,
                'route': getOfpRouteExport(ofp),
                plugins,
                rawText: filteredText
            })//.replace(/"(?:lati|longi)tude":"([0-9.]+)"/gu, (_, p1) => p1)
        }

        try {
            await navigator.share(shareData)
        } catch(err) {
            linkElement.classList.remove('animate');
            console.log(err);
        }
        return false;
    };
</script>
<menu>
    {#if $ofp.infos.ralts.length > 0}
        <p>Marge ETOPS: {$ofp.infos.minFuelMarginETOPS.toFixed(1)} T</p>
        <hr>
    {/if}
    <li><a class="text-reset text-decoration-none" href="https://ofp2map-plugins.netlify.app/aurora.html" target="_blank" on:click={close}>
        <span class="icon">
            <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgICAgJCAkKCgkNDgwODRMREBARExwUFhQWFBwrGx8bGx8bKyYuJSMlLiZENS8vNUROQj5CTl9VVV93cXecnNEBCAgICAkICQoKCQ0ODA4NExEQEBETHBQWFBYUHCsbHxsbHxsrJi4lIyUuJkQ1Ly81RE5CPkJOX1VVX3dxd5yc0f/CABEIABQAFAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAABAUGBwMBAQEBAQAAAAAAAAAAAAAAAAUBAAP/2gAMAwEAAhADEAAAAOJ2/nqO4HO05k7OeUnJCu//xAAjEAACAQMDBAMAAAAAAAAAAAABAgMABAURE1ESITFCQ5Gx/9oACAEBAAE/ALeDdYatoOanUx4+SARA/I0vKr20X7810msRbRzShZG0H4OTWZgePHLbxKdl+mRW5FbZHYLVoAkQUe+oas1dTyT3DM5IQKqL6qAop2ZmJJr/xAAaEQACAgMAAAAAAAAAAAAAAAAAARAxESFx/9oACAECAQE/AMUaHa5H/8QAHhEBAAEDBQEAAAAAAAAAAAAAAQQAAgMQEyFRUrL/2gAIAQMBAT8Alyy2Zhwvseit4q8GeKDxd9Gn/9k=" alt="Aurora icon" />
        </span>Aurora</a></li>
    {#if $route !== "/ftl"}
    <!-- <li><a class="text-reset text-decoration-none" href="#/ftl" on:click={close}><span class="icon">⏰</span>FTL</a></li> -->
    {/if}
    <li><a class="text-reset text-decoration-none" href="https://fr.flightaware.com/live/flight/{$ofp.infos.aircraftRegistration.replace('-','')}" on:click={close} target="_blank">
        <span class="icon">
            <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgICAgJCAkKCgkNDgwODRMREBARExwUFhQWFBwrGx8bGx8bKyYuJSMlLiZENS8vNUROQj5CTl9VVV93cXecnNEBCAgICAkICQoKCQ0ODA4NExEQEBETHBQWFBYUHCsbHxsbHxsrJi4lIyUuJkQ1Ly81RE5CPkJOX1VVX3dxd5yc0f/CABEIABQAFAMBIgACEQEDEQH/xAAwAAEAAgMAAAAAAAAAAAAAAAAAAgYDBQcBAAIDAQAAAAAAAAAAAAAAAAABAgMEBf/aAAwDAQACEAMQAAAA4ntoWnpZqOLYYg0Af//EACcQAAMAAgEBBgcAAAAAAAAAAAECAwQRAAUSExQhIjEWICMyQXFy/9oACAEBAAE/AACeDo2XTpkuowU2ibtB+wpJnT3UH+wdg8vC2PVpWk86LraupRhvz8w2jxr4OMGTGj3r/UXxFdj3+1pzB9BX8Ek8+OM89L61BH8M+VkQeK4yiIQKxanqTR23LXtej1rV3djtmZizH9k/J//EABwRAAEDBQAAAAAAAAAAAAAAAAIAAREDEBIhMf/aAAgBAgEBPwAyqaxFNMNPb//EABkRAQACAwAAAAAAAAAAAAAAAAEAAhARQf/aAAgBAwEBPwAKdY6z/9k=" alt="FlightAware logo"/>
        </span>FlightAware</a>
    </li>
    <li><a class="text-reset text-decoration-none" href="https://turbli.com/{$ofp.infos.depIATA}/{$ofp.infos.destIATA}/{$ofp.infos.ofpOUT.toISOString().split('T')[0]}/{$ofp.infos.flightNo.replace(/([A-Z]+)(0*)([1-9]\d*)/,'$1-$3')}" on:click={close} target="_blank">
        <span class="icon">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAU9JREFUOE+llL1SwkAQx3dBtLKysbGUMDa+gW8iJngZCi3ofAcrCp1x4EiY+Ci+gYVDgqWFjZWVDuaci1y8LHdJgJS53d/+9xNhza/TvTuYRdcfNjdck5ebO+54EE/9IfXfGChBbY+LJGQFhhHouLwnECYm9RRAoStAaVBVBgo9ce8PX6ZX79KvAKwDU8F0qK4yB5pg1IkqV+9tbyLSZnr0yv03K5CmpWB6YJPKDEjV2WDStuNHIl1852L/Vf51fAVYBitTqeq4FVAgpPOANfWZ3AqopyuhxpQBcZQEl33bLJqaov6ZgctIWRo9/pkEbL+qdkpdYbBJp2XHGqYJEAC385DdyDfHfxRi8ZXFU+nXHmxaAts81l29pyRkZ8ce7yPAgw7HnV2Ix92cs9FxUMBGaw9mo/Pq8yV3E6D86NgWoPLA6rXCn9ZpHF08l523X54wxBWFLBNqAAAAAElFTkSuQmCC" alt="turbli icon">
        </span>turbli</a>
    </li>
    {#if (navigator && navigator.share)}
        <li><a class="text-reset text-decoration-none" href="#top" on:click|preventDefault={shareOFP}><span class="icon">🧩</span>Plugins</a></li>
    {/if}
</menu>

<style>
    menu {
        padding-left: 10px;
        list-style-type: none;
        font-size: 1.5em;
        line-height: 1.75em;
        margin: 0;
        border: 1px solid lightgrey;
        border-radius: 5px;
        border-top-left-radius: 0;
        border-top-right-radius: 0;
        background-color: var(--bs-light);
    }
    menu>p {
        font-size: small;
        margin-bottom: 0;
    }
    menu>hr {
        margin: 0 0 0 -10px;
    }
    menu>li{
        line-height: 2em;
    }
    menu>li .icon {
        margin-right: 10px;
        display: inline-block;
        width: 20px;
    }
    menu>li a {
        display: block;
        white-space: nowrap;
    }
</style>
