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
        if (data.length < 48) {
            //console.log("skipping (length < 48)", data);
            return;
        }
        if (data[0].trim() === "OACI") return;
        //console.log(data[0], data[1], data[3], data[4], data[18], data[29], data[47]);
        const aircrafts = [];
        let order = {}; // first
        let isDest = 0;
        for (let i = 50; i <=62; i++) {
            if (data[i].trim().startsWith('DES')) {
                isDest = 1;
                break;
            }
        }
        for (let i = 18; i <=29; i++) {
            const [aircraft, cat] = data[i].trim().split('-');
            if (!aircraft) {
                console.log(`${data[0]}: empty aircraft column ${i}`)
                continue;
            }
            aircrafts.push(aircraft);
            if (cat === '3') {
                order[aircraft] = 2 - isDest; // 1-2 for status 3
            } else if (cat === '2'){
                order[aircraft] = 4 - isDest; // 3-4 for status 2
            } else if (cat === '1') {
                order[aircraft] = 8 - isDest; // 7-8 for status 1
            } else if (cat === 'E' || cat === 'R') {
                order[aircraft] = 6 - isDest; //5-6 for ERA which otherwise are status 2
            } else if (cat === '0') {
                order[aircraft] = 10 - isDest; // 9-10 for emergency
            } else {
                console.log(`${data[0]}: unknow aircraft status: ${cat} for ${aircraft}`);
                order[aircraft] = 0; // should not be there but are displayed first
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
                console.log(`unkwnown airport level ${data[47]}`, data);
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
        if (aircrafts.length > 0) {
            geojsonResults.push(feature);
        } else {
            console.log("skipping (no aircraft)", data);
        }
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
