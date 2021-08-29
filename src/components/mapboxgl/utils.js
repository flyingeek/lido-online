import {jsonLine, jsonPoint, featureCollection} from './json';
import {folder2prefix} from '../utils';
import {kml2mapColor, splitKmlColor} from "../mapSettings/ColorPinCombo.svelte";

export const pinColors = [
    '#FFFFFF', '#6699FF', '#FFFF00',
    '#CC9966', '#FF9922', '#DD5599',
    '#FF0000', '#22DD44', '#BB11EE', '#F56'
];
export const iconTextSizeDefault = 10;
export const lineWidthDefault = 2;
export const iconSizeDefault = 1;
export const iconSizeDefaultNoPin = 0.2;
export const minTextOpacityDefault= 0.8;
export const haloTextSizeThreshold =10;
export const haloLightColor = "#f8f9fa"; //bs-gray-100
export const haloDarkColor = "#212529"; //bs-dark
export const haloTextBlur = (textSize) => (textSize >= haloTextSizeThreshold) ? textSize/2 : 0;
export const haloTextWidth = (textSize) => textSize/4;
export const getContrastColor = (kmlColor, opacityProperty) => {
    const [R, G, B,] = splitKmlColor(kmlColor).map((v) => parseInt(v, 16));
    const A = opacityProperty;
    const brightness = R * 0.299 + G * 0.587 + B * 0.114 + (1 - A) * 255;
    return brightness > 186 ? haloDarkColor : haloLightColor;
}
export const geoPoints2LngLats = (data, affine, cb) => {
    let lngLats = [];
    const len = data.length;
    for (let i = 0; i < len; i++) {
        const newPair = (affine) ? affine([data[i].longitude, data[i].latitude]) : [data[i].longitude, data[i].latitude];
        if (newPair) lngLats.push((cb) ? cb(newPair, data[i]) : newPair);
    }
    return lngLats;
}

export const computeIconSize = (ratio, size=iconSizeDefault, extraFactor=1) => {
    const result = ratio * size * ((ratio > 1) ? extraFactor : 1);
    if (isNaN(result)) return 1;
    return result;
}
export const computeIconTextSize = (ratio, size=iconTextSizeDefault, extraFactor=1) => {
    const result = ratio * size * ((ratio > 1) ? extraFactor : 1);
    if (isNaN(result)) return iconTextSizeDefault;
    return result;
}
export const computeLineWidthSize = (ratio, size=lineWidthDefault) => {
    const result = ratio * size;
    if (isNaN(result)) return 1;
    return result;
}
//to increase size of track entry/exit points
export const getIconSizeExpression = (iconSize) =>["case", ["==", 1, ["get", "overrideTextColor"]], computeIconSize(iconSize/iconSizeDefault, iconSizeDefaultNoPin * 3), iconSizeDefaultNoPin];
export const getIconAnchorExpression = () => 'center';
export const getIconImageExpression = () => 'sdf-triangle';
export const getIconColorExpression = (color, overrideColor) => (overrideColor) ? ["case", ["==", 1, ["get", "overrideIconColor"]], overrideColor, color] : color;
export const getTextColorExpression = (color, overrideColor) => (overrideColor) ? ["case", ["==", 1, ["get", "overrideTextColor"]], overrideColor, color] : color;
export const getOpacityColorExpression = (opacity, overrideOpacity, minOpacity=minTextOpacityDefault) => {
    if (overrideOpacity) {
        return ["case", ["==", 1, ["get", "overrideTextColor"]], Math.max(overrideOpacity, minOpacity), Math.max(opacity, minOpacity)];
    }
    return Math.max(opacity, minOpacity);
}
export const getTextKmlColorExpression = (kmlcolor, overrideKmlColor) => {
    const [color,] = kml2mapColor(kmlcolor);
    const [overrideColor,] = (overrideKmlColor) ? kml2mapColor(overrideKmlColor) : [null, null];
    return getTextColorExpression(color, overrideColor);
};
export const getOpacityKmlColorExpression= (kmlcolor, overrideKmlColor, minOpacity=minTextOpacityDefault) => {
    const [, opacity] = kml2mapColor(kmlcolor);
    const [,overrideOpacity] = (overrideKmlColor) ? kml2mapColor(overrideKmlColor) : [null, null];
    return getOpacityColorExpression(opacity, overrideOpacity, minOpacity)
};
export function addPoints(map, id, data, affine, kmlOptions, minZoom, maxZoom) {
    const prefix = folder2prefix(id);
    const visibility = kmlOptions[`${prefix}Display`];
    const kmlcolor = kmlOptions[`${prefix}Color`];
    const textSize = computeIconTextSize(kmlOptions[`iconTextChange`]);
    const iconSize = computeIconSize(kmlOptions[`iconSizeChange`]);
    map.addSource(`${id}-marker-source`, featureCollection(
        geoPoints2LngLats(data, affine, (lngLat, geoPoint) => jsonPoint(lngLat, {title: geoPoint.name.replace(/00\.0/g,'')}))
    ));
    map.addLayer(markerLayer(id, kmlcolor, visibility, textSize, iconSize, minZoom, maxZoom));
}

export function addLine(map, id, data, affineLine, kmlcolor, visibility, lineWidth, dashes) {
    if (affineLine) {
        map.addSource(`${id}-line-source`, featureCollection(affineLine(data).map(l =>jsonLine(l))));
    } else {
        map.addSource(`${id}-line-source`, {
            'type': 'geojson',
            'data': jsonLine(data.map(g => [g.longitude, g.latitude]))
        });
    }
    map.addLayer(lineLayer(id, kmlcolor, visibility, lineWidth, dashes));
}

export function addLines(map, id, data, affineLine, kmlcolor, visibility, lineWidth, dashes) {
    if (affineLine) {
        const len = data.length;
        const results = [];
        for (let line=0; line<len; line++) {
            const sublines = affineLine(data[line]);
            const sublen = sublines.length;
            for (let subline = 0; subline < sublen; subline++) {
                results.push(jsonLine(sublines[subline]))
            }
        }
        map.addSource(`${id}-line-source`, featureCollection(results));
    }else{
        map.addSource(`${id}-line-source`, featureCollection(data.map(ar => jsonLine(ar.map(g => [g.longitude, g.latitude])))));
    }
    map.addLayer(lineLayer(id, kmlcolor, visibility, lineWidth, dashes));
}
export const interpolateTextSize = (size, minZoom=0, maxZoom=10, magnification =2) => [
    "interpolate", ["linear"], ["zoom"],
    // zoom is 5 (or less) -> circle radius will be 1px
    minZoom, size,
    // zoom is 10 (or greater) -> circle radius will be 5px
    maxZoom, size * magnification
];
export function markerLayer (folder, kmlcolor, visibility, textSize, iconSize, minZoom, maxZoom) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    const layer = {
        'id': `${folder}-marker-layer`,
        'type': 'symbol',
        'source': `${folder}-marker-source`,
        'layout': {
            'icon-image': getIconImageExpression(),
            'icon-size': getIconSizeExpression(iconSize),
            'icon-anchor': getIconAnchorExpression(),
            'icon-offset': [0, 0],
            //'icon-rotate': ['get', 'orientation'],
            'icon-allow-overlap': false,
            'visibility': ( visibility) ? 'visible' : 'none',
            'text-field': ['get', 'title'],
            //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': interpolateTextSize(textSize, minZoom, maxZoom),
            'text-offset': [0, 0.7],
            'text-anchor': 'top'
        },
        'paint': {
            'icon-color': getIconColorExpression(hexcolor),
            'icon-halo-width': 1,
            'icon-halo-color': '#000',
            'text-halo-color': haloLightColor,
            'text-color': getTextColorExpression(hexcolor),
            'text-opacity': getOpacityColorExpression(opacity)
        }
    };
    return layer;
}
export function lineLayer(folder, kmlcolor, visibility, lineWidth=lineWidthDefault, dashes=false) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    const layer = {
        'id': `${folder}-line-layer`,
        'type': 'line',
        'source': `${folder}-line-source`,
        'layout': {
            'line-join': 'round',
            'line-cap': 'round',
            'visibility': (visibility) ? 'visible' : 'none'
        },
        'paint': {
            'line-color': hexcolor,
            'line-opacity': opacity,
            'line-width': lineWidth,
            'line-dasharray': (dashes) ? [10, 10] : [1]
        }
    }
    return layer;
}
export function changeIconSizeGeneric(folder, data, iconSize=iconSizeDefault){
    const {map, value} = data;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(markerLayer)) {
        map.setLayoutProperty(markerLayer, 'icon-size', getIconSizeExpression(computeIconSize(value, iconSize)));
    }
    return true; // allows chaining
}
export function changeIconTextGeneric(folder, data, textSize=iconTextSizeDefault){
    const {map, value, mapOptions} = data;
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(markerLayer)) {
        map.setLayoutProperty(markerLayer, 'text-size', interpolateTextSize(computeIconTextSize(value, textSize), minZoom, maxZoom));
    }
    return true; // allows chaining
}
export function changeLineWidthGeneric(folder, data, lineWidth=lineWidthDefault){
    const {map, value} = data;
    const lineLayer = `${folder}-line-layer`;
    if (map.getLayer(lineLayer)) {
        map.setPaintProperty(lineLayer, 'line-width', computeLineWidthSize(value, lineWidth));
    }
    return true; // allows chaining
}

export function changeLineGeneric(folder, data){
    const {map, value} = data;
    const lineLayer = `${folder}-line-layer`;
    const markerLayer = `${folder}-marker-layer`;
    const [hexcolor, opacity] = kml2mapColor(value);
    if (map.getLayer(lineLayer)) {
        map.setPaintProperty(lineLayer, 'line-color', hexcolor);
        map.setPaintProperty(lineLayer, 'line-opacity', opacity);
    }
    if (map.getLayer(markerLayer)) {
        const iconImageExpression = map.getLayoutProperty(markerLayer, 'icon-image');
        const iconImage = Array.isArray(iconImageExpression) ? iconImageExpression.slice(-1).pop() : iconImageExpression;
        map.setPaintProperty(markerLayer, 'text-color', getTextColorExpression(hexcolor));
        map.setPaintProperty(markerLayer, 'text-opacity', getOpacityColorExpression(opacity));
        if (iconImage === 'sdf-triangle') map.setPaintProperty(markerLayer, 'icon-color', getIconColorExpression(hexcolor));
    }
    return true; // allows chaining
}
export function changeDisplayGeneric(folder, visibility, data){
    const {map} = data;
    const lineLayer = `${folder}-line-layer`;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(lineLayer)) {
        map.setLayoutProperty(lineLayer, 'visibility', (visibility) ? 'visible' : 'none');
    }
    if (map.getLayer(markerLayer)) {
        map.setLayoutProperty(markerLayer, 'visibility', (visibility) ? 'visible' : 'none');
    }
    return true; // allows chaining
}

