import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeMarkerGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric, getTextKmlColorExpression, getOpacityKmlColorExpression} from '../utils';
import {changeEPCircleColor} from './etops';

const folder = 'rmain';

const addRmain = (data) => {
    const {map, ofp, kmlOptions, mapData} = data;
    if (!ofp) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const route = ofp.route;
    route.name = `${ofp.infos.depICAO}-${ofp.infos.destICAO}`;
    route.description = ofp.description;
    addLine(map, folder, route.points, affineAndClip, kmlOptions.routeColor, true);
    addPoints(map, folder, route.points, affineOrDrop, kmlOptions);
}

const changeLine = (data) => {
    changeLineGeneric(folder, data) && changeEPCircleColor(data);
    const {map, value, kmlOptions} = data;
    changeLineGeneric(folder, data);
    const markerLayer = `rnat-marker-layer`;
    if (map.getLayer(markerLayer)) {
        map.setPaintProperty(markerLayer, 'text-color', getTextKmlColorExpression(kmlOptions["natColor"], value));
        map.setPaintProperty(markerLayer, 'text-opacity', getOpacityKmlColorExpression(kmlOptions["natColor"], value));
    }
    return true; // allows chaining

}
export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRmain,
    changeLine,
    changeMarker: changeMarkerGeneric.bind(null, folder),
    changeIconText: changeIconTextGeneric.bind(null, folder),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}