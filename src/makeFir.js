const fs = require('fs');
const etl = require('etl');
const unzipper = require('unzipper');
const parser = require('fast-xml-parser');
const config = require('../package.json');

const outputFirReg = "data/fir-reg-orig.geojson"
const zipPath = `data/FIR-REGLEMENTEES-${config.AIRAC.substr(0,4)}.kmz`;

const round = f => Math.round(parseFloat(f) * 10000) / 10000;
const transformer = (json) => {
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
    return collection;
}
fs.createReadStream(zipPath)
    .pipe(unzipper.Parse())
    .pipe(etl.map(async entry => {
        if (entry.path == "doc.kml") {
            const content = await entry.buffer();
            const json = parser.parse(content.toString(), []);
            fs.writeFile(outputFirReg, JSON.stringify(transformer(json)), (err) => {
                if (err) {
                  throw err;
                }
            });
            entry.autodrain();
        } else {
            console.log(entry.path);
            entry.autodrain();
        }
    }))
