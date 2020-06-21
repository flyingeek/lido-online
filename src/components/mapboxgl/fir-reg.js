export const addFirReg = (map, affine) => {
    fetch('data/fir-reg.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        for (let i = 0; i<data.features.length; i++){
            const points = data.features[i].geometry.coordinates[0];
            data.features[i].geometry.coordinates = [points.map(v => affine(v))];
        }
        map.addSource('fir-reg-source', {
            type: 'geojson',
            data: data
        });
        map.addLayer({
            'id': 'fir-reg-layer',
            'type': 'fill',
            'source': 'fir-reg-source',
            'layout': {},
            'paint': {
                'fill-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgba(255,0,0,0.25)", "rgba(255,127,0,0.25)"],
                'fill-outline-color': ['case', ['==', 'FIR-RED', ['get', 'type']], "rgb(255,0,0)", "rgb(255,127,0)"]
            }
        });
    })
};