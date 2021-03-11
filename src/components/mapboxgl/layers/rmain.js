import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeMarkerGeneric} from '../utils';
import {changeEPCircleColor} from './etops';

const folder = 'rmain';

const addRmain = (data) => {
    const {map, ofp, kmlOptions, mapData} = data;
    if (ofp.isFake) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const route = ofp.route;
    route.name = `${ofp.infos.departure}-${ofp.infos.destination}`;
    route.description = ofp.description;
    addLine(map, folder, route.points, affineAndClip, kmlOptions.routeColor, true);
    addPoints(map, folder, route.points, affineOrDrop, kmlOptions.routePin, true, kmlOptions.routeColor);
}

export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    remove: () => {},
    add: addRmain,
    changeLine: (data) => changeLineGeneric(folder, data) && changeEPCircleColor(data),
    changeMarker: changeMarkerGeneric.bind(null, folder),
    change: () => {}
}