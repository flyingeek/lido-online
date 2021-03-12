/* global mapboxgl */
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";
import {supportsHover} from "../../utils";

const folder = 'airport';
const adequateLayer = `${folder}-layer`;
const emergencyLayer = `${folder}-emer-layer`;
const source = `${folder}-source`;

const basicAirportIconColor = (raltNames, hexColor) => ["case",
    ["in", ["get", "name"], ["literal", raltNames]], hexColor,
    ["==", 0, ["get", "level"]], '#095','#C71'];
const statusAirportIconColor = (aircraftType) => ["case",
    ["==", 8, ["get", `${aircraftType}`]], '#ea80d8',
    ["==", 7, ["get", `${aircraftType}`]], '#ea80d8',
    ["==", 6, ["get", `${aircraftType}`]], '#dddddd',
    ["==", 5, ["get", `${aircraftType}`]], '#dddddd',
    ["==", 4, ["get", `${aircraftType}`]], '#fbfe98',
    ["==", 3, ["get", `${aircraftType}`]], '#fbfe98',
    ["==", 2, ["get", `${aircraftType}`]], '#00b0f1',
    ["==", 1, ["get", `${aircraftType}`]], '#00b0f1',
    '#000'];

const getIconColor = (style, aircraftType, raltNames, hexColor) => {
    if (style === 0) {
        return statusAirportIconColor(aircraftType);
    }
    return basicAirportIconColor(raltNames, hexColor);
}

const filterByAircraftType = (aircraftType, is=true) => {
    if (is) {
        return ["in", `${aircraftType}`, ["get", "type"]];
    }else{
        return ["!", ["in", `${aircraftType}`, ["get", "type"]]];
    }
}

const symbolSortKey = (aircraftType, etopsNames) => {
    return ["case",
    ["in", ["get", "name"], ["literal", etopsNames]], 0,
    ["get", `${aircraftType}`]]
}

const getIconHaloWidth = style => (style === 0) ? 3 : 0;
const getTextColor = (raltNames, hexColor) => ["case",
    ["in", ["get", "name"], ["literal", raltNames]], hexColor,
    ["==", 0, ["get", "level"]], '#000',
    '#C60'];

export const addAirports = (data) => {
    const {map, mapData, ofp, kmlOptions} = data;
    const {affineOrDrop} = mapData;
    const affine = affineOrDrop;
    let epPoints = [];
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epPoints = [ofp.infos['EEP'], ofp.infos['EXP']];
    }
    const aircraftType = (ofp.isFake) ? ofp.isFake : ofp.infos.aircraft;
    const raltPoints = ofp.infos['raltPoints'];
    const etopsKmlColor = kmlOptions.etopsColor;
    const style = kmlOptions.airportPin;
    const visibility = kmlOptions.airportDisplay;
    const [hexcolorEtops,] = kml2mapColor(etopsKmlColor);
    const epNames = epPoints.map(g => g.name);
    const raltNames = raltPoints.map(g => g.name);
    const etopsNames = epNames.concat(raltNames);
    fetch('data/airports.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        if (affine) {
            const projFeatures = [];
            for (let feature of data.features) {
                feature.geometry.coordinates = affine(feature.geometry.coordinates);
                if(feature.geometry.coordinates !== undefined) projFeatures.push(feature);
            }
            data.features = projFeatures;
        }
        map.addSource(source, {
            type: 'geojson',
            data: data
        });
        //<select style="background-color: transparent;border: none;"><option>773</option></select>
        map.addLayer({
            'id': emergencyLayer,
            'type': 'symbol',
            'source': source,
            'layout': {
                'icon-image': ["case",
                    ["==", 2, ["get", "level"]], 'sdf-star',
                    'sdf-airport'],
                'icon-size': ["case",
                    ["==", 2, ["get", "level"]], 0.5,
                    0.4],
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': ['get', 'name'],
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': 8,
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false
                //'symbol-sort-key': ["get", `${ofp.infos.aircraft}`]
            },
            'paint': {
                'icon-color': ["case",["==", 1, ["get", "level"]], '#D70', '#B02'],
                'icon-halo-width': 0,
                'icon-halo-color': '#000',
                'text-color': "#000",
                'text-opacity': 0.8
            },
            'filter': filterByAircraftType(aircraftType, false)
        });
        map.addLayer({
            'id': adequateLayer,
            'type': 'symbol',
            'source': source,
            'layout': {
                'icon-image': ["case",
                    ["in", ["get", "name"], ["literal", etopsNames]], 'sdf-triangle',
                    'sdf-airport'],
                'icon-size': ["case",
                    ["in", ["get", "name"], ["literal", etopsNames]], 1,
                    0.6],
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': ['get', 'name'],
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': ["case",
                    ["in", ["get", "name"], ["literal", etopsNames]], 10,
                    8],
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'symbol-sort-key':symbolSortKey(aircraftType, etopsNames)
            },
            'paint': {
                'icon-halo-color':["case", ["==", 0, ["get", "level"]], '#095','#D70'], // normal airports
                'icon-halo-width': getIconHaloWidth(style),
                'icon-color': getIconColor(style, aircraftType, raltNames, hexcolorEtops),
                'text-color': getTextColor(raltNames, hexcolorEtops),
                'text-halo-color': "#000",
                'text-halo-width': ["case", ["==", 0, ["get", "level"]], 0, 0],
                'text-opacity': 0.8
            },
            'filter': filterByAircraftType(aircraftType)
        });
        const popup = new mapboxgl.Popup({
            closeButton: false,
            // on touchscreen, this allows to show popup on each airport click
            // whitout having to click on the map first to cancel the popup
            // this setting has no effect on hover mode
            closeOnClick: false,
            // we need a way to close airport's popup: just move the map
            // this is not needed for popup on hover mode
            closeOnMove: !supportsHover
        });
        const addAirportPopup = function (e) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const title = e.features[0].properties.title;
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            popup.setLngLat(coordinates).setHTML(title).addTo(map);
        };
        const setCursorPointer = () => map.getCanvas().style.cursor = 'pointer';
        const resetCursor = () => map.getCanvas().style.cursor = '';
        const removeAirportPopup = function () {
            resetCursor();
            popup.remove();
        };
        if (supportsHover) {
            map.on('mouseenter', adequateLayer, (e) => {
                setCursorPointer();
                addAirportPopup(e);
            });
            map.on('mouseenter', emergencyLayer, (e) => {
                setCursorPointer();
                addAirportPopup(e);
            });
            map.on('mouseleave', adequateLayer, removeAirportPopup);
            map.on('mouseleave', emergencyLayer, removeAirportPopup);
        }else{
            map.on('mouseenter', adequateLayer, setCursorPointer);
            map.on('mouseenter', emergencyLayer, setCursorPointer);
            map.on('click', adequateLayer, addAirportPopup);
            map.on('click', emergencyLayer, addAirportPopup);
            map.on('mouseleave', adequateLayer, resetCursor);
            map.on('mouseleave', emergencyLayer, resetCursor);
        }

    })
};

export function changeAirportDisplay(data, visible) {
    const {map} = data;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'visibility', (visible) ? 'visible': 'none');
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'visibility', (visible) ? 'visible': 'none');
    }
}

export function changeAirportStyle(data) {
    const {map, kmlOptions, ofp, aircraftType} = data;
    const raltNames = (ofp.isFake) ? [] : ofp.infos.ralts;
    const [hexcolorEtops,] = kml2mapColor(kmlOptions.etopsColor);
    const style = kmlOptions.airportPin;
    if (map.getLayer(adequateLayer)) {
        map.setPaintProperty(adequateLayer, 'icon-color', getIconColor(style, aircraftType, raltNames, hexcolorEtops));
        map.setPaintProperty(adequateLayer, 'text-color',getTextColor(raltNames, hexcolorEtops));
        map.setPaintProperty(adequateLayer, 'icon-halo-width', getIconHaloWidth(style));
    }
}

export function changeAircraftType(data) {
    const {map, kmlOptions, aircraftType, ofp} = data;
    const raltNames = (ofp.isFake) ? [] : ofp.infos.ralts;
    const [hexcolorEtops,] = kml2mapColor(kmlOptions.etopsColor);
    const style = kmlOptions.airportPin;
    let epNames = [];
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epNames = [ofp.infos['EEP'].name, ofp.infos['EXP'].name];
    }
    const etopsNames = epNames.concat(raltNames);
    map.setFilter(adequateLayer, filterByAircraftType(aircraftType));
    map.setPaintProperty(adequateLayer, 'icon-color', getIconColor(style, aircraftType, raltNames, hexcolorEtops));
    map.setLayoutProperty(adequateLayer, 'symbol-sort-key', symbolSortKey(aircraftType, etopsNames));
    map.setFilter(emergencyLayer, filterByAircraftType(aircraftType, false));
}

export default {
    show: (data) => changeAirportDisplay(data, true),
    hide: (data) => changeAirportDisplay(data, false),
    remove: () => {},
    add: addAirports,
    changeLine: () => {},
    changeMarker: changeAirportStyle,
    change: changeAircraftType
}