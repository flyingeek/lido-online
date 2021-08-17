const Papa = require('papaparse');
const fs = require('fs');
const scriptArgs = process.argv.slice(2);
const airac = ((scriptArgs.length === 1) ? scriptArgs[0] : process.env.npm_package_config_AIRAC).substring(0,4);
if (typeof airac !== 'string' || airac.length !== 4) throw new Error(`invalid AIRAC: ${airac}, did you use npm run makeAirports ?`);
console.log("AIRAC:", airac);
const dataPath = `data/Global${airac}.csv`;
const output = "../lidojs/src/modules/airports.json";
const iataOutput = "../lidojs/src/modules/iata2icao.json";
const geojson = "data/airports.geojson";

function parseGlobal() {
    const file = fs.createReadStream(dataPath);
    let counter = 0;
    const results = {};
    let iataResults = "";
    const geojsonResults = [];
    //const icaoCountries = {};
    Papa.parse(file, {
        step: function(result) {
            //0:OACI 1:Nom 2:IATA 3:LAT 4:LON 5:787 6:320 7:340 8:350 9:220 10:772 11:773 12:Nb-Pistes 13:Min LDA 14:LDA Retenue 15:Longuest(m) 16:ETOPS 17:PPV 18:318 19:319 20:320 21:321 22:330 23:340 24:350 25:220 26:787 27:772 28:773 29:77F 30:CptAdqMC 31:CptAdqLC 32:O2 33:Reco 34:Remarque 35:IGO318 36:IGO319 37:IGO320 38:IGO321 39:IGO332 40:IGO343 41:IGO388 42:IGO744 43:IGO74Y 44:IGO772 45:IGO77W 46:IGO77X 47:RED_SURETE 48:Medical 49:Cercle Influence 50:Utilisation 51:PROG 330 52:PROG 340 53:PROG 350 54:PROG 380 55:PROG 772 56:PROG 773 57:PROG 77F 58:PROG 787 59:PROG 318 60:PROG 319 61:PROG 320 62:PROG 321 63:PROG 32A
            // 0:icao 1:name 2:iata 3:lat 4:lon 318:18 319:19 320:20 321:21 330:22 340:23 350:24 380:25 787:26 772:27 773:28 77F:29 sur:47
            //console.log(result);
            const data = result.data;
            //console.log(data)
            if (data.length < 63) {
                if (data.length > 1) console.log("skipping (length < 63)", data);
                return;
            }
            if (data[0].trim() === "OACI") return;
            //console.log(data[0], data[1], data[3], data[4], data[18], data[29], data[47]);
            const aircrafts = [];
            let order = {}; // first
            let isDest = 0;
            
            for (let i = 51; i <=63; i++) {
                if (data[i].trim().startsWith('DES')) {
                    isDest = 1;
                    break;
                }
            }
            for (let i = 18; i <=29; i++) {
                const [aircraft, cat] = data[i].trim().split('-');
                if (!aircraft) {
                    if (i!==23) console.log(`${data[0]}: empty aircraft column ${i}`); // 23=A340 removed
                    continue;
                }
                if (cat !== '0') aircrafts.push(aircraft);
                if (cat === '3') {
                    order[aircraft] = 3 - isDest; // 2-3 for status 3
                } else if (cat === '2'){
                    order[aircraft] = 5 - isDest; // 4-5 for status 2
                } else if (cat === 'E' || cat === 'R') {
                    order[aircraft] = 7 - isDest; //6-7 for ERA which otherwise are status 2
                } else if (cat === '1') {
                    order[aircraft] = 9 - isDest; // 8-9 for status 1
                } else if (cat === '0') {
                    order[aircraft] = 11 - isDest; // 10-11 for emergency
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
            //if (level>0) console.log(data[0], level);
            const latitude = parseFloat(data[3]);
            const longitude = parseFloat(data[4]);
            const icao = data[0].trim()
            results[icao] = [latitude, longitude];
            // if (longitude >= -30 && longitude <= 40 && latitude >=25) {
            //     icaoCountries[icao.substring(0, 2)] = true;
            // }
            iataResults +=  data[2] + ":" + data[0].trim();
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
                    'level': level,
                    'h': (data[48].trim() === 'H') ? 1 : 0
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
            //console.log(Object.keys(icaoCountries));
            fs.writeFile(output, JSON.stringify(results), (err) => {
                if (err) {
                    throw err;
                } else {
                    console.log(`Saved ${counter} airports in ${output}`);
                }
            });
            fs.writeFile(iataOutput, JSON.stringify(iataResults), (err) => {
                if (err) {
                    throw err;
                } else {
                    console.log(`Saved ${counter} airports in ${iataOutput}`);
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
                    console.log(`Saved ${counter} airports in ${geojson}`);
                }
            });
        }
    });
}
parseGlobal();
