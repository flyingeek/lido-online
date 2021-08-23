/* global editolido */
import {addLine, changeDisplayGeneric, changeLineGeneric, changeLineWidthGeneric, computeLineWidthSize} from '../utils';

const folder = 'great-circle';
const lineWidthGreatCircle = 1.5;

const addGreatCircle = (data) => {
    const {ofp, kmlOptions, mapData, map, mapOptions} = data;
    if (!ofp) return;
    const visibility = (mapOptions.id.startsWith('vb_')) ? false : kmlOptions.greatCircleDisplay;  // not relevant on this map
    const {affineAndClip} = mapData;
    const routeName = `${ofp.infos.depICAO}-${ofp.infos.destICAO}`;
    const route = ofp.route;
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange'], lineWidthGreatCircle);
    addLine(map, folder, greatCircle.points, affineAndClip, kmlOptions.greatCircleColor, visibility, lineWidth);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addGreatCircle,
    changeLine: changeLineGeneric.bind(null, folder),
    changeLineWidth: (data) => changeLineWidthGeneric(folder, data, lineWidthGreatCircle)
}