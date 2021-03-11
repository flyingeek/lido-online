import {addLine, changeDisplayGeneric, changeLineGeneric, changeMarkerGeneric} from '../utils';

const folder = 'great-circle';

const addGreatCircle = (data) => {
    const {ofp, kmlOptions, mapData, map} = data;
    if (ofp.isFake) return;
    const {affineAndClip} = mapData;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = ofp.route;
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
    addLine(map, folder, greatCircle.points, affineAndClip, kmlOptions.greatCircleColor, kmlOptions.greatCircleDisplay);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    remove: () => {},
    add: addGreatCircle,
    changeLine: changeLineGeneric.bind(null, folder),
    changeMarker: changeMarkerGeneric.bind(null, folder),
}