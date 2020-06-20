/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName} from './utils';
import { kmlDefaultOptions } from "./kml";
import { addAirports, changeAirportDisplay, changeAirportStyle } from "./mapboxgl/airports";
import { addFirReg } from "./mapboxgl/fir-reg";
import { addEtops, changeEPCircleColor, changeETOPSCircleColor, changeETOPSDisplay } from "./mapboxgl/etops";
import { addTracks } from "./mapboxgl/tracks";
import {pinColors, addLine, addPoints} from "./mapboxgl/layers";
import {clamp, isInside, addToSWCache} from './utils';

import proj4 from 'proj4';

export const token = 'MAPBOX_TOKEN';

export const key = {};

export function createMap(id, mapOptions, ofp, kmlOptions) {
    let mapboxOptions = {
        'container':id,
        'center': [0, 49],
        'zoom': 2
    }
    const map = new mapboxgl.Map({...mapOptions.mapboxOptions, ...mapboxOptions});
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
    let affineAndClamp = (v) => v;
    let affineOrDrop = (v) => v;
    if (mapOptions.extent) {
        proj4.defs('CUSTOM', mapOptions.proj4);
        let a, b, c, d;
        if (mapOptions.affineTransform) {
            [a, b, c, d] = mapOptions.affineTransform;
        } else {
            const [x0, y0, x1, y1] = mapOptions.extent;
            const [u0, v0, u1, v1] = [-20026376.39, -20048966.10, 20026376.39, 20048966.10];
            a = (u1 - u0) / (x1 -x0);
            b = u0 - (a * x0);
            c = (v1 - v0) / (y1 - y0);
            d = v0 - (c * y0);
        }
        
        const [minX, minY, maxX, maxY] = (mapOptions.viewport) ? mapOptions.viewport : mapOptions.extent;
        affine = ([lng, lat]) => {
            const [x, y] = proj4('CUSTOM', [lng, lat]);
            return proj4('EPSG:3857', 'WGS84', [(a * x) + b, (c * y) + d]);
        }
        affineAndClamp = ([lng, lat]) => {
            let [x, y] = proj4('CUSTOM', [lng, lat]);
            x = clamp(x, minX, maxX);
            y = clamp(y, minY, maxY);
            return proj4('EPSG:3857', 'WGS84', [(a * x) + b, (c * y) + d]);
        }
        affineOrDrop = ([lng, lat]) => {
            let [x, y] = proj4('CUSTOM', [lng, lat]);
            if (isInside(x, minX, maxX) && isInside(y, minY, maxY)) {
                return proj4('EPSG:3857', 'WGS84', [(a * x) + b, (c * y) + d]);
            }
        }
    }
    let bbox = undefined;
    const getBounds = (points, result=[Infinity, Infinity, -Infinity, -Infinity]) => {
        for (const [lng, lat] of points.map(g => affineAndClamp([g.longitude, g.latitude]))) {
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
        trackUserLocation: true
    });
    const originalOnSuccess = geolocate._onSuccess;
    geolocate._onSuccess = function(position) {
        const [lng, lat] = affine([position.coords.longitude, position.coords.latitude]);
        return originalOnSuccess.apply(this, [{'coords': {'longitude': lng, 'latitude': lat, 'accuracy': position.coords.accuracy}}]);
    }
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
        if (mapOptions.tiles) {
            map.addSource('jb-raster',{
                'type': 'raster',
                'tiles': mapOptions.tiles,
                'tileSize': mapOptions.tileSize,
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
        loadMap(ofp, kmlOptions, map, affine, affineAndClamp, affineOrDrop, mapOptions);
        //const testpoints = [[10, -60], [30,-120], [30, 120], [0, 60]].map(v => new editolido.GeoPoint(v));
        //addPoints(map,'test', testpoints,affine,5, true, kmlOptions.routeColor);
        addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet2');
        //fetch(ofp.ogimetData.proxyImg); // add to cache
    });
    // map.on('click', function(e) {
    //     e.lngLat.wrap();
    //     console.log(e.lngLat.wrap());
    // });
    return map;
}

export function changeLayerState(map, folder, value) {
    if (folder === 'etops') {
        return changeETOPSDisplay(map, value);
    } else if (folder === 'airport') {
        return changeAirportDisplay(map, value);
    }
    const markerLayer = folder + '-marker-layer';
    const lineLayer = folder + '-line-layer';
    if (map.getLayer(lineLayer)) map.setLayoutProperty(lineLayer, 'visibility', (value) ? 'visible' : 'none');
    if (map.getLayer(markerLayer)) {
        map.setLayoutProperty(markerLayer, 'visibility', (value) ? 'visible' : 'none');
    }
}

export function changeLineLayer(map, folder, kmlColor) {
    const [hexcolor, opacity] = kml2mapColor(kmlColor);
    if (folder === 'etops') {
        return changeETOPSCircleColor(map, kmlColor);
    }
    const markerLayer = folder + '-marker-layer';
    const lineLayer = folder + '-line-layer';
    if (map.getLayer(lineLayer)) {
        map.setPaintProperty(lineLayer, 'line-color', hexcolor);
        map.setPaintProperty(lineLayer, 'line-opacity', opacity);
    }
    if (map.getLayer(markerLayer)) {
        map.setPaintProperty(markerLayer, 'text-color', hexcolor);
    }
    if (folder === 'rmain') {
        changeEPCircleColor(map, kmlColor);
    }
}

export function changeMarkerLayer(map, folder, selectedPin, aircraftType, raltNames, etopsKmlColor) {
    if (folder === 'airport') {
        return changeAirportStyle(map, selectedPin, aircraftType, raltNames, etopsKmlColor);
    }
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

export function updateMapLayers(map, name, value, ofp, kmlOptions) {
    const folder = folderName(name);
    if (name.endsWith('-display')) {
        if (folder === 'rnat') {
            changeLayerState(map, 'rnat-incomplete', value); // we must turn both rnat & rnat-incomplete
        }
        changeLayerState(map, folder, value);
    }else if (name.endsWith('-pin')) {
        changeMarkerLayer(map, folder, value, ofp.infos.aircraftType || '773', ofp.infos.ralts, kmlOptions.etopsColor);
    }else if (name.endsWith('-color')) {
        changeLineLayer(map, folder, value);
    }else{
        console.error(`ignoring map layer update for ${name}`);
    }
  }

export function loadMap(ofp, kmlOptions, map, affine, affineAndClamp, affineOrDrop, mapOptions) {
    const options = {...kmlDefaultOptions, ...kmlOptions};
    const description = ofp.description;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = new editolido.Route(ofp.wptCoordinates(), {"name": routeName, "description": description});
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});

    addLine(map, 'greatcircle', greatCircle.points, affineOrDrop, options.greatCircleColor, options.greatCircleDisplay);
    addLine(map, 'ogimet', ofp.ogimetData.route.points, affineOrDrop, options.ogimetColor, options.ogimetDisplay);
    addLine(map, 'ralt', alternateRoute.points, affineOrDrop, options.alternateColor, options.alternateDisplay);
    addLine(map, 'rmain', route.points, affineOrDrop, options.routeColor, true);
    addPoints(map, 'ralt', alternateRoute.points, affineOrDrop, options.alternatePin, options.alternateDisplay, options.alternateColor);
    addPoints(map, 'rmain', route.points, affineOrDrop, options.routePin, true, options.routeColor);
    if (mapOptions.id !== 'jb_pacific') addFirReg(map, affineAndClamp);
    let epPoints = [];
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epPoints = [ofp.infos['EEP'], ofp.infos['EXP']];
    }
    addAirports(map, affineOrDrop, ofp.infos.aircraft, epPoints, ofp.infos['raltPoints'], options.etopsColor, options.airportPin, mapOptions.id.startsWith('jb_'));

    addTracks(map, ofp, affineOrDrop, options.natColor, options.natPin, options.natDisplay);
    //console.log(ofp.infos, ofp.text);
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0){
        addEtops(map, 'etops', [ofp.infos['EEP'], ofp.infos['EXP']].concat(ofp.infos['raltPoints']), affineOrDrop, affineAndClamp, true, ofp.infos['ETOPS'], options.routeColor, options.etopsColor);
    }
}
export const blankStyle = {
    "version": 8,
    "name": "Blank pour App",
    "metadata": {
        "mapbox:autocomposite": true,
        "mapbox:type": "template",
        "mapbox:sdk-support": {
            "js": "1.9.0",
            "android": "8.6.0",
            "ios": "5.6.0"
        },
        "mapbox:groups": {},
        "mapbox:uiParadigm": "layers"
    },
    "center": [0, 0],
    "zoom": 1.2946207284336362,
    "bearing": 0,
    "pitch": 0,
    "sources": {},
    "sprite": "mapbox://sprites/flyingeek/ckbhlmwdm0mn51imw8t4dddqs/ck2u8j60r58fu0sgyxrigm3cu",
    "glyphs": "mapbox://fonts/flyingeek/{fontstack}/{range}.pbf",
    "layers": [],
    "created": "2020-06-16T07:22:32.952Z",
    "id": "ckbhlmwdm0mn51imw8t4dddqs",
    "modified": "2020-06-16T07:23:29.539Z",
    "owner": "flyingeek",
    "visibility": "public",
    "draft": false
}