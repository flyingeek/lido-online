import {jsonLine, jsonPoint, featureCollection} from './json';
import {kml2mapColor} from "../KmlColor.svelte";

export const pinColors = [
    '#FFFFFF', '#6699FF', '#FFFF00',
    '#CC9966', '#FF9922', '#DD5599',
    '#FF0000', '#22DD44', '#BB11EE', '#F56'
];

export function addPoints(map, id, data, affine, selectedPin, visibility, kmlcolor) {
    const points = data.flatMap(g => {
        const newPair = affine([g.longitude, g.latitude]);
        if (newPair != undefined) {
            return [jsonPoint(newPair, g.name.replace(/00\.0/g,''))];
        }
        return [];
    });
    map.addSource(`${id}-marker-source`, featureCollection(points));
    map.addLayer(markerLayer(id, selectedPin, kmlcolor, visibility));
}


export function addLine(map, id, data, affine, kmlcolor, visibility) {
    const reduced = data.reduce(function(result, g) {
        const newPair = affine([g.longitude, g.latitude]);
        if (newPair !== undefined) {
            result.push(newPair);
        }
        return result;
    }, []);
    map.addSource(`${id}-line-source`, {
        'type': 'geojson',
        'data': jsonLine(reduced)
    });
    map.addLayer(lineLayer(id, kmlcolor, visibility));
}

export function addLines(map, id, data, affine, kmlcolor, visibility) {

    map.addSource(`${id}-line-source`, featureCollection(data.map((ar) => {
            return jsonLine(ar.reduce(function(result, g) {
                const newPair = affine([g.longitude, g.latitude]);
                if (newPair !== undefined) {
                    result.push(newPair);
                }
                return result;
            }, []));
        }))
    );
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