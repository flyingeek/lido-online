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
    const dispatch = createEventDispatcher();
    export let kmlOptions;
    let storedOptions = JSON.parse(localStorage.getItem("optionsKML")) || kmlDefaultOptions;
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
    function dispatchOptions(obj) {
        for (const [key, value] of Object.entries(obj)) {
            if (kmlOptions[key] !== value){
                dispatch('change', { 'name': camelCaseToDash(key), value});
            }
        }
    }
    function compare(obj1, obj2){
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
    function reset() {
        dispatchOptions(kmlDefaultOptions);
        kmlOptions = {...kmlDefaultOptions};
    }
    function restore() {
        dispatchOptions(storedOptions);
        kmlOptions = {...storedOptions};
    }
    function save() {
        if (isDefault) {
            localStorage.removeItem("optionsKML");
        } else {
            localStorage.setItem("optionsKML", JSON.stringify(kmlOptions));
        }
        storedOptions = {...kmlOptions};
    }
</script>

<form on:submit|preventDefault>
    <fieldset class="form-group">
        <legend>Route</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor name="route-color" kmlColor={kmlOptions['routeColor']} on:change={update}/>
            </div>
            <div class="col-12 col-sm-6">
                <PinSelector name="route-pin" selected={kmlOptions['routePin']} on:change={update}/>
            </div>
        </div>
    </fieldset>
    <fieldset class="form-group">
        <legend><input name="alternate-display" checked={kmlOptions['alternateDisplay']} type="checkbox" on:change={update} />Dégagement</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor name="alternate-color" kmlColor={kmlOptions['alternateColor']} on:change={update}/>
            </div>
            <div class="col-12 col-sm-6">
                <PinSelector name="alternate-pin" selected={kmlOptions['alternatePin']} on:change={update}/>
            </div>
        </div>
    </fieldset>
    <fieldset class="form-group">
        <legend><input name="nat-display" checked={kmlOptions['natDisplay']} type="checkbox" on:change={update}/>Tracks</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor  name="nat-color" kmlColor={kmlOptions['natColor']} on:change={update}/>
                <small class="form-text text-muted">Un track incomplet sera toujours affiché en rouge.</small>
            </div>
            <div class="ccol-12 col-sm-6">
                <PinSelector  name="nat-pin" selected={kmlOptions['natPin']} on:change={update}/>
                <small class="form-text text-muted">Le repère est placé à l'entrée des tracks.</small>
            </div>
        </div>
    </fieldset>
    <div class="row">
        <div class="col-12 col-sm-6">
            <fieldset class="form-group">
                <legend><input name="great-circle-display" checked={kmlOptions['greatCircleDisplay']} type="checkbox" on:change={update}/>Orthodromie</legend>
                <div class="row">
                    <div class="col">
                        <KmlColor name="great-circle-color" kmlColor={kmlOptions['greatCircleColor']} on:change={update}/>
                    </div>
                </div>
            </fieldset>
        </div>
        <div class="col-12 col-sm-6">
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
        <div class="col-12 col-sm-6">
        <button disabled={!isChanged} class="btn btn-secondary btn-sm mb-2" type="button" on:click={restore}>Restaurer</button>
        <button disabled={!isChanged} class="btn btn-primary btn-sm mb-2"type="button" on:click={save}>Mémoriser</button>
        </div>
        <div class="col-12 col-sm-6">
        {#if !isDefault }<button class="btn btn-link btn-sm float-right" type="button" on:click={reset}>Revenir aux valeurs par défaut</button>{/if}
        </div>
    </div>
</form>

<style>
    input[type="checkbox"] {
        margin-bottom: 0.2rem;
        margin-right: 0.5ch;
        vertical-align: middle;
    }
</style>