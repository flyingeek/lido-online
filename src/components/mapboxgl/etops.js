import {addLines} from './layers';
import {kml2mapColor} from "../KmlColor.svelte";

export function addEtops(map, id, data, affineOrDrop, affineAndClamp, visibility, etopsTime, routeKmlColor, etopsKmlColor) {
    addLines(map, `${id}-ep-circle`, [data[0].circle(420, 48), data[1].circle(420, 48)] , affineAndClamp, routeKmlColor, visibility);
    addLines(map, `${id}-etops-circle`, data.slice(2).map(d => d.circle(7 * etopsTime)), affineAndClamp, etopsKmlColor, visibility);
}

export function changeEPCircleColor(map, kmlColor) {
    const [hexcolor, opacity] = kml2mapColor(kmlColor);
    const layer = 'etops-ep-circle-line-layer';
    if (map.getLayer(layer)) {
        map.setPaintProperty(layer, 'line-color', hexcolor);
        map.setPaintProperty(layer, 'line-opacity', opacity);
    }
}

export function changeETOPSCircleColor(map, kmlColor) {
    const [hexcolor, opacity] = kml2mapColor(kmlColor);
    const layer = 'etops-etops-circle-line-layer';
    if (map.getLayer(layer)) {
        map.setPaintProperty(layer, 'line-color', hexcolor);
        map.setPaintProperty(layer, 'line-opacity', opacity);
    }
}

export function changeETOPSDisplay(map, visible) {
    let layer = 'etops-etops-circle-line-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
    layer = 'etops-ep-circle-line-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
}
