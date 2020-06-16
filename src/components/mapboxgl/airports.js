import {kml2mapColor} from "../KmlColor.svelte";

const basicAirportIconColor = ["case",["==", 0, ["get", "level"]], '#095','#B71'];
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

const getIconColor = (style, aircraftType) => {
    if (style === 0) {
        return statusAirportIconColor(aircraftType);
    }
    return basicAirportIconColor;
}
const getIconHaloWidth = style => (style === 0) ? 3 : 0;

export const addAirports = (map, affine, aircraftType, epPoints, raltPoints, etopsKmlColor, style) => {
    const [hexcolorEtops,] = kml2mapColor(etopsKmlColor);
    const epNames = epPoints.map(g => g.name);
    const raltNames = raltPoints.map(g => g.name);
    const etopsNames = epNames.concat(raltNames);
    fetch('data/airports.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        const projFeatures = [];
        for (let feature of data.features) {
            feature.geometry.coordinates = affine(feature.geometry.coordinates);
            if(feature.geometry.coordinates !== undefined) projFeatures.push(feature);
        }
        data.features = projFeatures;
        map.addSource('airports-source', {
            type: 'geojson',
            attribution: `Yammer/Maps.me - Airports/FIR © Olivier Ravet - ${aircraftType} ${"CONF_AIRAC".substring(0,2)}.${"CONF_AIRAC".substring(2,4)}`,
            data: data
        });

        map.addLayer({
            'id': `airport-emer-layer`,
            'type': 'symbol',
            'source': `airports-source`,
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
                'visibility': 'visible',
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
            'filter': ["!", ["in", `${aircraftType}`, ["get", "type"]]]
        });
        map.addLayer({
            'id': `airport-layer`,
            'type': 'symbol',
            'source': `airports-source`,
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
                'visibility': 'visible',
                'text-field': ['get', 'name'],
                //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                'text-size': ["case",
                    ["in", ["get", "name"], ["literal", etopsNames]], 10,
                    8],
                'text-offset': [0, 0.7],
                'text-anchor': 'top',
                'text-allow-overlap': false,
                'text-ignore-placement': false,
                'symbol-sort-key':["case",
                    ["in", ["get", "name"], ["literal", etopsNames]], 0,
                    ["get", `${aircraftType}`]]
            },
            'paint': {
                'icon-halo-color':["case", ["==", 0, ["get", "level"]], '#095','#D70'], // normal airports
                'icon-halo-width': getIconHaloWidth(style),
                'icon-color': getIconColor(style, aircraftType),
                'text-color': ["case",
                    ["in", ["get", "name"], ["literal", raltNames]], hexcolorEtops,
                    ["==", 0, ["get", "level"]], '#000',
                    '#C60'],
                'text-halo-color': "#000",
                'text-halo-width': ["case", ["==", 0, ["get", "level"]], 0, 0],
                'text-opacity': 0.8
            },
            'filter': ["in", `${aircraftType}`, ["get", "type"]]
        });
    })
};

export function changeAirportDisplay(map, visible) {
    let layer = 'airport-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
    layer = 'airport-emer-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
}

export function changeAirportStyle(map, style, aircraftType) {
    const layer = 'airport-layer';
    if (map.getLayer(layer)) {
        map.setPaintProperty(layer, 'icon-color', getIconColor(style, aircraftType));
        map.setPaintProperty(layer, 'icon-halo-width', getIconHaloWidth(style));
    }
}