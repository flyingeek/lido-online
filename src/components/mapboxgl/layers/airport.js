/* global mapboxgl editolido */
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";
import {STATUS, GREENRED, MEDICAL, BLUEGREENRED, RECO} from "../../mapSettings/AirportSelector.svelte";
import {computeIconTextSize, computeIconSize, haloLightColor, haloTextBlur, haloTextWidth} from '../utils';
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
const RECO_COLOR = '#7800d5';
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
const recoCondition = ["!=", 0, ["get", "r"]];
const recoCCondition = ["==", 5, ["get", "r"]];
const eaoCondition = ["in", ["get", "r"], ["literal", [1, 3, 5]]];
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
const medicalFormatter = (label, options={"text-color": MEDICAL_COLOR, "font-scale": 1.1}) => {
    return ["case", medicalCondition,
        ["format",
            label, {},
            medicalDecoration, options
        ],
        label
    ];
};
const eaoFormatter = (label) => {
    return ["case", ["all", recoCCondition, eaoCondition],
        ["format",
            '©', {"text-color": RECO_COLOR},
            label, {},
        ],
        ["case", eaoCondition,
            ["format",
                '▶︎', {"text-color": RECO_COLOR, "font-scale": 1.1},
                label, {},
            ],
            label
        ]];
}

// -------------> FILTER
const adequateFilter = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    if (style === MEDICAL) {
        return ["all", medicalCondition, adequateCondition(aircraftType)];
    }else if (style === RECO) {
        return ["all", recoCondition, adequateCondition(aircraftType)];
    }
    return adequateCondition(aircraftType);
};
const etopsFilter = ({ofp, kmlOptions: {airportPin: style}}) => {
    const [, etopsNames] = getEtopsNames(ofp);
    const isEtops = ["in", ["get", "name"], ["literal", etopsNames]];
    if (style === MEDICAL) {
        return ["all", isEtops, medicalCondition];
    }else if (style === RECO) {
        return ["all", isEtops, recoCondition];
    }
    return isEtops;
};
const emergencyFilter = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    if (style === MEDICAL) {
        return ["to-boolean", false];
    }else if (style === RECO) {
        return ["all", recoCondition, ["!", adequateCondition(aircraftType)]];
    }
    return ["!", adequateCondition(aircraftType)];
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
        ["==", 9, ["get", `${aircraftType}`]], '#ea80d8', //status 1
        ["==", 8, ["get", `${aircraftType}`]], '#ea80d8', //status 1
        ["==", 7, ["get", `${aircraftType}`]], '#dbe000', //status 2 era
        ["==", 6, ["get", `${aircraftType}`]], '#dbe000', //status 2 era
        ["==", 5, ["get", `${aircraftType}`]], '#fbfe98', //status 2
        ["==", 4, ["get", `${aircraftType}`]], '#fbfe98', //status 2
        ["==", 3, ["get", `${aircraftType}`]], '#00b0f1', //status 3
        ["==", 2, ["get", `${aircraftType}`]], '#00b0f1', //status 3
        '#000'
    ],
    [GREENRED]: () => ["case", level0Condition, '#095','#C71'],
    [BLUEGREENRED]: () => ["case", level0Condition, ["case", medicalCondition, '#0525cc', '#095'],'#C71'],
    [MEDICAL]: () => ["case", level0Condition, MEDICAL_COLOR,'#C71'],
    [RECO]: () => RECO_COLOR,
};
const adequateIconColor = ({aircraftType, kmlOptions: {airportPin: style}}) => {
    return adequateIconColorMap[style](aircraftType);
};
const emergencyIconColor = ({ofp, kmlOptions: {airportPin: style}}) => {
    switch(style) {
        case RECO:
            return RECO_COLOR;
        default:
            return (ofp) ?
                ["case", levelCondition(1), '#D70', '#B02'] :
                '#B02';
    }

};
const etopsIconColor = (data) => {
    const {ofp, kmlOptions: {airportPin: style, etopsColor}} = data;
    switch(style) {
        case RECO:
            return RECO_COLOR;
    default:
        return ["case", raltCondition(ofp),
            kml2mapColor(etopsColor)[0],
            adequateIconColor(data)
        ];
    }
};

// -------------> icon-image
const adequateIconImage = () => 'sdf-airport';
const etopsIconImage = () => 'sdf-triangle';
const emergencyIconImage = ({ofp, kmlOptions: {airportPin: style}}) => {
    if (!ofp) return 'sdf-airport';
    switch (style){
        case STATUS:
            return ["case", levelCondition(2),
            'sdf-star',
            'sdf-airport'
        ];
        case RECO:
            return "sdf-airport";
        default:
            return ["case", ["!=", 0, ["get", "level"]],
            'sdf-star',
            'sdf-airport'
        ];
    }
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
const adequateIconSize = ({mapOptions, kmlOptions:{iconSizeChange: iconRatio, airportPin: style}}) => {
return interpolateIconSize(computeIconSize(iconRatio, (style === STATUS) ? 0.5 : 0.6), mapOptions);
};
const etopsIconSize = ({mapOptions, kmlOptions:{iconSizeChange: iconRatio}}) => {
return interpolateIconSize(computeIconSize(iconRatio, 1), mapOptions);
};
const emergencyIconSize = ({mapOptions, kmlOptions: {iconSizeChange: iconRatio, airportPin: style}}) => {
return interpolateIconSize(computeIconSize(iconRatio, (style !== RECO) ? 0.5 : 0.6), mapOptions);
// return (ofpLoaded) ? ["case",
// ["==", 2, ["get", "level"]], computeIconSize(iconRatio, 0.5, 1.2),
// computeIconSize(iconRatio, 0.4, 1.2)] : computeIconSize(iconRatio, 0.4, 1.2);
};

// -------------> icon-halo-width
const adequateIconHaloWidth = ({kmlOptions: {airportPin: style}}) => (style === STATUS) ? 1 : 0;
const etopsIconHaloWidth = adequateIconHaloWidth;
const emergencyIconHaloWidth = () => 0;

// -------------> icon-halo-color
const adequateIconHaloColor = () => '#444';
const etopsIconHaloColor = adequateIconHaloColor;
const emergencyIconHaloColor = () => '#000';
// -------------> text-color
const adequateTextColor = ({ofp, kmlOptions: {airportPin: style}}) => {
    if (!ofp) return TEXT_COLOR;
    switch (style){
        case STATUS:
            return ["case", level0Condition,
                TEXT_COLOR,
                '#d47200'
            ];
        default:
            return TEXT_COLOR;
    }
};
const etopsTextColor = (data) => {
    const {ofp, kmlOptions:{etopsColor}} = data;
    return ["case", raltCondition(ofp),
        kml2mapColor(etopsColor)[0],
        adequateTextColor(data)
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
        case RECO:
            return eaoFormatter(label);
        default:
            return medicalFormatter(label);
    }
};
const etopsTextField = ({ofp, kmlOptions: {airportPin: style, airportLabel: labelling}}) => {
    const label = airportLabeller(labelling);
    switch (style){
        case BLUEGREENRED:
        case MEDICAL:
            return ["case", raltCondition(ofp), // only ralts are not "blue"
                medicalFormatter(label),
                label
            ];
        case RECO:
            return eaoFormatter(label);
        default:
            return medicalFormatter(label);
    }
};
const emergencyTextField = ({kmlOptions: {airportPin: style, airportLabel: labelling}}) => {
    const label = airportLabeller(labelling);
    switch (style){
        case RECO:
            return eaoFormatter(label);
        default:
            return label;
    }
};

// -------------> text-size
const interpolateTextSize = (mapOptions, {ratio, size, magnification=2, extraFactor=1}) => {
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;
    const textSize = computeIconTextSize(ratio, size, extraFactor);
    return [
        "interpolate", ["linear"], ["zoom"],
        // zoom is 5 (or less) -> circle radius will be 1px
        minZoom, textSize,
        // zoom is 10 (or greater) -> circle radius will be 5px
        maxZoom, textSize * magnification
    ];
};
const adequateTextSize = ({mapOptions, kmlOptions:{iconTextChange: ratio}}) => {
    return interpolateTextSize(mapOptions, {ratio, size: 8, extraFactor: 1.15});
};
const etopsTextSize = ({mapOptions, kmlOptions:{iconTextChange: ratio}}) => {
    return interpolateTextSize(mapOptions, {ratio, size: 9});
};
const emergencyTextSize =adequateTextSize;

// -------------> text-halo-blur
const adequateTextHaloBlur = ({kmlOptions:{iconTextChange: ratio}}) => {
    return haloTextBlur({ratio, size: 8, extraFactor: 1.15});
};
const etopsTextHaloBlur = ({kmlOptions:{iconTextChange: ratio}}) => {
    return haloTextBlur({ratio, size: 10});
};
const emergencyTextHaloBlur = adequateTextHaloBlur;

// -------------> text-halo-width
const adequateTextHaloWidth = ({kmlOptions:{iconTextChange: ratio}}) => {
    return haloTextWidth({ratio, size: 8, extraFactor: 1.15});
};
const etopsTextHaloWidth = ({kmlOptions:{iconTextChange: ratio}}) => {
    return haloTextWidth({ratio, size: 10});
};
const emergencyTextHaloWidth = adequateTextHaloWidth;
// -------------> text-allow-overlap
const adequateTextAllowOverlap = ({kmlOptions: {airportPin: style}}) => style === RECO;
const etopsTextAllowOverlap = adequateTextAllowOverlap;
const emergencyTextAllowOverlap = adequateTextAllowOverlap;
// -------------> text-ignore-placement
const adequateTextIgnorePlacement = ({kmlOptions: {airportPin: style}}) => style === RECO;
const etopsTextIgnorePlacement = adequateTextIgnorePlacement;
const emergencyTextIgnorePlacement = adequateTextIgnorePlacement;


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
const changeEmergencyColor = (data) => {
    const map = data.map;
    if (map.getLayer(emergencyLayer)) {
        map.setPaintProperty(emergencyLayer, 'icon-color', emergencyIconColor(data));
        map.setPaintProperty(emergencyLayer, 'text-color', emergencyTextColor(data));
    }
    return true; // allows chaining
}
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
        emergencyOptions.layout['text-allow-overlap'] = emergencyTextAllowOverlap(data);
        emergencyOptions.layout['text-ignore-placement'] = emergencyTextIgnorePlacement(data);
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
        adequateOptions.layout['text-allow-overlap'] = adequateTextAllowOverlap(data);
        adequateOptions.layout['text-ignore-placement'] = adequateTextIgnorePlacement(data);
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
        etopsOptions.layout['text-allow-overlap'] = etopsTextAllowOverlap(data);
        etopsOptions.layout['text-ignore-placement'] = etopsTextIgnorePlacement(data);
        etopsOptions.paint['icon-color'] = etopsIconColor(data);
        etopsOptions.paint['icon-halo-width'] = etopsIconHaloWidth(data);
        etopsOptions.paint['icon-halo-color'] = etopsIconHaloColor(data);
        etopsOptions.paint['text-color'] = etopsTextColor(data);
        etopsOptions.paint['text-halo-width'] = etopsTextHaloWidth(data);
        map.addLayer(etopsOptions);

        const addAirportPopup = function (e, {focusAfterOpen=false, closeOnMove=true, closeButton=true}={}) {
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
            const recoCode = e.features[0].properties.r;
            let reco, eao;
            switch(recoCode) {
                case 0:
                    reco = "A";
                    eao = false;
                    break;
                case 1:
                    reco = "A";
                    eao = true;
                    break;
                case 2:
                    reco = "B";
                    eao = false;
                    break;
                case 3:
                    reco = "B";
                    eao = true;
                    break;
                case 4:
                    reco = "C";
                    eao = false;
                    break;
                case 5:
                    reco = "C";
                    eao = true;
                    break;
                default:
                    console.error('unknown recoCode: ', recoCode);
            }
            const isMedical = e.features[0].properties.h === 1 && statusNum !== "0";
            const cc = e.features[0].properties.cc;
            let html = `<div class="airport">`
            html += `<h1><span class="title">${icao}/${iata}</span><span class="flag">${countryCodeEmoji(cc)}</span><span class="cc">${countryCodeName(cc)}</span></h1>`;
            html += `<h2>${title}${(isMedical) ? ' <b>🄷</b>' : ''}</h2>`;
            if (ofp) {
                html +=  `<p class="status status-${statusNum.charAt(0)}">STATUT ${statusNum}</p>`;
                if(security > 0) html += `<p class="security-${security}">${(security==1) ? 'ORANGE' : 'RED'}</p>`;
                html+= `<p class="reco reco-${reco}">reco ${reco}${(eao) ? ' EAO' : ''}</p>`;
                if(statusText) html += `<p class="status-text">${statusText}</p>`;
            }
            html += "</div>";
            let popup = new mapboxgl.Popup({closeButton, focusAfterOpen, closeOnMove});
            popup.on('close', () => {
                popup=undefined;
            });
            return popup.setLngLat(coordinates).setHTML(html).addTo(map);
        };
        let popup;
        for (const layer of layers) {
            map.on('mouseenter', layer, (e) => {
                if (popup) popup.remove();
                map.getCanvas().style.cursor = 'pointer';
                popup = addAirportPopup(e, {closeButton: false});
            });
            map.on('mouseleave', layer, () => {
                if (popup) popup.remove();
                map.getCanvas().style.cursor = '';
            });
            map.on('click', layer, (e) => {
                if (popup) popup.remove();
                popup = addAirportPopup(e);
            });
        }
    })
};

export function changeAirportStyle(data) {
    const map = data.map;
    if (map.getLayer(adequateLayer)) {
        changeAdequatesColor(data);
        map.setPaintProperty(adequateLayer, 'icon-halo-width', adequateIconHaloWidth(data));
        map.setLayoutProperty(adequateLayer, 'icon-size', adequateIconSize(data));
        map.setLayoutProperty(adequateLayer, 'text-field', adequateTextField(data));
        map.setLayoutProperty(adequateLayer, 'text-allow-overlap', adequateTextAllowOverlap(data));
        map.setLayoutProperty(adequateLayer, 'text-ignore-placement', adequateTextIgnorePlacement(data));
        map.setFilter(adequateLayer, adequateFilter(data));
    }
    if (map.getLayer(etopsLayer)) {
        changeAirportETOPSColor(data);
        map.setPaintProperty(etopsLayer, 'icon-halo-width', etopsIconHaloWidth(data));
        map.setLayoutProperty(etopsLayer, 'icon-size', etopsIconSize(data));
        map.setLayoutProperty(etopsLayer, 'text-field', etopsTextField(data));
        map.setLayoutProperty(etopsLayer, 'text-allow-overlap', etopsTextAllowOverlap(data));
        map.setLayoutProperty(etopsLayer, 'text-ignore-placement', etopsTextIgnorePlacement(data));
        map.setFilter(etopsLayer, etopsFilter(data));
    }
    if (map.getLayer(emergencyLayer)) {
        changeEmergencyColor(data);
        map.setLayoutProperty(emergencyLayer, 'icon-image', emergencyIconImage(data));
        map.setLayoutProperty(emergencyLayer, 'icon-size', emergencyIconSize(data));
        map.setLayoutProperty(emergencyLayer, 'text-field', emergencyTextField(data));
        map.setLayoutProperty(emergencyLayer, 'text-allow-overlap', emergencyTextAllowOverlap(data));
        map.setLayoutProperty(emergencyLayer, 'text-ignore-placement', emergencyTextIgnorePlacement(data));
        map.setFilter(emergencyLayer, emergencyFilter(data));
    }
}

export function changeAircraftType(data) {
    const map = data.map;
    map.setFilter(adequateLayer, adequateFilter(data));
    map.setFilter(etopsLayer, etopsFilter(data));
    map.setFilter(emergencyLayer, emergencyFilter(data));
    changeAdequatesColor(data);
    changeAirportETOPSColor(data);
    changeEmergencyColor(data);
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