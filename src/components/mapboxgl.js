/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName, addToSWCache} from './utils';
import { kmlDefaultOptions } from "./kml";
export const token = 'MAPBOX_TOKEN';

export const key = {};
const etopsKmlColor = '800324FC';

export function mapbox(node, parameters) {
    const ofp = parameters.ofp;
    const kmlOptions = parameters.kmlOptions;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
        'container': node.id, // container id
        'style': 'mapbox://styles/mapbox/streets-v11', // stylesheet location
        'center': [0, 49], // starting position
        'zoom': 2 // starting zoom
    });
    window.lidoMap = map;
    map.loadImage('sdf/maki-marker-sdf.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('sdf-marker-15', image, { pixelRatio: 2, sdf: true});
        }
    });
    map.loadImage('sdf/map-triangle-sdf.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('sdf-triangle', image, { pixelRatio: 2, sdf: true});
        }
    });
    map.loadImage('sdf/map-circle-sdf.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('sdf-airport', image, { pixelRatio: 2, sdf: true});
        }
    });
    map.loadImage('sdf/map-star-sdf.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('sdf-star', image, { pixelRatio: 2, sdf: true});
        }
    });
    map.on('load', function() {
        loadMap(ofp, kmlOptions, map);
        addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet');
    });
    let bbox = undefined;
    const getBounds = (points, result=[Infinity, Infinity, -Infinity, -Infinity]) => {
        for (const p of points) {
            if (result[0] > p.longitude) { result[0] = p.longitude; }
            if (result[1] > p.latitude) { result[1] = p.latitude; }
            if (result[2] < p.longitude) { result[2] = p.longitude; }
            if (result[3] < p.latitude) { result[3] = p.latitude; }
        }
        result[0] -= 1;
        result[1] -= 1;
        result[2] += 1;
        result[3] += 1;
        return result;
    }
    let points = [];
    for (const track of ofp.tracks) {
        points = points.concat(track.points);
    }
    points = points.concat(ofp.route.points, ofp.wptCoordinatesAlternate());
    bbox = getBounds(points);

    map.fitBounds(bbox, {padding: {top: 30, bottom:80, left: 30, right: 30}});
    map.addControl(new mapboxgl.FullscreenControl());
    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: false
        },
        fitBoundsOptions: {maxZoom: 3},
        trackUserLocation: false
    });
    map.addControl(geolocate);
    //console.log(geolocate);
    // geolocate.on('geolocate', function(e) {
    //     console.log('geolocated');
    //     const zoom = map.getZoom();
    //     geolocate.options['fitBoundsOptions'] = {maxZoom: zoom};
    //     //map.setZoom(8);
    // });
    // geolocate.on('trackuserlocationstart', function() {
    //     console.log('A trackuserlocationstart event has occurred.');
    //     const zoom = map.getZoom();
    //     geolocate.options['fitBoundsOptions'] = {maxZoom: zoom};
    // });
    document.addEventListener("webkitfullscreenchange", function( event ) {
        if ( document.webkitfullscreen ) {
            console.log('fullscreen element', document.fullscreenElement);
            map.resize();
        }else {
            console.log('fullscreen exit');
            map.resize();
        }

    });
    return {
        update(parameters) {
            if (parameters.route === '/map' && map) {
                map.resize();
                console.log("map resized");
            }
        },
        destroy() {
            map.remove();
            window.map = undefined;
        }
    }
}

function markerLayer (folder, selectedPin, kmlcolor, visibility) {
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

function lineLayer(folder, kmlcolor, visibility) {
    const [hexcolor, opacity] = kml2mapColor(kmlcolor);
    let lineWidth = 2;
    let lineDashArray = [1];
    if (folder.indexOf('-eep') !== -1 || folder.indexOf('-exp') !== -1 || folder.indexOf('-etops') !== -1) {
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
    '#FF0000', '#22DD44', '#BB11EE', '#F56'
];

export function addPointsToMap(map, id, data, selectedPin, visibility, kmlcolor) {
    const points = data.map(g => jsonPoint(g, g.name.replace(/00\.0/g,'')));
    map.addSource(`${id}-marker-source`, featureCollection(points));
    map.addLayer(markerLayer(id, selectedPin, kmlcolor, visibility));
}

export function addEtopsToMap(map, id, data, etopsKmlColor, visibility, etopsTime, routeKmlColor) {
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
            addLineToMap(map, `${id}-eep-circle`, data[0].circle(420), routeKmlColor, visibility);
        } else if (i === 1) {
            addLineToMap(map, `${id}-exp-circle`, data[1].circle(420), routeKmlColor, visibility);
        } else {
            addLineToMap(map, `${id}-etops${i-2}-circle`, data[i].circle(7 * etopsTime), etopsKmlColor, visibility)
        }
    }

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
    if (folder === 'rmain') {
        const etopsLayer = 'etops-marker-layer';
        const eepCircleLayer = 'etops-eep-circle-line-layer';
        const expCircleLayer = 'etops-exp-circle-line-layer';
        if (map.getLayer(etopsLayer)) {
            const prop = map.getPaintProperty(etopsLayer, 'icon-color');
            prop.pop();
            prop.push(hexcolor);
            map.setPaintProperty(etopsLayer, 'icon-color', prop);
            map.setPaintProperty(etopsLayer, 'text-color', prop);
            map.setPaintProperty(eepCircleLayer, 'line-color', hexcolor);
            map.setPaintProperty(expCircleLayer, 'line-color', hexcolor);
            map.setPaintProperty(eepCircleLayer, 'line-opacity', opacity);
            map.setPaintProperty(expCircleLayer, 'line-opacity', opacity);
        }
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
    map.setLayoutProperty(markerLayer, 'icon-image', (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-triangle');
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
    map.addSource('fir-reg-source', {
        type: 'geojson',
        data: 'data/fir-reg.CONF_AIRAC.geojson'
    });
    map.addLayer({
        'id': 'fir-reg-layer',
        'type': 'fill',
        'source': 'fir-reg-source',
        'layout': {},
        'paint': {
            'fill-color': ['case', ['==', 'FIR-RED', ['get', 'type']], '#F00', '#FF7F00'],
            'fill-opacity': ['case', ['==', 'FIR-RED', ['get', 'type']], 0.25, 0.2]
        }
    });
    // map.addSource('fir-oca-source', {
    //     type: 'geojson',
    //     data: 'data/fir-oceanic.geojson'
    // });
    // map.addLayer({
    //     'id': 'fir-oca-layer',
    //     'type': 'line',
    //     'source': 'fir-oca-source',
    //     'layout': {},
    //     'paint': {
    //         'line-color': "#099",
    //         'line-opacity': 0.6,
    //         'line-width': 1,
    //         'line-dasharray': [3,5]
    //     }
    // });
    // // When a click event occurs on a feature in the states layer, open a popup at the
    // // location of the click, with description HTML from its properties.
    // map.on('click', 'fir-reg-layer', function(e) {
    //     new mapboxgl.Popup()
    //     .setLngLat(e.lngLat)
    //     .setHTML(e.features[0].properties.name + '<br>' + e.features[0].properties.description)
    //     .addTo(map);
    // });
        
    // // Change the cursor to a pointer when the mouse is over the states layer.
    // map.on('mouseenter', 'fir-reg-layer', function() {
    //     map.getCanvas().style.cursor = 'pointer';
    // });
        
    // // Change it back to a pointer when it leaves.
    // map.on('mouseleave', 'fir-reg-layer', function() {
    //     map.getCanvas().style.cursor = '';
    // });

    map.addSource('airports-source', {
        type: 'geojson',
        attribution: `Airports/FIR ${ofp.infos.aircraft} ${"CONF_AIRAC".substring(0,2)}.${"CONF_AIRAC".substring(2,4)} © Olivier Ravet - Yammer/Maps.me`,
        data: 'data/airports.CONF_AIRAC.geojson'
    });
    map.addLayer({
        'id': `airports-emer-layer`,
        'type': 'symbol',
        'source': `airports-source`,
        'layout': {
            'icon-image': ["case",["==", 2, ["get", "level"]], 'sdf-star', 'sdf-airport'],
            'icon-size': ["case",["==", 2, ["get", "level"]], 0.5, 0.4],
            'icon-anchor': 'center',
            'icon-offset': [0, 0],
            //'icon-rotate': ['get', 'orientation'],
            'icon-allow-overlap': true,
            'visibility': 'visible',
            'text-field': ['get', 'name'],
            //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 8,
            'text-offset': [0, 0.7],
            'text-anchor': 'top',
            'symbol-sort-key': ["get", `${ofp.infos.aircraft}`]
        },
        'paint': {
            'icon-color': ["case",["==", 1, ["get", "level"]], '#B71', '#B02'],
            'icon-halo-width': 0,
            'icon-halo-color': '#000',
            'text-color': '#000',
            'text-opacity': 0.8
        },
        'filter': ["!", ["in", `${ofp.infos.aircraft}`, ["get", "type"]]]
    });
    map.addLayer({
        'id': `airports-layer`,
        'type': 'symbol',
        'source': `airports-source`,
        'layout': {
            'icon-image': 'sdf-airport',
            'icon-size': 0.6,
            'icon-anchor': 'center',
            'icon-offset': [0, 0],
            //'icon-rotate': ['get', 'orientation'],
            'icon-allow-overlap': true,
            'visibility': 'visible',
            'text-field': ['get', 'name'],
            //'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 8,
            'text-offset': [0, 0.7],
            'text-anchor': 'top',
            'symbol-sort-key': ["get", `${ofp.infos.aircraft}`]
        },
        'paint': {
            'icon-color': ["case",["==", 0, ["get", "level"]], '#095','#B71'],
            'icon-halo-width': 0,
            'icon-halo-color': '#000',
            'text-color': '#000',
            'text-opacity': 0.8
        },
        'filter': ["in", `${ofp.infos.aircraft}`, ["get", "type"]]
    });

    addTracksToMap(map, ofp, options.natColor, options.natPin, options.natDisplay);
    //console.log(ofp.infos, ofp.text);
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0){
        addEtopsToMap(map, 'etops', [ofp.infos['EEP'], ofp.infos['EXP']].concat(ofp.infos['raltPoints']), etopsKmlColor, true, ofp.infos['ETOPS'], options.routeColor);
    }
}