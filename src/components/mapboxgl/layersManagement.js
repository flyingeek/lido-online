import { folderName } from '../utils';
import airport from './layers/airport';
import etops from './layers/etops';
import fir from './layers/fir-reg';
import greatCircle from './layers/great-circle';
import ogimet from './layers/ogimet';
import ralt from './layers/ralt';
import rmain from './layers/rmain';
import tracks from './layers/tracks';
import {authorizedStylesWithoutOFP} from "../mapSettings/AirportSelector.svelte";

const layers = [ // order is important, so Array instead of dict
    ['fir', fir],
    ['airport', airport],
    ['etops', etops],
    ['greatcircle', greatCircle],
    ['ogimet', ogimet],
    ['ralt', ralt],
    ['rmain', rmain],
    ['rnat', tracks]
];
const restrictData = (data, folder) => {
    if (!data.ofp && folder === 'airport') {
        if (!authorizedStylesWithoutOFP.includes(data.kmlOptions.airportPin)){
            data.kmlOptions.airportPin = authorizedStylesWithoutOFP[0];
        }
        if (data.name === 'airport-pin' && !authorizedStylesWithoutOFP.includes(data.value)) {
            data.value = authorizedStylesWithoutOFP[0];
        }
    }
    return data;
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
    layers.forEach(([folder, module]) => module.add && module.add(restrictData(data, folder)));
}

export const updateMapLayers = (data) => {
    const name = data.name;
    const folder = folderName(name);
    const restrictedData = restrictData(data, folder);
    const value = restrictedData.value;
    if (folder === 'icontext') {
        return layers.forEach(([,layer]) => layer.changeIconText && layer.changeIconText(restrictedData));
    }else if (folder === 'linewidth'){
        return layers.forEach(([,layer]) => layer.changeLineWidth && layer.changeLineWidth(restrictedData));
    }else if (folder === 'iconsize'){
        return layers.forEach(([,layer]) => layer.changeIconSize && layer.changeIconSize(restrictedData));
    }
    const module = Object.fromEntries(layers)[folder];
    if (module) {
        if (name.endsWith('-display')){
            (value) ? module.show && module.show(restrictedData) : module.hide && module.hide(restrictedData);
        }else if (name.endsWith('-hide')){
            module.hide && module.hide(restrictedData);
        }else if (name.endsWith('-label')) {
            module.changeLabel && module.changeLabel(restrictedData);
        }else if (name.endsWith('-pin')) {
            module.changeMarker && module.changeMarker(restrictedData);
        }else if (name.endsWith('-color')) {
            module.changeLine && module.changeLine(restrictedData);
        }else if (name.endsWith('-change')) {
            module.change && module.change(restrictedData);
        }else{
            console.error(`ignoring map layer update for ${name}`);
        }
    }else{
        console.error(`unknown layer ${name} / folder ${folder}`);
    }
}

export default layers