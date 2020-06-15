/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName, addToSWCache} from './utils';
import { kmlDefaultOptions } from "./kml";
import { addAirports } from "./mapboxgl/airports";
import { addFirReg } from "./mapboxgl/fir-reg";
import { addEtops } from "./mapboxgl/etops";
import { addTracks } from "./mapboxgl/tracks";
import {pinColors, addLine, addPoints} from "./mapboxgl/layers";
import proj4 from 'proj4';

export const token = 'MAPBOX_TOKEN';

export const key = {};

export function createMap(id, mapOptions, ofp, kmlOptions) {
    const map = new mapboxgl.Map({
        'container': id, // container id
        'style': 'mapbox://styles/mapbox/streets-v11', // stylesheet location
        'center': [0, 49], // starting position
        'zoom': 2 // starting zoom
    });

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
    proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
    proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
    //window.proj4 = proj4;
    let affine = (v) => v;
    if (mapOptions.affineTransform) {
        proj4.defs('CUSTOM', mapOptions.proj4);
        const [a, b, c, d] = mapOptions.affineTransform;
        affine = ([lng, lat]) => {
            const [x, y] = proj4('CUSTOM', [lng, lat]);
            return proj4('EPSG:3857', 'WGS84', [(a * x) + b, (c * y) + d]);
        } 
    }
    let bbox = undefined;
    const getBounds = (points, result=[Infinity, Infinity, -Infinity, -Infinity]) => {
        for (const [lng, lat] of points.map(g => affine([g.longitude, g.latitude]))) {
            if (result[0] > lng) { result[0] = lng; }
            if (result[1] > lat) { result[1] = lat; }
            if (result[2] < lng) { result[2] = lng; }
            if (result[3] < lat) { result[3] = lat; }
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
    map.on('load', function() {
        if (mapOptions.id === 'jb_north') {
            map.addSource('jb-raster',{
                'type': 'raster',
                'tiles': [
                    'https://editolido.alwaysdata.net/i/tiles/{z}/{x}/{y}.png'
                ],
                'tileSize': 256,
            });
            map.addLayer({
                'id': 'jb-layer',
                'type': 'raster',
                'source': 'jb-raster',
                'minzoom': 0,
                'maxzoom': 22,
                paint:{
                    'raster-opacity': 1
                }
            });
        }
        loadMap(ofp, kmlOptions, map, affine);
        //const testpoints = [[10, -60], [30,-120], [30, 120], [0, 60]].map(v => new editolido.GeoPoint(v));
        //addPoints(map,'test', testpoints,affine,5, true, kmlOptions.routeColor);
        addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet');
    });
    // map.on('click', function(e) {
    //     e.lngLat.wrap();
    //     console.log(e.lngLat.wrap());
    // });
    return map;
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

export function loadMap(ofp, kmlOptions, map, affine) {
    const options = {...kmlDefaultOptions, ...kmlOptions};
    const description = ofp.description;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = new editolido.Route(ofp.wptCoordinates(), {"name": routeName, "description": description});
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});

    addLine(map, 'greatcircle', greatCircle.points, affine, options.greatCircleColor, options.greatCircleDisplay);
    addLine(map, 'ogimet', ofp.ogimetData.route.points, affine, options.ogimetColor, options.ogimetDisplay);
    addLine(map, 'ralt', alternateRoute.points, affine, options.alternateColor, options.alternateDisplay);
    addLine(map, 'rmain', route.points, affine, options.routeColor, true);
    addPoints(map, 'ralt', alternateRoute.points, affine, options.alternatePin, options.alternateDisplay, options.alternateColor);
    addPoints(map, 'rmain', route.points, affine, options.routePin, true, options.routeColor);
    addFirReg(map, affine);
    addAirports(map, affine, ofp.infos.aircraft);

    addTracks(map, ofp, affine, options.natColor, options.natPin, options.natDisplay);
    //console.log(ofp.infos, ofp.text);
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0){
        addEtops(map, 'etops', [ofp.infos['EEP'], ofp.infos['EXP']].concat(ofp.infos['raltPoints']), affine, true, ofp.infos['ETOPS'], options.routeColor);
    }
}