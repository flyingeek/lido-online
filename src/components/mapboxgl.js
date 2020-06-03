/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName} from './utils';
import { kmlDefaultOptions } from "./kml";
export const token = 'MAPBOX_TOKEN';

export const key = {};

// export function mapbox(node, parameters) {
//     let [map, ofp, kmlOptions] = parameters;
//     mapboxgl.accessToken = token;
//     map = new mapboxgl.Map({
//         'container': node.id, // container id
//         'style': 'mapbox://styles/mapbox/streets-v11', // stylesheet location
//         'center': [0, 49], // starting position
//         'zoom': 2 // starting zoom
//     });
//     map.loadImage('maki-marker-sdf.png', function(error, image) {
//         if (error) {
//             console.log(error);
//         } else {
//             map.addImage('sdf-marker-15', image, { pixelRatio: 2, sdf: true});
//         }
//     });
//     map.loadImage('map-triangle.png', function(error, image) {
//         if (error) {
//             console.log(error);
//         } else {
//             map.addImage('sdf-pin0', image, { pixelRatio: 2, sdf: true});
//         }
//     });
//     map.on('load', function() {
//         loadMap(ofp, kmlOptions, map);
//     });
//     const result = [Infinity, Infinity, -Infinity, -Infinity];
//     for (const p of ofp.route.points) {
//         if (result[0] > p.longitude) { result[0] = p.longitude; }
//         if (result[1] > p.latitude) { result[1] = p.latitude; }
//         if (result[2] < p.longitude) { result[2] = p.longitude; }
//         if (result[3] < p.latitude) { result[3] = p.latitude; }
//     };
//     map.fitBounds(result, {padding: {top: 10, bottom:25, left: 15, right: 15}});
//     map.addControl(new mapboxgl.FullscreenControl());
//     return {
//         update() {
//             // nothing to do (updated in App.svelte);
//         },
//         destroy() {
//             map.remove();
//         }
//     }
// }

function markerLayer (folder, selectedPin, kmlcolor, visibility) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    return {
        'id': `${folder}-marker-layer`,
        'type': 'symbol',
        'source': `${folder}-marker-source`,
        'layout': {
            'icon-image': (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-pin0',
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
            'text-opacity': opacity
        }
    };
}

function lineLayer(folder, kmlcolor, visibility) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
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
            'line-width': 2
        }
    }
}

function featureCollection(features) {
    return {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    };
}

function jsonPoint(point, title, description) {
    const json = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [point.longitude, point.latitude]
        },
        'properties': {
        }
    };
    if (title) json['properties']['title'] = title;
    if (description) json['properties']['description'] = description;
    return json;
}

function jsonLine(coordinates, title) {
   const json = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
        },
        'properties': {
        }
    };
    if (title) json['properties']['title'] = title;
    return json;
}

function folderHasMarker(folder) {
    return (!(folder === 'ogimet' || folder === 'greatcircle'));
}

export function addTracksToMap(map, ofp, kmlcolor, selectedPin, visibility) {
    const lines = {
        'rnat': [],
        'rnat-incomplete': []
    };
    const markers = {
        'rnat': [],
        'rnat-incomplete': []
    };
    for (let track of ofp.tracks) {
        const folder = (track.isComplete) ? 'rnat' : 'rnat-incomplete';
        const points = track.points.map(g => [g.longitude, g.latitude]);
        lines[folder].push(jsonLine(points, track.name));
        const firstPoint = track.points[0];
        markers[folder].push(jsonPoint(firstPoint, `${track.name}\n${firstPoint.name}`, track.description));
        if (track.isMine) {
            const lastPoint = track.points[track.points.length - 1];
            markers[folder].push(jsonPoint(lastPoint, `${track.name}\n${lastPoint.name}`, track.description));
        }
    }
    map.addSource(`rnat-marker-source`, featureCollection(markers['rnat']));
    map.addSource(`rnat-incomplete-marker-source`, featureCollection(markers['rnat-incomplete']));
    map.addSource(`rnat-line-source`, featureCollection(lines['rnat']));
    map.addSource(`rnat-incomplete-line-source`, featureCollection(lines['rnat-incomplete']));

    map.addLayer(lineLayer('rnat', kmlcolor, visibility));
    map.addLayer(lineLayer('rnat-incomplete', kmlDefaultOptions.natIncompleteColor, visibility));
    map.addLayer(markerLayer("rnat", selectedPin, kmlcolor, visibility));
    map.addLayer(markerLayer("rnat-incomplete", selectedPin, kmlcolor, visibility));

    const popup = (e) => {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var description = e.features[0].properties.description;
         
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
         
        new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
    };
    const activatePopup = (folder) => {
        const layer = folder + '-marker-layer';
        map.on('click', layer, popup);
        map.on('mouseenter', layer, function() {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layer, function() {
            map.getCanvas().style.cursor = '';
        });
    }
    activatePopup('rnat');
    activatePopup('rnat-incomplete');
}

export function addLineToMap(map, id, data, kmlcolor, visibility) {
    map.addSource(`${id}-line-source`, {
        'type': 'geojson',
        'data': jsonLine(data.map(g => [g.longitude, g.latitude]))
    });
    map.addLayer(lineLayer(id, kmlcolor, visibility));
}
export const pinColors = [
    '#FFFFFF', '#6699FF', '#FFFF00',
    '#CC9966', '#FF9922', '#DD5599',
    '#FF0000', '#22DD44', '#BB11EE'
];

export function addPointsToMap(map, id, data, selectedPin, visibility, kmlcolor) {
    const points = data.map(g => jsonPoint(g, g.name.replace(/00\.0/g,'')));
    map.addSource(`${id}-marker-source`, featureCollection(points));
    map.addLayer(markerLayer(id, selectedPin, kmlcolor, visibility));
}

export function changeLayerState(map, folder, value) {
    const markerLayer = folder + '-marker-layer';
    const lineLayer = folder + '-line-layer';
    map.setLayoutProperty(lineLayer, 'visibility', (value) ? 'visible' : 'none');
    if (folderHasMarker(folder)) {
        map.setLayoutProperty(markerLayer, 'visibility', (value) ? 'visible' : 'none');
    }
}

export function changeLineLayer(map, folder, kmlcolor) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    const markerLayer = folder + '-marker-layer';
    const lineLayer = folder + '-line-layer';
    map.setPaintProperty(lineLayer, 'line-color', hexcolor);
    map.setPaintProperty(lineLayer, 'line-opacity', opacity);
    if (folderHasMarker(folder)) {
        map.setPaintProperty(markerLayer, 'text-color', hexcolor);
    }
}

export function changeMarkerLayer(map, folder, selectedPin) {
    const hexcolor = pinColors[selectedPin];
    const markerLayer = folder + '-marker-layer';
    const lineLayer = folder + '-line-layer';
    const lineColor = map.getPaintProperty(lineLayer, 'line-color');
    map.setPaintProperty(markerLayer, 'icon-color', (selectedPin !== 0) ? hexcolor : lineColor);
    map.setPaintProperty(markerLayer, 'text-color', lineColor);
    map.setLayoutProperty(markerLayer, 'icon-size', (selectedPin !== 0) ? 1 : 0.2);
    map.setLayoutProperty(markerLayer, 'icon-image', (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-pin0');
    map.setLayoutProperty(markerLayer, 'icon-anchor', (selectedPin !== 0) ? 'bottom' : 'center');
}

export function updateMapLayers(map, name, value) {
    const folder = folderName(name);
    if (name.endsWith('-display')) {
        if (folder === 'rnat') {
            changeLayerState(map, 'rnat-incomplete', value); // we must turn both rnat & rnat-incomplete
        }
        changeLayerState(map, folder, value);
    }else if (name.endsWith('-pin')) {
        changeMarkerLayer(map, folder, value);
    }else if (name.endsWith('-color')) {
        changeLineLayer(map, folder, value);
    }else{
        console.error(`ignoring map layer update for ${name}`);
    }
  }

export function loadMap(ofp, options, map) {
    options = {...kmlDefaultOptions, ...options};
    const description = ofp.description;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = new editolido.Route(ofp.wptCoordinates(), {"name": routeName, "description": description});
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
    addLineToMap(map, 'greatcircle', greatCircle.points, options.greatCircleColor, options.greatCircleDisplay);
    addLineToMap(map, 'ogimet', ofp.ogimetData.route.points, options.ogimetColor, options.ogimetDisplay);
    addLineToMap(map, 'ralt', alternateRoute.points, options.alternateColor, options.alternateDisplay);
    addLineToMap(map, 'rmain', route.points, options.routeColor, true);
    addPointsToMap(map, 'ralt', alternateRoute.points, options.alternatePin, options.alternateDisplay, options.alternateColor);
    addPointsToMap(map, 'rmain', route.points, options.routePin, true, options.routeColor);
    addTracksToMap(map, ofp, options.natColor, options.natPin, options.natDisplay);
}