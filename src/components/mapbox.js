import {xml2json} from "./geojson";
// https://docs.mapbox.com/help/glossary/access-token/
const token = "pk.eyJ1IjoiZmx5aW5nZWVrIiwiYSI6ImNrYWh3bWwzZDA0cWgyeXMwZmJzYmhnb3AifQ.a9MA0LPrBDBSO2l_CwivzA";

const key = {};


const makeCustomLayer = (L, options) => {
    let mapIcons = [];
    for (let u of [0, 1, 2, 3, 4, 5, 6, 7, 8].map(c => `https://flyingeek.github.io/editolido/img/pin${c}.png`)) {
        mapIcons.push(L.icon({
            iconUrl: u,
            iconSize: [10, 17],
            iconAnchor: [5, 17],
        }));
    }
    return L.geoJson(null, {
        // http://leafletjs.com/reference.html#geojson-style
        style: function (feature) {
            function style(value) {
                const color = "#" + value.substring(6, 8) + value.substring(4, 6) + value.substring(2, 4);
                const opacity = parseInt(value.substring(0, 2), 16) / 255;
                return {color, opacity, "weight": 2};
            }
            //TODO why formOptions instead of kmlOptions ?
            switch (feature.properties.styleUrl) {
                case '#rmain':
                    return style(options.routeColor);
                case '#rnat':
                    return style(options.natColor);
                case '#rnat_incomplete':
                    return style(options.natIncompleteColor);
                case '#ogimet':
                    return style(options.ogimetColor);
                case '#ralt':
                    return style(options.alternateColor);
                case '#greatcircle':
                    return style(options.greatCircleColor);
                default:
                    return {"color": '#f00', "weight": 1, "opacity": 1.0};
            }

        },
        pointToLayer: function (geoJsonPoint, latlng) {
            if (geoJsonPoint.properties.styleUrl.substring(0, 11) === '#placemark-') {
                const i = window['editolido'].PINS.indexOf(geoJsonPoint.properties.styleUrl);
                return L.marker(latlng, {"icon": mapIcons[i]});
            }
            return L.marker(latlng);
        }
    });
};



const clearMapLayer = function (map, layer) {
    if (map !== undefined) {
        if (map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
        layer.clearLayers();
    }
};

const addKmlToMap = function (kml, map, layer) {
    if (map !== undefined) {
        const geojson = xml2json(kml);
        if ('setGeoJSON' in layer) {
            layer.setGeoJSON(geojson);
        } else if ('addData' in layer) {
            layer.addData(geojson);
        }
        layer.addTo(map);
    }
};

const updateMap = function (kml, map, layer) {
    clearMapLayer(map, layer);
    addKmlToMap(kml, map, layer);
};

export { token, key, updateMap, makeCustomLayer, addKmlToMap };