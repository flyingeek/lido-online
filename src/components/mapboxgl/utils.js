import {jsonLine, jsonPoint, featureCollection} from './json';
import {kml2mapColor} from "../mapSettings/KmlColor.svelte";

export const pinColors = [
    '#FFFFFF', '#6699FF', '#FFFF00',
    '#CC9966', '#FF9922', '#DD5599',
    '#FF0000', '#22DD44', '#BB11EE', '#F56'
];

export const geoPoints2LngLats = (data, affine, cb) => {
    let lngLats = [];
    const len = data.length;
    for (let i = 0; i < len; i++) {
        const newPair = (affine) ? affine([data[i].longitude, data[i].latitude]) : [data[i].longitude, data[i].latitude];
        if (newPair) lngLats.push((cb) ? cb(newPair, data[i]) : newPair);
    }
    return lngLats;
}

// const geoPoints2LngLats2 = (data, affine, cb) => {
//     const lngLats = data.reduce(function(result, g) {
//         const newPair = (affine) ? affine([g.longitude, g.latitude]) : [g.longitude, g.latitude];
//         if (newPair) result.push((cb) ? cb(newPair, g) : newPair);
//         return result;
//     }, []);
//     return lngLats;
// }

export function addPoints(map, id, data, affine, selectedPin, visibility, kmlcolor) {
    map.addSource(`${id}-marker-source`, featureCollection(
        geoPoints2LngLats(data, affine, (lngLat, geoPoint) => jsonPoint(lngLat, geoPoint.name.replace(/00\.0/g,'')))
    ));
    map.addLayer(markerLayer(id, selectedPin, kmlcolor, visibility));
}

export function addLine(map, id, data, affineLine, kmlcolor, visibility) {
    if (affineLine) {
        map.addSource(`${id}-line-source`, featureCollection(affineLine(data).map(l =>jsonLine(l))));
    } else {
        map.addSource(`${id}-line-source`, {
            'type': 'geojson',
            'data': jsonLine(data.map(g => [g.longitude, g.latitude]))
        });
    }
    map.addLayer(lineLayer(id, kmlcolor, visibility));
}

export function addLines(map, id, data, affineLine, kmlcolor, visibility) {
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
    map.addLayer(lineLayer(id, kmlcolor, visibility));
}

export function markerLayer (folder, selectedPin, kmlcolor, visibility) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    return {
        'id': `${folder}-marker-layer`,
        'type': 'symbol',
        'source': `${folder}-marker-source`,
        'layout': {
            'icon-image': (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-triangle',
            'icon-size': (selectedPin !== 0) ? 1 : 0.2,
            'icon-anchor': (selectedPin !== 0) ? 'bottom' : 'center',
            'icon-offset': [0, 0],
            //'icon-rotate': ['get', 'orientation'],
            'icon-allow-overlap': false,
            'visibility': ( visibility) ? 'visible' : 'none',
            'text-field': ['get', 'title'],
            //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10,
            'text-offset': [0, 0.7],
            'text-anchor': 'top'
        },
        'paint': {
            'icon-color': (selectedPin !== 0) ? pinColors[selectedPin] : hexcolor,
            'icon-halo-width': 1,
            'icon-halo-color': '#000',
            'text-color': hexcolor,
            'text-opacity': Math.max(opacity, 0.7)
        }
    };
}
export function lineLayer(folder, kmlcolor, visibility) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    let lineWidth = 2;
    let lineDashArray = [1];
    if (folder.indexOf('-ep-') !== -1 || folder.indexOf('-etops-') !== -1) {
        lineWidth = 1;
        lineDashArray = [10, 10];
    } else if (folder.indexOf('rnat') !== -1){
        lineWidth = 1;
    }
    return {
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
            'line-dasharray': lineDashArray
        }
    }
}

export function changeMarkerGeneric(folder, data){
    const {map, value} = data;
    const lineLayer = `${folder}-line-layer`;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(markerLayer) && map.getLayer(lineLayer)) {
        const selectedPin = value;
        const hexcolor = pinColors[selectedPin];
        const lineColor = map.getPaintProperty(lineLayer, 'line-color');
        map.setPaintProperty(markerLayer, 'icon-color', (selectedPin !== 0) ? hexcolor : lineColor);
        map.setPaintProperty(markerLayer, 'text-color', lineColor);
        map.setLayoutProperty(markerLayer, 'icon-size', (selectedPin !== 0) ? 1 : 0.2);
        map.setLayoutProperty(markerLayer, 'icon-image', (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-triangle');
        map.setLayoutProperty(markerLayer, 'icon-anchor', (selectedPin !== 0) ? 'bottom' : 'center');
    }
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
        map.setPaintProperty(markerLayer, 'text-color', hexcolor);
    }
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
}