export const firMapIdCondition = (mapOptions) => (mapOptions && (mapOptions.id.startsWith('exemple_')));
const folder = 'fir-reg';
const lineLayer = `${folder}-line-layer`;
const orangeStripeLayer = `${folder}-orange-stripe-layer`;
const redStripeLayer = `${folder}-red-stripe-layer`;
const layers = [orangeStripeLayer, redStripeLayer, lineLayer];
const source = `${folder}-source`;

function crossing180(coordinates) {
  for (let i = 0; i < coordinates.length; i++) {
    const diffLng = (i > 0) ? coordinates[i][0] - coordinates[i - 1][0] : 0;
    if (Math.abs(diffLng) > 180) { // cross 180 boundary
      return true
    }
  }
  return false;
}
export const addFirReg = (data) => {
    const {ofp, map, mapData, kmlOptions, mapOptions} = data;
    if (!ofp || firMapIdCondition(mapOptions)) return;
    const {affineAndClamp, affineAndClip} = mapData;
    const visibility = kmlOptions.firDisplay && !kmlOptions.firHide.includes(mapOptions.id);
    fetch('data/fir-reg.CONF_AIRAC.geojson')
    .then(response => response.json())
    .then(data => {
        if (mapOptions.id === 'jb_south') {
          for (let i = 0; i<data.features.length; i++){
              const points = data.features[i].geometry.coordinates[0];
              data.features[i].geometry.coordinates = affineAndClip(points.map(([longitude, latitude]) => ({latitude, longitude})), 'polygon');
          }
        }else if (affineAndClamp) {
          for (let i = 0; i<data.features.length; i++){
              const points = data.features[i].geometry.coordinates[0];
              const newCoordinates = points.map(v => affineAndClamp(v));
              if (mapOptions.id === 'jb_pacific' && (crossing180(newCoordinates))
              ){
                  data.features[i].geometry.coordinates = [[]];
              }else{
                  data.features[i].geometry.coordinates = [newCoordinates];
              }
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

export function changeFirDisplay({map, kmlOptions, mapOptions}) {
    const visibility = kmlOptions.firDisplay && !kmlOptions.firHide.includes(mapOptions.id);
    for (const layer of layers) {
        if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'visibility', (visibility) ? 'visible': 'none');
        }
    }
}

export default {
    show: (data) => changeFirDisplay(data),
    hide: (data) => changeFirDisplay(data),
    add: addFirReg,
}
