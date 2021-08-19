import { folderName } from '../utils';
import airport from './layers/airport';
import etops from './layers/etops';
import fir from './layers/fir-reg';
import greatCircle from './layers/great-circle';
import ogimet from './layers/ogimet';
import ralt from './layers/ralt';
import rmain from './layers/rmain';
import tracks from './layers/tracks';

const layers = {
    'airport': airport,
    'etops': etops,
    'fir': fir,
    'greatcircle': greatCircle,
    'ogimet': ogimet,
    'ralt': ralt,
    'rmain': rmain,
    'rnat': tracks
}
export const loadMapLayers = (data) => {
    const {map, mapOptions} = data;
    if (mapOptions.tiles) {
        map.addSource('jb-raster',{
            'type': 'raster',
            'tiles': mapOptions.tiles,
            'tileSize': mapOptions.tileSize,
        });
        map.addLayer({
            'id': 'jb-layer',
            'type': 'raster',
            'source': 'jb-raster',
            'minzoom': 0,
            'maxzoom': 22,
            paint:{
                'raster-opacity': 1
            }
        });
    }
    Object.values(layers).forEach(layer => layer.add && layer.add(data));
}

export const updateMapLayers = (data) => {
    const {name, value} = data;
    const folder = folderName(name);
    if (folder === 'icontext') {
        return Object.values(layers).forEach(layer => layer.changeIconText && layer.changeIconText(data));
    }else if (folder === 'linewidth'){
        return Object.values(layers).forEach(layer => layer.changeLineWidth && layer.changeLineWidth(data));
    }else if (folder === 'iconsize'){
        return Object.values(layers).forEach(layer => layer.changeIconSize && layer.changeIconSize(data));
    }
    const module = layers[folder];
    if (module) {
        if (name.endsWith('-display')){
            (value) ? module.show && module.show(data) : module.hide && module.hide(data);
        }else if (name.endsWith('-label')) {
            module.changeLabel && module.changeLabel(data);
        }else if (name.endsWith('-pin')) {
            module.changeMarker && module.changeMarker(data);
        }else if (name.endsWith('-color')) {
            module.changeLine && module.changeLine(data);
        }else if (name.endsWith('-change')) {
            module.change && module.change(data);
        }else{
            console.error(`ignoring map layer update for ${name}`);
        }
    }else{
        console.error(`unknown layer ${name} / folder ${folder}`);
    }
}

export default layers