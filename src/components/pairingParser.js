/* globals editolido */
const parisBase = ['CDG', 'ORY'];
const getFlightTypePNC = (departure, destination) => {
    if (departure.longitude >= -30 && departure.longitude <= 40 && departure.latitude >=25 
        && destination.longitude >= -30 && destination.longitude <= 40 && destination.latitude >=25) {
        return "MC";
    }
    return "LC";
}
const getFlightTypePNT = (distance) => {
    if (distance <= 2100) {
        return "MC1";
    } else if (distance <=3000) {
        return "MC2";
    }
    return "LC"
}
const isBase = (base, iata) => {
    if (base === 'PAR') return parisBase.includes(iata);
    return base === iata;
}

const getMeridians = (base, baseTZ, duties) => {
    const meridians = [];
    for (const duty of duties) {
        const lastLeg = duty.legs[duty.legs.length - 1];
        //console.log(lastLeg, parseFloat(lastLeg.destTZ) - baseTZ, isBase(lastLeg.destIATA), lastLeg.destIATA)
        if (!isBase(base, lastLeg.destIATA)) {
            meridians.push(Math.abs(parseFloat(lastLeg.destTZ) - baseTZ));
        }
    }
    return Math.max(meridians);
}

const addDutyMeta = (duty, {base}) => {
    const lastLeg = duty.legs[duty.legs.length - 1];
    if (lastLeg) {
        duty.OUT = duty.legs[0].OUT;
        duty.IN = lastLeg.IN;
        duty.TVSV = duty.legs.reduce((a, v) => v.blockTime + a, 0);
        if (!isBase(base, lastLeg.destIATA)) {
            duty.layover = lastLeg.destIATA;
            duty.layoverTZ = lastLeg.destTZ;
        }
    }
    return duty;
}

export const pairingData = (ofp) => {
    const results = {};
    if (!ofp) return results;
    let pairing = {};
    let duties = [];
    let scheduledTSV;
    let pattern, match;
    try {
        const pairingText = editolido.extract(ofp.text, 'CREW PAIRING', 'Generated');
        pattern = /TSV\s+-\s+(\d{2}):(\d{2})/u;
        match = pattern.exec(pairingText);
        scheduledTSV = (match) ? parseInt(match[2], 10) + parseInt(match[1], 10) * 60 : 0; //in minutes
        pattern = /DATE\s:\s(\d+)\.(\S{3})\.(\d{4})/u;
        match = pattern.exec(pairingText);
        let month, year; // for pairing start
        if (match) {
            year = parseInt(match[3], 10);
            month = editolido.months3.indexOf(match[2]) + 1; // 1-12
            if (month <= 0) throw new Error('could not extract pairing month');
        } else {
            throw new Error('could not extract pairing month/year');
        }
        pattern = new RegExp(String.raw`>\s${ofp.infos.depIATA}\s\(([-+.0-9]+)\)`, "u");
        match = pattern.exec(pairingText);
        results.depTZ = (match) ? match[1] : '';
        pattern = new RegExp(String.raw`>\s${ofp.infos.destIATA}\s\(([-+.0-9]+)\)`, "u");
        match = pattern.exec(pairingText);
        results.destTZ = (match) ? match[1] : '';
        pattern = /OPERATION VERSION\s(.+?)\s\d+\sNB PAX/u;
        match = pattern.exec(pairingText);
        results.aircraftOpsVersion = (match) ? match[1] : '';
        pattern = /(\d{2})\/(\d{2})\s\S+\s(\S{3})\s>\s(\S{3})\s\(([-+\d.]+)\)\s(\d{2}):(\d{2})\s(?:\d{2}:\d{2})\s(\d{2}):(\d{2})/gu;
        // eslint-disable-next-line init-declarations
        let tz = 0;
        let duty = {"legs": []};
        let flightTypePNC = "MC";
        let flightTypePNT = "MC1";
        let base = undefined;
        for (match of pairingText.matchAll(pattern)) {
            const m = parseInt(match[2], 10); // 1-12
            const d = parseInt(match[1], 10);
            const y = (m < month) ? year + 1 : year;
            const scheduledOut = new Date(Date.UTC(y, m - 1, d, parseInt(match[6], 10), parseInt(match[7], 10))); // month must be 0-11
            const blockTime = parseInt(match[9], 10) + parseInt(match[8], 10) * 60;
            const scheduledIN = new Date(scheduledOut.getTime() + 60000 * blockTime);
            const depIATA = match[3];
            const departure = editolido.iata2GeoPoint(depIATA);
            if (!base) base = (parisBase.includes(depIATA)) ? 'PAR' : depIATA;
            const arrival = editolido.iata2GeoPoint(match[4]);
            const groundDistance = Math.round(departure.distanceTo(arrival, editolido.rad_to_nm));
            if (flightTypePNC !== "LC" && getFlightTypePNC(departure, arrival) === "LC") {
                flightTypePNC = "LC";
            }
            if (flightTypePNT !== "LC") {
                const distanceType = getFlightTypePNT(groundDistance);
                if (distanceType === "LC" || (distanceType === "MC2" && flightTypePNT === "MC1")){
                    flightTypePNT = distanceType;
                }
            }
            if (duty.legs.length !== 0 && scheduledOut - duty.legs[duty.legs.length - 1].IN > 36000000) { // more than 10 hours
                duties.push(addDutyMeta(duty, {base}));
                duty = {"legs": []};
            }
            duty.legs.push({
                //"depPoint": {"latitude": departure.latitude.toFixed(6), "longitude": departure.longitude.toFixed(6)},
                "depICAO": departure.name,
                "depIATA": depIATA,
                //"destPoint": {"latitude": arrival.latitude.toFixed(6), "longitude": arrival.longitude.toFixed(6)},
                "destIATA": match[4],
                "destICAO": arrival.name,
                //"groundDistance": groundDistance,
                "destTZ": match[5],
                "depTZ": tz,
                "OUT": scheduledOut,
                "IN": scheduledIN,
                "blockTime": blockTime,
                "isOFP": (scheduledOut.toISOString() === ofp.infos.ofpOUT.toISOString())
            });
            tz = match[5];
        }
        if (duty.legs.length > 0) duties.push(addDutyMeta(duty, {base}));
        pairing.baseTZ = tz;
        pairing.base = base;
        if (duties.length > 0) {
            duties[0].legs[0].depTZ = tz;
        }
        pairing.flightTypePNT = (flightTypePNT === "MC2" && getMeridians(base, parseFloat(pairing.baseTZ), duties) >= 4) ? "LC" : flightTypePNT;
        pairing.flightTypePNC = flightTypePNC;
        //console.log(getMeridians(base, parseFloat(pairing.baseTZ), duties))

    } catch (err) {
        if (!(err instanceof editolido.StringExtractException)) {
            console.error(err);
        }
        duties = [];
    }
    results.pairing = pairing;
    results.pairing.duties = duties; 
    const duty = duties.filter(duty => duty.legs.reduce((a, v) => v.isOFP || a, false)).pop();
    results.scheduledTSV = scheduledTSV; //deprecated
    if (duty) {
        duty.TSV = scheduledTSV;
        if (duty.legs.length > 0) {
            const lastLeg = duty.legs[duty.legs.length - 1];
            if (!isBase(pairing.base, lastLeg.destIATA)) {
                duty.layover = lastLeg.destIATA;
                duty.layoverTZ = lastLeg.destTZ;
            }
        }
    }
    results.duty = duty;
    return results;
}