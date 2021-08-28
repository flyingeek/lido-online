/* global editolido */
import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric, computeLineWidthSize} from '../utils';

const folder = 'ralt';

const addRalt = (data) => {
    const {map, ofp, kmlOptions, mapData, mapOptions} = data;
    if (!ofp) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const maxZoom = mapOptions.interpolateZoom || mapOptions.mapboxOptions.maxZoom;
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange']);
    addLine(map, folder, alternateRoute.points, affineAndClip, kmlOptions.alternateColor, kmlOptions.alternateDisplay, lineWidth);
    addPoints(map, folder, alternateRoute.points, affineOrDrop, kmlOptions, maxZoom);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRalt,
    changeLine: changeLineGeneric.bind(null, folder),
    changeIconText: changeIconTextGeneric.bind(null, folder),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}