<script context="module">
    import {kmlDefaultOptions} from "../kml.js";
    function dashToCamelCase(str) {
        return str.replace(/-([a-z])/g, function (g) {
            return g[1].toUpperCase();
        });
    }

    // function camelCaseToDash(str) {
    //     return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
    // }
</script>
<script>
    import { createEventDispatcher } from 'svelte';
    import KmlColor from "./KmlColor.svelte";
    import PinSelector from './PinSelector.svelte';
    const dispatch = createEventDispatcher();
    export let kmlOptions;
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

    /**
     * helper function to write the html markup
     * usage: {...attr('route-color')}
     */
    function attr(dashName) {
        if (dashName.endsWith('-color')) {
            return {
                'name': dashName,
                'kmlColor': kmlOptions[dashToCamelCase(dashName)]
            }
        } else if (dashName.endsWith('-display')) {
            return {
                'name': dashName,
                'checked': kmlOptions[dashToCamelCase(dashName)],
            }
        } else if (dashName.endsWith('-pin')) {
            return {
                'name': dashName,
                'selected': kmlOptions[dashToCamelCase(dashName)]
            }
        }
        console.error(`unknown attribute ${dashName}`);
    }
</script>

<form>
    <fieldset class="form-group">
        <legend>Route</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor {...attr('route-color')} on:change={update}/>
            </div>
            <div class="col-12 col-sm-6">
                <PinSelector {...attr('route-pin')} on:change={update}/>
            </div>
        </div>
    </fieldset>
    <fieldset class="form-group">
        <legend><input {...attr('alternate-display')} type="checkbox" on:change={update} />Dégagement</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor {...attr('alternate-color')} on:change={update}/>
            </div>
            <div class="col-12 col-sm-6">
                <PinSelector {...attr('alternate-pin')} on:change={update}/>
            </div>
        </div>
    </fieldset>
    <fieldset class="form-group">
        <legend><input {...attr('nat-display')} type="checkbox" on:change={update}/>Tracks</legend>
        <div class="row">
            <div class="col-12 col-sm-6">
                <KmlColor  {...attr('nat-color')} on:change={update}/>
                <small class="form-text text-muted">Un track incomplet sera toujours affiché en rouge.</small>
            </div>
            <div class="ccol-12 col-sm-6">
                <PinSelector  {...attr('nat-pin')} on:change={update}/>
                <small class="form-text text-muted">Le repère est placé à l'entrée des tracks.</small>
            </div>
        </div>
    </fieldset>
    <div class="row">
        <div class="col-12 col-sm-6">
            <fieldset class="form-group">
                <legend><input {...attr('great-circle-display')} type="checkbox" on:change={update}/>Orthodromie</legend>
                <div class="row">
                    <div class="col">
                        <KmlColor {...attr('great-circle-color')} on:change={update}/>
                    </div>
                </div>
            </fieldset>
        </div>
        <div class="col-12 col-sm-6">
            <fieldset class="form-group">
                <legend><input {...attr('ogimet-display')} type="checkbox" on:change={update}/>Route du GRAMET</legend>
                <div class="row">
                    <div class="col">
                        <KmlColor {...attr('ogimet-color')} on:change={update}/>
                    </div>
                </div>
            </fieldset>
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