import {kml2mapColor} from "../KmlColor.svelte";
import {jsonPoint, featureCollection} from './json.js';
import {addLine} from './layers';

const etopsKmlColor = '800324FC';

export function addEtops(map, id, data, visibility, etopsTime, routeKmlColor) {
    const [hexcolorEtops,] = kml2mapColor(etopsKmlColor);
    const [hexcolorRoute,] = kml2mapColor(routeKmlColor);
    const points = data.map(g => jsonPoint(g, g.name, g.description));
    map.addSource(`${id}-marker-source`, featureCollection(points.reverse())); // priority to ETOPS over EEP/EXP
    map.addLayer({
        'id': `${id}-marker-layer`,
        'type': 'symbol',
        'source': `${id}-marker-source`,
        'layout': {
            'icon-image': 'sdf-triangle',
            'icon-size': 1,
            'icon-anchor': 'center',
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
            'icon-color': ["case",["==", "ETOPS", ["get", "description"]], hexcolorEtops, hexcolorRoute],
            'icon-halo-width': 1,
            'icon-halo-color': '#000',
            'text-color': ["case",["==", "ETOPS", ["get", "description"]], hexcolorEtops, hexcolorRoute],
            'text-opacity': 1
        }
    });
    for (let i = 0; i < data.length; i += 1){
        if (i === 0) {
            addLine(map, `${id}-eep-circle`, data[0].circle(420, 48), routeKmlColor, visibility);
        } else if (i === 1) {
            addLine(map, `${id}-exp-circle`, data[1].circle(420, 48), routeKmlColor, visibility);
        } else {
            addLine(map, `${id}-etops${i-2}-circle`, data[i].circle(7 * etopsTime), etopsKmlColor, visibility)
        }
    }

}
