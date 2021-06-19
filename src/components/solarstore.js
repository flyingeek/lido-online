import {derived} from "svelte/store";
import {sun, moon, geomagneticLatitudeAndKp} from "./suncalc";
import {ofp, takeOffTime} from "../stores";

function* iterateSegment({prev, next, takeOffTime, segmentLength, getState, stateMap, increment=30000 /* 30sec */}){
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
            const type =  stateMap.get(prevState)([prevState, state]);
            yield({position: pos, type, date, fl});
            if (state === next.state) break;
        }
        prevState = state;
    }
}
const getSolarDefault = () => {
    return {[moon.name]: [], [sun.name]: [], 'route': [], 'takeOffTs': 0};
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
        const routeMatrix = [];
        for (const object of [sun, moon]) {
            const matrix = [];
            let prev = null;
            for (const [i, [p, sum, level]] of timeMatrix.entries()) {
                let fl = level;
                if (i === 0 || i === last) fl = 0;
                const date = new Date(takeOffTime + sum * 60000);
                const state = object.getState(date, p, fl).state;
                const next = {p, sum, fl, state};
                if (prev && state !== prev.state) {
                    const segmentLength = distanceMatrix[i][1] - distanceMatrix[i-1][1];
                    const params = {
                        prev, 
                        next, 
                        takeOffTime, 
                        segmentLength, 
                        getState: object.getState, 
                        stateMap: object.stateMap, 
                        increment: (object.name === 'sun') ? 30000 : 60000
                    };
                    for (const data of iterateSegment(params)) {
                        matrix.push(data);
                        if (object === sun) {
                            const [,minKp] = geomagneticLatitudeAndKp(data.position, data.date);
                            routeMatrix.push({/*'p': data.position, */'date': data.date, minKp, 'state': data.type});
                        }
                    }
                }
                prev = next;
                if (object === sun) {
                    const [, minKp] = geomagneticLatitudeAndKp(p, date);
                    routeMatrix.push({/*p, */date, minKp, state});
                }
            }
            results[object.name] = matrix;
        }

        results['route'] = routeMatrix;
        results['takeOffTs'] = takeOffTime;
        return results;
    },
    getSolarDefault() // initial value
);