import fs from "fs";
import etl from "etl";
import unzipper from "unzipper";
import parser from "fast-xml-parser";
import mapshaper from "mapshaper";

const outputFirReg = "data/fir-reg-orig.geojson";
const outputFirRegOptimized = "data/fir-reg.geojson";
const scriptArgs = process.argv.slice(2);
const airac =
  scriptArgs.length === 1
    ? scriptArgs[0]
    : process.env.npm_package_config_AIRAC;
if (typeof airac !== "string" || airac.length !== 4)
  throw new Error(
    `invalid AIRAC: ${airac}, did you use npm run makeFir [-- CYCLE] ?`
  );
console.log("AIRAC:", airac);
const zipPath = `data/FIR-REGLEMENTEES-${airac}.kmz`;
const round = (f) => Math.round(parseFloat(f) * 10000) / 10000;
const transformer = (json) => {
  let features = [];
  const feature = (name, type, coordinates) => {
    let coords = coordinates
      .split(" ")
      .map((v) => v.split(",").slice(0, 2))
      .map(([lon, lat]) => [round(lon), round(lat)]);
    if (coords[0] !== coords[coords.length - 1]) {
      coords.push(coords[0]);
    }
    const obj = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
      properties: {
        name: name,
        type: type,
      },
    };
    return obj;
  };
  const parsePlacemark = (obj, converter, countryName=undefined) => {
    const name = obj.description || obj.name || countryName;
    let coordinates;
    if (!name) console.log(obj);
    try {
      coordinates = obj.LineString.coordinates;
    } catch (err) {
      coordinates = obj.outerBoundaryIs.LinearRing.coordinates;
    }
    console.log({ name, clength: coordinates.length });
    if (converter) return converter({ name, coordinates });
    return { name, coordinates };
  };
  for (let folder of json.kml.Document.Folder) {
    let type = "FIR-REG";
    if (folder.name.startsWith("FIRS-ROUGES")) {
      type = "FIR-RED";
      const getData = (src) => {
        for (let obj of src) {
          features.push(
            parsePlacemark(obj.Placemark, ({ name, coordinates }) =>
              feature(name, type, coordinates)
            )
          );
        }
      };
      if (folder.Folder !== undefined) {
        getData(folder.Folder.Document);
      }
      if (folder.Placemark !== undefined) {
        if (Array.isArray(folder.Placemark)) {
          folder.Placemark.forEach((placemark) => {
            features.push(
              parsePlacemark(placemark, ({ name, coordinates }) =>
                feature(name, type, coordinates)
              )
            );
          });
        } else {
          features.push(
            parsePlacemark(folder.Placemark, ({ name, coordinates }) => {
              return feature(name, type, coordinates);
            })
          );
        }
      }
      if (folder.Document !== undefined) {
        getData(folder.Document !== undefined);
      }
      if (folder.S_country && folder.S_country.MultiGeometry !== undefined && folder.S_country.MultiGeometry.Polygon !== undefined) {
        folder.S_country.MultiGeometry.Polygon.forEach((polygon) => {
          features.push(parsePlacemark(polygon, ({ name, coordinates }) => {
              return feature(name, type, coordinates);
            }, folder.S_country.name))
        })
      }
    } else {
      for (let obj of folder.Placemark) {
        features.push(
          parsePlacemark(obj, ({ name, coordinates }) =>
            feature(name, type, coordinates)
          )
        );
      }
    }
  }
  features = features.filter((v) => v !== undefined);
  const collection = {
    type: "FeatureCollection",
    features: features,
  };
  return collection;
};
fs.createReadStream(zipPath)
  .pipe(unzipper.Parse())
  .pipe(
    etl.map(async (entry) => {
      if (entry.path == "doc.kml") {
        const content = await entry.buffer();
        const json = parser.parse(content.toString(), []);
        await fs.promises.writeFile(
          outputFirReg,
          JSON.stringify(transformer(json)),
          (err) => {
            if (err) {
              throw err;
            }
          }
        );
        mapshaper.runCommands(
          "-i " +
            outputFirReg +
            " -simplify keep-shapes weighted 15% -o " +
            outputFirRegOptimized +
            " format=geojson"
        );
        entry.autodrain();
      } else {
        console.log(entry.path);
        entry.autodrain();
      }
    })
  );
