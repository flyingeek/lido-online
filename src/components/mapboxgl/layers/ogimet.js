import {addLine, changeDisplayGeneric, changeLineGeneric} from '../utils';

const folder = 'ogimet';

const addOgimet = (data) => {
    const {map, ofp, kmlOptions, mapData} = data;
    if (ofp.isFake) return;
    const {affineAndClip} = mapData;
    addLine(map, folder, ofp.ogimetData.route.points, affineAndClip, kmlOptions.ogimetColor, kmlOptions.ogimetDisplay);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addOgimet,
    changeLine: changeLineGeneric.bind(null, folder),
}