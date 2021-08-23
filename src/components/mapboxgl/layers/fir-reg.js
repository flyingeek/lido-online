const folder = 'fir-reg';
const lineLayer = `${folder}-line-layer`;
const orangeStripeLayer = `${folder}-orange-stripe-layer`;
const redStripeLayer = `${folder}-red-stripe-layer`;
const source = `${folder}-source`;

export const addFirReg = (data) => {
    const {ofp, map, mapData, kmlOptions, mapOptions} = data;
    if (!ofp) return;
    const {affine} = mapData;
    const visibility = (mapOptions.id === 'jb_pacific' || mapOptions.id.startsWith('vb_')) ? false : kmlOptions.firDisplay; // displays badly on this map
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
            'id': orangeStripeLayer,
            'type': 'fill',
            'source': source,
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                //'fill-color': "rgba(255, 0, 0, 0.2)",
                'fill-pattern': 'stripe-orange',
                'fill-opacity': 0.4
            },
            'filter': ['!', ['==', 'FIR-RED', ['get', 'type']]]
        });
        map.addLayer({
            'id': redStripeLayer,
            'type': 'fill',
            'source': source,
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                //'fill-color': "rgba(255, 0, 0, 0.2)",
                'fill-pattern': 'stripe-red',
                'fill-opacity': 0.35
            },
            'filter': ['==', 'FIR-RED', ['get', 'type']]
        });
        map.addLayer({
            'id': lineLayer,
            'type': 'line',
            'source': source,
            'layout': {'visibility': (visibility) ? 'visible' : 'none'},
            'paint': {
                'line-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"],
                'line-width': 1,
                'line-opacity': ['case', ['==', 'FIR-RED', ['get', 'type']], 0.35, 0.4]
            }
        });
    })
};

export function changeFirDisplay(data, visible) {
    const {map} = data;
    if (map.getLayer(redStripeLayer)) {
        map.setLayoutProperty(redStripeLayer, 'visibility', (visible) ? 'visible': 'none');
    }
    if (map.getLayer(orangeStripeLayer)) {
        map.setLayoutProperty(orangeStripeLayer, 'visibility', (visible) ? 'visible': 'none');
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