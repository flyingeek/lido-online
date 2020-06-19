/* global mapboxgl */
import { kmlDefaultOptions } from "../kml";
import {jsonPoint, jsonLine, featureCollection} from './json.js';
import {lineLayer, markerLayer} from './layers';

export function addTracks(map, ofp, affine, kmlcolor, selectedPin, visibility) {
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
        const points = track.points.reduce(function(result, g) {
            const newPair = affine([g.longitude, g.latitude]);
            if (newPair !== undefined) {
                result.push(newPair);
            }
            return result;
        }, []);
        lines[folder].push(jsonLine(points, affine, track.name));
        const firstPoint = track.points[0];
        let jsonP = jsonPoint(affine([firstPoint.longitude, firstPoint.latitude]), `${track.name}\n${firstPoint.name}`, track.description);
        if (jsonP !== undefined) markers[folder].push(jsonP);
        if (track.isMine) {
            const lastPoint = track.points[track.points.length - 1];
            jsonP = jsonPoint(affine([lastPoint.longitude, lastPoint.latitude]), `${track.name}\n${lastPoint.name}`, track.description);
            if (jsonP !== undefined) markers[folder].push(jsonP);
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