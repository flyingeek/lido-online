/* global mapboxgl */

import {clamp, isInside, lineclip, getBounds} from '../utils';
import {loadMapLayers} from './layersManagement';
import {sidebar} from '../../stores';
import times from './pj_times';
import eqearth from './pj_eqearth';

export const token = 'MAPBOX_TOKEN';

export const key = {};

export function createMap(id, mapOptions, ofp, kmlOptions, aircraftType, onLoadCb, initialLoad=false) {
    if (!window.proj4.Proj.projections.get('times')) window.proj4.Proj.projections.add(times);
    if (!window.proj4.Proj.projections.get('eqearth')) window.proj4.Proj.projections.add(eqearth);
    const customAttribution = () => {
        const airportsAttribution = 'Airports/FIR © Olivier Ravet';
        if (mapOptions.id.startsWith('ed_eqe')) {
            return `© equal-earth.com - ${airportsAttribution}`;
        } else if (mapOptions.id.startsWith('jb_') || mapOptions.id.startsWith('ed_')) {
            return `Yammer/QGIS & Avenza maps - ${airportsAttribution}`;
        } else if (mapOptions.id.startsWith('vb_')) {
            return `© ${window.atob("Q2FydGFCb3NzeQ==")}.com - Airports © Olivier Ravet`;
        } else{
            return `Yammer/Maps.me - ${airportsAttribution}`;
        }
    }
    let mapboxOptions = {
        'container':id,
        'center': [0, 49],
        'zoom': 2,
        'attributionControl': true,
        'customAttribution': customAttribution()
    }
    const map = new mapboxgl.Map({...mapOptions.mapboxOptions, ...mapboxOptions});
    map._setCacheLimits(320, 32);
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
    // definitions from epsg.io
    //https://epsg.io/4326
    window.proj4.defs('WGS84', "+proj=longlat +datum=WGS84");
    //https://epsg.io/3857
    window.proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
    let affine, affineAndClamp, affineOrDrop, affineAndClip;
    let affine2xy = (lngLat) => window.proj4('WGS84', 'EPSG:3857', lngLat);
    let xy2wgs84 = (xy) => window.proj4('EPSG:3857', 'WGS84', xy);
    let reverseLngLat = (lngLat) => window.proj4('EPSG:3857', 'WGS84', window.proj4('WGS84', 'EPSG:3857', lngLat));
    if (mapOptions.extent) {
        window.proj4.defs('CUSTOM', mapOptions.proj4);
        let a, b, c, d;
        if (mapOptions.affineTransform) {
            [a, b, c, d] = mapOptions.affineTransform;
        }else{
            const mercatorBounds = [-20026376.39, -20048966.10, 20026376.39, 20048966.10]; //EPSG:3857 bounds
            const [x0, y0, x1, y1] = mapOptions.extent;
            let [u0, v0, u1, v1] = mercatorBounds;
            if (mapOptions.ratio) { /* this is not exact, still in progress */
                const mercatorHeight = mercatorBounds[3] - mercatorBounds[1];
                const [w, h] = mapOptions.ratio;
                const dy = (h / w) * mercatorHeight;
                [u0, v0, u1, v1] = [mercatorBounds[0], mercatorBounds[3] - dy, mercatorBounds[2],  mercatorBounds[3]];
            }
            a = (u1 - u0) / (x1 - x0);
            b = u0 - (a * x0);
            c = (v1 - v0) / (y1 - y0);
            d = v0 - (c * y0);
            //console.log(a,b,c,d)
        }
        const [minX, minY, maxX, maxY] = (mapOptions.viewport) ? mapOptions.viewport : mapOptions.extent;
        const customXY = (lngLat) => window.proj4('WGS84', 'CUSTOM', lngLat);
        const xy2customXY = ([x, y]) => [(x - b) / a, (y - d) / c];
        const customXY2xy = (XY) => [(a * XY[0]) + b, (c * XY[1]) + d];
        const customXY2wgs84 = (XY) => {/*console.log('XY2xy', customXY2xy(XY)); */return xy2wgs84(customXY2xy(XY));}
        reverseLngLat = (lngLat) => window.proj4('CUSTOM', 'WGS84', xy2customXY(window.proj4('WGS84', 'EPSG:3857', lngLat)));
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
    if (ofp) {
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

    const mapData = {map, affine, affineAndClamp, affineAndClip, affineOrDrop, bbox, mapOptions, geolocate, initialLoad};

    class LayersControl {
        onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl  mapboxgl-ctrl-group';
        this._button = document.createElement('button');
        this._button.className = 'mapboxgl-ctrl-layers';
        this._button.setAttribute('type', "button");
        this._button.setAttribute('title', "Personnaliser la carte");
        this._button.innerHTML = `<svg><use xlink:href="#layers-symbol"/></svg>`;
        this._container.appendChild(this._button);
        this._toggleSidebar = () => sidebar.update((value) => !value);
        this._button.addEventListener('click', this._toggleSidebar);
        return this._container;
        }
        onRemove() {
        this._button.removeEventListener('click', this._toggleSidebar);
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
        }
    }
    map.addControl(new(LayersControl));
    map.addControl(geolocate);
    let calibrateMode = false;
    let calibrateData = [];
    const calibrate = (e) => {
        console.log(reverseLngLat([e.lngLat.lng, e.lngLat.lat]));
        const expectedLngLat = reverseLngLat([e.lngLat.lng, e.lngLat.lat]).map(v => Math.round(v));
        const [X, Y] = window.proj4('WGS84', 'CUSTOM', expectedLngLat);
        const [x, y] = window.proj4('WGS84', 'EPSG:3857', [e.lngLat.lng, e.lngLat.lat]);
        // x1 = aX1+b
        // y1 = cY1+d
        // x2 = aX2+b
        // y2 = cY2+d
        calibrateData.push([X, Y, x, y]);
        console.log(`point${calibrateData.length}: ${expectedLngLat}`);
        if (calibrateData.length === 2) {
            const [X1, Y1, x1, y1] = calibrateData[0];
            const [X2, Y2, x2, y2] = calibrateData[1];
            const a = (x1 - x2)/(X1 - X2);
            const b = x1 - (a * X1);
            const c = (y1 - y2)/(Y1 - Y2);
            const d = y1 - (c * Y1);
            console.log({a, b, c, d});
            calibrateData = [];
        }
    };
    const handleKeydown = (event) => {
        if (event.ctrlKey) {
            calibrateMode = !calibrateMode;
            map.getCanvasContainer().style.cursor = (calibrateMode) ? "crosshair" : "grab";
            calibrateData = [];
            if (calibrateMode) {
                map.on('click', calibrate);
            } else {
                map.off('click', calibrate);
            }
        }
        
    };
    map.on('load', function() {

        loadMapLayers({
            ofp,
            kmlOptions,
            mapData,
            map,
            mapOptions,
            aircraftType
        });

        // if (ofp) addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet2');
        //fetch(ofp.ogimetData.proxyImg); // add to cache
        if (onLoadCb) onLoadCb(map, mapOptions);
        // eslint-disable-next-line no-constant-condition
        if ('process.env.NODE_ENV' === '"development"') {
            document.addEventListener('keydown', handleKeydown);
            console.log(`map initial zoom: ${map.getZoom()}`);
        }
    });
    map.on('remove', function() {
        // eslint-disable-next-line no-constant-condition
        if ('process.env.NODE_ENV' === '"development"') document.removeEventListener('keydown', handleKeydown);
    });
    // map.on('zoom', function() {
    //     console.log(map.getZoom());
    // });
    return mapData;
}
