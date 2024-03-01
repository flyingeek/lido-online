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
    export let addInfos = false;

    $: flipDirection = (Math.random() <0.5) ? 'flipHead' : 'flipTail';

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
    export const afURL = (flightNo, depIATA, depUTCIsoString) => {
        try {
            const utc = new Date(depUTCIsoString);
            const tzOffset = parseFloat(editolido.tzOffset(depIATA, depUTCIsoString));
            const dateStr = new Date(utc.getTime() + tzOffset * 3600000).toISOString().split('T')[0].replace(/-/g, ''); // format YYYYMMDD in local departure time
            return `https://wwws.airfrance.fr/flight-status/flight-list?date=${dateStr}&flightNumber=${flightNo}`;
        } catch (e) {
            console.error(e);
            return "https://wwws.airfrance.fr/flight-status";
        }
    }
</script>
<menu>
    {#if addInfos}
        <p style="line-height: normal; margin-top:0.5em;"><b>{$ofp.infos.flightNo}</b> {$ofp.infos.depICAO}-{$ofp.infos.destICAO}</p>
        <p style="line-height: normal;">{$ofp.infos.ofpTextDate} {($ofp.infos.ofp.includes('/')) ? '' : 'ofp: '}{$ofp.infos.ofp}</p>
        {#if $ofp.infos.ralts.length > 0}
            <p>Marge ETOPS: {$ofp.infos.minFuelMarginETOPS.toFixed(1)} T</p>
        {/if}
        <hr>
    {:else}
        {#if $ofp.infos.ralts.length > 0}
            <p>Marge ETOPS: {$ofp.infos.minFuelMarginETOPS.toFixed(1)} T</p>
            <hr>
        {/if}
    {/if}
    <li><a class="text-reset text-decoration-none" href="{afURL($ofp.infos.flightNo, $ofp.infos.depIATA, $ofp.infos.ofpOUT.toISOString())}" on:click={close} target="_blank">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAACEUExURf////zW1/FJUPBAR/BCSe87QvaKjv74+PFRV+0cJO4uNf3g4faMkPm2ufvKy+0iKvR3fP7z8/BES/BARv7w8PV8ge0gKPrFx/q7vu0eJvaIjP3r7O84P/FNU/739//7+/Nma+4rM/zU1v7x8fNsce4oL/rAwvm5u+8zOu85QPA/RfNobS/40rMAAAABYktHRACIBR1IAAAAB3RJTUUH6AIWDTAjTIi8vgAAAGBJREFUGNONz0cSgCAQRFFUDBgwZ1TM6f73s5xiNq78u9e7JuR3mm5QSk0LbTvszfVw8MEsQPMQHKHjBJxmOOTgokRXNQwNuhXgrlceJHiclOcFvG7KuzzEKa6b/z/17QGm3AW2JvXFcgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNC0wMi0yMlQxMzo0ODozNSswMDowMChp0C0AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjQtMDItMjJUMTM6NDg6MzUrMDA6MDBZNGiRAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI0LTAyLTIyVDEzOjQ4OjM1KzAwOjAwDiFJTgAAAABJRU5ErkJggg==" alt="af icon">
        <span class="label">AF flight status</span></a>
    </li>
    <li><a class="text-reset text-decoration-none" href="https://fr.flightaware.com/live/flight/{$ofp.infos.aircraftRegistration.replace('-','')}" on:click={close} target="_blank">
        <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgICAgJCAkKCgkNDgwODRMREBARExwUFhQWFBwrGx8bGx8bKyYuJSMlLiZENS8vNUROQj5CTl9VVV93cXecnNEBCAgICAkICQoKCQ0ODA4NExEQEBETHBQWFBYUHCsbHxsbHxsrJi4lIyUuJkQ1Ly81RE5CPkJOX1VVX3dxd5yc0f/CABEIABQAFAMBIgACEQEDEQH/xAAwAAEAAgMAAAAAAAAAAAAAAAAAAgYDBQcBAAIDAQAAAAAAAAAAAAAAAAABAgMEBf/aAAwDAQACEAMQAAAA4ntoWnpZqOLYYg0Af//EACcQAAMAAgEBBgcAAAAAAAAAAAECAwQRAAUSExQhIjEWICMyQXFy/9oACAEBAAE/AACeDo2XTpkuowU2ibtB+wpJnT3UH+wdg8vC2PVpWk86LraupRhvz8w2jxr4OMGTGj3r/UXxFdj3+1pzB9BX8Ek8+OM89L61BH8M+VkQeK4yiIQKxanqTR23LXtej1rV3djtmZizH9k/J//EABwRAAEDBQAAAAAAAAAAAAAAAAIAAREDEBIhMf/aAAgBAgEBPwAyqaxFNMNPb//EABkRAQACAwAAAAAAAAAAAAAAAAEAAhARQf/aAAgBAwEBPwAKdY6z/9k=" alt="FlightAware logo"/>
        <span class="label">FlightAware</span></a>
    </li>
    <li><a class="text-reset text-decoration-none" href="https://ofp2map-plugins.netlify.app/aurora.html" target="_blank" on:click={close}>
        <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgICAgJCAkKCgkNDgwODRMREBARExwUFhQWFBwrGx8bGx8bKyYuJSMlLiZENS8vNUROQj5CTl9VVV93cXecnNEBCAgICAkICQoKCQ0ODA4NExEQEBETHBQWFBYUHCsbHxsbHxsrJi4lIyUuJkQ1Ly81RE5CPkJOX1VVX3dxd5yc0f/CABEIABQAFAMBIgACEQEDEQH/xAAuAAEAAwEBAAAAAAAAAAAAAAAABAUGBwMBAQEBAQAAAAAAAAAAAAAAAAUBAAP/2gAMAwEAAhADEAAAAOJ2/nqO4HO05k7OeUnJCu//xAAjEAACAQMDBAMAAAAAAAAAAAABAgMABAURE1ESITFCQ5Gx/9oACAEBAAE/ALeDdYatoOanUx4+SARA/I0vKr20X7810msRbRzShZG0H4OTWZgePHLbxKdl+mRW5FbZHYLVoAkQUe+oas1dTyT3DM5IQKqL6qAop2ZmJJr/xAAaEQACAgMAAAAAAAAAAAAAAAAAARAxESFx/9oACAECAQE/AMUaHa5H/8QAHhEBAAEDBQEAAAAAAAAAAAAAAQQAAgMQEyFRUrL/2gAIAQMBAT8Alyy2Zhwvseit4q8GeKDxd9Gn/9k=" alt="Aurora icon" />
        <span class="label">Space Weather</span></a>
    </li>
    <li><a class="text-reset text-decoration-none" href="https://turbli.com/{$ofp.infos.depIATA}/{$ofp.infos.destIATA}/{$ofp.infos.ofpOUT.toISOString().split('T')[0]}/{$ofp.infos.flightNo.replace(/([A-Z]+)(0*)([1-9]\d*)/,'$1-$3')}" on:click={close} target="_blank">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAU9JREFUOE+llL1SwkAQx3dBtLKysbGUMDa+gW8iJngZCi3ofAcrCp1x4EiY+Ci+gYVDgqWFjZWVDuaci1y8LHdJgJS53d/+9xNhza/TvTuYRdcfNjdck5ebO+54EE/9IfXfGChBbY+LJGQFhhHouLwnECYm9RRAoStAaVBVBgo9ce8PX6ZX79KvAKwDU8F0qK4yB5pg1IkqV+9tbyLSZnr0yv03K5CmpWB6YJPKDEjV2WDStuNHIl1852L/Vf51fAVYBitTqeq4FVAgpPOANfWZ3AqopyuhxpQBcZQEl33bLJqaov6ZgctIWRo9/pkEbL+qdkpdYbBJp2XHGqYJEAC385DdyDfHfxRi8ZXFU+nXHmxaAts81l29pyRkZ8ce7yPAgw7HnV2Ix92cs9FxUMBGaw9mo/Pq8yV3E6D86NgWoPLA6rXCn9ZpHF08l523X54wxBWFLBNqAAAAAElFTkSuQmCC" alt="turbli icon">
        <span class="label">turbli</span></a>
    </li>
    <li><a class="text-reset text-decoration-none" href="https://ofp2map-plugins.netlify.app/pile-ou-face/index.html" target="_blank" on:click={close}>
        <img src="data:image/webp;base64,UklGRrYBAABXRUJQVlA4WAoAAAAQAAAAEwAAEwAAQUxQSKgAAAABgFhbmyHpq6mZ6GwzGDsSKxKvFYHxb33rqhAiQoHbNsqYd/ALQGl4MqPTh/uLaU5BKwBKIbLjH9wEAfXDLVLEkEaE7APKixpF+AflnUNo+CmG/6B5ZxyeHYX/ovDEV7QxKazM7fDB1RWNDQxvH+mAr25w6eLczVxK1gWXQVW9d3krhPluf1ONlu3tB9D2Pxr8+Tj/P395jP/w7z/Pzy4eHq7mJR+0AgBWUDgg6AAAAPAFAJ0BKhQAFAA+kTyYSCWjIqEoDVCwEglAFiPQj4E6AD0n0AA0kadkh0koZp4NXExH+CklnjoAAP7gq+JXrKdjT96/tOz+imG5vSZevgyNxp0KBpLfrdDfYoXFlMv8zMQnVXfGP0a7YZ1lxT2FfzM4F6oILrVSzf0O592fHJvo8Hc5vo7xmnlWAQOrkQOGiecTWQ12Yc1A3V9SKheYNK4Ofh+l3cqYVcUhYNuUHteS5t/S+5PuXxqnJLWGpRe9W/9WkINrcV4j+A9jocr6ljFPAiM8u3IH+6TtHgNomYm3AaiuesAAAAA=" alt="pièce 1 euro"/>
        <span class="label coin {flipDirection}">
            <span class="side head">Pile</span>
            <span class="side tail">Face</span>
        </span></a>
    </li>
    {#if (navigator && navigator.share)}
        <hr>
        <li><a class="text-reset text-decoration-none" href="#top" on:click|preventDefault={shareOFP}><span class="icon">🧩</span><span class="label">Plugins</span></a></li>
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
    menu>li .icon {
        width: 20px;
        vertical-align: middle;
        line-height: normal;
    }
    menu>li img, menu>li .icon {
        margin-right: 10px;
    }
    menu>li a {
        display: flex;
        white-space: nowrap;
        height: 2em;
        line-height: 2em; /* only useful for the .coin */
        align-items: center;
    }
    .coin {
        font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
        cursor: pointer;
        transform-style: preserve-3d;
        transform-box: fill-box; /* for Safari */
        width: 4ch;
        height: 100%;
    }
    .side {
        width: 100%;
        height: 100%;
        position: absolute;
        backface-visibility: hidden;
        display: block;
    }
    .head {
        z-index: 10;
    }
    .tail {
        transform: rotateY(-180deg);
    }
    :global(menu .flipHead) {
        animation: resultHead 1.2s ease-out forwards;
    }
    :global(menu .flipTail) {
        animation: resultTail 1.5s ease-out forwards;
    }

    @keyframes resultHead {
        from { transform: rotateY(0); }
        to { transform: rotateY(720deg); }
    }

    @keyframes resultTail {
        from { transform: rotateY(0); }
        to { transform: rotateY(900deg); }
    }
</style>
