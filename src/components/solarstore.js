import {derived} from "svelte/store";
import {sun, moon} from "./suncalc";
import {ofp, takeOffTime} from "../stores";

function* iterateSegment({prev, next, takeOffTime, flightTime, segmentLength, getState, stateMap, increment=30000 /* 30sec */}){
    let prevState = prev.state;
    const min2ms = 60000;
    const lowerLimit = prev.sum * min2ms;
    const upperLimit = next.sum * min2ms;
    for(let m = lowerLimit + increment; m <= upperLimit; m= m + increment){
        let fl = prev.fl;
        if (m >= upperLimit) fl = next.fl;
        const date = new Date(takeOffTime + m);
        let pos;
        const segmentTime = upperLimit - lowerLimit;
        if (segmentTime === 0) {
            pos = next.p;
        }else{
            const fraction = (m - lowerLimit) / segmentTime;
            pos = prev.p.atFraction(next.p, fraction, segmentLength);
        }
        const {state} = getState(date, pos, fl);
        if (state !== prevState) {
            const relpos = Math.round(1000 * m / flightTime) / 10;
            const type =  stateMap.get(prevState)([prevState, state]);
            yield({position: pos, type, date, fl, relpos});
            if (state === next.state) break;
        }
        prevState = state;
    }
}
const getSolarDefault = () => {
    return {[moon.name]: [], [sun.name]: [], 'route': []};
};

export const solar = derived(
    [ofp, takeOffTime],
    ([$ofp, $takeOffTime]) => {
        if (!$takeOffTime || !$ofp || $ofp.timeMatrix.length === 0) return getSolarDefault();
        const takeOffTime = $takeOffTime.getTime();
        const results = getSolarDefault();
        const timeMatrix = $ofp.timeMatrix;
        const distanceMatrix = $ofp.distanceMatrix;
        let last = timeMatrix.length - 1;
        const flightTime = timeMatrix[last][1] * 60000;
        const routeMatrix = [];
        for (const object of [sun, moon]) {
            const matrix = [];
            let prev = null;
            for (const [i, [p, sum, level]] of timeMatrix.entries()) {
                let fl = level;
                if (i === 0 || i === last) fl = 0;
                const date = new Date(takeOffTime + sum * 60000);
                const {state, elevation} = object.getState(date, p, fl);
                let slope = 0;
                if (prev) {
                  slope = (prev.elevation - elevation <= 0) ? 1 : -1;
                }
                const next = {p, sum, fl, state, elevation, slope};
                if (prev && (state !== prev.state || (state === prev.state && slope !== prev.slope))) {
                    const segmentLength = distanceMatrix[i][1] - distanceMatrix[i-1][1];
                    const params = {
                        prev,
                        next,
                        takeOffTime,
                        flightTime,
                        segmentLength,
                        getState: object.getState,
                        stateMap: object.stateMap,
                        increment: (object.name === 'sun') ? 30000 : 60000
                    };
                    for (const data of iterateSegment(params)) {
                        matrix.push(data);
                        if (object === sun) {
                            routeMatrix.push(data);
                        }
                    }
                }
                prev = next;
                if (object === sun) {
                    routeMatrix.push({position: p, type: state, date, relpos: Math.round(1000 * sum * 60000 / flightTime) / 10});
                }
            }
            results[object.name] = matrix;
        }
        results['route'] = routeMatrix;
        return results;
    },
    getSolarDefault() // initial value
);
