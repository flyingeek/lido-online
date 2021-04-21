/* global mapboxgl */
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";
import {computeIconTextSize, computeIconSize} from '../utils';
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

const adequateTextSize = (etopsNames, textRatio) => {
    return ["case",
    ["in", ["get", "name"], ["literal", etopsNames]], computeIconTextSize(textRatio, 10),
    computeIconTextSize(textRatio, 8, 1.15)]
}
const emergencyTextSize = (textRatio) => {
    return computeIconTextSize(textRatio, 8, 1.15)
}
const adequateIconSize = (etopsNames, iconRatio) => {
    return ["case",
    ["in", ["get", "name"], ["literal", etopsNames]], computeIconSize(iconRatio, 1),
    computeIconSize(iconRatio, 0.6)]
}
const emergencyIconSize = (iconRatio) => {
    return ["case",
    ["==", 2, ["get", "level"]], computeIconSize(iconRatio, 0.5, 1.2),
    computeIconSize(iconRatio, 0.4, 1.2)]
}
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
                'icon-size': emergencyIconSize(kmlOptions['iconSizeChange']),
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': ['get', 'name'],
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': emergencyTextSize(kmlOptions['iconTextChange']),
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
                'icon-size': adequateIconSize(etopsNames, kmlOptions['iconSizeChange']),
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': ['get', 'name'],
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': adequateTextSize(etopsNames, kmlOptions['iconTextChange']),
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
            let html = `<div class="airport"><h1>${title}</h1>`;
            const security = e.features[0].properties.level;
            const status = e.features[0].properties[aircraftType];
            //console.log(status, typeof status)
            let statusText = "";
            let statusNum = "0";
            switch(status) {
                case 1:
                case 2:
                    statusText = "Destination & RCF";
                    statusNum = "3";
                    break;
                case 3:
                case 4:
                    statusText = "Dégagement à destination";
                    statusNum = "2";
                    break;
                case 5:
                case 6:
                    statusText = "Dégagement en route";
                    statusNum = "2 ERA";
                    break;
                case 7:
                case 8:
                    statusText = "Appui etops, o2, panne moteur, adéquat en route";
                    statusNum = "1";
                    break;
            }
            if (!ofp.isFake) {
                html +=  `<p class="status status-${statusNum.charAt(0)}">STATUT ${statusNum}</p>`;
                if(security > 0) html += `<p class="security-${security}">SECURITY ${(security==1) ? 'ORANGE' : 'RED'}</p>`;
                if(statusText) html += `<p class="status-text">${statusText}</p>`;
            }
            html += "</div>";
            popup.setLngLat(coordinates).setHTML(html).addTo(map);
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
const getEtopsNames = (ofp) => {
    const raltNames = (ofp.isFake) ? [] : ofp.infos.ralts;
    let epNames = [];
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epNames = [ofp.infos['EEP'].name, ofp.infos['EXP'].name];
    }
    return [raltNames, epNames.concat(raltNames)];
}
export function changeAircraftType(data) {
    const {map, kmlOptions, aircraftType, ofp} = data;
    const [raltNames, etopsNames] = getEtopsNames(ofp);
    const [hexcolorEtops,] = kml2mapColor(kmlOptions.etopsColor);
    const style = kmlOptions.airportPin;
    map.setFilter(adequateLayer, filterByAircraftType(aircraftType));
    map.setPaintProperty(adequateLayer, 'icon-color', getIconColor(style, aircraftType, raltNames, hexcolorEtops));
    map.setLayoutProperty(adequateLayer, 'symbol-sort-key', symbolSortKey(aircraftType, etopsNames));
    map.setFilter(emergencyLayer, filterByAircraftType(aircraftType, false));
}
const changeIconText = (data) => {
    const {map, kmlOptions, ofp} = data;
    const [, etopsNames] = getEtopsNames(ofp);
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'text-size', adequateTextSize(etopsNames, kmlOptions['iconTextChange']));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'text-size', emergencyTextSize(kmlOptions['iconTextChange']));
    }
}
const changeIconSize = (data) => {
    const {map, kmlOptions, ofp} = data;
    const [, etopsNames] = getEtopsNames(ofp);
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'icon-size', adequateIconSize(etopsNames, kmlOptions['iconSizeChange']));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'icon-size', emergencyIconSize(kmlOptions['iconSizeChange']));
    }
}
export default {
    show: (data) => changeAirportDisplay(data, true),
    hide: (data) => changeAirportDisplay(data, false),
    add: addAirports,
    changeMarker: changeAirportStyle,
    change: changeAircraftType,
    changeIconText,
    changeIconSize
}