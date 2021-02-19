const TWO_PI = Math.PI * 2;
const FORTPI = Math.PI / 4;
const SPI = 3.14159265359;
const sign = function(x) {
    return x<0 ? -1 : 1;
}
const adjust_lon = function(x) {
  return (Math.abs(x) <= SPI) ? x : (x - (sign(x) * TWO_PI));
}
/*
    reference
    The Times projection
    Flattening the Earth, Snyder, J.P., 1993, p.213-214.
  */


/* Initialize the Times projection
    -------------------------------------------*/
export function init() {
    //no-op
}

/* The Times forward equations--mapping lat,long to x,y
    ------------------------------------------------------------*/
export function forward(p) {
    var lon = p.x;
    var lat = p.y;
    var dlon = adjust_lon(lon - this.long0);
    var T = Math.tan(lat/2.0);
    var S = Math.sin(FORTPI * T);
    var S2 = S*S;
    var x = this.x0 + (this.a * dlon  * (0.74482 - 0.34588*S2));
    var y = this.y0 + (this.a * 1.70711 *  T);
    p.x = x;
    p.y = y;
    return p;
}

/* The Times inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------*/
export function inverse(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var T = p.y / 1.70711 / this.a;
    var S = Math.sin(FORTPI * T);
    var S2 = S*S;
    var lon = adjust_lon(this.long0 + (p.x / this.a / (0.74482 - 0.34588 * S2)));
    var lat = 2 * Math.atan(T);

    p.x = lon;
    p.y = lat;
    return p;
}

export var names = ["The Times", "times"];
export default {
    init: init,
    forward: forward,
    inverse: inverse,
    names: names
};