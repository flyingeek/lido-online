const Papa = require('papaparse');
const fs = require('fs');
const config = require('../package.json');

const dataPath = `data/Global${config.AIRAC.substr(0,4)}.csv`;
const output = "data/airports.json";
const geojson = "data/airports.geojson";

const file = fs.createReadStream(dataPath);
let counter = 0;
const results = {};
const geojsonResults = [];
Papa.parse(file, {
    step: function(result) {
        // 0:icao 1:name 3:lat 4:lon 318:18 319:19 320:20 321:21 330:22 340:23 350:24 380:25 787:26 772:27 773:28 77F:29 sur:47
        //console.log(result);
        const data = result.data;
        if (data.length < 48) return;
        if (data[0].trim() === "OACI") return;
        //console.log(data[0], data[1], data[3], data[4], data[18], data[29], data[47]);
        const aircrafts = [];
        let order = {}; // first
        for (let i = 18; i <=29; i++) {
            const [aircraft, cat] = data[i].trim().split('-');
            if (cat !== '0') {
                aircrafts.push(aircraft);
                if (! isNaN(cat)) { // leaves R or E as order = 0 (first)
                    order[aircraft] = 4 - parseInt(cat, 10);// 3-> 1 2 -> 2 1 -> 3
                } else {
                    order[aircraft] = 0; //first
                }
            } else {
                order[aircraft] = 10; // last
            }
        }
        let level = 0;
        switch (data[47].trim()) {
            case '':
                break;
            case 'o':
                level = 1;
                break
            case 'x':
                level = 2;
                break;
            default:
                console.log(`unkwnown airport level ${data[47]}`);
        }
        results[data[0].trim()] = [parseFloat(data[3]),parseFloat(data[4])];
        const feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [parseFloat(data[4]), parseFloat(data[3])]
            },
            'properties': {
                'name': data[0].trim(),
                'title': data[1].trim(),
                'type': aircrafts,
                'level': level
            }
        };
        for (const k in order){
            feature.properties[k] = order[k];
        }
        geojsonResults.push(feature);
        counter += 1;
        return;
    },
    complete: function() {
        // this one is for lidojs (etops & eep & exp)
        fs.writeFile(output, JSON.stringify(results), (err) => {
            if (err) {
              throw err;
            } else {
              console.log(`Saved ${counter} airports!`);
            }
        });
        const collection = {
            "type": "FeatureCollection",
            "features": geojsonResults
        };
        fs.writeFile(geojson, JSON.stringify(collection), (err) => {
            if (err) {
              throw err;
            } else {
              console.log(`Saved ${counter} airports!`);
            }
        });
    }
});
