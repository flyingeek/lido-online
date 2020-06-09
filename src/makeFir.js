const fs = require('fs');
const  parser = require('fast-xml-parser');

// const firPath = "data/fir2002.kml";
const firRegPath = "data/fir-reg2007.kml";
// const outputFir = "data/fir-oceanic.geojson";
const outputFirReg = "data/fir-reg.geojson"

const round = f => Math.round(parseFloat(f) * 10000) / 10000;

fs.readFile(firRegPath, 'utf8', function(err, data) {
    if (err) throw err;
    const json = parser.parse(data, []);
    const features = [];
    const feature = (name, type, coordinates) => {
        let coords = coordinates.split(' ').map(v => v.split(',').slice(0, 2)).map(([lon, lat]) => [round(lon), round(lat)])
        if (coords[0] !== coords[coords.length - 1]) {
            coords.push(coords[0]);
        }
        const obj = {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [coords]
            },
            'properties': {
                'name': name,
                'type': type
            }
        };
        return obj;
    }
    for (let folder of json.kml.Document.Folder) {
        let type = 'FIR-REG';
        let coordinates = [];
        let name;
        if (folder.name.startsWith('FIRS-ROUGES')) {
            type = 'FIR-RED';
            for (let obj of folder.Document) {
                name = obj.Placemark.description || obj.Placemark.name;
                if (!name) console.log(obj);
                try {
                    coordinates = obj.Placemark.LineString.coordinates;
                    features.push(feature(name, type, coordinates));
                } catch (err) {
                    //coordinates = obj.Placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;
                }
                
            }
        } else {
            for (let obj of folder.Placemark) {
                name = obj.name;
                try {
                    coordinates = obj.LineString.coordinates;
                    features.push(feature(name, type, coordinates));
                } catch (err) {
                    //coordinates = obj.Polygon.outerBoundaryIs.LinearRing.coordinates
                }
                
            }
        }
    }
    const collection = {
        "type": "FeatureCollection",
        "features": features
    };
    fs.writeFile(outputFirReg, JSON.stringify(collection), (err) => {
        if (err) {
          throw err;
        }
    });
});
// fs.readFile(firPath, 'utf8', function(err, data) {
//     if (err) throw err;
//     const json = parser.parse(data, []);
//     const features = [];

//     const feature = (name, coordinates) => {
//         let coords = coordinates.split(' ').map(v => v.split(',').slice(0, 2)).map(([lon, lat]) => [round(lon), round(lat)])
//         if (coords[0] !== coords[coords.length - 1]) {
//             coords.push(coords[0]);
//         }
//         const obj = {
//             'type': 'Feature',
//             'geometry': {
//                 'type': 'LineString',
//                 'coordinates': coords
//             },
//             'properties': {
//                 'name': name
//             }
//         };
//         //if (description) obj.properties.description = description;
//         return obj;
//     }
//     for (let obj of json.kml.Document.Placemark) {
//         let coordinates = [];
//         let name = obj.name;
//         if (name.indexOf('OCEANIC') === -1 || ['PIARCO', 'CAYENNE', 'ATLANTICO', 'CANARIES', 'REYKJAVIK', 'NUUK', 'MAGADAN']) continue;
//         console.log(name);
//         coordinates = obj.LineString.coordinates;
//         features.push(feature(name, coordinates));
//     }
//     const collection = {
//         "type": "FeatureCollection",
//         "features": features
//     };
//     fs.writeFile(outputFir, JSON.stringify(collection), (err) => {
//         if (err) {
//           throw err;
//         }
//     });
// });
