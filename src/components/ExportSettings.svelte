<script>
    import ColorPinCombo from './mapSettings/ColorPinCombo.svelte';
    import CheckboxColorCombo from './mapSettings/CheckboxColorCombo.svelte';
    import {storage, stores, validate} from './mapSettings/storage.js';
    import {dashToCamelCase, camelCaseToDash} from './mapSettings/Form.svelte';
    import {kmlExportDefaultOptions, updateKml} from './kml.js';

    const store = stores.exportKML;
    let storedOptions = validate({...(storage.getItem(store) ||{})}, kmlExportDefaultOptions);
    let exportOptions = {...kmlExportDefaultOptions, ...storedOptions};
    const allowedOptions = [
        'routeDisplay', 'routeColor',
        'alternateDisplay', 'alternateColor',
        'natDisplay', 'natColor',
        'greatCircleDisplay', 'greatCircleColor'];
    export let mapOptions;
    const allowedMapOptions = Object.keys(mapOptions)
        .filter(key => allowedOptions.includes(key))
        .reduce((obj, key) => {
            obj[key] = (key === 'routeDisplay')  ? true : mapOptions[key];
            return obj;
        }, {});

    function updateAll(options) {
        let hasChange = false;
        for (const [key, value] of Object.entries(options)) {
            if (exportOptions[key] !== value){
                exportOptions[key] = value;
                const name = camelCaseToDash(key);
                updateKml(name, value);
                hasChange = true;
            }
        }
        if (hasChange) {
            exportOptions = {...exportOptions}; // notify svelte
        }
    }
    for (const [key, value] of Object.entries(exportOptions)) {
        if (kmlExportDefaultOptions[key] !== value){
            const name = camelCaseToDash(key);
            updateKml(name, value);
        }
    }

    function compare(obj1, obj2){
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    $: isDefault = compare(kmlExportDefaultOptions, exportOptions);
    $: isChanged = !compare(storedOptions, exportOptions);
    $: isLikeMap = compare({...exportOptions, ...allowedMapOptions}, exportOptions);


    function update(e) {
        const name = (e.detail) ? e.detail.name : e.target.name;
        const value = (e.detail) ? e.detail.value : e.target.checked;
        const key = dashToCamelCase(name);
        if ( exportOptions[key] !== value) {
            exportOptions[key] = value;
            updateKml(name, value);
        }
    }
    const restore = () => updateAll(storedOptions);
    const reset = () => updateAll(kmlExportDefaultOptions);
    const asMap = () => updateAll({...exportOptions, ...allowedMapOptions});
    function save() {
        if (isDefault) {
            storage.removeItem(store);
        } else {
            const options = {};
            for (const key of Object.keys(exportOptions).filter(k => exportOptions[k] !== kmlExportDefaultOptions[k])){
                options[key] = exportOptions[key];
            }
            storage.setItem(store, options);
        }
        storedOptions = {...exportOptions};
    }
</script>

<div>
    <fieldset class="form-group">
        <legend>Route</legend>
            <ColorPinCombo name="route" kmlColor={exportOptions['routeColor']} selected={exportOptions['routePin']} on:change={update} />
    </fieldset>
    <fieldset class="form-group">
        <legend><input name="alternate-display" checked={exportOptions['alternateDisplay']} type="checkbox" on:change={update} />Dégagement</legend>
        <ColorPinCombo name="alternate" kmlColor={exportOptions['alternateColor']} selected={exportOptions['alternatePin']} on:change={update} />
    </fieldset>
    <fieldset class="form-group">
        <legend><input name="nat-display" checked={exportOptions['natDisplay']} type="checkbox" on:change={update}/>Tracks</legend>
        <ColorPinCombo name="nat" kmlColor={exportOptions['natColor']} selected={exportOptions['natPin']} on:change={update} />
        <small class="form-text text-muted">Positionné à l'entrée des tracks, un track incomplet restera rouge.</small>
    </fieldset>
    <fieldset class="form-group">
        <CheckboxColorCombo name="great-circle" kmlColor={exportOptions['greatCircleColor']} checked={exportOptions['greatCircleDisplay']} on:change={update}>Orthodromie</CheckboxColorCombo>
    </fieldset>
    <div class="mt-3 mb-1 d-flex">
        <button disabled={!isChanged} class="btn btn-primary btn-sm"type="button" on:click={save}>Mémoriser</button>
        <button disabled={!isChanged} class="btn btn-secondary btn-sm ml-3" type="button" on:click={restore}>Restaurer</button>
        <button disabled={isLikeMap} class="btn btn-outline-secondary btn-sm ml-auto" type="button" on:click={asMap}>Comme Carte</button>
        <button disabled={isDefault} class="btn btn-outline-secondary btn-sm ml-auto" type="button" on:click={reset}>Reset</button>
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