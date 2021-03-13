import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeMarkerGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric} from '../utils';

const folder = 'ralt';

const addRalt = (data) => {
    const {map, ofp, kmlOptions, mapData} = data;
    if (ofp.isFake) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    addLine(map, folder, alternateRoute.points, affineAndClip, kmlOptions.alternateColor, kmlOptions.alternateDisplay);
    addPoints(map, folder, alternateRoute.points, affineOrDrop, kmlOptions);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRalt,
    changeLine: changeLineGeneric.bind(null, folder),
    changeMarker: changeMarkerGeneric.bind(null, folder),
    changeIconText: changeIconTextGeneric.bind(null, folder),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}