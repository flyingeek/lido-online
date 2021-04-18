
const epsilon2 = 1e-12;
const abs = Math.abs;
const asin = Math.asin;
const cos = Math.cos;
const sin = Math.sin;
const sqrt = Math.sqrt;
/*
    reference
    https://github.com/d3/d3-geo/blob/master/src/projection/equalEarth.js
  */

    const A1 = 1.340264,
    A2 = -0.081106,
    A3 = 0.000893,
    A4 = 0.003796,
    M = sqrt(3) / 2,
    iterations = 12;


/* Initialize the Equal Earth projection
    -------------------------------------------*/
export function init() {
    //lat=phi long=lambda
    //equations considers x0=y0=long0=0
}

/* The Equal Earth forward equations--mapping lat,long to x,y 
    ------------------------------------------------------------*/
export function forward(p) {
    const lambda = p.x;
    const phi = p.y;
    const l = asin(M * sin(phi)), l2 = l * l, l6 = l2 * l2 * l2;
    p.x = this.a * lambda * cos(l) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
    p.y = this.a * l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
    return p;
}

/* The Equal Earth inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------*/
export function inverse(p) {
    const y = p.y / this.a;
    const x = p.x / this.a;

    let l = y, l2 = l * l, l6 = l2 * l2 * l2;
    for (var i = 0, delta, fy, fpy; i < iterations; ++i) {
        fy = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2)) - y;
        fpy = A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2);
        l -= delta = fy / fpy, l2 = l * l, l6 = l2 * l2 * l2;
        if (abs(delta) < epsilon2) break;
    }

    p.x =  M * x * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)) / cos(l);
    p.y = asin(sin(l) / M);
    return p;
}

export var names = ["Equal Earth", "eqearth"];
export default {
    init: init,
    forward: forward,
    inverse: inverse,
    names: names
};