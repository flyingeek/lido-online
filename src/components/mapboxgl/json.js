
export function jsonPoint(lngLat, properties={}) {
    const json = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [lngLat[0], lngLat[1]]
        },
        properties
    };
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

export function jsonLine(coordinates, properties={}) {
    const json = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
        },
        properties
    };
    return json;
}
