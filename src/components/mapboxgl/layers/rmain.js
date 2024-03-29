import {addLine, addPoints, changeDisplayGeneric, changeLineGeneric, changeIconTextGeneric, changeLineWidthGeneric, changeIconSizeGeneric, computeLineWidthSize, getContrastColor, haloTextBlur, haloTextWidth} from '../utils';
import {changeEPCircleColor} from './etops';
import {changeMyTrackLabels} from './tracks';

const folder = 'rmain';
const iconTextSize = 9;

const addRmain = (data) => {
    const {map, ofp, kmlOptions, mapData, mapOptions} = data;
    if (!ofp) return;
    const {affineAndClip, affineOrDrop} = mapData;
    const minZoom = mapOptions.interpolateMinZoom || mapOptions.mapboxOptions.minZoom || 0;
    const maxZoom = mapOptions.interpolateMaxZoom || mapOptions.mapboxOptions.maxZoom || 10;
    const route = ofp.route;
    route.name = `${ofp.infos.depICAO}-${ofp.infos.destICAO}`;
    route.description = ofp.description;
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange']);
    addLine(map, folder, route.points, affineAndClip, kmlOptions.routeColor, true, lineWidth);
    addPoints(map, folder, route.points, affineOrDrop, kmlOptions, minZoom, maxZoom, iconTextSize);
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
    const ratio = kmlOptions.iconTextChange;
    const markerLayer = `${folder}-marker-layer`;
    if (map.getLayer(markerLayer)) {
        const opacityProperty = map.getPaintProperty(markerLayer, 'text-opacity');
        const contrastColor = getContrastColor(kmlOptions.routeColor, opacityProperty);
        map.setPaintProperty(markerLayer, 'text-halo-color', contrastColor);
        map.setPaintProperty(markerLayer, 'text-halo-width', haloTextWidth({ratio}));
        map.setPaintProperty(markerLayer, 'text-halo-blur', haloTextBlur({ratio}));
    }
    return true; // allows chaining
}
export default {
    show: changeDisplayGeneric.bind(null, folder, true),
    hide: changeDisplayGeneric.bind(null, folder, false),
    add: addRmain,
    changeLine,
    changeIconText: (data) => changeIconTextGeneric(folder, data, iconTextSize) && setTextHalo(data),
    changeLineWidth: changeLineWidthGeneric.bind(null, folder),
    changeIconSize: changeIconSizeGeneric.bind(null, folder)
}