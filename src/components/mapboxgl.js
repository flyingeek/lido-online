/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName, addToSWCache} from './utils';
import { kmlDefaultOptions } from "./kml";
import { addAirports } from "./mapboxgl/airports";
import { addFirReg } from "./mapboxgl/fir-reg";
import { addEtops } from "./mapboxgl/etops";
import { addTracks } from "./mapboxgl/tracks";
import {pinColors, addLine, addPoints} from "./mapboxgl/layers";
export const token = 'MAPBOX_TOKEN';

export const key = {};


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
    //map.addControl(new mapboxgl.FullscreenControl());
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
            window.lidoMap = undefined;
        }
    }
}

function folderHasMarker(folder) {
    return (!(folder === 'ogimet' || folder === 'greatcircle'));
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
    addLine(map, 'greatcircle', greatCircle.points, options.greatCircleColor, options.greatCircleDisplay);
    addLine(map, 'ogimet', ofp.ogimetData.route.points, options.ogimetColor, options.ogimetDisplay);
    addLine(map, 'ralt', alternateRoute.points, options.alternateColor, options.alternateDisplay);
    addLine(map, 'rmain', route.points, options.routeColor, true);
    addPoints(map, 'ralt', alternateRoute.points, options.alternatePin, options.alternateDisplay, options.alternateColor);
    addPoints(map, 'rmain', route.points, options.routePin, true, options.routeColor);
    addFirReg(map);
    addAirports(map, ofp.infos.aircraft);

    addTracks(map, ofp, options.natColor, options.natPin, options.natDisplay);
    //console.log(ofp.infos, ofp.text);
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0){
        addEtops(map, 'etops', [ofp.infos['EEP'], ofp.infos['EXP']].concat(ofp.infos['raltPoints']), true, ofp.infos['ETOPS'], options.routeColor);
    }
}