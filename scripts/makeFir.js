import fs from 'fs';
import etl from 'etl';
const unzipper = require('unzipper');
const parser = require('fast-xml-parser');
const mapshaper = require('mapshaper');

const outputFirReg = "data/fir-reg-orig.geojson";
const outputFirRegOptimized = "data/fir-reg.geojson";
const scriptArgs = process.argv.slice(2);
const airac = (scriptArgs.length === 1) ? scriptArgs[0] : process.env.npm_package_config_AIRAC;
if (typeof airac !== 'string' || airac.length !== 4) throw new Error(`invalid AIRAC: ${airac}, did you use npm run makeFir [-- CYCLE] ?`);
console.log("AIRAC:", airac);
const zipPath = `data/FIR-REGLEMENTEES-${airac}.kmz`;
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
            const getData = (src) => {
                for (let obj of src) {
                    name = obj.Placemark.description || obj.Placemark.name;
                    if (!name) console.log(obj);
                    try {
                        coordinates = obj.Placemark.LineString.coordinates;
                    } catch (err) {
                        coordinates = obj.Placemark.Polygon.outerBoundaryIs.LinearRing.coordinates;
                    }
                    features.push(feature(name, type, coordinates));
                }
            };
            if (folder.Folder !== undefined) {
                getData(folder.Folder.Document);
            }
            getData(folder.Document);
        } else {
            for (let obj of folder.Placemark) {
                name = obj.name;
                try {
                    coordinates = obj.LineString.coordinates;
                } catch (err) {
                    coordinates = obj.Polygon.outerBoundaryIs.LinearRing.coordinates
                }
                features.push(feature(name, type, coordinates));
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
            await fs.promises.writeFile(outputFirReg, JSON.stringify(transformer(json)), (err) => {
                if (err) {
                  throw err;
                }
            });
            mapshaper.runCommands('-i ' + outputFirReg + ' -simplify keep-shapes weighted 15% -o ' + outputFirRegOptimized + ' format=geojson');
            entry.autodrain();
        } else {
            console.log(entry.path);
            entry.autodrain();
        }
    }))
