import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric, computeLineWidthSize} from '../utils';
import {changeEPCircleColor} from './etops';
import {changeMyTrackLabels} from './tracks';

const folder = 'rmain';

const addRmain = (data) => {
    const {map, ofp, kmlOptions, mapData} = data;
    if (!ofp) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const route = ofp.route;
    route.name = `${ofp.infos.depICAO}-${ofp.infos.destICAO}`;
    route.description = ofp.description;
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange']);
    addLine(map, folder, route.points, affineAndClip, kmlOptions.routeColor, true, lineWidth);
    addPoints(map, folder, route.points, affineOrDrop, kmlOptions);
}

const changeLine = (data) => {
    changeLineGeneric(folder, data);
    changeEPCircleColor(data);
    changeMyTrackLabels(data);
    return true; // allows chaining
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRmain,
    changeLine,
    changeIconText: changeIconTextGeneric.bind(null, folder),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}