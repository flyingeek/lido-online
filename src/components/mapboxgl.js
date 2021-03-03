/* global editolido mapboxgl */

import {kml2mapColor} from "./KmlColor.svelte";
import {folderName, getBounds} from './utils';
import { kmlDefaultOptions } from "./kml";
import { addAirports, changeAirportDisplay, changeAirportStyle, changeAircraftType } from "./mapboxgl/airports";
import { addFirReg, changeFirDisplay } from "./mapboxgl/fir-reg";
import { addEtops, changeEPCircleColor, changeETOPSCircleColor, changeETOPSDisplay } from "./mapboxgl/etops";
import { addTracks } from "./mapboxgl/tracks";
import {pinColors, addLine, addPoints} from "./mapboxgl/layers";
import {clamp, isInside, addToSWCache, lineclip} from './utils';
import times from './mapboxgl/pj_times';

//import proj4 from 'proj4';

export const token = 'MAPBOX_TOKEN';

export const key = {};

export function createMap(id, mapOptions, ofp, kmlOptions, aircraftSelect) {
    if (!window.proj4.Proj.projections.get('times')) window.proj4.Proj.projections.add(times);
    const isAvenza = mapOptions.id.startsWith('jb_');
    let mapboxOptions = {
        'container':id,
        'center': [0, 49],
        'zoom': 2,
        'attributionControl': true,
        'customAttribution': `Yammer/${(isAvenza) ? 'QGIS & Avenza maps': 'Maps.me'} - Airports/FIR © Olivier Ravet`
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
    window.proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
    window.proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
    let affine, affineAndClamp, affineOrDrop, affineAndClip;
    let affine2xy = (lngLat) => window.proj4('WGS84', 'EPSG:3857', lngLat);
    let xy2wgs84 = (xy) => window.proj4('EPSG:3857', 'WGS84', xy);
    if (mapOptions.extent) {
        window.proj4.defs('CUSTOM', mapOptions.proj4);
        let a, b, c, d;
        if (mapOptions.affineTransform) {
            [a, b, c, d] = mapOptions.affineTransform;
        } else if (mapOptions.ratio) { /* this is not exact, still in progress */
            const mercatorBounds = [-20026376.39, -20048966.10, 20026376.39, 20048966.10];
            const mercatorWidth = mercatorBounds[2] - mercatorBounds[0];
            const mercatorHeight = mercatorBounds[3] - mercatorBounds[1];
            const [x0, y0, x1, y1] = mapOptions.extent;
            const [w, h] = mapOptions.ratio;
            const dx = mercatorWidth / w;
            const dy = dx * h * (mercatorHeight/mercatorWidth);
            const [u0, v0, u1, v1] = [mercatorBounds[0], mercatorBounds[3] - dy, mercatorBounds[2],  mercatorBounds[3]];
            a = (u1 - u0) / (x1 -x0);
            b = u0 - (a * x0);
            c = (v1 - v0) / (y1 - y0);
            d = v0 - (c * y0);
            //console.log(a,b,c,d)
        } else {
            const [x0, y0, x1, y1] = mapOptions.extent;
            const [u0, v0, u1, v1] = [-20026376.39, -20048966.10, 20026376.39, 20048966.10];
            a = (u1 - u0) / (x1 -x0);
            b = u0 - (a * x0);
            c = (v1 - v0) / (y1 - y0);
            d = v0 - (c * y0);
            //console.log(a,b,c,d)
        }
        const [minX, minY, maxX, maxY] = (mapOptions.viewport) ? mapOptions.viewport : mapOptions.extent;
        const customXY = (lngLat) => window.proj4('WGS84', 'CUSTOM', lngLat);
        const customXY2xy = (XY) => [(a * XY[0]) + b, (c * XY[1]) + d];
        const customXY2wgs84 = (XY) => {/*console.log('XY2xy', customXY2xy(XY)); */return xy2wgs84(customXY2xy(XY));}
        affine2xy = (lngLat) => {
            return customXY2xy(customXY(lngLat));
        }
        affine = (lngLat) => {
            return xy2wgs84(affine2xy(lngLat))
        }
        affineAndClamp = (lngLat) => {
            let [X, Y] = customXY(lngLat);
            X = clamp(X, minX, maxX);
            Y = clamp(Y, minY, maxY);
            return customXY2wgs84([X, Y]);
        }
        affineOrDrop = (lngLat) => {
            let [X, Y] = customXY(lngLat);
            if (isInside(X, minX, maxX) && isInside(Y, minY, maxY)) {
                return customXY2wgs84([X, Y]);
            }
        }
        affineAndClip = (data) => {
            if (data.length === 0) return [];
            const points = data.map(g => customXY([g.longitude, g.latitude]));
            return lineclip(points, mapOptions.extent).map(l => l.map(XY => customXY2wgs84(XY)));
        }
    }
    let bbox = undefined;
    let points = [];
    if (!ofp.isFake) {
        for (const track of ofp.tracks) {
            points = points.concat(track.points);
        }
        points = points.concat(ofp.route.points, ofp.wptCoordinatesAlternate());
        bbox = getBounds(points, affineAndClamp);

        map.fitBounds(bbox, {padding: {top: 30, bottom:80, left: 30, right: 30}});
    }
    //map.addControl(new mapboxgl.FullscreenControl());
    const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: false
        },
        fitBoundsOptions: {maxZoom: 3},
        trackUserLocation: true
    });
    if (affine) {
        const originalOnSuccess = geolocate._onSuccess;
        geolocate._onSuccess = function(position) {
            const [lng, lat] = affine([position.coords.longitude, position.coords.latitude]);
            return originalOnSuccess.apply(this, [{'coords': {'longitude': lng, 'latitude': lat, 'accuracy': position.coords.accuracy}}]);
        }
    }
    map.addControl(geolocate);
    map.affineAndClamp = affineAndClamp;
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
        loadMap(ofp, kmlOptions, map, affine, affineAndClamp, affineOrDrop, affineAndClip, mapOptions);
        const attribution = document.querySelector(`#${id} .mapboxgl-ctrl-attrib-inner`);
        if (attribution) {
            attribution.appendChild(document.createTextNode(' | '));
            attribution.appendChild(aircraftSelect);
            attribution.appendChild(document.createTextNode(`${"CONF_AIRAC".substring(0,2)}.${"CONF_AIRAC".substring(2,4)}`));
        }
        if (!ofp.isFake) addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet2');
        //fetch(ofp.ogimetData.proxyImg); // add to cache
    });
    // map.on('zoom', function() {
    //     console.log(map.getZoom());
    // });
    // map.on('click', function(e) {
    //     e.lngLat.wrap();
    //     console.log(e.lngLat.wrap());
    // });
    return map;
}

export function changeLayerState(map, folder, value) {
    if (folder === 'etops') {
        return changeETOPSDisplay(map, value);
    }else if (folder === 'fir') {
        return changeFirDisplay(map, value);
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
    if (map.getLayer(markerLayer)) {
        const lineColor = map.getPaintProperty(lineLayer, 'line-color');
        map.setPaintProperty(markerLayer, 'icon-color', (selectedPin !== 0) ? hexcolor : lineColor);
        map.setPaintProperty(markerLayer, 'text-color', lineColor);
        map.setLayoutProperty(markerLayer, 'icon-size', (selectedPin !== 0) ? 1 : 0.2);
        map.setLayoutProperty(markerLayer, 'icon-image', (selectedPin !== 0) ? 'sdf-marker-15' : 'sdf-triangle');
        map.setLayoutProperty(markerLayer, 'icon-anchor', (selectedPin !== 0) ? 'bottom' : 'center');
    }
}

export function updateMapLayers(map, name, value, ofp, kmlOptions, aircraftType) {
    const folder = folderName(name);
    if (name === 'aircraftType') {
        let epNames = [];
        if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
            epNames = [ofp.infos['EEP'].name, ofp.infos['EXP'].name];
        }
        changeAircraftType(map, kmlOptions.airportPin, aircraftType, ofp.infos.ralts, epNames.concat(ofp.infos.ralts), kmlOptions.etopsColor);
    }else if (name.endsWith('-display')) {
        if (folder === 'rnat') {
            changeLayerState(map, 'rnat-incomplete', value); // we must turn both rnat & rnat-incomplete
        }
        changeLayerState(map, folder, value);
    }else if (name.endsWith('-pin')) {
        changeMarkerLayer(map, folder, value, aircraftType, ofp.infos.ralts, kmlOptions.etopsColor);
    }else if (name.endsWith('-color')) {
        changeLineLayer(map, folder, value);
    }else{
        console.error(`ignoring map layer update for ${name}`);
    }
  }

export function loadMap(ofp, kmlOptions, map, affine, affineAndClamp, affineOrDrop, affineAndClip, mapOptions) {
    const options = {...kmlDefaultOptions, ...kmlOptions};
    const description = ofp.description;
    if (! ofp.isFake) {
        const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
        const route = new editolido.Route(ofp.wptCoordinates(), {"name": routeName, "description": description});
        const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
        const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
        addLine(map, 'greatcircle', greatCircle.points, affineAndClip, options.greatCircleColor, options.greatCircleDisplay);
        addLine(map, 'ogimet', ofp.ogimetData.route.points, affineAndClip, options.ogimetColor, options.ogimetDisplay);
        addLine(map, 'ralt', alternateRoute.points, affineAndClip, options.alternateColor, options.alternateDisplay);
        addLine(map, 'rmain', route.points, affineAndClip, options.routeColor, true);
        addPoints(map, 'ralt', alternateRoute.points, affineOrDrop, options.alternatePin, options.alternateDisplay, options.alternateColor);
        addPoints(map, 'rmain', route.points, affineOrDrop, options.routePin, true, options.routeColor);
    }
    if (mapOptions.id !== 'jb_pacific') addFirReg(map, affine, options.firDisplay);
    let epPoints = [];
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        epPoints = [ofp.infos['EEP'], ofp.infos['EXP']];
    }
    addAirports(map, affineOrDrop, (ofp.isFake) ? ofp.isFake : ofp.infos.aircraft, epPoints, ofp.infos['raltPoints'], options.etopsColor, options.airportPin, options.airportDisplay);
    if(!ofp.isFake) {
        addTracks(map, ofp, affineOrDrop, affineAndClip, options.natColor, options.natPin, options.natDisplay);
        //console.log(ofp.infos, ofp.text);
        if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0){
            addEtops(map, 'etops', [ofp.infos['EEP'], ofp.infos['EXP']].concat(ofp.infos['raltPoints']), affineAndClip, options.etopsDisplay, ofp.infos['ETOPS'], options.routeColor, options.etopsColor);
        }
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