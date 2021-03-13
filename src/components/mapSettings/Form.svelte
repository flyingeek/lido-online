<script context="module">
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
    import {kmlDefaultOptions} from "../kml.js";
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import ColorPinCombo from './ColorPinCombo.svelte';
    import CheckboxColorCombo from './CheckboxColorCombo.svelte';
    import AirportSelector from './AirportSelector.svelte';
    import ZoomLevel from './ZoomLevel.svelte';
    import {storage, stores} from './storage.js';
    import {sidebar} from "../../stores.js";
    import clickOutside from '../../actions/clickOutsideAction';
    const dispatch = createEventDispatcher();
    const store = stores.optionsKML;
    export let kmlOptions;
    let storedOptions = {...kmlDefaultOptions, ...(storage.getItem(store) ||{})};
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

{#if $sidebar}
<div class:sidebar={$sidebar} class="settings"  use:clickOutside on:click_outside={() => $sidebar=false} transition:fly="{{duration: 300, x: 200, y: 0}}">
    <a
    class="closeB"
    role="button"
    href="."
    on:click|preventDefault={() =>  {$sidebar = !$sidebar}}>
    <svg>
        <use xlink:href="#close-symbol" />
    </svg>
    </a>
    <form on:submit|preventDefault>
        <div class="reset">
            <button class="btn btn-light btn-sm" class:invisible={isDefault} type="button" on:click={reset}>Revenir aux valeurs par défaut</button>
        </div>
        <fieldset class="form-group">
            <legend>Route</legend>
                <ColorPinCombo name="route" kmlColor={kmlOptions['routeColor']} selected={kmlOptions['routePin']} on:change={update} />
        </fieldset>
        <fieldset class="form-group">
            <legend><input name="alternate-display" checked={kmlOptions['alternateDisplay']} type="checkbox" on:change={update} />Dégagement</legend>
            <ColorPinCombo name="alternate" kmlColor={kmlOptions['alternateColor']} selected={kmlOptions['alternatePin']} on:change={update} />
        </fieldset>
        <fieldset class="form-group">
            <legend><input name="nat-display" checked={kmlOptions['natDisplay']} type="checkbox" on:change={update}/>Tracks</legend>
            <ColorPinCombo name="nat" kmlColor={kmlOptions['natColor']} selected={kmlOptions['natPin']} on:change={update} />
            <small class="form-text text-muted">Positionné à l'entrée des tracks, un track incomplet restera rouge.</small>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="great-circle" label="Orthodromie" kmlColor={kmlOptions['greatCircleColor']} checked={kmlOptions['greatCircleDisplay']} on:change={update}/>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="ogimet" label="Route GRAMET" kmlColor={kmlOptions['ogimetColor']} checked={kmlOptions['ogimetDisplay']} on:change={update}/>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="etops" label="ETOPS" kmlColor={kmlOptions['etopsColor']} checked={kmlOptions['etopsDisplay']} on:change={update}/>
        </fieldset>
        <fieldset class="form-group">
            <AirportSelector name="airport" selected={kmlOptions['airportPin']} checked={kmlOptions['airportDisplay']} on:change={update} />
        </fieldset>
        <fieldset class="form-group">
            <legend><input name="fir-display" checked={kmlOptions['firDisplay']} type="checkbox" on:change={update}/>FIR SÛRETÉ</legend>
        </fieldset>
        <fieldset class="form-group">
            <ZoomLevel name="icon-text-change" label="Label" value={kmlOptions['iconTextChange']} on:change={update}/>
            <ZoomLevel name="line-width-change" label="Ligne" value={kmlOptions['lineWidthChange']} min={0.6} max={2} step={0.2} on:change={update}/>
            <ZoomLevel name="icon-size-change" label="Icône" value={kmlOptions['iconSizeChange']} min={0.6} max={2} step={0.1} on:change={update}/>
        </fieldset>

        <div class="last">
            <button disabled={!isChanged} class="btn btn-primary btn-sm mb-2"type="button" on:click={save}>Mémoriser</button>
            <button disabled={!isChanged} class="btn btn-secondary btn-sm mb-2" type="button" on:click={restore}>Restaurer</button>
        </div>
    </form>
</div>
{/if}
<style>
    .settings :global(input[type="checkbox"]) {
        margin-right: 0.5ch;
    }
    .btn:disabled {
        opacity: .3;
    }
    small {
        line-height: 1.1;
        margin-bottom: 0.25rem;
    }
    .settings :global(legend, .checkbox-combo .input-group-text) {
        font-size: 1rem;
        font-weight: bold;
        font-variant-caps: all-small-caps;
        margin-bottom: 0;
    }
    form {
        width: 250px;
        margin-top: 3px;
    }
    .form-group{
        margin-bottom: 0.8em;
    }
    .closeB {
        position: absolute;
        right:10px;
        top: 7px;
    }
    .settings {
        position: absolute;
        right: -10px;
        transition: right 0.15s ease-out;
        background-color: #eee;
        border-left: 1px solid rgba(255,255,255,0.2);
        padding: 5px;
        z-index: 2;
        /* height: 100%; */
        /* top: 0; */
    }
    .reset button{
        background-color: #e2e6ea;
        color: var(--gray);
    }
    @supports ( backdrop-filter: blur(4px) ) or ( -webkit-backdrop-filter: blur(4px) ) {
        .settings {
            background-color: rgba(254,254,254,0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
    }
    .last {
        margin-top: 24px;
    }
    svg {
        stroke:#555;
        width: 20px;
        height: 20px;
        animation: none;
    }

</style>