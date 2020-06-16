<script context="module">
    import {kmlDefaultOptions} from "./kml.js";
    function dashToCamelCase(str) {
        return str.replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
        });
    }
    function camelCaseToDash(str) {
        return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
    }
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import KmlColor from "./KmlColor.svelte";
    import PinSelector from './PinSelector.svelte';
    import AirportSelector from './AirportSelector.svelte';
    import {storage, stores} from './storage.js';
    const dispatch = createEventDispatcher();
    const store = stores.optionsKML;
    export let kmlOptions;
    export let mode = "col-12 col-sm-6 col-md-12 col-lg-12 col-xl-12";
    let storedOptions = {...kmlDefaultOptions, ...(storage.getItem(store) ||{})};
    export let sidebar;
    let hamburgerBlink = compare(kmlDefaultOptions, kmlOptions); // check only on entry
    $: isDefault = compare(kmlDefaultOptions, kmlOptions);
    $: isChanged = !compare(storedOptions, kmlOptions);

    /**
     * e is a component event or a dom checkbox event
     */
    function update(e) {
        const name = (e.detail) ? e.detail.name : e.target.name;
        const value = (e.detail) ? e.detail.value : e.target.checked;
        const key = dashToCamelCase(name);
        if ( kmlOptions[key] !== value) {
            kmlOptions[key] = value;
            dispatch('change', {name, value});
        }
    }
    function updateAll(options) {
        let hasChange = false;
        for (const [key, value] of Object.entries(options)) {
            if (kmlOptions[key] !== value){
                kmlOptions[key] = value;
                dispatch('change', { 'name': camelCaseToDash(key), value});
                hasChange = true;
            }
        }
        if (hasChange) {
            kmlOptions = {...options};
        }
    }
    function compare(obj1, obj2){
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
    function reset() {
        updateAll(kmlDefaultOptions);
    }
    function restore() {
        updateAll(storedOptions);
    }
    function save() {
        if (isDefault) {
            storage.removeItem(store);
        } else {
            const options = {};
            for (const key of Object.keys(kmlOptions).filter(k => kmlOptions[k] !== kmlDefaultOptions[k])){
                options[key] = kmlOptions[key];
            }
            storage.setItem(store, options);
        }
        dispatch('save');
        storedOptions = {...kmlOptions};
    }
</script>
<div class:sidebar class="settings">
    <a
    class="hamburger"
    role="button"
    href="."
    on:click|preventDefault={() =>  {sidebar = !sidebar; hamburgerBlink = false;}}>
    <svg class:blink={hamburgerBlink}>
        <use xlink:href="#bars" />
    </svg>
    </a>
    <a
    class="closeB"
    role="button"
    href="."
    on:click|preventDefault={() =>  {sidebar = !sidebar; hamburgerBlink = false;}}>
    <svg class:blink={hamburgerBlink}>
        <use xlink:href="#close" />
    </svg>
    </a>
    <form on:submit|preventDefault>
        <fieldset class="form-group">
            <legend>Route</legend>
            <div class="row">
                <div class={mode}>
                    <KmlColor name="route-color" kmlColor={kmlOptions['routeColor']} on:change={update}/>
                </div>
                <div class={mode}>
                    <PinSelector name="route-pin" selected={kmlOptions['routePin']} on:change={update}/>
                </div>
            </div>
        </fieldset>
        <fieldset class="form-group">
            <legend><input name="alternate-display" checked={kmlOptions['alternateDisplay']} type="checkbox" on:change={update} />Dégagement</legend>
            <div class="row">
                <div class={mode}>
                    <KmlColor name="alternate-color" kmlColor={kmlOptions['alternateColor']} on:change={update}/>
                </div>
                <div class={mode}>
                    <PinSelector name="alternate-pin" selected={kmlOptions['alternatePin']} on:change={update}/>
                </div>
            </div>
        </fieldset>
        <fieldset class="form-group">
            <legend><input name="nat-display" checked={kmlOptions['natDisplay']} type="checkbox" on:change={update}/>Tracks</legend>
            <div class="row">
                <div class={mode}>
                    <KmlColor  name="nat-color" kmlColor={kmlOptions['natColor']} on:change={update}/>
                    <small class="form-text text-muted">Un track incomplet restera rouge.</small>
                </div>
                <div class={mode}>
                    <PinSelector  name="nat-pin" selected={kmlOptions['natPin']} on:change={update}/>
                    <small class="form-text text-muted">Positionné à l'entrée des tracks.</small>
                </div>
            </div>
        </fieldset>
        <div class="row">
            <div class={mode}>
                <fieldset class="form-group">
                    <legend><input name="great-circle-display" checked={kmlOptions['greatCircleDisplay']} type="checkbox" on:change={update}/>Orthodromie</legend>
                    <div class="row">
                        <div class="col">
                            <KmlColor name="great-circle-color" kmlColor={kmlOptions['greatCircleColor']} on:change={update}/>
                        </div>
                    </div>
                </fieldset>
            </div>
            <div class={mode}>
                <fieldset class="form-group">
                    <legend><input name="ogimet-display" checked={kmlOptions['ogimetDisplay']} type="checkbox" on:change={update}/>Route du GRAMET</legend>
                    <div class="row">
                        <div class="col">
                            <KmlColor name="ogimet-color" kmlColor={kmlOptions['ogimetColor']} on:change={update}/>
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
        <div class="row">
            <div class={mode}>
                <fieldset class="form-group">
                    <legend><input name="etops-display" checked={kmlOptions['etopsDisplay']} type="checkbox" on:change={update}/>Etops</legend>
                    <div class="row">
                        <div class="col">
                            <KmlColor name="etops-color" kmlColor={kmlOptions['etopsColor']} on:change={update}/>
                        </div>
                    </div>
                </fieldset>
            </div>
            <div class={mode}>
                <fieldset class="form-group">
                    <legend><input name="airport-display" checked={kmlOptions['airportDisplay']} type="checkbox" on:change={update}/>Airports</legend>
                    <div class="row">
                        <div class="col">
                            <AirportSelector name="airport-pin" selected={kmlOptions['airportPin']} on:change={update} />
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>
        <!-- <fieldset class="form-group">
            <legend><input name="sigmet-display" checked={kmlOptions['sigmetDisplay']} type="checkbox" on:change={update}/>Sigmet</legend>
            <div class="row">
                <div class={mode}>
                    <KmlColor  name="sigmet-color" kmlColor={kmlOptions['sigmetColor']} on:change={update}/>
                </div>
                <div class={mode}>
                    <PinSelector  name="sigmet-pin" selected={kmlOptions['sigmetPin']} on:change={update}/>
                </div>
            </div>
        </fieldset> -->
        <div class="row last">
            <div class={mode}>
            <button disabled={!isChanged} class="btn btn-primary btn-sm mb-2"type="button" on:click={save}>Mémoriser</button>
            <button disabled={!isChanged} class="btn btn-secondary btn-sm mb-2" type="button" on:click={restore}>Restaurer</button>
            </div>
            <div class={mode}>
            {#if !isDefault }<button class="btn btn-link btn-sm float-right" type="button" on:click={reset}>Revenir aux valeurs par défaut</button>{/if}
            </div>
        </div>
    </form>
</div>

<style>
    input[type="checkbox"] {
        margin-bottom: 0.2rem;
        margin-right: 0.5ch;
        vertical-align: middle;
    }
    small {
        margin-top: -0.3rem;
        margin-bottom: 0.25rem;
    }
    legend {
        font-size: 1rem;
        font-weight: bold;
        font-variant-caps: all-small-caps;
        margin-bottom: 0;
    }
    form {
        width: 250px;
    }
    .hamburger {
        display: block !important;
        position: absolute;
        left: -30px;
        top: 0.7rem;
    }
    .closeB {
        display: none;
        position: absolute;
        left: 230px;
        top: 0;
    }
    .settings {
        position: absolute;
        right: -260px;
        transition: right 0.15s ease-out;
        background-color: #eee;
        padding: 5px;
        z-index: 2;
        height: 100vh;
    }
    .sidebar .hamburger {
        display: none !important;
    }
    .sidebar .closeB {
        display: block !important;
    }
    .settings.sidebar {
        right: 0;
    }
    .form-group {
        margin-bottom: 0;
    }
    .row.last {
        margin-top: 10px;
    }
    @media (max-width: 767px), (max-height: 700px) {
        .hamburger, .closeB {
            display: none;
        }
        .settings {
            position: relative;
            background-color: inherit;
            right: 0;
            height: auto;
        }
        form {
            width: auto;
        }
    }
    svg {
      fill:#555;
      width: 20px;
      height: 20px;
      animation: none;
    }
    svg.blink {
        animation: blink 3s ease infinite;
    }


    @keyframes blink {
        0% { transform: scale(1.0); }
        75% { transform: scale(1.0); }
        80% { transform: scale(1.2); }
        95% { transform: scale(1.2); }
        100% { transform: scale(1.0); }
    } 

</style>