//const Papa = require('papaparse');
import got from 'got';
import Papa from 'papaparse';
import fs from 'fs';
import { countryCodeEmoji, countryCodeName } from '../src/components/countries.js';

const scriptArgs = process.argv.slice(2);
const airac = ((scriptArgs.length === 1) ? scriptArgs[0] : process.env.npm_package_config_AIRAC).substring(0,4);
if (typeof airac !== 'string' || airac.length !== 4) throw new Error(`invalid AIRAC: ${airac}, did you use npm run makeAirports ?`);
console.log("AIRAC:", airac);
const dataPath = `data/Global${airac}.csv`;
const output = "../lidojs/src/modules/airports.json";
const iataOutput = "../lidojs/src/modules/iata2icao.json";
const geojson = "data/airports.geojson";

const gistURL = "https://github.com/mborsetti/airportsdata/raw/main/airportsdata/airports.csv";
const tzOutput = "../lidojs/src/modules/timezones.json";
const airportsdataTZ = {};

const iata2countryData = JSON.parse(fs.readFileSync('data/iata2country.json'));
const iata2cc = (iata) => {
    const index = iata2countryData.indexOf(iata + ':');
    if (index>=0) {
        let cc = iata2countryData.substring(index + 4, index + 6);
        if (cc == 'TY') {
            cc = 'JP';
        }else if (cc == 'NY'){
            cc = 'US';
        }
        return cc;
    }
    return null;
};

function parseGlobal() {
    const file = fs.createReadStream(dataPath);
    let counter = 0;
    const results = {};
    let iataResults = "";
    let timezones = {};
    let timezonesIndex = 1; // '00' means timezone is missing
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
            if (data[0].trim() === "HEAX" && data[2].trim() === '---') return;
            //console.log(data[0], data[1], data[3], data[4], data[18], data[29], data[47]);

            let order = {}; // first
            let isDest = 0;
            
            for (let i = 51; i <=63; i++) {
                if (data[i].trim().startsWith('DES')) {
                    isDest = 1;
                    break;
                }
            }
            for (let i = 18; i <=29; i++) {
                //
                // The criteria used for adequate vs emergency in airport layer depends of those values
                // adequate < 10 && emergency >= 10
                //
                const [aircraft, cat] = data[i].trim().split('-');
                if (!aircraft) {
                    if (i!==23) console.log(`${data[0]}: empty aircraft column ${i}`); // 23=A340 removed
                    continue;
                }
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
                    continue; // skip when status is unknown
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
            const icao = data[0].trim();
            const iata = data[2].trim();
            const cc = (iata) ? iata2cc(iata) : null;
            if (!cc) console.error(`unknown country code for ${icao}/${iata}`);
            const emoji = countryCodeEmoji(cc);
            if (!emoji) console.error(`unknown emoji for ${icao}/${iata}/${cc}`);
            const countryName = countryCodeName(cc);
            if (!countryName) console.error(`unknown country name for ${icao}/${iata}/${cc}`);
            results[icao] = [latitude, longitude];
            // if (longitude >= -30 && longitude <= 40 && latitude >=25) {
            //     icaoCountries[icao.substring(0, 2)] = true;
            // }
            let tzRef;
            let tz = airportsdataTZ[icao];
            if (tz) {
                if (tz in timezones) {
                    tzRef = timezones[tz];
                } else {
                    tzRef = timezonesIndex.toString(36).padStart(2, "0");
                    timezones[tz] = tzRef;
                    timezonesIndex++;
                }
            }else{
                switch (icao) {
                    case 'DTNH':
                        tzRef = timezones["Africa/Tunis"];
                        break;
                    case 'FVRG':
                        tzRef = timezones["Africa/Harare"];
                        break;
                    case 'GQNO':
                        tzRef = timezones["Africa/Nouakchott"];
                        break;
                    case 'HSSK':
                        tzRef = timezones["Africa/Khartoum"];
                        break;
                    case 'SBSG':
                        tzRef = timezones["America/Recife"];
                        break;
                    case 'UCFM':
                        tzRef = timezones["Asia/Bishkek"];
                        break;
                    default:
                        console.log(`missing time zone for ${icao}`);
                        tzRef = '00';
                }
            }
            iataResults +=  data[2].trim() + ":" + data[0].trim() + tzRef;
            if (!data[2].trim()) console.log(`unkwnown iata code for ${data[0]}`, data);
            const EAO = ['BGSF', 'DAOO', 'FSIA', 'KJFK', 'LDDU', 'LEBB', 'LFKF', 'LFML', 'LFMN', 'LFTH', 'LGIR', 'LGSR', 'LIRN', 'LSZH', 'MMMX', 'MROC', 'MTPP', 'OIIE', 'OIII', 'RJTT', 'SBGL', 'SKBO', 'SVMI', 'TFFF', 'TFFR', 'TNCM'];
            const reco = (data[33]).trim();
            let recoCode = 0;
            const eao = (reco === 'C') || EAO.includes(icao);
            recoCode += (eao) ? 1 : 0;
            // 0 -> type A
            // 1 -> type A + EAO
            // 2 -> type B
            // 3 -> type B + EAO
            // 4 -> type C
            // 5 -> type C + EAO
            if (reco) {
                recoCode += (reco === 'B') ? 2 : 4;
            }
            //if (recoCode > 0) console.log(`${icao}/${iata} reco type: ${reco}${(eao) ? ' EAO': ''}  ${recoCode}`);
            const feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [parseFloat(data[4]), parseFloat(data[3])]
                },
                'properties': {
                    'name': icao,
                    'title': data[1].trim(),
                    iata,
                    cc,
                    'level': level,
                    'h': (data[48].trim() === 'H') ? 1 : 0,
                    'r': recoCode,
                    ...order
                }
            };
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
            const reversedTz = Object.assign({}, ...Object.entries(timezones).map(([a,b]) => ({ [b]: a })));
            fs.writeFile(tzOutput, JSON.stringify(reversedTz),
                (err) => {
                    if (err) {
                        throw err;
                    }else{
                        console.log(`Saved ${Object.keys(reversedTz).length} timezones! in ${tzOutput}`);
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
Papa.parse(got.stream(gistURL), {
    "step": row => {
        const [icao,,,,,,,,, tz] = row.data;
        airportsdataTZ[icao] = tz;
    },
    "complete": parseGlobal
});
