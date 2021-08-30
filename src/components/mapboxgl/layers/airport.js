/* global mapboxgl editolido */
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";
import {STATUS, GREENRED, MEDICAL, BLUEGREENRED} from "../../mapSettings/AirportSelector.svelte";
import {computeIconTextSize, computeIconSize, haloLightColor, haloTextBlur, haloTextWidth} from '../utils';
import {supportsHover} from "../../utils";
import { countryCodeName, countryCodeEmoji } from "../../countries";
import {get} from "svelte/store";
import {aircraftType as aircraftTypeStore} from '../../../stores';

const folder = 'airport';
const adequateLayer = `${folder}-layer`;
const emergencyLayer = `${folder}-emer-layer`;
const etopsLayer = `${folder}-etops-layer`;
const layers = [emergencyLayer, adequateLayer, etopsLayer]; // in display order
const source = `${folder}-source`;

const MEDICAL_COLOR = '#062DF8';
const TEXT_COLOR = '#000';

const getEtopsNames = (ofp) => {
    const raltNames = (ofp) ? ofp.infos.ralts : [];
    let epNames = [];
    if (ofp && ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epNames = [ofp.infos['EEP'].name, ofp.infos['EXP'].name];
    }
    return [raltNames, epNames.concat(raltNames)];
};

// --------------> CONDITIONS
const medicalCondition = ["==", 1, ["get", "h"]];
const levelCondition = (level) => ["==", level, ["get", "level"]];
const level0Condition = levelCondition(0);
const adequateCondition = (aircraftType) => ["<", ["coalesce", ["get", `${aircraftType}`], 11], 10];
const raltCondition = (ofp) => {
    const [raltNames] = getEtopsNames(ofp);
    if (raltNames.length > 0) {
        return  ["in", ["get", "name"], ["literal", raltNames]];
    }else{
        return ["to-boolean", false];
    }
};

// --------------> LABELLER + FORMATTER
const airportLabeller = (labelling) =>  (labelling === 0) ? ['get', 'name'] : ['get', 'iata'];
const medicalDecoration = '\u200A✚'; //https://jkorpela.fi/chars/spaces.html
const medicalFormatter = (label, options) => {
    return ["case", medicalCondition,
        ["format",
            label, {},
            medicalDecoration, options
        ],
        label
    ];
};

// -------------> FILTER
const adequateFilter = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    return (style === MEDICAL)
        ? ["all", medicalCondition, adequateCondition(aircraftType)]
        : adequateCondition(aircraftType);
};
const etopsFilter = ({ofp, kmlOptions: {airportPin: style}}) => {
    const [, etopsNames] = getEtopsNames(ofp);
    const isEtops = ["in", ["get", "name"], ["literal", etopsNames]];
    return (style === MEDICAL)
        ? ["all", isEtops, medicalCondition]
        : isEtops;
};
const emergencyFilter = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    return (style === MEDICAL)
        ? ["to-boolean", false]
        : ["!", adequateCondition(aircraftType)];
};

// -------------> symbol-sort-key
const adequateSymbolSortKey = ({aircraftType, ofp}) => {
    // maxPriority = 0
    // medical = 1
    // then by order field
    const [, etopsNames] = getEtopsNames(ofp);
    const maxPriorityNames = (ofp) ? [ofp.departure.name, ofp.arrival.name].concat(etopsNames) : etopsNames;
    return ["case",
    ["in", ["get", "name"], ["literal", maxPriorityNames]], 0,
    ["case", medicalCondition, 1, ["get", `${aircraftType}`]]]
};

// -------------> icon-color
const adequateIconColorMap = {
    [STATUS]: (aircraftType) => ["case",
        ["==", 9, ["get", `${aircraftType}`]], '#ea80d8',
        ["==", 8, ["get", `${aircraftType}`]], '#ea80d8',
        ["==", 7, ["get", `${aircraftType}`]], '#dddddd',
        ["==", 6, ["get", `${aircraftType}`]], '#dddddd',
        ["==", 5, ["get", `${aircraftType}`]], '#fbfe98',
        ["==", 4, ["get", `${aircraftType}`]], '#fbfe98',
        ["==", 3, ["get", `${aircraftType}`]], '#00b0f1',
        ["==", 2, ["get", `${aircraftType}`]], '#00b0f1',
        '#000'
    ],
    [GREENRED]: () => ["case", level0Condition, '#095','#C71'],
    [BLUEGREENRED]: () => ["case", level0Condition, ["case", medicalCondition, '#0525cc', '#095'],'#C71'],
    [MEDICAL]: () => ["case", level0Condition, MEDICAL_COLOR,'#C71'],
};
const adequateIconColor = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    return adequateIconColorMap[style](aircraftType);
};
const emergencyIconColor = ({ofp}) => {
    return (ofp) ?
        ["case", levelCondition(1), '#D70', '#B02'] :
        '#B02';
};
const etopsIconColor = (data) => {
    return ["case", raltCondition(data.ofp),
        kml2mapColor(data.kmlOptions.etopsColor)[0],
        adequateIconColor(data)
    ];
};

// -------------> icon-image
const adequateIconImage = () => 'sdf-airport';
const etopsIconImage = () => 'sdf-triangle';
const emergencyIconImage = ({ofp}) => {
    return (ofp) ? 
        ["case", levelCondition(2),
            'sdf-star',
            'sdf-airport'
        ] :
        'sdf-airport'
};

// -------------> icon-size
const interpolateIconSize = (size, mapOptions, magnification =1.8) => {
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;
    return [
        "interpolate", ["linear"], ["zoom"],
        // zoom is 5 (or less) -> circle radius will be 1px
        minZoom, size,
        // zoom is 10 (or greater) -> circle radius will be 5px
        maxZoom, size * magnification
    ];
};
const adequateIconSize = ({mapOptions, kmlOptions:{iconSizeChange: iconRatio}}) => {
return interpolateIconSize(computeIconSize(iconRatio, 0.6), mapOptions);
};
const etopsIconSize = ({mapOptions, kmlOptions:{iconSizeChange: iconRatio}}) => {
return interpolateIconSize(computeIconSize(iconRatio, 1), mapOptions);
};
const emergencyIconSize = ({mapOptions, kmlOptions: {iconSizeChange: iconRatio}}) => {
return interpolateIconSize(computeIconSize(iconRatio, 0.5, 1.2), mapOptions);
// return (ofpLoaded) ? ["case",
// ["==", 2, ["get", "level"]], computeIconSize(iconRatio, 0.5, 1.2),
// computeIconSize(iconRatio, 0.4, 1.2)] : computeIconSize(iconRatio, 0.4, 1.2);
};

// -------------> icon-halo-width
const adequateIconHaloWidth = ({ofp, kmlOptions: {airportPin: style}}) => (style === STATUS && !!ofp) ? 3 : 0;
const etopsIconHaloWidth = adequateIconHaloWidth;
const emergencyIconHaloWidth = () => 0;

// -------------> icon-halo-color
const adequateIconHaloColor = ({ofp}) => {
    return (ofp) ? 
        ["case", ["==", 0, ["get", "level"]], '#095','#D70'] :
        '#444';
};
const etopsIconHaloColor = adequateIconHaloColor;
const emergencyIconHaloColor = () => '#000';
// -------------> text-color
const adequateTextColor = ({ofp}) => {
    if (!ofp) return TEXT_COLOR;
    return ["case", level0Condition,
        TEXT_COLOR,
        '#8d4600'
    ];
};
const etopsTextColor = ({ofp, kmlOptions:{etopsColor}}) => {
        return ["case", raltCondition(ofp),
            kml2mapColor(etopsColor)[0],
            TEXT_COLOR
        ];
};
const emergencyTextColor = () => TEXT_COLOR;

// -------------> text-field
const adequateTextField = ({kmlOptions: {airportPin: style, airportLabel: labelling}}) => {
    const label = airportLabeller(labelling);
    switch (style){
        case BLUEGREENRED:
        case MEDICAL:
            return ["case", level0Condition, // only decorates level > 0
                label,
                medicalFormatter(label, {"text-color": '#0525cc', "font-scale": 1.1}),
            ];
        default:
            return medicalFormatter(label, {"text-color": MEDICAL_COLOR, "font-scale": 1.1});
    }
};
const etopsTextField = ({ofp, kmlOptions: {airportLabel: labelling}}) => {
    const label = airportLabeller(labelling);
    return ["case", raltCondition(ofp),
        medicalFormatter(label, {"text-color": MEDICAL_COLOR, "font-scale": 1.1}),
        label
    ];
};
const emergencyTextField = ({kmlOptions: {airportLabel: labelling}}) => {
    return airportLabeller(labelling);
};

// -------------> text-size
const interpolateTextSize = (size, mapOptions, magnification =2) => {
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;
    return [
        "interpolate", ["linear"], ["zoom"],
        // zoom is 5 (or less) -> circle radius will be 1px
        minZoom, size,
        // zoom is 10 (or greater) -> circle radius will be 5px
        maxZoom, size * magnification
    ];
};
const adequateTextSize = ({mapOptions, kmlOptions:{iconTextChange: textRatio}}) => {
    return interpolateTextSize(computeIconTextSize(textRatio, 8, 1.15),mapOptions);
};
const etopsTextSize = ({mapOptions, kmlOptions:{iconTextChange: textRatio}}) => {
    return interpolateTextSize(computeIconTextSize(textRatio, 10), mapOptions);
};
const emergencyTextSize =adequateTextSize;

// -------------> text-halo-blur
const adequateTextHaloBlur = ({kmlOptions:{iconTextChange: textRatio}}) => {
    return haloTextBlur(computeIconTextSize(textRatio, 8, 1.15));
};
const etopsTextHaloBlur = ({kmlOptions:{iconTextChange: textRatio}}) => {
    return haloTextBlur(computeIconTextSize(textRatio, 10));
};
const emergencyTextHaloBlur = adequateTextHaloBlur;

// -------------> text-halo-width
const adequateTextHaloWidth = ({kmlOptions:{iconTextChange: textRatio}}) => {
    return haloTextWidth(computeIconTextSize(textRatio, 8, 1.15));
};
const etopsTextHaloWidth = ({kmlOptions:{iconTextChange: textRatio}}) => {
    return haloTextWidth(computeIconTextSize(textRatio, 10));
};
const emergencyTextHaloWidth = adequateIconHaloWidth;

export const changeAdequatesColor = (data) => {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        map.setPaintProperty(adequateLayer, 'icon-color', adequateIconColor(data));
        map.setPaintProperty(adequateLayer, 'text-color', adequateTextColor(data));
    }
    return true; // allows chaining
};
export const changeAirportETOPSColor = (data) => {
    const map = data.map;
    if (map.getLayer(etopsLayer)) {
        map.setPaintProperty(etopsLayer, 'icon-color', etopsIconColor(data));
        map.setPaintProperty(etopsLayer, 'text-color', etopsTextColor(data));
    }
    return true; // allows chaining
};
export const changeAirportETOPSDisplay = ({map}, visible) => {
    if (map.getLayer(etopsLayer) ) {
        map.setLayoutProperty(etopsLayer, 'visibility', (visible) ? 'visible': 'none');
    }
};

function changeAirportDisplay({map}, visible) {
    for (const layer of layers) {
        if (map.getLayer(layer)) {
            if (layer === etopsLayer) continue; //etops Layer is in charge
            map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
        }
    }
}
const baseLayerOptions = {
    'type': 'symbol',
    'layout': {
        'icon-anchor': 'center',
        'icon-offset': [0, 0],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'text-offset': [0, 0.7],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
    },
    'paint': {
        'text-halo-color': haloLightColor,
        'text-opacity': 0.8
    }
};

export const addAirports = (data) => {
    const {map, mapData: {affineOrDrop: affine}, ofp, kmlOptions:{airportDisplay, etopsDisplay}} = data;
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
        const emergencyOptions = {...baseLayerOptions};
        emergencyOptions.id = emergencyLayer;
        emergencyOptions.source = source;
        emergencyOptions.filter = emergencyFilter(data);
        emergencyOptions.layout['icon-image'] = emergencyIconImage(data);
        emergencyOptions.layout['icon-size'] = emergencyIconSize(data);
        emergencyOptions.layout['visibility'] = (airportDisplay) ? 'visible' : 'none';
        emergencyOptions.layout['text-field'] = emergencyTextField(data);
        emergencyOptions.layout['text-size'] = emergencyTextSize(data);
        emergencyOptions.paint['icon-color'] = emergencyIconColor(data);
        emergencyOptions.paint['icon-halo-width'] = emergencyIconHaloWidth(data);
        emergencyOptions.paint['icon-halo-color'] = emergencyIconHaloColor(data);
        emergencyOptions.paint['text-color'] = emergencyTextColor(data);
        emergencyOptions.paint['text-halo-width'] = emergencyTextHaloWidth(data);
        map.addLayer(emergencyOptions);
        const adequateOptions = {...baseLayerOptions};
        adequateOptions.id = adequateLayer;
        adequateOptions.source = source;
        adequateOptions.filter = adequateFilter(data);
        adequateOptions.layout['symbol-sort-key'] = adequateSymbolSortKey(data);
        adequateOptions.layout['icon-image'] = adequateIconImage(data);
        adequateOptions.layout['icon-size'] = adequateIconSize(data);
        adequateOptions.layout['visibility'] = (airportDisplay) ? 'visible' : 'none';
        adequateOptions.layout['text-field'] = adequateTextField(data);
        adequateOptions.layout['text-size'] = adequateTextSize(data);
        adequateOptions.paint['icon-color'] = adequateIconColor(data);
        adequateOptions.paint['icon-halo-width'] = adequateIconHaloWidth(data);
        adequateOptions.paint['icon-halo-color'] = adequateIconHaloColor(data);
        adequateOptions.paint['text-color'] = adequateTextColor(data);
        adequateOptions.paint['text-halo-width'] = adequateTextHaloWidth(data);
        map.addLayer(adequateOptions);
        const etopsOptions = {...baseLayerOptions};
        etopsOptions.id = etopsLayer;
        etopsOptions.source = source;
        etopsOptions.filter = etopsFilter(data);
        etopsOptions.layout['icon-image'] = etopsIconImage(data);
        etopsOptions.layout['icon-size'] = etopsIconSize(data);
        etopsOptions.layout['visibility'] = (etopsDisplay) ? 'visible' : 'none';
        etopsOptions.layout['text-field'] = etopsTextField(data);
        etopsOptions.layout['text-size'] = etopsTextSize(data);
        etopsOptions.paint['icon-color'] = etopsIconColor(data);
        etopsOptions.paint['icon-halo-width'] = etopsIconHaloWidth(data);
        etopsOptions.paint['icon-halo-color'] = etopsIconHaloColor(data);
        etopsOptions.paint['text-color'] = etopsTextColor(data);
        etopsOptions.paint['text-halo-width'] = etopsTextHaloWidth(data);
        map.addLayer(etopsOptions);

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
            let html = `<div class="airport">`
            html += `<h1><span class="title">${icao}/${iata}</span><span class="flag">${countryCodeEmoji(cc)}</span><span class="cc">${countryCodeName(cc)}</span></h1>`;
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
            for (const layer of layers) {
                map.on('mouseenter', layer, (e) => {
                    setCursorPointer();
                    addAirportPopup(e);
                });
                map.on('mouseleave', layer, removeAirportPopup);
            }
        }else{
            for (const layer of layers) {
                map.on('mouseenter', layer, setCursorPointer);
                map.on('click', layer, addAirportPopup);
                map.on('mouseleave', layer, resetCursor);
            }
        }

    })
};

export function changeAirportStyle(data) {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        changeAdequatesColor(data);
        map.setPaintProperty(adequateLayer, 'icon-halo-width', adequateIconHaloWidth(data));
        map.setLayoutProperty(adequateLayer, 'text-field', adequateTextField(data));
        map.setFilter(adequateLayer, adequateFilter(data));
    }
    if (map.getLayer(etopsLayer)) {
        changeAirportETOPSColor(data);
        map.setPaintProperty(etopsLayer, 'icon-halo-width', etopsIconHaloWidth(data));
        map.setLayoutProperty(etopsLayer, 'text-field', etopsTextField(data));
        map.setFilter(etopsLayer, etopsFilter(data));
    }
    if (map.getLayer(emergencyLayer)) map.setFilter(emergencyLayer, emergencyFilter(data));
}

export function changeAircraftType(data) {
    const map = data.map;
    map.setFilter(adequateLayer, adequateFilter(data));
    map.setFilter(etopsLayer, etopsFilter(data));
    map.setFilter(emergencyLayer, emergencyFilter(data));
    changeAdequatesColor(data);
    changeAirportETOPSColor(data);
    map.setLayoutProperty(adequateLayer, 'symbol-sort-key', adequateSymbolSortKey(data));
}

const changeIconText = (data) => {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'text-size', adequateTextSize(data));
        map.setPaintProperty(adequateLayer, 'text-halo-width', adequateIconHaloWidth(data));
        map.setPaintProperty(adequateLayer, 'text-halo-blur', adequateTextHaloBlur(data));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'text-size', etopsTextSize(data));
        map.setPaintProperty(etopsLayer, 'text-halo-width', etopsIconHaloWidth(data));
        map.setPaintProperty(etopsLayer, 'text-halo-blur', etopsTextHaloBlur(data));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'text-size', emergencyTextSize(data));
        map.setPaintProperty(emergencyLayer, 'text-halo-width', emergencyIconHaloWidth(data));
        map.setPaintProperty(emergencyLayer, 'text-halo-blur', emergencyTextHaloBlur(data));
    }
}
const changeIconSize = (data) => {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'icon-size', adequateIconSize(data));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'icon-size', etopsIconSize(data));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'icon-size', emergencyIconSize(data));
    }
}

const changeLabel = (data) => {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        map.setLayoutProperty(adequateLayer, 'text-field', adequateTextField(data));
    }
    if (map.getLayer(etopsLayer)) {
        map.setLayoutProperty(etopsLayer, 'text-field', etopsTextField(data));
    }
    if (map.getLayer(emergencyLayer)) {
        map.setLayoutProperty(emergencyLayer, 'text-field', emergencyTextField(data));
    }
};

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