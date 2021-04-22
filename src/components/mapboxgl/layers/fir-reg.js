const folder = 'fir-reg';
const lineLayer = `${folder}-line-layer`;
const fillLayer = `${folder}-layer`;
const source = `${folder}-source`;

export const addFirReg = (data) => {
    const {ofp, map, mapData, kmlOptions, mapOptions} = data;
    if (mapOptions.id === 'jb_pacific' || mapOptions.id.startsWith('vb_')) return; // displays badly on this map
    if (!ofp) return;
    const {affine} = mapData;
    const visibility = kmlOptions.firDisplay;
    fetch('data/fir-reg.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        if (affine) {
            for (let i = 0; i<data.features.length; i++){
                const points = data.features[i].geometry.coordinates[0];
                data.features[i].geometry.coordinates = [points.map(v => affine(v))];
            }
        }
        map.addSource(source, {
            type: 'geojson',
            data: data
        });
        map.addLayer({
            'id': fillLayer,
            'type': 'fill',
            'source': source,
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                'fill-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgba(255,0,0,0.2)", "rgba(255,127,0,0.25)"]
                //'fill-outline-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"]
            }
        });
        map.addLayer({
            'id': lineLayer,
            'type': 'line',
            'source': source,
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                'line-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"],
                'line-width': 1,
                'line-opacity': ['case', ['==', 'FIR-RED', ['get', 'type']], 0.4, 0.6]
            }
        });
    })
};

export function changeFirDisplay(data, visible) {
    const {map} = data;
    if (map.getLayer(fillLayer)) {
        map.setLayoutProperty(fillLayer, 'visibility', (visible) ? 'visible': 'none');
    }
    if (map.getLayer(lineLayer)) {
        map.setLayoutProperty(lineLayer, 'visibility', (visible) ? 'visible': 'none');
    }
}

export default {
    show: (data) => changeFirDisplay(data, true),
    hide: (data) => changeFirDisplay(data, false),
    add: addFirReg,
}