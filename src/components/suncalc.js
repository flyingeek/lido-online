/* globals editolido */
// shortcuts for easier to read formulas
const PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    acos = Math.acos,
    atan = Math.atan2,
    deg = 180 / PI,
    rad  = PI / 180;

// date/time constants and conversions
const dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;

const toJulian = (date) => date.valueOf() / dayMs - 0.5 + J1970;
const toCenturies = (date) => (toJulian(date) - J2000) / 36525.0;

// modulo is not always remainder
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Remainder
const modulo = (a, n) => ((a % n ) + n ) % n;



//const azimuth = (H, phi, dec) => atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi));
const altitude = (H, phi, dec) => asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));

const geomMeanLongSun = (t) => {
    const L0 = 280.46646 + t * (36000.76983 + t*(0.0003032));
    return modulo(L0, 360); // in degrees
};

const geomMeanAnomalySun = (t) => {
    const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return M; // in degrees
};

const eccentricityEarthOrbit = (t) => {
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    return e; // unitless
};

const sunEqOfCenter = (t) => {
    const m = rad * geomMeanAnomalySun(t);
    const C = sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin(2 * m) * (0.019993 - 0.000101 * t) + sin(3 * m) * 0.000289;
    return C; // in degrees
};

const sunTrueLong = (t) => {
    return geomMeanLongSun(t) + sunEqOfCenter(t); // in degrees
};

const sunApparentLong = (t) => {
    const o = sunTrueLong(t);
    const omega = 125.04 - 1934.136 * t;
    const lambda = o - 0.00569 - 0.00478 * sin(rad * omega);
    return lambda; // in degrees
};

const meanObliquityOfEcliptic = (t) => {
    const seconds = 21.448 - t*(46.8150 + t*(0.00059 - t*(0.001813)));
    const e0 = 23.0 + (26.0 + (seconds/60.0))/60.0;
    return e0; // in degrees
};

const obliquityCorrection = (t) => {
    const e0 = meanObliquityOfEcliptic(t);
    const omega = 125.04 - 1934.136 * t; // in degrees
    const e = e0 + 0.00256 * cos(rad * omega);
    return e; // in degrees
};

const sunDeclinationInRadians = (t) => {
    const e = rad * obliquityCorrection(t);
    const lambda = rad * sunApparentLong(t);
    const sint = sin(e) * sin(lambda);
    const theta = asin(sint);
    return theta; // in radians
};
const sunRtAscensionInRadians = (t) => {
    var e = rad * obliquityCorrection(t);
    var lambda = rad * sunApparentLong(t);
    var tananum = cos(e) * sin(lambda);
    var tanadenom = cos(lambda);
    var alpha = atan(tananum, tanadenom);
    return alpha; // in radians
};

//Equation of time in minutes
const eqTime = (t) => {
    const e = eccentricityEarthOrbit(t);
    const epsilon = rad * obliquityCorrection(t);
    const l0 = rad * geomMeanLongSun(t);
    const m = rad * geomMeanAnomalySun(t);
    const y = Math.pow(tan(epsilon / 2), 2);

    const Etime = y * sin(2.0 * l0) - 2.0 * e * sin(m) + 4.0 * e * y * sin(m) * cos(2 * l0) - 0.5 * y * y * sin(4 * l0) - 1.25 * e * e * sin(2 * m);
    return deg * Etime * 4.0; // in minutes of time
};



export const sunAzEl = (date, point) => {
    const {latitude, longitude} = point;
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const t = toCenturies(date);
    const solarTimeFix = eqTime(t) + (4 * longitude);
    const theta = sunDeclinationInRadians(t);
    // True Solar Time
    let tst = ((hours * 60) + minutes + (seconds / 60) + solarTimeFix) % 1440;
    // Solar hour angle
    let ha = (tst / 4) - 180;
    if (ha < -180) {
        ha += 360;
    }
    const phi = rad * latitude;
    let csz = (sin(phi) * sin(theta)) + (cos(phi) * cos(theta) * cos(rad * ha));
    if (csz > 1.0) {
        csz = 1.0
    } else if (csz < -1.0) { 
        csz = -1.0
    }
    const zenith = acos(csz);
    // const azDenom = cos(phi) * sin(zenith);
    // let azimuth;
    // if (Math.abs(azDenom) > 0.001) {
    //     var azRad = ((sin(phi) * cos(zenith)) - sin(theta)) / azDenom;
    //     if (Math.abs(azRad) > 1.0) {
    //         if (azRad < 0) {
    //             azRad = -1.0
    //         } else {
    //             azRad = 1.0
    //         }
    //     }
    //     azimuth = 180.0 - deg * acos(azRad);
    //     if (ha > 0.0) {
    //         azimuth = -azimuth;
    //     }
    // } else {
    //     azimuth = (latitude > 0.0) ? 180 : 0;
    // }
    // if (azimuth < 0.0) {
    //     azimuth += 360.0
    // }
    // we do not need to calculate refraction for our usage (see isNight)
    return {elevation: 90 - (deg * zenith)};
};
export const sunStateMap = new Map([
    ['night', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'astronomicalDawn': 'nightStart'],
    ['astronomical twilight', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'nauticalDawn': 'astronomicalDusk'],
    ['nautical twilight', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'civilDawn': 'nauticalDusk'],
    ['civil twilight', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'sunrise': 'civilDusk'],
    ['sunrise end', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'sunriseEnd' : 'sunset'],
    ['day', ([prevState, newState]) => (isSunRising(prevState, newState)) ? 'dayStart': 'sunsetStart'],
]);

const sunRisingStates = Array.from(sunStateMap.keys());
export const isSunRising = (prevState, newState) => {
    return sunRisingStates.indexOf(newState) >= sunRisingStates.indexOf(prevState);
};
export const sunStateAndRising = (date, point, fl) => {
    const {state, elevation} = sunState(date, point, fl);
    //compare sun elevation beetween date and date + 10mn
    const isRising =  elevation < sunAzEl(new Date(date.getTime() + 600000), point).elevation;
    return {state, isRising};
};

const sunStates = [ // order important
    [   -15, 'night'], // used for color in timeline and for aurora prediction real astronomical night starts at -18
    [   -12, 'astronomical twilight'],
    [    -6, 'nautical twilight'],
    [-0.833, 'civil twilight'],
    [     1, 'sunrise end'] // not related to sunrise end (-0.3) only for timeline color
];

export const sunState = (date, point, fl=0) => {
    const elevation = sunAzEl(date, point).elevation;
    // -0.833 includes refraction at sea level
    // formula includes altitude and altitude refraction
    // https://en.wikipedia.org/wiki/Sunrise_equation
    const correction = 1.15 * Math.sqrt(fl * 100) / 60;
    for (const[value, state] of sunStates) {
        if (elevation <= value - correction) {
            return {state, elevation};
        }
    }
    return {state: 'day', elevation};
};

/* Moon Equations from https://github.com/mourner/suncalc */
const toDays = (date) => toJulian(date) - J2000;
const e = rad * 23.4397; // obliquity of the Earth
const rightAscension = (l, b) => atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
const declination = (l, b) => asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
const siderealTime = (d, lw) => rad * (280.16 + 360.9856235 * d) - lw;
const moonCoords = (d) => { // geocentric ecliptic coordinates of the moon
    const L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d),  // mean distance

        l  = L + rad * 6.289 * sin(M), // longitude
        b  = rad * 5.128 * sin(F),     // latitude
        dt = 385001 - 20905 * cos(M);  // distance to the moon in km
    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
};
export const getMoonIllumination = (date) => {

    const t = toCenturies(date),
        s = {dec: sunDeclinationInRadians(t), ra: sunRtAscensionInRadians(t)},
        m = moonCoords(toDays(date)),

        sdist = 149598000, // distance from Earth to Sun in km

        phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra)),
        inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi)),
        angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) -
                cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));

    return {
        fraction: (1 + cos(inc)) / 2,
        phase: 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI,
        angle: angle
    };
};
export const getMoonPosition = function (date, point) {

    var lw  = rad * -point.longitude,
        phi = rad * point.latitude,
        d   = toDays(date),

        c = moonCoords(d),
        H = siderealTime(d, lw) - c.ra,
        h = altitude(H, phi, c.dec);
        // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        //pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));

    //h = h + astroRefraction(h); // altitude correction for refraction

    return {
        //azimuth: azimuth(H, phi, c.dec),
        altitude: h,
        //distance: c.dist,
        //parallacticAngle: pa
    };
};
export const moonState = (date, point, fl) => { // true => visible
    // + altitude of moonrise is 8mn of arc (0.133*rad)
    // - refraction correction at this altitude is 0.008116109187895005
    // we apply the same altitude correction that the sun (really ?)
    const correction = rad * 1.15 * Math.sqrt(fl * 100) / 60;
    const altitude = getMoonPosition(date, point).altitude;
    return  {state: altitude > -0.005794821282742547 - correction, elevation: deg * altitude};
}
export const moonStateMap = new Map([
    [false, () => 'moonrise'],
    [true, () => 'moonset']
]);
export const sun = {name: 'sun', getState: sunState, stateMap: sunStateMap};
export const moon = {name: 'moon', getState: moonState, stateMap: moonStateMap};

export const geomagneticLatitudeAndKp = (p, date) => {
    let year = date.getUTCFullYear();
    if (year < 2016) year = 2016;
    if (year > 2025) year = 2025;
    // from http://wdc.kugi.kyoto-u.ac.jp/poles/polesexp.html
    const poleLatLngByYear = {
        '2016': [80.4, -72.6],
        '2017': [80.5, -72.6],
        '2018': [80.5, -72.7],
        '2019': [80.6, -72.7],
        '2020': [80.7, -72.7],
        '2021': [80.7, -72.7],
        '2022': [80.7, -72.7],
        '2023': [80.8, -72.7],
        '2024': [80.8, -72.6],
        '2025': [80.9, -72.6]
    };
    const poleLatLng = poleLatLngByYear[year.toString()];
    if (p.latitude <= 40) return [-90, 99]; // no need to compute
    const mlat = 90 - p.distanceTo(new editolido.GeoPoint(poleLatLng)) * deg;
    if (mlat < 45) return [-90, 99]; // no need to compute
    const Kp = (mlat - 66.5) / 2 // https://www.swpc.noaa.gov/content/tips-viewing-aurora
    return [mlat, (Kp > 0) ? 0 : Math.floor(-Kp)];
};