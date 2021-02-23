/* globals editolido */
import {folderName} from './utils';

export const kmlDefaultOptions = {
    "routePin": 0,
    "routeColor": "FFDA25A8",
    "alternateDisplay": true,
    "alternatePin": 0,
    "alternateColor": "FFFF00FF",
    "natDisplay": true,
    "natPin": 8,
    "natPinPosition": 0,
    "natColor": "80DA25A8",
    "natIncompleteColor": "FF0000FF",
    "greatCircleDisplay": true,
    "greatCircleColor": "5F1478FF",
    "ogimetDisplay": true,
    "ogimetColor": "40FF0000",
    "airportDisplay": true,
    "airportPin": 0,
    "firDisplay": true,
    "etopsDisplay": true,
    "etopsColor": "FF0324FC"
    // "sigmetDisplay": false,
    // "sigmetPin": 2,
    // "sigmetColor": "6200FBFF"
};

function skeleton (kmlGen, kmlOptions) {
  kmlGen.addFolders(
    {"name": "greatcircle", "enabled": kmlOptions.greatCircleDisplay, "color": kmlOptions.greatCircleColor},
    {"name": "ogimet", "enabled": kmlOptions.ogimetDisplay, "color": kmlOptions.ogimetColor},
    {
        "name": "ralt",
        "enabled": kmlOptions.alternateDisplay,
        "color": kmlOptions.alternateColor,
        "pinId": kmlOptions.alternatePin
    },
    {"name": "rmain", "color": kmlOptions.routeColor, "pinId": kmlOptions.routePin},
    {"name": "rnat", "enabled": kmlOptions.natDisplay, "color": kmlOptions.natColor, "pinId": kmlOptions.natPin},
    {
        "name": "rnat_incomplete",
        "enabled": kmlOptions.natDisplay,
        "color": kmlOptions.natIncompleteColor,
        "pinId": kmlOptions.natPin
    }
   );
}

/**
 * This is a singleton definition which can be imported  even without lidojs loaded
 */
export const KmlGenerator = () => {
  if (!(window['kmlGen'])) {
    window['kmlGen'] = new editolido.KMLGenerator();
    skeleton(window['kmlGen'], kmlDefaultOptions);
  }
  return window['kmlGen'];
}


export function updateKml(name, value) {
  if (name.startsWith('etops-') || name.startsWith('airport-') || name.startsWith('fir-')) return;
  const kmlGen = KmlGenerator();
  const folder = folderName(name);
  if (name.endsWith('-display')) {
      kmlGen.changeFolderState(folder, value);
  }else if (name.endsWith('-pin')) {
      kmlGen.changeFolderPin(folder, value);
  }else if (name.endsWith('-color')) {
      kmlGen.changeFolderColor(folder, value.toUpperCase());
  }else{
      console.error(`ignoring kml update for ${name}`);
  }
}
/**
 * skeleton to generate kml for an OFP
 * @param ofp: Ofp
 * @param kmlGen: KmlGenerator
 * @param options: {}
 * @returns {string|Source|ConcatSource}
 */
export function generateKML(ofp, options) {
    let kmlOptions = {...kmlDefaultOptions, ...options};
    const kmlGen = KmlGenerator();
    skeleton(kmlGen, kmlOptions); //perform reset also
    const description = ofp.description;
    kmlGen.setName(description);
    if (ofp.isFake) return;
    const routeName = `${ofp.infos.departure}-${ofp.infos.destination}`;
    const route = new editolido.Route(ofp.wptCoordinates(), {"name": routeName, "description": description});
    const alternateRoute = new editolido.Route(ofp.wptCoordinatesAlternate(), {"name": "Route Dégagement"});
    const greatCircle = new editolido.Route([route.points[0], route.points[route.points.length - 1]]).split(300, {"name": `Ortho ${routeName}`});
    let natmarks = [];
    for (let track of ofp.tracks) {
      let folder = track.isComplete ? 'rnat' : 'rnat_incomplete';
      kmlGen.addLine(folder, track);
      let p = new editolido.GeoPoint(track.points[0], {"name": track.name, "description": track.description});
      kmlGen.addPoint(folder, p);
      if (track.isMine) {
        natmarks.push(p);
        p = new editolido.GeoPoint(track.points[track.points.length - 1], {"name": track.name, "description": track.description});
        natmarks.push(p);
        kmlGen.addPoint(folder, p);
      }
    }
    kmlGen.addLine('greatcircle', greatCircle);
    kmlGen.addLine('rmain', route);
    kmlGen.addPoints('rmain', route, {'excluded': natmarks});
    kmlGen.addLine('ralt', alternateRoute);
    kmlGen.addLine('ogimet', ofp.ogimetData.route);
    kmlGen.addPoints('ralt', alternateRoute);
    // const ogimetRoute2 = editolido.ogimetRoute(wmoGrid, ofp.route, {'algorithm': 'crs'});
    // kmlGen.addFolder("ogimet2", {"enabled": true, "color": "4000F900", "pinId": 0});
    // kmlGen.addLine('ogimet2', ogimetRoute2);
    // const url = `https://editolido.alwaysdata.net/proxy_sigmet/?url=https://www.aviationweather.gov/gis/scripts/IsigmetJSON.php?type=all`;
    // fetch(url).then((response) => {
    //     var contentType = response.headers.get("content-type");
    //     if(contentType && contentType.indexOf("application/json") !== -1) {
    //         return response.json().then((json) => {
    //             kmlSigmet(json);
    //         });
    //     }
    // }, (error) => console.log(error));
  }

// export function kmlSigmet(json) {
//   const kmlGen = KmlGenerator();
//   for (const d of json['features']) {
//     const props = d['properties'];
//     const geom = d['geometry'];
//     const name = `${props['firName']}: ${props['qualifier']} ${props['hazard']}`;
//     const description = props['rawSigmet'];
//     if (geom['type'] === 'LineString') {
//       geom['coordinates'] = [geom['coordinates']]
//     }
//     if(geom['type'] === 'LineString' || geom['type'] === 'Polygon'){
//       for (const area of geom['coordinates']) {
//         const points = area.map(a => new editolido.GeoPoint([a[1], a[0]]));
//         const route = new editolido.Route(points);
//         kmlGen.addLine('sigmet', route);
//         kmlGen.addPoint('sigmet', editolido.GeoPoint.getCenter(points, {name, description}));
//       }
//     } else if (geom['type'] === 'Point') {
//       kmlGen.addPoint('sigmet', new editolido.GeoPoint([geom['coordinates'][1], geom['coordinates'][0]], {name, description}));
//     } else {
//       console.error(`unknown geometry type: ${geom['type']}`);
//       console.log(d);
//     }
//   }
// }