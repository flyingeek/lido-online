/* global editolido */
import {addLine, changeDisplayGeneric, changeLineGeneric} from '../utils';

const folder = 'great-circle';

const addGreatCircle = (data) => {
    const {ofp, kmlOptions, mapData, map, mapOptions} = data;
    if (mapOptions.id.startsWith('vb_')) return; // not relevant on this map
    if (!ofp) return;
    const {affineAndClip} = mapData;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = ofp.route;
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
    addLine(map, folder, greatCircle.points, affineAndClip, kmlOptions.greatCircleColor, kmlOptions.greatCircleDisplay);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addGreatCircle,
    changeLine: changeLineGeneric.bind(null, folder),
}