<script context="module">
    export function dashToCamelCase(str) {
        return str.replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
        });
    }
    export function camelCaseToDash(str) {
        return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
    }
</script>

<script>
    import { createEventDispatcher } from 'svelte';
    import { fly } from 'svelte/transition';
    import CheckboxColorCombo from './CheckboxColorCombo.svelte';
    import AirportSelector from './AirportSelector.svelte';
    import ZoomLevel from './ZoomLevel.svelte';
    import {storage, stores, kmlDefaultOptions, validate} from './storage.js';
    import {sidebar, ofp, focusMode} from "../../stores.js";
    import clickOutside from '../../actions/clickOutsideAction';
    const dispatch = createEventDispatcher();
    const store = stores.optionsKML;
    export let kmlOptions;
    let focusOptions;
    let focusBackup;
    const focusStore = stores.focusKML;
    let storedOptions = validate({...(storage.getItem(store) ||{})});
    const focusOptionsDefault = (options) => Object.keys(options)
        .reduce((obj, key) => {
            obj[key] = (key !== 'routeDisplay' && key.endsWith('Display'))  ? false : options[key];
            return obj;
        }, {});

    $: isDefault = compare(kmlOptions, kmlDefaultOptions);
    $: isChanged = !compare(storedOptions, kmlOptions);
    $: isFocusDefault = (focusBackup) ? compare(focusOptionsDefault(focusBackup), kmlOptions) : false;

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

    function toggleFocus(e) {
        e.target.blur();
        if ($focusMode) {
            endFocusMode();
        }else{
            focusBackup = {...kmlOptions};
            focusOptions = validate({...(storage.getItem(focusStore) ||focusOptionsDefault(kmlOptions))});
            $focusMode = true;
            updateAll(focusOptions);
        }
        $sidebar = false;
    }
    export function endFocusMode() {
        if ($focusMode) {
            storage.setItem(focusStore, kmlOptions);
            if (focusBackup) {
                updateAll(focusBackup);
            }
            focusOptions = undefined;
            $focusMode = false;
        }
    }
    function resetFocus() {
        storage.removeItem(focusStore);
        if (focusBackup) {
            focusOptions = focusOptionsDefault(focusBackup);
            updateAll(focusOptions);
        } else {
            console.error('the focus backup should never be undefined');
        }
    }
</script>

{#if $sidebar}
<div class:sidebar={$sidebar} class:focusmode={$focusMode} class="settings"  use:clickOutside on:click_outside={() => $sidebar=false} transition:fly="{{duration: 300, x: 200, y: 0}}">
    <!-- svelte-ignore a11y-missing-content -->
    <a class="btn-close float-end" role="button" href="." on:click|preventDefault={() =>  {$sidebar = !$sidebar}}></a>
    <form on:submit|preventDefault class:mt-5={!$ofp}>
        {#if $ofp}
        <fieldset class="form-group mb-4">
            <legend class="d-flex align-items-center">
                <input name="fir-display" checked={kmlOptions['firDisplay']} type="checkbox" on:change={update}/>FIR REG</legend>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="route" kmlColor={kmlOptions['routeColor']} checked={kmlOptions['routeDisplay']} on:change={update}>
                Route
                <button class="getfocus btn btn-sm btn-outline-info" class:active={$focusMode} on:click|preventDefault={toggleFocus}>
                    {#if $focusMode}<svg><use xlink:href="#checkmark-symbol"/></svg>{/if}FOCUS</button>
            </CheckboxColorCombo>
            {#if $focusMode}<small class="text-center mt-0">Cliquez sur FOCUS pour sortir du mode</small>{/if}
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="alternate" kmlColor={kmlOptions['alternateColor']} checked={kmlOptions['alternateDisplay']} on:change={update}>Dégagement</CheckboxColorCombo>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="nat" kmlColor={kmlOptions['natColor']} checked={kmlOptions['natDisplay']} on:change={update}>Tracks</CheckboxColorCombo>
            <small class="form-text text-muted">Un track incomplet sera rouge</small>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="great-circle" kmlColor={kmlOptions['greatCircleColor']} checked={kmlOptions['greatCircleDisplay']} on:change={update}>Orthodromie</CheckboxColorCombo>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="ogimet" kmlColor={kmlOptions['ogimetColor']} checked={kmlOptions['ogimetDisplay']} on:change={update}>Route GRAMET</CheckboxColorCombo>
        </fieldset>
        <fieldset class="form-group">
            <CheckboxColorCombo name="etops" kmlColor={kmlOptions['etopsColor']} checked={kmlOptions['etopsDisplay']} on:change={update}>ETOPS</CheckboxColorCombo>
        </fieldset>
        <fieldset class="form-group">
            <legend class="d-flex align-items-center">
                <input name="airport-display" checked={kmlOptions['airportDisplay']} type="checkbox" on:change={update}/>Aéroports</legend>
            <AirportSelector selectedPin={kmlOptions['airportPin']} selectedLabel={kmlOptions['airportLabel']} on:change={update} />
        </fieldset>
        {/if}
        <fieldset class="form-group">
            <legend>Aspect général</legend>
            <ZoomLevel name="icon-text-change" label="Labels" value={kmlOptions['iconTextChange']} min={0.9} max={2} on:change={update}/>
            {#if $ofp}
            <ZoomLevel name="line-width-change" label="Lignes" value={kmlOptions['lineWidthChange']} max={3} on:change={update}/>
            {/if}
            <ZoomLevel name="icon-size-change" label="Icônes" value={kmlOptions['iconSizeChange']} on:change={update}/>
        </fieldset>
        <div>
        {#if (!$focusMode)}
            <button disabled={!isChanged} class="btn btn-primary btn-sm"type="button" on:click={save}>Mémoriser</button>
            <button disabled={!isChanged} class="btn btn-secondary btn-sm" type="button" on:click={restore}>Restaurer</button>
            {#if !isDefault}<button class="btn btn-outline-dark btn-sm ms-auto" type="button" on:click={reset}>Reset</button>{/if}
        {:else}
            <button disabled={isFocusDefault} class="resetfocus btn btn-danger btn-sm" type="button" on:click={resetFocus}>RESET Réglages mode FOCUS</button>
        {/if}
        </div>
    </form>
</div>
{/if}

<style>
    :global(.settings input[type="checkbox"]) {
        margin-right: 0.5ch;
    }
    .btn:disabled {
        opacity: .3;
    }
    fieldset small {
        line-height: 1;
        width: var(--formwidth);
        display: block;
        margin-top: -0.05rem;
        font-size: 70%;
        position: absolute;
        font-variant: all-small-caps
    }
    :global(.settings legend, .checkbox-combo label.form-control) {
        font-size: 1rem;
        font-weight: bold;
        font-variant-caps: all-small-caps;
        margin-bottom: 0;
    }
    form {
        --formwidth: 250px;
        width: var(--formwidth);
        margin-top: 5px;
        user-select: none; /* supported by Chrome and Opera */
        -webkit-user-select: none; /* Safari */
        -moz-user-select: none; /* Firefox */
        touch-action: manipulation;
    }
    .form-group{
        margin-bottom: 1.25rem;
    }
    .settings {
        position: absolute;
        right: 0;
        transition: right 0.15s ease-out;
        background-color: #eee;
        border-left: 1px solid rgba(255,255,255,0.2);
        padding: 5px;
        z-index: 2;
    }
    @supports ( backdrop-filter: blur(4px) ) or ( -webkit-backdrop-filter: blur(4px) ) {
        .settings {
            background-color: rgba(254,254,254,0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
        .settings.focusmode {
            background-color: rgba(23, 162, 184, 0.1);
        }
    }

    .getfocus{
        line-height: 1;
        margin-left: auto;
        font-size: 0.8rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        color: var(--bs-info);
        border-color: var(--bs-info);
    }
    .getfocus.active, .getfocus:active {
        color: var(--bs-dark);
        background-color: var(--bs-info);
        border-color: var(--bs-info);
    }
    .getfocus svg {
        width: 0.7rem;
        height: 0.7rem;
        stroke: transparent;
        stroke-width: 8px;
        margin-right: 5px;
        border: 1px solid var(--bs-info);
        padding: 2px;
        border-radius: 2px;
    }
    .getfocus.active svg {
        stroke: var(--bs-dark);
        border: 1px solid var(--bs-dark);
    }
    .getfocus:not(.active):hover{
        background-color: transparent;
        color: var(--bs-info);
    }
    .resetfocus{
        margin-left: auto;
        margin-right: auto;
    }
    .btn-sm{
        font-variant-caps: all-small-caps;
    }
    form>:last-child {
        margin-top: 24px;
        margin-bottom: 0.5rem;
        display: flex;
        column-gap: 0.5rem;
    }
    .settings :global(select[name=airport-pin]), .settings :global(select[name=airport-label]) {
        font-size: 0.9rem;
    }
</style>
