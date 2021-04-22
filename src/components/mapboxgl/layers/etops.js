import {addLines, computeLineWidthSize} from '../utils';
import {kml2mapColor} from "../../mapSettings/ColorPinCombo.svelte";

const folder = 'etops';
const lineWidthDefault = 1;
const epCircleLayer = `${folder}-ep-circle-line-layer`;
const etopsCircleLayer = `${folder}-etops-circle-line-layer`;
function addEtops(data) {
    const {map, mapData, ofp, kmlOptions} = data;
    if (!ofp) return;
    const lineWidth = computeLineWidthSize(kmlOptions['lineWidthChange'], lineWidthDefault);
    if (ofp.infos['EEP'] && ofp.infos['EXP'] && ofp.infos['raltPoints'].length > 0) {
        const {affineAndClip} = mapData;
        const etopsTime = ofp.infos['ETOPS'];
        const visibility = kmlOptions.etopsDisplay;
        addLines(map, `${folder}-ep-circle`, [ofp.infos['EEP'].circle(420, 48), ofp.infos['EXP'].circle(420, 48)] , affineAndClip, kmlOptions.routeColor, visibility, lineWidth, true);
        addLines(map, `${folder}-etops-circle`, ofp.infos['raltPoints'].map(d => d.circle(7 * etopsTime)), affineAndClip, kmlOptions.etopsColor, visibility, lineWidth, true);
    }
}

export function changeEPCircleColor(data) {
    const {map, kmlOptions} = data;
    const [hexcolor, opacity] = kml2mapColor(kmlOptions.routeColor);
    if (map.getLayer(epCircleLayer)) {
        map.setPaintProperty(epCircleLayer, 'line-color', hexcolor);
        map.setPaintProperty(epCircleLayer, 'line-opacity', opacity);
    }
}

function changeETOPSCircleColor(data) {
    const {map} = data;
    const [hexcolor, opacity] = kml2mapColor(data.value);
    if (map.getLayer(etopsCircleLayer)) {
        map.setPaintProperty(etopsCircleLayer, 'line-color', hexcolor);
        map.setPaintProperty(etopsCircleLayer, 'line-opacity', opacity);
    }
}

function changeETOPSDisplay(data, visible) {
    const {map} = data;
    if (map.getLayer(etopsCircleLayer)) {
        map.setLayoutProperty(etopsCircleLayer, 'visibility', (visible) ? 'visible': 'none');
    }
    if (map.getLayer(epCircleLayer)) {
        map.setLayoutProperty(epCircleLayer, 'visibility', (visible) ? 'visible': 'none');
    }
}
function changeLineWidth(data){
    const {map, value} = data;
    const lineWidth = computeLineWidthSize(value, lineWidthDefault);
    if (map.getLayer(etopsCircleLayer)) {
        map.setPaintProperty(etopsCircleLayer, 'line-width', lineWidth);
    }
    if (map.getLayer(epCircleLayer)) {
        map.setPaintProperty(epCircleLayer, 'line-width', lineWidth);
    }
    return true; // allows chaining
}
export default {
    show: (data) => changeETOPSDisplay(data, true),
    hide: (data) => changeETOPSDisplay(data, false),
    add: addEtops,
    changeLine: (data) => changeETOPSCircleColor(data),
    changeLineWidth
}
