/* global mapboxgl editolido */
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";
import {isMedicalStyle, isStatusStyle} from "../../mapSettings/AirportSelector.svelte";
import {computeIconTextSize, computeIconSize, haloLightColor, haloTextBlur, haloTextWidth} from '../utils';
import {supportsHover} from "../../utils";
import { countryCodeName, countryCodeEmoji } from "../../countries";
import {get} from "svelte/store";
import {aircraftType as aircraftTypeStore} from '../../../stores';

const folder = 'airport';
const adequateLayer = `${folder}-layer`;
const emergencyLayer = `${folder}-emer-layer`;
const etopsLayer = `${folder}-etops-layer`;
const source = `${folder}-source`;
const medicalColor = '#062DF8';
const medicalCondition = ["==", 1, ["get", "h"]];


const basicAirportIconColor = (raltNames, hexColor) => ["case",
    ["in", ["get", "name"], ["literal", raltNames]], hexColor,
    ["==", 0, ["get", "level"]], '#095','#C71'];
const medicalAirportIconColor = (raltNames, hexColor) => ["case",
    ["in", ["get", "name"], ["literal", raltNames]], hexColor,
    ["==", 0, ["get", "level"]], medicalColor,'#C71'];
const statusAirportIconColor = (aircraftType) => ["case",
    ["==", 9, ["get", `${aircraftType}`]], '#ea80d8',
    ["==", 8, ["get", `${aircraftType}`]], '#ea80d8',
    ["==", 7, ["get", `${aircraftType}`]], '#dddddd',
    ["==", 6, ["get", `${aircraftType}`]], '#dddddd',
    ["==", 5, ["get", `${aircraftType}`]], '#fbfe98',
    ["==", 4, ["get", `${aircraftType}`]], '#fbfe98',
    ["==", 3, ["get", `${aircraftType}`]], '#00b0f1',
    ["==", 2, ["get", `${aircraftType}`]], '#00b0f1',
    '#000'];

const getIconColor = (style, aircraftType, raltNames, hexColor, ofpLoaded) => {
    if (!ofpLoaded) return '#095';
    if (isStatusStyle(style)) {
        return statusAirportIconColor(aircraftType);
    } else if (isMedicalStyle(style)) {
        return medicalAirportIconColor(raltNames, hexColor);
    }
    return basicAirportIconColor(raltNames, hexColor);
}

const filterByAircraftType = (aircraftType, is=true, medicalOnly=false) => {
    const typeCondition = ["<", ["coalesce", ["get", `${aircraftType}`], 11], 10];
    if (medicalOnly) {
        if (is) {
            return ["all", medicalCondition, typeCondition];
        }else{
            return ["to-boolean", false]; //none
        }
    }else{
        if (is) {
            return typeCondition;
        }else{
            return ["!", typeCondition];
        }
    }
}
const adequateFilter = (aircraftType, is, medicalOnly, etopsNames) => [
    "all",
    filterByAircraftType(aircraftType, is, medicalOnly),
    ["!", ["in", ["get", "name"], ["literal", etopsNames]]]];
const etopsFilter = (aircraftType, is, medicalOnly, etopsNames) => [
    "all",
    filterByAircraftType(aircraftType, is, medicalOnly),
    ["in", ["get", "name"], ["literal", etopsNames]]];
const emergencyFilter = (aircraftType, is, medicalOnly) => filterByAircraftType(aircraftType, is, medicalOnly);
const symbolSortKey = (aircraftType, maxPriorityNames) => {
    // maxPriority = 0
    // medical = 1
    // then by order field
    return ["case",
    ["in", ["get", "name"], ["literal", maxPriorityNames]], 0,
    ["case", medicalCondition, 1, ["get", `${aircraftType}`]]]
}

const getIconHaloWidth = (style, ofpLoaded) => (style === 0 && ofpLoaded) ? 3 : 0;
const getTextColor = (style, raltNames, hexColor, ofpLoaded) => {
    const styleBasedColor = (!isMedicalStyle(style)) ? ["case", medicalCondition, medicalColor, '#000'] : '#000';
    if (!ofpLoaded) return styleBasedColor;
    return ["case",
    ["in", ["get", "name"], ["literal", raltNames]], hexColor,
    ["==", 0, ["get", "level"]], styleBasedColor,
    '#8d4600'];
};
const getAdequateTextField = (style, labelling) => {
    const label = (labelling === 0) ? ['get', 'name'] : ['get', 'iata'];
    if (!isMedicalStyle(style)) return ["case", ["==", 1, ["get", "h"]], ["concat", label, '\u200A✚'], label];  //https://jkorpela.fi/chars/spaces.html
    return label;
};
const getETOPSTextField = getAdequateTextField;
const getEmergencyTextField = (labelling) => {
    const label = (labelling === 0) ? ['get', 'name'] : ['get', 'iata'];
    return label;
};
const interpolateTextSize = (size, maxZoom=10, magnification =2) => [
    "interpolate", ["linear"], ["zoom"],
    // zoom is 5 (or less) -> circle radius will be 1px
    3, size,
    // zoom is 10 (or greater) -> circle radius will be 5px
    maxZoom, size * magnification
];
const etopsTextSize = (textRatio, maxZoom) => {
    return interpolateTextSize(computeIconTextSize(textRatio, 10), maxZoom);
};
const emergencyTextSize = (textRatio, maxZoom) => {
    return interpolateTextSize(computeIconTextSize(textRatio, 8, 1.15), maxZoom);
};
const adequateTextSize = emergencyTextSize;

const adequateHaloBlur = (textRatio) => {
    return haloTextBlur(computeIconTextSize(textRatio, 8, 1.15));
};
const etopsHaloBlur = (textRatio) => {
    return haloTextBlur(computeIconTextSize(textRatio, 10));
};
const emergencyHaloBlur = (textRatio) => {
    return haloTextBlur(computeIconTextSize(textRatio, 8, 1.15));
};
const adequateHaloWidth = (textRatio) => {
    return haloTextWidth(computeIconTextSize(textRatio, 8, 1.15));
};
const etopsHaloWidth = (textRatio) => {
    return haloTextWidth(computeIconTextSize(textRatio, 10));
};
const emergencyHaloWidth = (textRatio) => {
    return haloTextWidth(computeIconTextSize(textRatio, 8, 1.15));
};
const interpolateIconSize = (size, maxZoom, magnification =1.8) => [
    "interpolate", ["linear"], ["zoom"],
    // zoom is 5 (or less) -> circle radius will be 1px
    3, size,
    // zoom is 10 (or greater) -> circle radius will be 5px
    maxZoom, size * magnification
];
const adequateIconSize = (iconRatio, maxZoom) => {
    return interpolateIconSize(computeIconSize(iconRatio, 0.6), maxZoom);
}
const etopsIconSize = (iconRatio, maxZoom) => {
    return interpolateIconSize(computeIconSize(iconRatio, 1), maxZoom);
}
const emergencyIconSize = (iconRatio, maxZoom, ofpLoaded) => {
    return interpolateIconSize(computeIconSize(iconRatio, 0.5, 1.2), maxZoom);
    // return (ofpLoaded) ? ["case",
    // ["==", 2, ["get", "level"]], computeIconSize(iconRatio, 0.5, 1.2),
    // computeIconSize(iconRatio, 0.4, 1.2)] : computeIconSize(iconRatio, 0.4, 1.2);
}
export const addAirports = (data) => {
    const {map, mapData, ofp, kmlOptions, aircraftType, mapOptions} = data;
    const {affineOrDrop} = mapData;
    const affine = affineOrDrop;
    const maxZoom = mapOptions.interpolateZoom || mapOptions.mapboxOptions.maxZoom;
    let epPoints = [];
    if (ofp && ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epPoints = [ofp.infos['EEP'], ofp.infos['EXP']];
    }
    const raltPoints = (ofp) ? ofp.infos['raltPoints'] : [];
    const etopsKmlColor = kmlOptions.etopsColor;
    const style = kmlOptions.airportPin;
    const visibility = kmlOptions.airportDisplay;
    const [hexcolorEtops,] = kml2mapColor(etopsKmlColor);
    const epNames = epPoints.map(g => g.name);
    const raltNames = raltPoints.map(g => g.name);
    const etopsNames = epNames.concat(raltNames);
    const maxPriorityNames = (ofp) ? [ofp.departure.name, ofp.arrival.name].concat(etopsNames) : etopsNames;
    fetch('data/airports.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(json => {
        if (affine) {
            const projFeatures = [];
            for (let feature of json.features) {
                feature.geometry.coordinates = affine(feature.geometry.coordinates);
                if(feature.geometry.coordinates !== undefined) projFeatures.push(feature);
            }
            json.features = projFeatures;
        }
        map.addSource(source, {
            type: 'geojson',
            data: json
        });
        //<select style="background-color: transparent;border: none;"><option>773</option></select>
        map.addLayer({
            'id': emergencyLayer,
            'type': 'symbol',
            'source': source,
            'layout': {
                'icon-image': (ofp) ? ["case",
                    ["==", 2, ["get", "level"]], 'sdf-star',
                    'sdf-airport'] : 'sdf-airport',
                'icon-size': emergencyIconSize(kmlOptions['iconSizeChange'], maxZoom, !!ofp),
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': getEmergencyTextField(kmlOptions['airportLabel']),
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': emergencyTextSize(kmlOptions['iconTextChange'], maxZoom),
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false
                //'symbol-sort-key': ["get", `${ofp.infos.aircraftType}`]
            },
            'paint': {
                'icon-color': (ofp) ? ["case",["==", 1, ["get", "level"]], '#D70', '#B02'] : '#B02', // no ofp => all red
                'icon-halo-width': 0,
                'icon-halo-color': '#000',
                'text-color': "#000",
                'text-halo-color': haloLightColor,
                'text-opacity': 0.8
            },
            'filter': emergencyFilter(aircraftType, false, style===2)
        });
        map.addLayer({
            'id': adequateLayer,
            'type': 'symbol',
            'source': source,
            'layout': {
                'icon-image': 'sdf-airport',
                'icon-size': adequateIconSize(kmlOptions['iconSizeChange'], maxZoom),
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': getAdequateTextField(style, kmlOptions['airportLabel']),
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': adequateTextSize(kmlOptions['iconTextChange'], maxZoom),
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'symbol-sort-key':symbolSortKey(aircraftType, maxPriorityNames)
            },
            'paint': {
                'icon-halo-color':(ofp) ? ["case", ["==", 0, ["get", "level"]], '#095','#D70'] : '#444',
                'icon-halo-width': getIconHaloWidth(style, !!ofp),
                'icon-color': getIconColor(style, aircraftType, raltNames, hexcolorEtops, !!ofp),
                'text-color': getTextColor(style, raltNames, hexcolorEtops, !!ofp),
                'text-halo-color': haloLightColor,
                'text-halo-width': ["case", ["==", 0, ["get", "level"]], 0, 0],
                'text-opacity': 0.8
            },
            'filter': adequateFilter(aircraftType, true, style === 2, etopsNames),
        });
        map.addLayer({
            'id': etopsLayer,
            'type': 'symbol',
            'source': source,
            'layout': {
                'icon-image': 'sdf-triangle',
                'icon-size': etopsIconSize(kmlOptions['iconSizeChange'], maxZoom),
                'icon-anchor': 'center',
                'icon-offset': [0, 0],
                //'icon-rotate': ['get', 'orientation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
                'visibility': (visibility) ? 'visible' : 'none',
                'text-field': getETOPSTextField(style, kmlOptions['airportLabel']),
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': etopsTextSize(kmlOptions['iconTextChange'], maxZoom),
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'symbol-sort-key':symbolSortKey(aircraftType, maxPriorityNames)
            },
            'paint': {
                'icon-halo-color':(ofp) ? ["case", ["==", 0, ["get", "level"]], '#095','#D70'] : '#444',
                'icon-halo-width': getIconHaloWidth(style, !!ofp),
                'icon-color': getIconColor(style, aircraftType, raltNames, hexcolorEtops, !!ofp),
                'text-color': getTextColor(style, raltNames, hexcolorEtops, !!ofp),
                'text-halo-color': haloLightColor,
                'text-halo-width': ["case", ["==", 0, ["get", "level"]], 0, 0],
                'text-opacity': 0.8
            },
            'filter': etopsFilter(aircraftType, true, style === 2, etopsNames),
        });
        setTextHalo(data);
        const popup = new mapboxgl.Popup({
            closeButton: true,
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
            const icao = e.features[0].properties.name;
            const iata = editolido.icao2iata(icao);
            const aircraftType = get(aircraftTypeStore); // important to re-read store value when adding popup
            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            const security = e.features[0].properties.level;
            const order = e.features[0].properties[aircraftType];
            //console.log(status, typeof status)
            let statusText = "";
            let statusNum = "0";
            switch(order) {
                case 2:
                case 3:
                    statusText = "Destination & RCF";
                    statusNum = "3";
                    break;
                case 4:
                case 5:
                    statusText = "Dégagement à destination";
                    statusNum = "2";
                    break;
                case 6:
                case 7:
                    statusText = "Dégagement en route";
                    statusNum = "2 ERA";
                    break;
                case 8:
                case 9:
                    statusText = "Appui ou adéquat en route";
                    statusNum = "1";
                    break;
            }
            const isMedical = e.features[0].properties.h === 1 && statusNum !== "0";
            const cc = e.features[0].properties.cc;
            let html = `<div class="airport"><h1><span class="title">${icao}/${iata}</span><span class="flag">${countryCodeEmoji(cc)}</span><span class="cc">${countryCodeName(cc)}</span></h1>`;
            html += `<h2>${title}${(isMedical) ? ' <b>🄷</b>' : ''}</h2>`;
            if (ofp) {
                html +=  `<p class="status status-${statusNum.charAt(0)}">STATUT ${statusNum}</p>`;
                if(security > 0) html += `<p class="security-${security}">${(security==1) ? 'ORANGE' : 'RED'}</p>`;
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
            map.on('mouseenter', etopsLayer, (e) => {
                setCursorPointer();
                addAirportPopup(e);
            });
            map.on('mouseleave', adequateLayer, removeAirportPopup);
            map.on('mouseleave', emergencyLayer, removeAirportPopup);
            map.on('mouseleave', etopsLayer, removeAirportPopup);
        }else{
            map.on('mouseenter', adequateLayer, setCursorPointer);
            map.on('mouseenter', emergencyLayer, setCursorPointer);
            map.on('mouseenter', etopsLayer, setCursorPointer);
            map.on('click', adequateLayer, addAirportPopup);
            map.on('click', emergencyLayer, addAirportPopup);
            map.on('click', etopsLayer, addAirportPopup);
            map.on('mouseleave', adequateLayer, resetCursor);
            map.on('mouseleave', emergencyLayer, resetCursor);
            map.on('mouseleave', etopsLayer, resetCursor);
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
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'visibility', (visible) ? 'visible': 'none');
    }
}

export function changeAirportStyle(data) {
    const {map, kmlOptions, ofp, aircraftType} = data;
    const style = kmlOptions.airportPin;
    const [, etopsNames] = getEtopsNames(ofp);
    if (map.getLayer(adequateLayer)) {
        changeAdequatesColor(data);
        map.setPaintProperty(adequateLayer, 'icon-halo-width', getIconHaloWidth(style, !!ofp));
        map.setLayoutProperty(adequateLayer, 'text-field', getAdequateTextField(style, kmlOptions.airportLabel));
        map.setFilter(adequateLayer, adequateFilter(aircraftType, true, style===2, etopsNames));
    }
    if (map.getLayer(etopsLayer)) {
        changeETOPSColor(data);
        map.setPaintProperty(etopsLayer, 'icon-halo-width', getIconHaloWidth(style, !!ofp));
        map.setLayoutProperty(etopsLayer, 'text-field', getETOPSTextField(style, kmlOptions.airportLabel));
        map.setFilter(etopsLayer, etopsFilter(aircraftType, true, style===2, etopsNames));
    }
    if (map.getLayer(emergencyLayer)) map.setFilter(emergencyLayer, emergencyFilter(aircraftType, false, style===2));
}
const getEtopsNames = (ofp) => {
    const raltNames = (ofp) ? ofp.infos.ralts : [];
    let epNames = [];
    if (ofp && ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epNames = [ofp.infos['EEP'].name, ofp.infos['EXP'].name];
    }
    return [raltNames, epNames.concat(raltNames)];
}
export function changeAircraftType(data) {
    const {map, kmlOptions, aircraftType, ofp} = data;
    const [, etopsNames] = getEtopsNames(ofp);
    const style = kmlOptions.airportPin;
    const maxPriorityNames = (ofp) ? [ofp.departure.name, ofp.arrival.name].concat(etopsNames) : etopsNames;
    map.setFilter(adequateLayer, adequateFilter(aircraftType, true, style===2, etopsNames));
    map.setFilter(etopsLayer, etopsFilter(aircraftType, true, style===2, etopsNames));
    changeAdequatesColor(data);
    changeETOPSColor(data);
    map.setLayoutProperty(adequateLayer, 'symbol-sort-key', symbolSortKey(aircraftType, maxPriorityNames));
    map.setLayoutProperty(etopsLayer, 'symbol-sort-key', symbolSortKey(aircraftType, maxPriorityNames));
    map.setFilter(emergencyLayer, emergencyFilter(aircraftType, false, style===2));
}
const changeIconText = (data) => {
    const {map, kmlOptions, mapOptions} = data;
    const maxZoom = mapOptions.interpolateZoom || mapOptions.mapboxOptions.maxZoom;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'text-size', adequateTextSize(kmlOptions['iconTextChange'], maxZoom));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'text-size', etopsTextSize(kmlOptions['iconTextChange'], maxZoom));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'text-size', emergencyTextSize(kmlOptions['iconTextChange'], maxZoom));
    }
    setTextHalo(data);
}
const changeIconSize = (data) => {
    const {map, kmlOptions, mapOptions} = data;
    const maxZoom = mapOptions.interpolateZoom || mapOptions.mapboxOptions.maxZoom;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'icon-size', adequateIconSize(kmlOptions['iconSizeChange'], maxZoom));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'icon-size', etopsIconSize(kmlOptions['iconSizeChange'], maxZoom));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'icon-size', emergencyIconSize(kmlOptions['iconSizeChange'], maxZoom));
    }
}
export const changeAdequatesColor = (data) => {
    const {map, kmlOptions, ofp, aircraftType} = data;
    const style = kmlOptions.airportPin;
    const [hexcolorEtops,] = kml2mapColor(kmlOptions.etopsColor);
    const [raltNames,] = getEtopsNames(ofp);
    if (map.getLayer(adequateLayer)) {
        map.setPaintProperty(adequateLayer, 'icon-color', getIconColor(style, aircraftType, raltNames, hexcolorEtops, !!ofp));
        map.setPaintProperty(adequateLayer, 'text-color', getTextColor(style, raltNames, hexcolorEtops, !!ofp));
    }
}
export const changeETOPSColor = (data) => {
    const {map, kmlOptions, ofp, aircraftType} = data;
    const style = kmlOptions.airportPin;
    const [hexcolorEtops,] = kml2mapColor(kmlOptions.etopsColor);
    const [raltNames,] = getEtopsNames(ofp);
    if (map.getLayer(etopsLayer)) {
        map.setPaintProperty(etopsLayer, 'icon-color', getIconColor(style, aircraftType, raltNames, hexcolorEtops, !!ofp));
        map.setPaintProperty(etopsLayer, 'text-color', getTextColor(style, raltNames, hexcolorEtops, !!ofp));
    }
}
const changeLabel = (data) => {
    const {map, kmlOptions, value} = data;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'text-field', getAdequateTextField(kmlOptions.airportPin, value));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'text-field', getETOPSTextField(kmlOptions.airportPin, value));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'text-field', getEmergencyTextField(value));
    }
};
function setTextHalo(data){
    const {map, kmlOptions} = data;
    const value = kmlOptions.iconTextChange;
    if (value && map.getLayer(adequateLayer) && map.getLayer(emergencyLayer) && map.getLayer(etopsLayer)) {
        map.setPaintProperty(adequateLayer, 'text-halo-width', adequateHaloWidth(value));
        map.setPaintProperty(etopsLayer, 'text-halo-width', etopsHaloWidth(value));
        map.setPaintProperty(emergencyLayer, 'text-halo-width', emergencyHaloWidth(value));
        map.setPaintProperty(adequateLayer, 'text-halo-blur', adequateHaloBlur(value));
        map.setPaintProperty(etopsLayer, 'text-halo-blur', etopsHaloBlur(value));
        map.setPaintProperty(emergencyLayer, 'text-halo-blur', emergencyHaloBlur(value));
    }
    return true; // allows chaining
}
export default {
    show: (data) => changeAirportDisplay(data, true),
    hide: (data) => changeAirportDisplay(data, false),
    add: addAirports,
    changeMarker: changeAirportStyle,
    change: changeAircraftType,
    changeIconText,
    changeIconSize,
    changeLabel
}