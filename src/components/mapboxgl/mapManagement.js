/* global mapboxgl */

import {clamp, isInside, lineclip, getBounds, throttle, focusMap, polygonclip} from '../utils';
import {loadMapLayers} from './layersManagement';
import {focusMode, sidebar, showPlaneOnMap, mapZoom} from '../../stores';
import times from './pj_times';
import eqearth from './pj_eqearth';
import {firMapIdCondition} from './layers/fir-reg';

export const token = 'MAPBOX_TOKEN';

export const key = {};

export const mapControlHTML = focusMode => (
    (focusMode)
    ? '<svg><use xlink:href="#single-layer-symbol"/></svg>'
    : '<svg><use xlink:href="#layers-symbol"/></svg>');

export function createMap(id, mapOptions, ofp, kmlOptions, aircraftType, onLoadCb, initialLoad=false) {
    if (!window.proj4.Proj.projections.get('times')) window.proj4.Proj.projections.add(times);
    if (!window.proj4.Proj.projections.get('eqearth')) window.proj4.Proj.projections.add(eqearth);
    const customAttribution = () => {
        const airportsAttribution = (!firMapIdCondition(mapOptions)) ? 'Airports/FIR © Olivier Ravet' : 'Airports © Olivier Ravet';
        if (mapOptions.copyright) return `© ${mapOptions.copyright} - ${airportsAttribution}`;
        if (mapOptions.id.startsWith('jb_') || mapOptions.id.startsWith('ed_')) {
            return `Yammer/QGIS & Avenza maps - ${airportsAttribution}`;
        } else{
            return `Yammer/Maps.me - ${airportsAttribution}`;
        }
    }
    let mapboxOptions = {
        'container':id,
        'center': [0, 49],
        'zoom': 2,
        'attributionControl': true,
        'customAttribution': customAttribution(),
        'trackResize': false //otherwise we have frozen map on reactivation (ios15)
    }
    const map = new mapboxgl.Map({...mapOptions.mapboxOptions, ...mapboxOptions});
    //map._setCacheLimits(320, 32);
    map.loadImage('sdf/maki-camera-sdf.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('sdf-camera', image, { pixelRatio: 2, sdf: true});
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
    map.loadImage('images/stripe-orange.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('stripe-orange', image, { pixelRatio: 2, sdf: true});
        }
    });
    map.loadImage('images/stripe-red.png', function(error, image) {
        if (error) {
            console.log(error);
        } else {
            map.addImage('stripe-red', image, { pixelRatio: 2, sdf: true});
        }
    });
    // map.showTileBoundaries = true;
    // definitions from epsg.io
    //https://epsg.io/4326
    window.proj4.defs('WGS84', "+proj=longlat +datum=WGS84");
    //https://epsg.io/3857
    window.proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
    let affine, affineAndClamp, affineOrDrop;
    const optionalAnteMeridianSplitter = (data) => {
      if (data.length === 0) return [];
      let lines = [];
      if (mapOptions.allow180Crossing) {
        lines = [data];
      } else {
        let subline = [];
        for (let i = 0; i < data.length; i++) {
          const diffLng = (i > 0) ? data[i].longitude - data[i - 1].longitude : 0;
          if (Math.abs(diffLng) > 180) { // cross 180 boundary => new segment
            if (subline.length) lines.push(subline);
            subline = [data[i]];
          } else {
            subline.push(data[i]);
          }
        }
        if (subline.length) lines.push(subline);
      }
      return lines.map(l => l.map(g => [g.longitude, g.latitude]));
    }
    let affineAndClip = optionalAnteMeridianSplitter;
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
                const mercatorWidth = mercatorBounds[2] - mercatorBounds[0];
                const [w, h] = mapOptions.ratio;
                if (w > h) {
                    const dy = (h / w) * mercatorHeight;
                    [u0, v0, u1, v1] = [mercatorBounds[0], mercatorBounds[3] - dy, mercatorBounds[2],  mercatorBounds[3]];
                } else if (h > w) {
                    const dx = (w / h) * mercatorWidth;
                    [u0, v0, u1, v1] = [mercatorBounds[0], mercatorBounds[1], mercatorBounds[0] + dx,  mercatorBounds[3]];
                }
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
        affineAndClip = (data, geometry) => {
            if (data.length === 0) return [];
            let lines = optionalAnteMeridianSplitter(data);
            const results = [];
            for (let i = 0; i < lines.length; i++) {
              const points = lines[i].map(customXY);
              let sublines;
              if (geometry === 'polygon') {
                sublines = [polygonclip(points, mapOptions.extent)];
              }else{
                sublines = lineclip(points, mapOptions.extent);
              }
              results.push(sublines.map(l => l.map(XY => customXY2wgs84(XY))));
            }
            return results.flat();
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
    const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: false
        },
        fitBoundsOptions: {maxZoom: 3},
        trackUserLocation: true
    });
    if (affine) {
        const originalOnSuccess = geolocateControl._onSuccess;
        geolocateControl._onSuccess = function(position) {
            const [lng, lat] = affine([position.coords.longitude, position.coords.latitude]);
            return originalOnSuccess.apply(this, [{'coords': {'longitude': lng, 'latitude': lat, 'accuracy': position.coords.accuracy}}]);
        }
    }

    const mapData = {map, affine, affineAndClamp, affineAndClip, affineOrDrop, bbox, mapOptions, geolocate: geolocateControl, initialLoad};

    class LayersControl {
        onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl  mapboxgl-ctrl-group';
        this._button = document.createElement('button');
        this._button.className = 'mapboxgl-ctrl-layers';
        this._button.setAttribute('type', "button");
        this._button.setAttribute('title', "Personnaliser la carte");
        this._focusModeUnsubscribe = focusMode.subscribe($focusMode => this._button.innerHTML = mapControlHTML($focusMode));
        this._container.appendChild(this._button);
        this._toggleSidebar = () => sidebar.update((value) => !value);
        this._button.addEventListener('click', this._toggleSidebar);
        return this._container;
        }
        onRemove() {
        this._button.removeEventListener('click', this._toggleSidebar);
        this._focusModeUnsubscribe();
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
        }
    }
    map.addControl(new(LayersControl));
    map.addControl(geolocateControl);
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
    //patch for logitech combo touch azerty
    const patchKeyboard = (e) => {
        let patchEvent;
        if(e.keyCode === 187 && (e.key === '-' || e.key === '_')) {
            e.preventDefault();
            e.stopPropagation();
            patchEvent = new KeyboardEvent('keydown', {
                location: e.location,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                altKey: e.altKey,
                metaKey: e.metaKey,
                repeat: e.repeat,
                isComposing: e.isComposing,
                charCode: e.charCode,
                key: e.key,
                code: e.code,
                bubbles: true,
                keyCode: 189,
                which: 189
            });
            map.getCanvas().dispatchEvent(patchEvent);
            console.log('patched event keycode 187 -> 189');
        }
    };
    const hidePlane = () => showPlaneOnMap.set(false);
    const storeZoom = throttle(e => mapZoom.set(Math.floor( ( e.target.getZoom() + Number.EPSILON ) * 10 ) / 10), 100);
    const geolocateControlElt = document.querySelector('.mapboxgl-ctrl-geolocate');
    map.on('load', function() {

        loadMapLayers({
            ofp,
            kmlOptions,
            mapData,
            map,
            mapOptions,
            aircraftType
        });
        if (geolocateControlElt) geolocateControlElt.addEventListener('click', focusMap);
        geolocateControl.on('trackuserlocationstart', hidePlane);

        // if (ofp) addToSWCache([ofp.ogimetData.proxyImg], 'lido-gramet2');
        //fetch(ofp.ogimetData.proxyImg); // add to cache
        if (onLoadCb) onLoadCb(map, mapOptions);
        // eslint-disable-next-line no-constant-condition
        if ('process.env.NODE_ENV' === '"development"') {
            document.addEventListener('keydown', handleKeydown);
        }
        map.on('zoom', storeZoom);
        mapZoom.set(map.getZoom());
        map.getCanvasContainer().addEventListener('keydown', patchKeyboard, {capture: true});
        //map.getCanvas().focus(); //we do not give focus here because the nat entry point might be focused on the close button
    });

    map.on('remove', function() {
        if (geolocateControlElt) geolocateControlElt.removeEventListener('click', focusMap);
        geolocateControl.off('trackuserlocationstart', hidePlane);
        // eslint-disable-next-line no-constant-condition
        if ('process.env.NODE_ENV' === '"development"') document.removeEventListener('keydown', handleKeydown);
        map.off('zoom', storeZoom);
        map.getCanvasContainer().removeEventListener('keydown', patchKeyboard);
    });

    return mapData;
}
