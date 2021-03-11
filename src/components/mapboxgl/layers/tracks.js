/* global mapboxgl */
import {jsonPoint, jsonLine, featureCollection} from '../json.js';
import {lineLayer, markerLayer, changeMarkerGeneric, changeLineGeneric, changeDisplayGeneric} from '../utils';

const folder = 'rnat';

export function addTracks(data) {
    const {map, ofp, mapData, kmlOptions} = data;
    if (ofp.isFake) return;
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
        if (affineLine) {
            const sublines = affineLine(track.points);
            const sublen = sublines.length;
            for (let i=0; i<sublen;i++){
                lines[folder].push(jsonLine(sublines[i], track.name));
            }
        }else{
            lines[folder].push(jsonLine(track.points.map(g => [g.longitude, g.latitude]), track.name))
        }
        const firstPoint = track.points[0];
        let lngLat = (affine) ? affine([firstPoint.longitude, firstPoint.latitude]) : [firstPoint.longitude, firstPoint.latitude];
        if (lngLat) markers[folder].push(jsonPoint(lngLat, `${track.name}\n${firstPoint.name}`, track.description));
        if (track.isMine) {
            const lastPoint = track.points[track.points.length - 1];
            lngLat = (affine) ? affine([lastPoint.longitude, lastPoint.latitude]) : [lastPoint.longitude, lastPoint.latitude];
            if (lngLat) markers[folder].push(jsonPoint(lngLat, `${track.name}\n${lastPoint.name}`, track.description));
        }
    }
    map.addSource(`rnat-marker-source`, featureCollection(markers['rnat']));
    map.addSource(`rnat-incomplete-marker-source`, featureCollection(markers['rnat-incomplete']));
    map.addSource(`rnat-line-source`, featureCollection(lines['rnat']));
    map.addSource(`rnat-incomplete-line-source`, featureCollection(lines['rnat-incomplete']));

    map.addLayer(lineLayer('rnat', kmlcolor, visibility));
    map.addLayer(lineLayer('rnat-incomplete', kmlOptions.natIncompleteColor, visibility));
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

export default {
    show: (data) => changeDisplayGeneric(folder, true, data) && changeDisplayGeneric('rnat-incomplete', true, data),
    hide: (data) => changeDisplayGeneric(folder, false, data) && changeDisplayGeneric('rnat-incomplete', false, data),
    remove: () => {},
    add: addTracks,
    changeLine: changeLineGeneric.bind(null, folder),
    changeMarker: changeMarkerGeneric.bind(null, folder),
    change: () => {}
}