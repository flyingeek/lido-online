/**
 * Change coordinates to draw line crossing 180 meridian on mapbox if needed
 */
export function mapbox180Cross(coordinates) {
  const newCoordinates = [];
  for (let i = 0; i < coordinates.length; i++) {
    const diffLng = (i > 0) ? coordinates[i][0] - coordinates[i - 1][0] : 0;
    if (Math.abs(diffLng) > 180) { // cross 180 boundary
        if (diffLng >= 180) {
          newCoordinates.push([coordinates[i][0] - 360, coordinates[i][1]]);
        } else if (diffLng < 180) {
          newCoordinates.push([coordinates[i][0] + 360, coordinates[i][1]]);
        }
    } else { // do not cross
      newCoordinates.push([coordinates[i][0], coordinates[i][1]]);
    }
  }
  return newCoordinates;
}

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
            'coordinates': mapbox180Cross(coordinates)
        },
        properties
    };
    return json;
}
