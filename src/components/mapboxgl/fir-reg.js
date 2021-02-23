export const addFirReg = (map, affine, visibility) => {
    fetch('data/fir-reg.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        if (affine) {
            for (let i = 0; i<data.features.length; i++){
                const points = data.features[i].geometry.coordinates[0];
                data.features[i].geometry.coordinates = [points.map(v => affine(v))];
            }
        }
        map.addSource('fir-reg-source', {
            type: 'geojson',
            data: data
        });
        map.addLayer({
            'id': 'fir-reg-layer',
            'type': 'fill',
            'source': 'fir-reg-source',
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                'fill-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgba(255,0,0,0.2)", "rgba(255,127,0,0.25)"]
                //'fill-outline-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"]
            }
        });
        map.addLayer({
            'id': 'fir-reg-line-layer',
            'type': 'line',
            'source': 'fir-reg-source',
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                'line-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"],
                'line-width': 1,
                'line-opacity': ['case', ['==', 'FIR-RED', ['get', 'type']], 0.4, 0.6]
            }
        });
    })
};

export function changeFirDisplay(map, visible) {
    let layer = 'fir-reg-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
    layer = 'fir-reg-line-layer';
    if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, 'visibility', (visible) ? 'visible': 'none');
    }
}