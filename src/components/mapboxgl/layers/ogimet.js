import {addLine, changeDisplayGeneric, changeLineGeneric, changeLineWidthGeneric, computeLineWidthSize} from '../utils';

const folder = 'ogimet';
const lineWidthOgimet = 1.5;

const addOgimet = (data) => {
    const {map, ofp, kmlOptions, mapData, mapOptions} = data;
    if (!ofp) return;
    const visibility = (mapOptions.id.startsWith('vb_')) ? false : kmlOptions.ogimetDisplay; // not relevant on this map
    const {affineAndClip} = mapData;
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange'], lineWidthOgimet);
    addLine(map, folder, ofp.ogimetData.route.points, affineAndClip, kmlOptions.ogimetColor, visibility, lineWidth);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addOgimet,
    changeLine: changeLineGeneric.bind(null, folder),
    changeLineWidth: (data) => changeLineWidthGeneric(folder, data, lineWidthOgimet)
}