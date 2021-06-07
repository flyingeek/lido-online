// shortcuts for easier to read formulas
const PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    acos = Math.acos,
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
}


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



export const sunElevation = ({date, latitude, longitude}) => {
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
    const zenith = deg * acos(csz)
    const elevation = 90 - zenith;
    // we do not need to calculate refraction for our usage (see isNight)
    return elevation;
};

export const nightEvents = {
    'night': ['astronomicalDawn', 'nightStart'],
    'astronomical twilight': ['nauticalDawn', 'astronomicalDusk'],
    'nautical twilight': ['civilDawn', 'nauticalDusk'],
    'civil twilight': ['sunrise', 'civilDusk'],
    'day': ['dayEnd', 'sunset']
};
export const nightEventNames = {
    'dayEnd': 'dayEnd',
    'nightStart': 'nightStart',
    'astronomicalDawn': 'Aube astronomique',
    'astronomicalDusk': 'Nuit astronomique',
    'nauticalDawn': 'Aube nautique',
    'nauticalDusk': 'Nuit nautique',
    'civilDawn': 'Aube civile',
    'civilDusk': 'Nuit civile',
    'sunrise': 'Lever du soleil',
    'sunset': 'Coucher du soleil'
}
const risingStates = ['night', 'astronomical twilight', 'nautical twilight', 'civil twilight', 'day', 'day'];

export const isRising = (prevState, newState) => {
    return risingStates.indexOf(newState) >= risingStates.indexOf(prevState);
}

const nightStates = [ // order important
    [   -18, 'night'],
    [   -12, 'astronomical twilight'],
    [    -6, 'nautical twilight'],
    [-0.833, 'civil twilight'],
];

export const nightState = (sunElevation, fl=0) => {
    // -0.833 includes refraction at sea level
    // formula includes altitude and altitude refraction
    // https://en.wikipedia.org/wiki/Sunrise_equation
    const correction = 1.15 * Math.sqrt(fl * 100) / 60;
    for (const[value, name] of nightStates) {
        if (sunElevation <= value - correction) {
            return name;
        }
    }
    return 'day';
}
//export const isNight = (sunElevation, fl=0) => nightState(sunElevation, fl) === 'night';
//export const isDay = (sunElevation, fl=0) => nightState(sunElevation, fl) === 'day';
