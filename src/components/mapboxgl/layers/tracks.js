/* global mapboxgl, editolido */
import {jsonPoint, jsonLine, featureCollection} from '../json.js';
import {lineLayer, markerLayer, changeLineWidthGeneric, changeLineGeneric, changeDisplayGeneric, computeIconTextSize, computeLineWidthSize, computeIconSize, getTextKmlColorExpression, getOpacityKmlColorExpression, changeIconSizeGeneric, changeIconTextGeneric, interpolateTextSize, getContrastColor, haloTextBlur, haloTextWidth} from '../utils';
import {takeOffTime} from "../../../stores";

const folder = 'rnat';
const lineWidthTracks = 1;
const minTextOpacityTracks = 0.9;

const rnatLabelLayer = (id, kmlcolor, visibility, textSize, minZoom, maxZoom) => {
    return {
        'id': `${id}-marker-layer`,
        'type': 'symbol',
        'source': `${id.replace('-labels', '')}-line-source`,
        'layout': {
            'visibility': ( visibility) ? 'visible' : 'none',
            'text-field': ['get', 'title'],
            'text-size': interpolateTextSize(textSize, minZoom, maxZoom),
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
function addTracks(data) {
    const {map, ofp, mapData, kmlOptions, mapOptions} = data;
    if (!ofp) return;
    const {affineOrDrop, affineAndClip} = mapData;
    const affine = affineOrDrop;
    const affineLine = affineAndClip;
    const kmlcolor = kmlOptions.natColor;
    const visibility = kmlOptions.natDisplay;
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;

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
            direction: natDirection,
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
            direction: natDirection,
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
    map.addLayer(markerLayer("rnat", kmlcolor, visibility, textSize, iconSize, minZoom, maxZoom));
    changeMyTrackLabels(data); // text-color & text-opacity for entry/exit point
    map.setLayoutProperty("rnat-marker-layer", 'symbol-sort-key', ["case", ["==", 1, ["get", "overrideTextColor"]], 0, 1]);
    map.addLayer(markerLayer("rnat-incomplete", kmlcolor, visibility, textSize, iconSize, minZoom, maxZoom));
    map.addLayer(rnatLabelLayer('rnat-labels', kmlcolor, visibility, textSize, minZoom, maxZoom));
    map.addLayer(rnatLabelLayer('rnat-incomplete-labels', kmlOptions.natIncompleteColor, visibility, textSize, minZoom, maxZoom));

    const popup = (e, {closeButton=true, focusAfterOpen=false, closeOnMove=true}={}) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        const props = e.features[0].properties; // WARNING properties created above or in addEntryPointPopup below
        //console.log(props);
        let trackPopup = new mapboxgl.Popup({closeButton, focusAfterOpen, closeOnMove});
        trackPopup.setLngLat(coordinates);
        const unsubscribe = takeOffTime.subscribe($takeOffTime => {
            let description = props.description.replace(props.point, `<b>${props.point}</b>`);
            let entry = [undefined, undefined, undefined];
            if (props.isMine) entry = ofp.timeMatrix.filter(([p,]) => editolido.isARINC(props.point) ? editolido.arinc_normalizer(props.point).asDM === p.name: props.point === p.name).pop() || entry;
            const [, eet, fl] = entry;
            let flInTitle = (fl) ? ` - FL${fl}` : '';
            const direction = (props.direction === 'WEST') ? 'WB' : (props.direction === 'EAST') ? 'EB' : '';
            if (fl) {
                if (direction) {
                    const pattern = new RegExp(String.raw`(LVLS ${direction})([\d\s]*)( ${fl} )`, "u");
                    const highlighted = description.replace(pattern, "<strong>$1</strong>$2<strong><b>$3</b></strong>");
                    if (description != highlighted) {
                        description = highlighted;
                    }else{
                        description = description.replace(`LVLS ${direction}`, `<strong class="error">LVLS ${direction}</strong>`);
                    }
                }
            }
            const eto = (eet && $takeOffTime) ? ' - ETO: ' + (new Date($takeOffTime.getTime() + 60000 * eet)).toISOString().substring(11,16) + 'z' : '';
            let html = `<div class="track"><h1>${props.track}${eto}${flInTitle}</h1><p>${description}</p>`;
            trackPopup.setHTML(html);
        });
        const closePopup = () => {
            unsubscribe();
            if (trackPopup) trackPopup.off('close', closePopup);
            trackPopup = undefined;
            map.getCanvas().focus();
        };
        trackPopup.on('close', closePopup);
        return trackPopup.addTo(map);
    };
    let trackPopup;
    for (const layer of ['rnat-marker-layer', 'rnat-incomplete-marker-layer']) {
        map.on('click', layer, function(e) {
            if (trackPopup) trackPopup.remove();
            trackPopup = popup(e, {closeOnMove: false});
        });
        map.on('mouseenter', layer, function(e) {
            map.getCanvas().style.cursor = 'pointer';
            if (trackPopup) trackPopup.remove();
            trackPopup = popup(e, {closeButton: false});
        });
        map.on('mouseleave', layer, function() {
            if (trackPopup) trackPopup.remove();
            map.getCanvas().style.cursor = '';
        });
    }
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
                                "description": myTrack.description,
                                "direction": myTrack.infos.direction
                            },
                            "geometry": {
                                'coordinates': [longitude, latitude]
                            }
                        }
                    ]
                };
                popup(popupData, {closeButton:true, focusAfterOpen: false, closeOnMove: false}); //TODO on iPad if the close button has focus, we can't close with keyboard
            }
        }
    };
    if (mapData.initialLoad) addEntryPointPopup();
}

function changeLine(data){
    changeLineGeneric(folder, data) && changeLineGeneric('rnat-labels', data);
    changeMyTrackLabels(data);
    return true; // allows chaining
}
function changeIconText(data) {
    [folder, 'rnat-incomplete', 'rnat-labels', 'rnat-incomplete-labels'].forEach(folder => changeIconTextGeneric(folder, data));
    changeMyTrackLabels(data);
}
export function changeMyTrackLabels(data) {
    const {map, kmlOptions} = data;
    const markerLayer = `rnat-marker-layer`;
    const rmainLayer = 'rmain-marker-layer';
    if (map.getLayer(markerLayer)) {
        const ratio = kmlOptions.iconTextChange;
        map.setPaintProperty(markerLayer, 'text-color', getTextKmlColorExpression(kmlOptions["natColor"], kmlOptions["routeColor"]));
        map.setPaintProperty(markerLayer, 'text-opacity', getOpacityKmlColorExpression(kmlOptions["natColor"], kmlOptions["routeColor"], minTextOpacityTracks));
        if (map.getLayer(rmainLayer)){
            const opacityProperty = map.getPaintProperty(rmainLayer, 'text-opacity');
            const contrastColor = getContrastColor(kmlOptions.routeColor, opacityProperty);
            const condition = ["==", 1, ["get", "overrideTextColor"]];
            map.setPaintProperty(markerLayer, 'text-halo-color', ["case", condition, contrastColor, "rgba(0, 0, 0, 0)"]);
            map.setPaintProperty(markerLayer, 'text-halo-width', ["case", condition, haloTextWidth({ratio}), 0]);
            map.setPaintProperty(markerLayer, 'text-halo-blur', ["case", condition, haloTextBlur({ratio}), 0]);
        }
    }
    return true; // allows chaining
}
export default {
    show: (data) => [folder, 'rnat-incomplete', 'rnat-labels', 'rnat-incomplete-labels'].forEach(folder => changeDisplayGeneric(folder, true, data)),
    hide: (data) => [folder, 'rnat-incomplete', 'rnat-labels', 'rnat-incomplete-labels'].forEach(folder => changeDisplayGeneric(folder, false, data)),
    add: addTracks,
    changeLine,
    changeIconText,
    changeLineWidth: (data) => [folder, 'rnat-incomplete'].forEach(folder => changeLineWidthGeneric(folder, data, lineWidthTracks)),
    changeIconSize: (data) => [folder, 'rnat-incomplete'].forEach(folder => changeIconSizeGeneric(folder, data))
}