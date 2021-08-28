import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric, computeLineWidthSize, computeIconTextSize, getContrastColor, haloTextBlur, haloTextWidth} from '../utils';
import {changeEPCircleColor} from './etops';
import {changeMyTrackLabels} from './tracks';

const folder = 'rmain';

const addRmain = (data) => {
    const {map, ofp, kmlOptions, mapData, mapOptions} = data;
    if (!ofp) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const maxZoom = mapOptions.interpolateZoom || mapOptions.mapboxOptions.maxZoom;
    const route = ofp.route;
    route.name = `${ofp.infos.depICAO}-${ofp.infos.destICAO}`;
    route.description = ofp.description;
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange']);
    addLine(map, folder, route.points, affineAndClip, kmlOptions.routeColor, true, lineWidth);
    addPoints(map, folder, route.points, affineOrDrop, kmlOptions, maxZoom);
    setTextHalo(data);
}

const changeLine = (data) => {
    changeLineGeneric(folder, data);
    changeEPCircleColor(data);
    changeMyTrackLabels(data);
    setTextHalo(data);
    return true; // allows chaining
}
function setTextHalo(data){
    const {map, kmlOptions} = data;
    const value = kmlOptions.iconTextChange;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(markerLayer)) {
        const textSize = computeIconTextSize(value);
        const opacityProperty = map.getPaintProperty(markerLayer, 'text-opacity');
        const contrastColor = getContrastColor(kmlOptions.routeColor, opacityProperty);
        map.setPaintProperty(markerLayer, 'text-halo-color', contrastColor);
        map.setPaintProperty(markerLayer, 'text-halo-width', haloTextWidth(textSize));
        map.setPaintProperty(markerLayer, 'text-halo-blur', haloTextBlur(textSize));
    }
    return true; // allows chaining
}
export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRmain,
    changeLine,
    changeIconText: (data) => changeIconTextGeneric(folder, data) && setTextHalo(data),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}