<script>
    import ColorPinCombo from './mapSettings/ColorPinCombo.svelte';
    import CheckboxColorCombo from './mapSettings/CheckboxColorCombo.svelte';
    import {storage, stores} from './mapSettings/storage.js';
    import {dashToCamelCase, camelCaseToDash} from './mapSettings/Form.svelte';
    import {updateKml} from './kml.js';
    const allowedOptions = [
        'routeDisplay', 'routeColor', 'routePin',
        'alternateDisplay', 'alternateColor', 'alternatePin',
        'natDisplay', 'natColor', 'natPin',
        'greatCircleDisplay', 'greatCircleColor'];
    export let mapOptions;
    const allowedMapOptions = Object.keys(mapOptions)
        .filter(key => allowedOptions.includes(key))
        .reduce((obj, key) => {
            obj[key] = (key === 'routeDisplay')  ? true : mapOptions[key];
            return obj;
        }, {});
    const store = stores.exportKML;
    let storedOptions = {...(storage.getItem(store) ||{})};
    let kmlOptions = {...allowedMapOptions, ...storedOptions};
    
    function updateAll(options) {
        let hasChange = false;
        const onlyDiff = (kmlOptions !== options);
        for (const [key, value] of Object.entries(options)) {
            if (onlyDiff && kmlOptions[key] !== value){
                kmlOptions[key] = value;
                updateKml(camelCaseToDash(key), value);
                hasChange = true;
            }
        }
        if (hasChange) {
            kmlOptions = {...options};
        }
    }
    updateAll(kmlOptions);

    function compare(obj1, obj2){
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    $: isDefault = compare(allowedMapOptions, kmlOptions);
    $: isChanged = !compare(storedOptions, kmlOptions);

    function update(e) {
        const name = (e.detail) ? e.detail.name : e.target.name;
        const value = (e.detail) ? e.detail.value : e.target.checked;
        const key = dashToCamelCase(name);
        if ( kmlOptions[key] !== value) {
            kmlOptions[key] = value;
            updateKml(name, value);
        }
    }
    const restore = () => updateAll(storedOptions);
    const reset = () => updateAll(allowedMapOptions);
    function save() {
        storage.setItem(store, kmlOptions);
        storedOptions = {...kmlOptions};
    }
</script>

<div>
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
    <div class="mt-3 mb-1 d-flex">
        <button disabled={!isChanged} class="btn btn-primary btn-sm"type="button" on:click={save}>Mémoriser</button>
        <button disabled={!isChanged || Object.keys(storedOptions).length === 0} class="btn btn-secondary btn-sm ml-3" type="button" on:click={restore}>Restaurer</button>
        <button disabled={isDefault} class="btn btn-outline-secondary btn-sm ml-auto" type="button" on:click={reset}>Comme carte</button>
    </div>
</div>

<style>
    fieldset.form-group {
        margin-bottom: 0.5rem;
    }
    .btn-primary {
        background-color: var(--blueaf);
        border-color: var(--blueaf);
    }
    .btn:disabled {
        opacity: 0.25;
    }
</style>