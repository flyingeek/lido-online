/* global mapboxgl, editolido */
import {jsonPoint, jsonLine, featureCollection} from '../json.js';
import {lineLayer, markerLayer, changeMarkerGeneric, changeLineGeneric, changeDisplayGeneric, computeIconTextSize, computeLineWidthSize, computeIconSize, getIconSizeExpression, getTextKmlColorExpression, getOpacityKmlColorExpression} from '../utils';
import {takeOffTime} from "../../../stores";

const folder = 'rnat';
const lineWidthTracks = 1;
const minTextOpacityTracks = 0.9;

const rnatLabelLayer = (id, kmlcolor, visibility, textSize) => {
    return {
        'id': `${id}-marker-layer`,
        'type': 'symbol',
        'source': `${id.replace('-labels', '')}-line-source`,
        'layout': {
            'visibility': ( visibility) ? 'visible' : 'none',
            'text-field': ['get', 'title'],
            'text-size': textSize,
            'text-offset': [0, -0.1],
            'text-anchor': 'bottom',
            'text-ignore-placement': true,
            'text-allow-overlap': true,
            'symbol-placement': 'line-center'
        },
        'paint': {
            'text-halo-color': '#000',
            'text-color': getTextKmlColorExpression(kmlcolor),
            'text-opacity': getOpacityKmlColorExpression(kmlcolor, null, minTextOpacityTracks)
        }
    };
};
export function addTracks(data) {
    const {map, ofp, mapData, kmlOptions} = data;
    if (!ofp) return;
    const {affineOrDrop, affineAndClip} = mapData;
    const affine = affineOrDrop;
    const affineLine = affineAndClip;
    const kmlcolor = kmlOptions.natColor;
    const selectedPin = kmlOptions.natPin;
    const visibility = kmlOptions.natDisplay;

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
        const natLetter = track.name.slice(-1);
        const natDirection = track.infos.direction;
        const natLabel = (natDirection === 'WEST') ? `<\u2009${natLetter}` : (natDirection === 'EAST') ? `${natLetter}\u2009>` : natLetter;
        if (affineLine) {
            const sublines = affineLine(track.points);
            const sublen = sublines.length;
            for (let i=0; i<sublen;i++){
                lines[folder].push(jsonLine(sublines[i], {title: natLabel}));
            }
        }else{
            lines[folder].push(jsonLine(track.points.map(g => [g.longitude, g.latitude]), {title: track.name.slice(-1)}))
        }
        const firstPoint = track.points[0];
        let lngLat = (affine) ? affine([firstPoint.longitude, firstPoint.latitude]) : [firstPoint.longitude, firstPoint.latitude];
        if (lngLat) markers[folder].push(jsonPoint(lngLat, {
            title: `${(track.isMine) ? track.name + '\n' : ''}${firstPoint.name}`,
            description: track.description,
            track: track.name,
            point: firstPoint.name,
            isMine: track.isMine,
            overrideTextColor: (track.isMine) ? 1 : 0
        }));
        const lastPoint = track.points[track.points.length - 1];
        lngLat = (affine) ? affine([lastPoint.longitude, lastPoint.latitude]) : [lastPoint.longitude, lastPoint.latitude];
        if (lngLat) markers[folder].push(jsonPoint(lngLat,{
            title: `${(track.isMine) ? track.name + '\n' : ''}${lastPoint.name}`,
            description:  track.description,
            track: track.name,
            point: lastPoint.name,
            isMine: track.isMine,
            noPin: 1,
            overrideTextColor: (track.isMine) ? 1 : 0
        }));
    }
    map.addSource(`rnat-marker-source`, featureCollection(markers['rnat']));
    map.addSource(`rnat-incomplete-marker-source`, featureCollection(markers['rnat-incomplete']));
    map.addSource(`rnat-line-source`, featureCollection(lines['rnat']));
    map.addSource(`rnat-incomplete-line-source`, featureCollection(lines['rnat-incomplete']));
    const textSize = computeIconTextSize(kmlOptions[`iconTextChange`]);
    const lineWidth = computeLineWidthSize(kmlOptions[`lineWidthChange`], lineWidthTracks);
    const iconSize = computeIconSize(kmlOptions[`iconSizeChange`]);
    map.addLayer(lineLayer('rnat', kmlcolor, visibility, lineWidth));
    map.addLayer(lineLayer('rnat-incomplete', kmlOptions.natIncompleteColor, visibility, lineWidth));
    map.addLayer(markerLayer("rnat", selectedPin, kmlcolor, visibility, textSize, iconSize));
    changeMyTrackLabels(data); // text-color & text-opacity for entry/exit point
    map.addLayer(markerLayer("rnat-incomplete", selectedPin, kmlcolor, visibility, textSize, iconSize));
    map.addLayer(rnatLabelLayer('rnat-labels', kmlcolor, visibility, textSize));
    map.addLayer(rnatLabelLayer('rnat-incomplete-labels', kmlOptions.natIncompleteColor, visibility, textSize));

    const popup = (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        const props = e.features[0].properties;
        const trackPopup = new mapboxgl.Popup()
            .setLngLat(coordinates)
            .addTo(map);
        const unsubscribe = takeOffTime.subscribe($takeOffTime => {
            let description = props.description.replace(props.point, `<b>${props.point}</b>`);
            let entry = [undefined, undefined, undefined];
            if (props.isMine) entry = ofp.timeMatrix.filter(([p,]) => editolido.isARINC(props.point) ? editolido.arinc_normalizer(props.point).asDM === p.name: props.point === p.name).pop() || entry;
            const [, eet, fl] = entry;
            if (fl) description = description.replace(` ${fl} `, ` <b>${fl}</b> `);
            const eto = (eet && $takeOffTime) ? ' - ETO: ' + (new Date($takeOffTime.getTime() + 60000 * eet)).toISOString().substring(11,16) + 'z' : '';
            let html = `<div class="track"><h1>${props.track}${eto}${(fl) ? ' FL' + fl: ''}</h1><p>${description}</p>`;
            trackPopup.setHTML(html);
        })
        trackPopup.on('close', () => {
            unsubscribe();
        });
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
    const addEntryPointPopup = () => {
        const myTrack = ofp.tracks.filter(t => t.isMine).pop();
        if (myTrack && myTrack.points.length > 0) {
            const entryPoint = myTrack.points[0];
            const affine = mapData.affineOrDrop;
            const lngLat = (affine) ? affine([entryPoint.longitude, entryPoint.latitude]) : [entryPoint.longitude, entryPoint.latitude];
            if (lngLat) {
                const [longitude, latitude] = lngLat;
                const popupData = {
                    lngLat:{
                        "lng": longitude,
                        "lat": latitude
                    },
                    features: [
                        {
                            "properties": {
                                "track": myTrack.name,
                                "point": entryPoint.name,
                                "isMine": true,
                                "description": myTrack.description
                            },
                            "geometry": {
                                'coordinates': [longitude, latitude]
                            }
                        }
                    ]
                };
                popup(popupData);
            }
        }
    };
    if (mapData.initialLoad) addEntryPointPopup();
}
function changeIconText(data){
    const {map, value} = data;
    const textSize = computeIconTextSize(value);
    ['rnat-marker-layer', 'rnat-incomplete-marker-layer', 'rnat-labels-marker-layer', 'rnat-incomplete-labels-marker-layer'].forEach(layer => {
        if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'text-size', textSize);
        }
    });
    return true; // allows chaining
}
function changeLineWidth(data){
    const {map, value} = data;
    const lineWidth = computeLineWidthSize(value, lineWidthTracks);
    ['rnat-line-layer', 'rnat-incomplete-line-layer'].forEach(layer => {
        if (map.getLayer(layer)) {
            map.setPaintProperty(layer, 'line-width', lineWidth);
        }

    });
    return true; // allows chaining
}
function changeIconSize(data){
    const {map, value, kmlOptions} = data;
    const selectedPin = kmlOptions[`natPin`];
    const expression = getIconSizeExpression(selectedPin, computeIconSize(value));
    ['rnat-marker-layer', 'rnat-incomplete-marker-layer'].forEach(layer => {
        if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'icon-size', expression);
        }

    });
    return true; // allows chaining
}
function changeLine(data){
    changeLineGeneric(folder, data) && changeLineGeneric('rnat-labels', data);
    changeMyTrackLabels(data);
    return true; // allows chaining
}
function changeMarker(data){
    changeMarkerGeneric(folder, data);
    changeMyTrackLabels(data);
    return true; // allows chaining
}
export function changeMyTrackLabels(data) {
    const {map, kmlOptions} = data;
    const markerLayer = `rnat-marker-layer`;
    if (map.getLayer(markerLayer)) {
        map.setPaintProperty(markerLayer, 'text-color', getTextKmlColorExpression(kmlOptions["natColor"], kmlOptions["routeColor"]));
        map.setPaintProperty(markerLayer, 'text-opacity', getOpacityKmlColorExpression(kmlOptions["natColor"], kmlOptions["routeColor"], minTextOpacityTracks));
    }
    return true; // allows chaining
}
export default {
    show: (data) => [folder, 'rnat-incomplete', 'rnat-labels', 'rnat-incomplete-labels'].forEach(folder => changeDisplayGeneric(folder, true, data)),
    hide: (data) => [folder, 'rnat-incomplete', 'rnat-labels', 'rnat-incomplete-labels'].forEach(folder => changeDisplayGeneric(folder, false, data)),
    add: addTracks,
    changeLine,
    changeMarker,
    changeIconText,
    changeLineWidth,
    changeIconSize
}