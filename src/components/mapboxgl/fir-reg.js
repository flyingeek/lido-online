export const addFirReg = (map) => {
    map.addSource('fir-reg-source', {
        type: 'geojson',
        data: 'data/fir-reg.CONF_AIRAC.geojson'
    });
    map.addLayer({
        'id': 'fir-reg-layer',
        'type': 'fill',
        'source': 'fir-reg-source',
        'layout': {},
        'paint': {
            'fill-color': ['case', ['==', 'FIR-RED', ['get', 'type']], '#F00', '#FF8000'],
            'fill-opacity': ['case', ['==', 'FIR-RED', ['get', 'type']], 0.25, 0.2]
        }
    });
};