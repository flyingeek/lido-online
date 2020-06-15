
export function jsonPoint(lngLat, title, description) {
    const json = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [lngLat[0], lngLat[1]]
        },
        'properties': {
        }
    };
    if (title) json['properties']['title'] = title;
    if (description) json['properties']['description'] = description;
    return json;
}

export function featureCollection(features) {
    return {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': features
        }
    };
}

export function jsonLine(coordinates, title) {
    const json = {
         'type': 'Feature',
         'geometry': {
             'type': 'LineString',
             'coordinates': coordinates
         },
         'properties': {
         }
     };
     if (title) json['properties']['title'] = title;
     return json;
 }
