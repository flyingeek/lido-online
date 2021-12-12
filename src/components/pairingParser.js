/* globals editolido */
const parisBase = ['CDG', 'ORY'];
// const getFlightTypePNC = (departure, destination) => {
//     if (departure.longitude >= -30 && departure.longitude <= 40 && departure.latitude >=25 
//         && destination.longitude >= -30 && destination.longitude <= 40 && destination.latitude >=25) {
//         return "MC";
//     }
//     return "LC";
// };
const getFlightTypePNT = (distance) => {
    if (distance <= 2100) {
        return "MC1";
    } else if (distance <=3000) {
        return "MC2";
    }
    return "LC"
};
const isBase = (base, iata) => {
    if (base === 'PAR') return parisBase.includes(iata);
    return base === iata;
};
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
};
const reportingObject = (duty, minutesOffset) => {
    const obj = {
        'value': new Date(duty.legs[0].OUT.getTime() - (minutesOffset * 60000))
    };
    let computedTZ = editolido.tzOffset(duty.depIATA, obj.value.toISOString());
    obj.tz = computedTZ || duty.depTZ;
    obj.safeTZ = !!computedTZ;
    obj.textValue = dateToHHMM(obj.value);
    return obj;
};

const decimalToHHMM = (v) => `${Math.floor(v).toString().padStart(2,0)}:${((v - Math.floor(v)) * 60).toFixed(0).padStart(2,0)}`;
const minutesToHHMM = (v) => `${Math.floor(v/60).toString().padStart(2,0)}:${(v - Math.floor(v/60) * 60).toFixed(0).padStart(2,0)}`;
const dateToHHMM = (v) => `${v.getUTCHours().toString().padStart(2,0)}:${v.getUTCMinutes().toString().padStart(2,0)}`;
/* output latest out calculation */
const diff_formula = (maxTSV, duty) => {
    if (maxTSV.IN.getTime() < duty.IN.getTime()) return '';
    if (maxTSV.OUT) {
        const blockTime = (maxTSV.IN.getTime() - maxTSV.OUT.getTime()) / 60000;
        return `<span class="formula">${dateToHHMM(maxTSV.IN)}z - ${minutesToHHMM(blockTime)} = </span>${dateToHHMM(maxTSV.OUT)}z`
    }
    return 'calculé uniquement sur la dernière étape du SV';
};
const mayWrap = (text, emmetTag, condition) => {
    const [tag, className] = emmetTag.split('.');
    if (condition) {
        if (className) {
            return `<${tag} class="${className}">${text}</${tag}>`;
        }else{
            return `<${tag}>${text}</${tag}>`;
        }
    }
    return text;
};
const wrap = (text, emmetTag) => mayWrap(text, emmetTag, true);
const manex = ref => wrap(`MANEX ${ref}`, 'cite')

const addDutyMeta = (duty, flightTypeAircraft, base) => {
    if (!Array.isArray(duty.legs) || duty.legs.length <= 0) return duty;
    const firstLeg = duty.legs[0];
    const lastLeg = duty.legs[duty.legs.length - 1];
    if (firstLeg.depTZ === undefined) {  // add first matching timezone for departure if needed
        for (const leg of duty.legs.slice(1)) {
            if (leg.destIATA === firstLeg.depIATA || leg.destIATA === 'ORY' && firstLeg.depIATA === 'CDG' || leg.destIATA === 'CDG' && firstLeg.depIATA === 'ORY') {
                firstLeg.depTZ = leg.destTZ;
                break;
            }
        }
    }
    let deltaAF=60, deltaFTL=60;
    if (isBase(base, firstLeg.depIATA)) {
        if (base === "PAR") {
            if (flightTypeAircraft === "LC") {
                deltaFTL = 105;
                deltaAF = 90;
            } else {
                deltaFTL = 90;
                deltaAF = 75;
            }
            if (firstLeg.isMEP){
                deltaFTL = 75;
                deltaAF = 60;
            }
        } else if (base === "PTP") {
            deltaFTL = 75;
            deltaAF = 75;
        }
    }else{
        if (base === "PAR") {
            if (flightTypeAircraft === "LC") {
                deltaFTL = 75;
                deltaAF = 75;
            }
        }
        if (duty.legs[0].isMEP){
            deltaFTL = 60;
            deltaAF = 60;
        }
    }
    duty.OUT = firstLeg.OUT;
    duty.depTZ = firstLeg.depTZ;
    duty.depIATA = firstLeg.depIATA;
    duty.firstLegIsMEP = firstLeg.isMEP;
    duty.reportingFTL = reportingObject(duty, deltaFTL);
    duty.reportingAF = reportingObject(duty, deltaAF);
    duty.IN = lastLeg.IN;
    duty.destIATA = lastLeg.destIATA;
    //duty.destTZ = lastLeg.destTZ;
    duty.scheduledBlockTime = (duty.IN.getTime() - duty.OUT.getTime()) / 60000;
    return duty;
}

//for better understanding, see https://www.easa.europa.eu/faq/47576
const addAcclimatization = (duties) => {
    let previousReportingFTL, previousDepIATA, previousAcclimatizationValue;
    const dutiesWithAcclimatization = [];
    const steps = [];
    if (!Array.isArray(duties) || duties.length === 0) return [dutiesWithAcclimatization, steps.pop()];
    const firstDuty = duties[0];
    for (const duty of duties) {
        const isOFPDuty = duty.legs.reduce((a, leg) => a || leg.isOFP, false);
        let acclimatization;
        if (!previousReportingFTL){
            acclimatization = {value: 'Base', 'tz': duty.reportingFTL.tz, 'iata': duty.depIATA, 'safeTZ': duty.reportingFTL.safeTZ};
        }else if (previousAcclimatizationValue !== 'X') {
            if (Math.abs(parseFloat(previousReportingFTL.tz) - parseFloat(duty.reportingFTL.tz)) <= 2) {
                acclimatization = {value: '±2', 'tz': duty.reportingFTL.tz, 'iata': duty.depIATA, 'safeTZ': duty.reportingFTL.safeTZ};
            }else{
                acclimatization = computeAcclimatization(previousReportingFTL, previousDepIATA, previousAcclimatizationValue, duty, (isOFPDuty) ? steps : []);
            }
        }else{
            acclimatization = computeAcclimatization(firstDuty.reportingFTL, firstDuty.depIATA, previousAcclimatizationValue, duty, (isOFPDuty) ? steps : []);
        }
        dutiesWithAcclimatization.push({...duty, acclimatization});
        previousReportingFTL = duty.reportingFTL;
        previousAcclimatizationValue = acclimatization.value;
        previousDepIATA = duty.depIATA;
    }
    return [dutiesWithAcclimatization, steps.pop()];
};

const getDutyWithFTL = ([duties, acclimatizationStep], {base, flightTypeAircraft, baseTZ, flightTypePNT, isCargo}, steps) => {
    const OFPDutyIndex = duties.findIndex(duty => duty.legs.reduce((a, leg) => a || leg.isOFP, false));
    const duty = duties[OFPDutyIndex];
    const previousDuty = (OFPDutyIndex > 0) ? duties[OFPDutyIndex - 1] : undefined;
    const preOperational = true;

    const addStep = (v) => {
        steps.push(v);
    };
    const addStepLC = (v) => {
        if (flightTypeAircraft === 'LC') addStep(v);
    }
    const isLastDuty = OFPDutyIndex === duties.length - 1;
    let courrierCroise = false;


    addStep(`SV débute par une MEP: ${(duty.firstLegIsMEP) ? "OUI" : "NON"}`);
    addStep(`début TSV FTL: ${dateToHHMM(duty.reportingFTL.value)}z ${manex("07.05.01 & 07.05.05")}`);
    addStep(`début TSV AF: ${dateToHHMM(duty.reportingAF.value)}z ${manex("07.08.01")}`);
    
    duty.FDP = (duty.IN.getTime() - duty.reportingFTL.value.getTime()) / 60000;
    duty.TSVAF = (duty.IN.getTime() + (15 * 60000) - duty.reportingAF.value.getTime()) / 60000; //MANEX 07.08.01.A

    if (base === 'PAR' && isLastDuty && duties[0].depIATA !== duty.destIATA) { // courrier croisé
        addStep(`Dernier SV d'un courrier croisé: OUI`);
        addStep(`Le TSV AF se termine au bloc réel +75mn ${manex("07.08.01.A")}`);
        courrierCroise = true;
        duty.TSVAF += 60;
    }else{
        addStep(`Dernier SV d'un courrier croisé: NON`);
        addStep(`Le TSV AF se termine au bloc réel +15mn ${manex("07.08.01.A")}`);
    }
    addStep(`TSV AF: ${minutesToHHMM(duty.TSVAF)} ${manex("07.08.01.A")}`);
    addStep(`Le TSV FTL se termine au bloc réel ${manex("07.02.Définitions")}`);
    addStep(`TSV FTL: ${minutesToHHMM(duty.FDP)} ${manex("07.02.Définitions")}`);

    addStep(`nombre de tronçons du SV au sens FTL: ${ftlNumberOfLegs(duty.legs)} ${manex("07.05.05")}`);
    const maxTSVFTL = {
        'PEQ2': {},
        'PEQ3': {'value': maxFDPWithRest(duty.legs, 3, preOperational)},
        'PEQ4': {'value': maxFDPWithRest(duty.legs, 4, preOperational)}
    };
    if(preOperational) addStepLC(`<b>PEQ3/PEQ4 PRE considéré comme opérationnel</b>`);
    addStepLC(`TSV MAX FTL PEQ3: ${decimalToHHMM(maxTSVFTL.PEQ3.value)} ${manex("07.05.04.C")}`);
    addStepLC(`TSV MAX FTL PEQ4: ${decimalToHHMM(maxTSVFTL.PEQ4.value)} ${manex("07.05.04.C")}`);
    if (duty.acclimatization.value === 'Base'){
        addStep(`Equipage acclimaté à la base ${duty.depIATA} (${mayWrap(`GMT${duty.reportingFTL.tz}`, 'b', !duty.acclimatization.safeTZ)}) ${manex("07.02.Définitions")}`);
    }else if (duty.acclimatization.value === '±2') {
        addStep(`méridiens traversés <= 2 => équipage acclimaté ${duty.acclimatization.iata} (${mayWrap(`GMT${duty.reportingFTL.tz}`, 'b', !duty.acclimatization.safeTZ)})  ${manex("07.02.Définitions")}`);
    }else{
        if (acclimatizationStep) addStep(acclimatizationStep);
        addStep(`ACCLIMATATION: "${duty.acclimatization.value}"${(duty.acclimatization.value !== 'X') ? ' fuseau GMT' + duty.acclimatization.tz + ' (' + duty.acclimatization.iata + ')': ''} ${manex("07.02.Définitions")}`);
    }
    if (duty.acclimatization.value === 'X') {
        const sgrf = false;
        maxTSVFTL.PEQ2 = matchInTable([ftlNumberOfLegs(duty.legs), sgrf], FDP_EASA_BASE_UNKNOWN_ACCLIMATIZATION_DATA);
        addStep(`<b>accord spécifique SGRF: NON</b> -> ajouter 1h au TSV MAX FTL PEQ2 si OUI`)
        addStep(`TSV MAX FTL PEQ2: ${decimalToHHMM(maxTSVFTL.PEQ2.value)} ${manex("07.05.04.A.b")}`);
    }else{
        const refDate = new Date(duty.reportingFTL.value.getTime() + (parseFloat(duty.acclimatization.tz) * 3600000));
        const refTime = refDate.getUTCHours() + (refDate.getUTCMinutes() / 60);
        maxTSVFTL.PEQ2 = matchInTable([ftlNumberOfLegs(duty.legs), refTime], FDP_EASA_BASE_ACCLIMATED_DATA);
        addStep(`Heure de référence FTL: ${dateToHHMM(refDate)}`)
        addStep(`TSV MAX FTL PEQ2: ${decimalToHHMM(maxTSVFTL.PEQ2.value)} ${manex("07.05.04.A.a")}`);
    }
    let layoverRestTimeHours;
    if (previousDuty) {
        const previousEndTSVAFTime = previousDuty.IN.getTime() + (15 * 60000); // 15 because previous duty can not be the last duty
        layoverRestTimeHours = (duty.reportingAF.value.getTime() - previousEndTSVAFTime) / 3600000;
        addStep(`<b>Durée du repos en escale: ${decimalToHHMM(layoverRestTimeHours)}</b> -> sinon, vérifier TSV MAX AF ≤ repos`);
    }else{
        layoverRestTimeHours = 100; //big enough number
    }
    const maxTSVAF = {
        'PEQ2': {},
        'PEQ3': {'value': maxTSVWithRest(duty.legs, 3, isCargo, steps)},
        'PEQ4': {'value': maxTSVWithRest(duty.legs, 4, isCargo, steps)}
    };
    addStep(`nombre de tronçons du SV au sens AF: ${afNumberOfLegs(duty.legs)} ${manex("07.08.03 & 07.08.05.D")}`);
    addStepLC(`<b>Vol Cargo: ${(isCargo) ? "OUI" : "NON"}</b>`);
    addStepLC(`TSV MAX AF PEQ3 (LC): ${decimalToHHMM(maxTSVAF.PEQ3.value)} ${manex("07.08.05.C")}`);
    addStepLC(`TSV MAX AF PEQ4 (LC): ${decimalToHHMM(maxTSVAF.PEQ4.value)} ${manex("07.08.05.C")}`);
    const refAFTZ = computeRefTimeTZAF(flightTypeAircraft, flightTypePNT, baseTZ, base, (duty.reportingAF.value.getTime() - duties[0].reportingAF.value.getTime())/3600000, duty, steps);
    const refDateAF = new Date(duty.reportingAF.value.getTime() + (parseFloat(refAFTZ) * 3600000));
    const refTimeAF = refDateAF.getUTCHours() + (refDateAF.getUTCMinutes() / 60);
    maxTSVAF.PEQ2 = computeMaxTSVAF_PEQ2(duty.legs, flightTypeAircraft, refTimeAF, layoverRestTimeHours);
    addStep(`Fuseau de référence AF: GMT${refAFTZ} ${manex("07.08.01.A")}`);
    addStep(`Heure de référence AF: ${dateToHHMM(refDateAF)} ${manex("07.08.01.A")}`);
    addStep(`TSV MAX AF PEQ2: ${decimalToHHMM(maxTSVAF.PEQ2.value)} ${(flightTypeAircraft === "LC") ? manex("07.08.05.B") : manex("07.08.03.B")}`);

    const latestIN_AF = (peq) => new Date(duty.reportingAF.value.getTime() + (maxTSVAF[peq].value * 3600000) - (((courrierCroise) ? 75 : 15) * 60000));
    const latestIN_FTL = (peq) => new Date(duty.reportingFTL.value.getTime() + (maxTSVFTL[peq].value * 3600000));
    const maxTSV = (peq) => {
        const IN_AF = latestIN_AF(peq);
        const IN_FTL = latestIN_FTL(peq);
        return (IN_FTL <= IN_AF)
                ? {'rule': 'FTL', 'value': maxTSVFTL[peq].value, 'IN': IN_FTL, 'isForbidden': IN_FTL.getTime() < duty.IN.getTime()}
                : {'rule': 'AF', 'value': maxTSVAF[peq].value, 'IN': IN_AF, 'isForbidden': IN_AF.getTime() < duty.IN.getTime()};
    };
    const maxTSV_PEQ2 = maxTSV('PEQ2');
    const maxTSV_PEQ3 = maxTSV('PEQ3');
    const maxTSV_PEQ4 = maxTSV('PEQ4');
    const getReposPNC = maxTSV => matchInTable([preOperational, (maxTSV.rule === 'FTL') ? maxTSV.value : (maxTSV.IN.getTime() - duty.reportingFTL.value.getTime()) / 3600000], FDP_EASA_PNC_PRE_REST).value;
    maxTSV_PEQ2.reposPNC = 0;
    addStepLC(`Calculs des repos en vol FTL pour le PNC au TSV MAX`);
    maxTSV_PEQ3.reposPNC =  getReposPNC(maxTSV_PEQ3);
    maxTSV_PEQ4.reposPNC =  getReposPNC(maxTSV_PEQ4);
    
    const FDP_PNC_REST = (duty.FDP /60 > maxTSVFTL.PEQ2.value)
                            ? matchInTable([preOperational, duty.FDP/60], FDP_EASA_PNC_PRE_REST)
                            : {"value" : 0};
    
    addStepLC(`Le repos PNC en vol AF est basé sur le temps de vol OFP`);
    addStepLC(`Le repos PNC en vol FTL est basé sur le <b>TSV FTL PNC supposé identique à celui du CDB</b>`);
    const ofpLeg = duty.legs.filter(leg => leg.isOFP).pop();
    const reposPNC = {
        "FTL":{'value': FDP_PNC_REST.value}
    }
    let retardPNC;
    const RETARD_PNC_TSVMAX_1730 = "TSV AF PNC maxi 17h30";
    const RETARD_PNC_TSVMAX_1500 = "TSV AF PNC maxi 15h00";
    if (isBase(base, ofpLeg.depIATA) && flightTypeAircraft === "LC") { // MANEX 07.09.06.B
        retardPNC = {};
        retardPNC.value = 360 - 30 * Math.ceil(Math.max((duty.scheduledBlockTime - 360), 0) / 60);
        retardPNC.textValue = minutesToHHMM(retardPNC.value);
        if (duty.legs.length === 1 && duty.scheduledBlockTime > 870) {
            retardPNC.textValue = RETARD_PNC_TSVMAX_1730;
            retardPNC.textOUT = retardPNC.textValue;
        }else if (duty.legs.length > 1 && duty.scheduledBlockTime > 570) {
            retardPNC.textValue = RETARD_PNC_TSVMAX_1500;
            retardPNC.textOUT = retardPNC.textValue;
        }else{
            retardPNC.OUT = new Date(duty.OUT.getTime() + retardPNC.value * 60000);
            retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
        }
        addStepLC(`A la base, il y a un retard maximum pour les PNC LC de ${retardPNC.textValue} <b>(si SV PNC identique)</b>`);
    }
    const blockTimeOFP = duty.legs[duty.legs.length - 1].blockTimeOFP;
    if (blockTimeOFP) { // on last leg perform departure computations
        addStep(`Dernière étape du SV, butées départ calculées avec le bloc OFP: ${minutesToHHMM(blockTimeOFP)}`);
        maxTSV_PEQ2.OUT = new Date(maxTSV_PEQ2.IN.getTime() - (blockTimeOFP * 60000));
        maxTSV_PEQ3.OUT = new Date(maxTSV_PEQ3.IN.getTime() - (blockTimeOFP * 60000));
        maxTSV_PEQ4.OUT = new Date(maxTSV_PEQ4.IN.getTime() - (blockTimeOFP * 60000));
        if (retardPNC) {
            const afOffset = (courrierCroise) ? 90 : 30;
            const departureDateFromTSV = tsvMax =>  new Date(duty.reportingAF.value.getTime() + (tsvMax * 3600000) - (afOffset * 60000) - (blockTimeOFP * 60000));
            if (retardPNC.textValue === RETARD_PNC_TSVMAX_1730) {
                retardPNC.OUT = departureDateFromTSV(17.5);
                retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
            }else if (retardPNC.textValue === RETARD_PNC_TSVMAX_1500) {
                retardPNC.OUT = departureDateFromTSV(17.5);
                retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
            }
        }
    }
    if (retardPNC && ofpLeg.destIATA === 'BEY') {
        addStepLC(`<b class="warning">Vérifiez les conditions des vols BEY pour le retard PNC</b>${manex("07.09.06.B.b")}`);
        retardPNC.textOUT = wrap(retardPNC.textOUT,'span.warning');
    }
    addStep(`Il est possible d'ajouter au TSV MAX une marge de 2h en PEQ2 et 3h en PEQ3/PEQ4 ${manex("07.06.07.B")}`);
    addStep(`<b>La REGUL PN a toujours raison</b> (même s'il faut parfois insister...)`);
    return {...duty, reposPNC, 'retardPNC': retardPNC || '', maxTSV_PEQ2, maxTSV_PEQ3, maxTSV_PEQ4, maxTSVFTL, maxTSVAF};
};

export const pairingData = (ofp) => {
    //const results = {};
    if (!ofp) return {};
    let pairing = {};
    let duties = [];
    let steps = [];
    let scheduledTSV;
    let pattern, match;
    let pncCount;
    let dutyWithFTL;
    try {
        const pairingText = editolido.extract(ofp.text, 'CREW PAIRING', 'Generated');
        //console.log(pairingText);
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
        pattern = /CABIN VERSION[^(]+\((\d+)[^/]+\/\s*(\d+)\s*PNC/u;
        match = pattern.exec(pairingText);
        if (match) {
            //pilotCount = parseFloat(match[1]);
            pncCount = parseFloat(match[2]);
        }
        const tzDec = (tzOFP) => { // +5h30 -> +5.5
            const [tzh, tzm] = tzOFP.split('h');
            return (tzm) ? `${tzh}.${(parseFloat(tzm)/6).toFixed(0)}` : tzh;
        }
        //pattern = new RegExp(String.raw`>\s${ofp.infos.depIATA}\s\(([-+h0-9]+)\)`, "u");
        //match = pattern.exec(pairingText);
        //results.depTZ = (match) ? tzDec(match[1]) : '';
        //pattern = new RegExp(String.raw`>\s${ofp.infos.destIATA}\s\(([-+h0-9]+)\)`, "u");
        //match = pattern.exec(pairingText);
        //results.destTZ = (match) ? tzDec(match[1]) : '';
        pattern = /OPERATION VERSION\s(.+?)\s\d+\sNB PAX/u;
        match = pattern.exec(pairingText);
        const aircraftOpsVersion = (match) ? match[1] : '';
        pattern = /(\d{2})\/(\d{2})\s\S+(\sX)?\s(\S{3})\s>\s(\S{3})\s\(([-+\dh]+)\)\s(\d{2}):(\d{2})\s(?:\d{2}:\d{2})\s(\d{2}):(\d{2})/gu;
        // eslint-disable-next-line init-declarations
        let previousDestTZ;
        let duty = {"legs": []};
        //let flightTypePNC = "MC";
        let flightTypePNT = "MC1";
        let base = undefined;
        pairing.aircraftType = (ofp.infos) ? ofp.infos.aircraftType : '???';
        pairing.flightTypeAircraft = (['220', '318', '319', '320', '321'].includes(pairing.aircraftType)) ? "MC" : "LC";
        for (match of pairingText.matchAll(pattern)) {
            //console.log(match)
            const m = parseInt(match[2], 10); // 1-12
            const d = parseInt(match[1], 10);
            const isMep = !!match[3];
            const y = (m < month) ? year + 1 : year;
            const scheduledOut = new Date(Date.UTC(y, m - 1, d, parseInt(match[7], 10), parseInt(match[8], 10))); // month must be 0-11
            const blockTime = parseInt(match[10], 10) + parseInt(match[9], 10) * 60;
            const scheduledIN = new Date(scheduledOut.getTime() + 60000 * blockTime);
            const depIATA = match[4];
            const destIATA = match[5];
            const departure = editolido.iata2GeoPoint(depIATA);
            if (!base) base = (parisBase.includes(depIATA)) ? 'PAR' : depIATA;
            const destTZ = tzDec(match[6]);
            const depTZ = editolido.tzOffset(depIATA, `${y}-${match[2]}-${match[1]}T${match[7]}:${match[8]}Z`) || previousDestTZ;
            const arrival = editolido.iata2GeoPoint(destIATA);
            const groundDistance = Math.round(departure.distanceTo(arrival, editolido.rad_to_nm));
            // if (flightTypePNC !== "LC" && getFlightTypePNC(departure, arrival) === "LC") {
            //     flightTypePNC = "LC";
            // }
            if (flightTypePNT !== "LC") {
                const distanceType = getFlightTypePNT(groundDistance);
                if (distanceType === "LC" || (distanceType === "MC2" && flightTypePNT === "MC1")){
                    flightTypePNT = distanceType;
                }
            }
            if (duty.legs.length !== 0 && scheduledOut - duty.legs[duty.legs.length - 1].IN > 36000000) { // more than 10 hours
                duties.push(addDutyMeta(duty, pairing.flightTypeAircraft, base));
                duty = {"legs": []};
            }
            const isOFP = scheduledOut.toISOString() === ofp.infos.ofpOUT.toISOString();
            duty.legs.push({
                //"depPoint": {"latitude": departure.latitude.toFixed(6), "longitude": departure.longitude.toFixed(6)},
                //"depICAO": departure.name,
                "depIATA": depIATA,
                //"destPoint": {"latitude": arrival.latitude.toFixed(6), "longitude": arrival.longitude.toFixed(6)},
                "destIATA": destIATA,
                //"destICAO": arrival.name,
                //"groundDistance": groundDistance,
                "destTZ": destTZ,
                "depTZ": depTZ,
                "OUT": scheduledOut,
                "IN": scheduledIN,
                "blockTime": blockTime,
                "blockTimeOFP": (isOFP) ? ofp.infos.blockTime : undefined,
                "isOFP": isOFP,
                "isMEP": isMep,
            });
            previousDestTZ = destTZ;
        }
        if (duty.legs.length > 0) duties.push(addDutyMeta(duty, pairing.flightTypeAircraft, base));
        pairing.base = base;
        try{
            pairing.baseTZ = duties[0].reportingAF.tz;
        }catch(e){
            pairing.baseTZ = previousDestTZ;
        }
        if (duties.length > 0 && duties[0].depTZ === undefined && duties[0].legs.length > 0) {
            console.debug('depTz set via last flight of pairing');
            duties[0].legs[0].depTZ = previousDestTZ;
            duties[0].depTZ = previousDestTZ;
        }
        pairing.flightTypePNT = (flightTypePNT === "MC2" && getMeridians(base, parseFloat(pairing.baseTZ), duties) >= 4) ? "LC" : flightTypePNT;
        //pairing.flightTypePNC = flightTypePNC;
        steps.push(`<b>la rotation satisfait au MANEX 07.05.04.A ou 07.05.04.C (standard ou avec repos en vol)</b>`);
        if (['PAR', 'TLS', 'MRS', 'NCE', 'PTP'].includes(base)){
            steps.push(`base ${base}`);
            if (!Array.isArray(duties) || !duty || !Array.isArray(duty.legs) || duties.length === 0 || duty.legs.length === 0 || (duties.length === 1 && duty.legs.length === 1)){
                steps.push(`<span class="error">L'OFP ne contient pas la rotation complète ou erreur d'analyse.</span>`);
            }
        }else{
            steps.push(`<span class="error">base ${base} -> l'OFP ne contient pas la rotation complète ou erreur d'analyse.</span>`);
        }
        if (!pairing.aircraftType || pairing.aircraftType === '???') steps.push(`<span class="error">Type avion inconnu</span>`);
        steps.push(`type avion ${pairing.aircraftType} -> règles ${pairing.flightTypeAircraft}`);
        if (pairing.flightTypeAircraft === "LC") {
            pairing.isCargo = (pairing.aircraftType === '77F' || (['P001', 'J001', 'W001', 'Y001', '1P', '1J', '1W', '1Y'].includes(aircraftOpsVersion) && pncCount === 0));
            steps.push(`${pairing.aircraftType} LC / config ${aircraftOpsVersion} / ${pncCount} PNC -> vol ${(pairing.isCargo) ? 'CARGO' : 'PAX'}`);
        }else{
            pairing.isCargo = false;
        }
        dutyWithFTL = getDutyWithFTL(addAcclimatization(duties), pairing, steps);
    } catch (err) {
        if (!(err instanceof editolido.StringExtractException)) {
            console.error(err);
        }
        return {};
    }
    const FORBIDDEN = 'interdit';
    const duty = dutyWithFTL;
    return {
        //...duty,
        'scheduledBlockTime': duty.scheduledBlockTime,
        'isCargo': pairing.isCargo,
        'retardPNC': (duty.retardPNC) ? {'textOUT': duty.retardPNC.textOUT} : '',
        'rules': pairing.flightTypeAircraft,
        'reposPNC': {
            'AF': {'textValue': minutesToHHMM(flightRestTimePNCAF((ofp.infos.ofpON - ofp.infos.ofpOFF) / 60000))},
            'FTL': {'textValue': FDP_EASA_PNC_PRE_REST.dataDisplay(duty.reposPNC.FTL.value)}
        },
        'title': (duty.legs) ? duty.legs.reduce((a, leg) => a + '-' + leg.destIATA, duty.depIATA || '') : '',
        'textOUT': dateToHHMM(duty.OUT),
        'reportingAF': {'textValue': duty.reportingAF.textValue},
        'reportingFTL': {'textValue': duty.reportingFTL.textValue},
        'textIN': dateToHHMM(duty.IN),
        'textTSVAF': minutesToHHMM(duty.TSVAF),
        'textFDP': minutesToHHMM(duty.FDP),
        'maxTSVAF': {
            'PEQ2': {'textValue': decimalToHHMM(duty.maxTSVAF.PEQ2.value)},
            'PEQ3': {'textValue': decimalToHHMM(duty.maxTSVAF.PEQ3.value)},
            'PEQ4': {'textValue': decimalToHHMM(duty.maxTSVAF.PEQ4.value)},
        },
        'maxTSVFTL': {
            'PEQ2': {'textValue': decimalToHHMM(duty.maxTSVFTL.PEQ2.value)},
            'PEQ3': {'textValue': decimalToHHMM(duty.maxTSVFTL.PEQ3.value)},
            'PEQ4': {'textValue': decimalToHHMM(duty.maxTSVFTL.PEQ4.value)},
        },
        'destIATA': duty.destIATA,
        'maxTSV_PEQ2': {
            'rule': duty.maxTSV_PEQ2.rule,
            'textIN': (duty.maxTSV_PEQ2.isForbidden) ? FORBIDDEN : dateToHHMM(duty.maxTSV_PEQ2.IN) + 'z',
            'textOUT': diff_formula(duty.maxTSV_PEQ2, duty),
            'reposPNC': (pairing.flightTypeAircraft !== "LC" || duty.maxTSV_PEQ2.isForbidden) ? '' : minutesToHHMM(duty.maxTSV_PEQ2.reposPNC),
        },
        'maxTSV_PEQ3': {
            'rule': duty.maxTSV_PEQ3.rule,
            'textIN': (duty.maxTSV_PEQ3.isForbidden) ? FORBIDDEN : dateToHHMM(duty.maxTSV_PEQ3.IN) + 'z',
            'textOUT': diff_formula(duty.maxTSV_PEQ3, duty),
            'reposPNC': (duty.maxTSV_PEQ3.isForbidden) ? '' : minutesToHHMM(duty.maxTSV_PEQ3.reposPNC),
        },
        'maxTSV_PEQ4': {
            'rule': duty.maxTSV_PEQ4.rule,
            'textIN': (duty.maxTSV_PEQ4.isForbidden) ? FORBIDDEN : dateToHHMM(duty.maxTSV_PEQ4.IN) + 'z',
            'textOUT': diff_formula(duty.maxTSV_PEQ4, duty),
            'reposPNC': (duty.maxTSV_PEQ4.isForbidden) ? '' : minutesToHHMM(duty.maxTSV_PEQ4.reposPNC),
        },
        //pilotCount,
        //pncCount,
        'steps': steps.map(step => wrap(step, 'li')).join('\n'),
        scheduledTSV // deprecated
    }
}

const computeAcclimatization = (previousReporting, previousDepIATA, previousAcclimatizationValue, {reportingFTL,depIATA}, steps) => {
    const ellapsedTimeMn = (reportingFTL.value.getTime() - previousReporting.value.getTime()) /60000;
    const meridians = Math.abs(parseFloat(reportingFTL.tz) - parseFloat(previousReporting.tz));
    let tzInfos = [
        mayWrap(`${previousDepIATA} ${previousReporting.tz}`, 'b', !previousReporting.safeTZ),
        mayWrap(`${depIATA} ${reportingFTL.tz}`, 'b', !reportingFTL.safeTZ),
        `${meridians}`
    ];
    const label = (previousAcclimatizationValue === 'X') ? 'le départ de la base' : 'dernière acclimatation';
    steps.push(`Temps depuis ${label}: ${minutesToHHMM(ellapsedTimeMn)}, méridiens traversés: ${tzInfos[2]} (${tzInfos[0]} -> ${tzInfos[1]})`);
    let tz = null, iata, safeTZ = false;
    const {x, y, ix, iy, value} = matchInTable([ellapsedTimeMn, meridians], EASA_ACCLIMATIZATION);
    if (value === "B"){
        tz = previousReporting.tz;
        iata = previousDepIATA;
        safeTZ = previousReporting.safeTZ;
    }
    else if (value === "D") {
        tz = reportingFTL.tz;
        iata = depIATA;
        safeTZ = reportingFTL.safeTZ;
    }
    return {x, y, ix, iy, value, tz, 'iata': iata, safeTZ };
}
const computeRefTimeTZAF = (flightTypeAircraft, flightTypePNT, baseTZ, base, ellapsedHours, {depIATA, reportingAF}, steps) => { //MANEX 07.08.01.A
    const deltaTZ = parseFloat(reportingAF.tz) - parseFloat(baseTZ);
    const tzFormat = tz => (tz >= 0) ? `+${tz}`: tz.toString();
    let tzInfos = mayWrap(`${depIATA} ${reportingAF.tz}`, 'b', !reportingAF.safeTZ);
    steps.push(`Type avion: ${flightTypeAircraft}, type de courrier: ${(flightTypePNT === 'LC') ? 'Long' : 'Moyen'} Trajet`);
    if (flightTypeAircraft === "LC" && flightTypePNT === "LC") {
        steps.push(`Temps d'absence AF: ${decimalToHHMM(ellapsedHours)}, méridiens traversés: ${Math.abs(deltaTZ)} ( ${base} ${baseTZ} ->  ${tzInfos})`);
        if (ellapsedHours < 24) {
            return baseTZ;
        }else if (ellapsedHours < 48){
            if (deltaTZ >= 3) {
                return tzFormat(parseFloat(baseTZ) + 3);
            }else if (deltaTZ <= -3) {
                return tzFormat(parseFloat(baseTZ) - 3);
            }else{
                return reportingAF.tz;
            }
        }else if (ellapsedHours < 96){
            if (deltaTZ >= 6) {
                return tzFormat(parseFloat(baseTZ) + 6);
            }else if (deltaTZ <= -6) {
                return tzFormat(parseFloat(baseTZ) - 6);
            }else{
                return reportingAF.tz;
            }
        }else{
            return reportingAF.tz;
        }
    } else {
        return baseTZ;
    }
};
const EASA_ACCLIMATIZATION = {
    //"title": "Table MANEX 07.02.Défininitions",
    // 48h=2880mn 72h=4320mn 96h=5760mn 120h=7200mn
    "x": [x => x < 2880, x => x < 4320, x => x < 5760, x => x < 7200, x => x >= 7200],
    //"xLabel": ['< 48:00', '48:00-71:59 ', '72:00-95:59', '96:00-119:59', '≥ 120:00'],
    //"xLegend": "Time elapsed since reporting at reference time",
    //"xDisplay": x => `${Math.floor(x/60)}:${(x % 60).toString().padStart(2,0)}`,
    "y": [y => y < 4, y => y <= 6, y => y <= 9, y => y <= 12],
    //"yLabel": ['< 4', '≤ 6', '≤ 9', '≤ 12'],
    //"yLegend": "Time difference (h) between reference time and local time where the crew member starts the next duty",
    //"yDisplay": y => `${y}`,
    "data": [
        ["B", "D", "D", "D", "D"],
        ["B", "X", "D", "D", "D"],
        ["B", "X", "X", "D", "D"],
        ["B", "X", "X", "X", "D"],
    ],
    //"dataDisplay": v => v,
};
const ftlNumberOfLegs = (legs) => legs.length - ((legs.length > 0 && legs[0].isMEP) ? 1 : 0); //MANEX 07.05.05
const afNumberOfLegs = (legs) => legs.length - ((legs.length > 0 && legs[legs.length-1].isMEP) ? 1 : 0); //MANEX 07.08.03 & 07.08.05.D
const FDP_EASA_BASE_ACCLIMATED_DATA = {
    //"title": "Table MANEX 07.05.04.A",
    "x": [x => x <= 2, x => x === 3, x => x === 4, x => x === 5, x => x === 6],
    //"xLabel": ["1 à 2 étapes", "3 étapes", "4 étapes", "5 étapes", "6 étapes"],
    //"xLegend": "TSV quotidien maximal de base – membres d’équipages acclimatés",
    //"xDisplay": x => `${x} étape${(x > 1) ? 's' : ''}`,
    "y": [y => y>= 6 && y < 13.5, y => y >= 13.5 && y < 14, y => y >=14 && y < 14.5, y => y >= 14.5 && y < 15, y => y >= 15 && y < 15.5, y => y >= 15.5 && y < 16, y => y >= 16 && y < 16.5, y => y >= 16.5 && y < 17, y => (y>= 17 || y < 5), y => y >= 5 && y < 5.25, y => y >= 5.25 && y < 5.5, y => y >= 5.5 && y < 5.75, y => 5.75 && y < 6],
    //"yLabel": ["06:00-13:29", "13:30-13:59", "14:00-14:29", "14:30-14:59", "15:00-15:29", "15:30-15:59", "16:00-16:29", "16:30-16:59", "17:00-04:59", "05:00-05:14", "05:15-05:29", "05:30-05:44", "05:45-05:59"],
    //"yLegend": "Début du TSV à l'heure de référence",
    //"yDisplay": decimalToHHMM,
    "data": [
        [13.00, 12.50, 12.00, 11.50, 11.00],
        [12.75, 12.25, 11.75, 11.25, 10.75],
        [12.50, 12.00, 11.50, 11.00, 10.50],
        [12.25, 11.75, 11.25, 10.75, 10.25],
        [12.00, 11.50, 11.00, 10.50, 10.00],
        [11.75, 11.25, 10.75, 10.25,  9.75],
        [11.50, 11.00, 10.50, 10.00,  9.50],
        [11.25, 10.75, 10.25,  9.75,  9.25],
        [11.00, 10.50, 10.00,  9.50,  9.00],
        [12.00, 11.50, 11.00, 10.50, 10.00],
        [12.25, 11.75, 11.25, 10.75, 10.25],
        [12.50, 12.00, 11.50, 11.00, 10.50],
        [12.75, 12.25, 11.75, 11.25, 10.75]
    ],
    //"dataDisplay": decimalToHHMM
};

const FDP_EASA_BASE_UNKNOWN_ACCLIMATIZATION_DATA = {
    //"title": "Table MANEX 07.05.04.B",
    "x": [x => x <= 2, x => x === 3, x => x === 4, x => x === 5],
    //"xLabel": ["1 à 2 étapes", "3 étapes", "4 étapes", "5 étapes"],
    //"xLegend": "TSV quotidien maximal de base – acclimatation inconnue",
    //"xDisplay": x => `${x} étape${(x > 1) ? 's' : ''}`,
    "y": [y => y === true, y => y === false],
    //"yLabel": ["SGRF", "STD"],
    //"yLegend": "accord SGRF",
    //"yDisplay": y => ((y) ? "SGRF" : "STD"),
    "data": [
        [12.00, 11.50, 11.00, 10.50],
        [11.00, 10.50, 10.00,  9.50]
    ],
    //"dataDisplay": decimalToHHMM
};
const FDP_EASA_PNC_PRE_REST = {
    //"title": "Table MANEX 07.05.04.C.c",
    "x": [x => x === true, x => x === false],
    //"xLabel": ["PRE", "PRE HS"],
    //"xLegend": "Repos en vol PNC minimum",
    //"xDisplay": x => (x) ? 'PRE' : 'PRE HS',
    "y": [      y => y <= 14.5,  y => y <= 15, y => y <= 15.5, y => y <= 16, y => y <= 16.5, y => y <= 17, y => y <= 17.5, y => y <= 18, () => true],
    //"yLabel": ["jusqu'à 14:30", "14:31-15:00", "15:01-15:30", "15:31-16:00", "16:01-16:30", "16:31-17:00", "17:01-17:30", "17:31-18:00", "18:01 et plus"],
    //"yLegend": "TSV prolongé maximum",
    //"yDisplay": decimalToHHMM,
    "data": [
        [90, 90],
        [105, 120],
        [120, 140],
        [135, 160],
        [155, 180],
        [180, 205],
        [205, -1],
        [230, -1],
        [-1, -1]
    ],
    "dataDisplay": v => ((v >= 0) ?  minutesToHHMM(v): 'Interdit')
};
const flightRestTimePNCAF = (flightTime) => { //MANEX 07.09.05.F
    if (flightTime < 300) {
        return 0;
    }else if (flightTime < 690) {
        return 30 + 15 * Math.floor((flightTime -300) / 60);
    }else if (flightTime < 870) {
        return 135 + 15 * Math.floor((flightTime - 690) / 30);
    }else{
        return 240;
    }
};
const maxFDPWithRest = (legs, numberOfPilots, preUsable=true) => {
    const numberOfLegs = ftlNumberOfLegs(legs);
    let hasOneSectorOf9hours = false;
    const reducer = (p, leg) => Math.max(p, leg.blockTime);
    if (numberOfLegs === 2) {
        if (numberOfLegs < legs.length) { //first is a MEP
            hasOneSectorOf9hours = legs.slice(1).reduce(reducer, 0) >= 540;
        }else{
            hasOneSectorOf9hours = legs.reduce(reducer, 0) >= 540;
        }
    }
    if (numberOfLegs === 2 && hasOneSectorOf9hours) {
        if (numberOfPilots === 3) {
            return (preUsable) ? 17 : 16;
        }else if (numberOfPilots >= 4) {
            return (preUsable) ? 18 : 17;
        }
    }else if (numberOfLegs <= 3) {
        if (numberOfPilots === 3) {
            return (preUsable) ? 16 : 15;
        }else if (numberOfPilots >= 4) {
            return (preUsable) ? 17 : 16;
        }
    }
};
const maxTSVWithRest = (legs, numberOfPilots, isCargo=false, steps) => { // MANEX 07.08.05.C
    const numberOfLegs = afNumberOfLegs(legs);
    if (!isCargo) {
        if (numberOfPilots >= 4 && numberOfLegs === 1) {
            return 18;
        }
        if (numberOfLegs === 1 || (numberOfLegs === 2 && legs[0].blockTime <= 90)) {
            return 16.5;
        }else if (numberOfLegs === 2) {
            return 14;
        }
    } else { // cargo
        if (numberOfPilots >= 4) {
            if (numberOfLegs === 1) {
                //steps.push(`Le SV est un cargo mono-tronçon en PEQ2 doublé`);
                return 18;
            }else if (numberOfLegs === 2 && legs[0].depIATA !== legs[legs.length - 1].destIATA){
                //steps.push(`Le SV est un cargo bi-tronçons (pas d'aller-retour) en PEQ2 doublé`);
                return 17.5;
            }
        }else if (numberOfPilots === 3) {
            if (numberOfLegs === 1){
                //steps.push(`Le SV est un cargo mono-tronçon en PEQ2 reforcé`);
                return 16.5;
            }else if (numberOfLegs === 2 && legs[0].blockTime <= 90) {
                //steps.push(`Le SV est un cargo bi-tronçons (première étape <= 1h30) en PEQ2 reforcé`);
                return 16.5;
            }else if (numberOfLegs === 2 && legs[0].depIATA === legs[legs.length - 1].destIATA ){ // AR
                //steps.push(`Le SV est un cargo aller-retour`);
                return 14;
            }else if (numberOfLegs === 2) { // not AR
                if (legs[0].depIATA === 'MEX' && legs[0].blockTime <= 210 && ['CDG', 'ORY'].includes(legs[legs.length - 1].destIATA)) { //retour MEX, première étable moins de 3h30
                    //steps.push(`Le SV est un cargo bi-tronçons retour MEX ${manex('07.08.05.C.a')}`);
                    return 16.5;
                }
                //steps.push(`Le SV est un cargo bi-tronçons (pas d'aller-retour)`);
                return 15;
            }else if (numberOfLegs === 3){
                const localTimeOfDepartureDate = new Date(legs[0].OUT.getTime() + (parseFloat(legs[0].depTZ) * 3600000));
                const localTimeOfDeparture = localTimeOfDepartureDate.getUTCHours() + (localTimeOfDepartureDate.getUTCMinutes() / 60);
                if (localTimeOfDeparture <= 10.5) {
                    const blockTimeCondition = legs.reduce((p, leg) => (p || leg.blockTime >= 330), false); //au moins une étape de plus de 5h30
                    if (blockTimeCondition) {
                        steps.push(`<b>PEQ3: Le SV est considéré comme un cargo tri-tronçons Afrique</b> ${manex('07.08.05.C.a')}`);
                        return 14.5; // (TODO: Afrique non testé)
                    }
                }
            }
        }
    }
    return 0;
};

const computeMaxTSVAF_PEQ2 = (legs, flightTypeAircraft, refTime, previousRest) => {
    const numberOfLegs = afNumberOfLegs(legs);
    const result = (interpolatedValue) => {
        interpolatedValue = Math.floor(interpolatedValue * 60) / 60; //prevents rounding problems in results
        return {
            "value": Math.min(interpolatedValue, previousRest),
            "legs": numberOfLegs,
            refTime,
            "type": flightTypeAircraft 
        };
    };
    if (flightTypeAircraft === "LC") {
        return result(interpolate(refTime, (numberOfLegs <= 3) ? AF_LC_1_OR_2_OR_3_LEGS : AF_LC_4_LEGS));
    }else{
        if (numberOfLegs <= 2) {
            return result(interpolate(refTime, AF_MC_1_OR_2_LEGS));
        }else if (numberOfLegs === 3) {
            return result(interpolate(refTime, AF_MC_3_LEGS));
        }else if (numberOfLegs === 4) {
            return result(interpolate(refTime, AF_MC_4_LEGS));
        }else if (numberOfLegs === 5) {
            return result(interpolate(refTime, AF_MC_5_LEGS));
        }
    }
};
const matchInTable = ([x, y], table) => {
    const ix = table.x.findIndex(fn => fn(x));
    const iy = table.y.findIndex(fn => fn(y));
    return {/*x, y, ix, iy, */"value": (ix >=0 && iy >= 0) ? table.data[iy][ix] : undefined};
}
const AF_MC_1_OR_2_LEGS = [
    [0, 10.5], [4.5, 10.5], [4.75, 11], [5, 11.34], [6, 13], [8, 13], [12, 13], [18, 10.5], [24, 10.5]
];
const AF_MC_3_LEGS = [
    [0, 10.5], [4.99, 10.5], [5, 10.75], [5.5, 12.5], [13.5, 12.5], [14.75, 12], [17.99, 10.75], [18, 10.5], [24, 10.5]
];
const AF_MC_4_LEGS = [
    [0, 10.5], [4.99, 10.5], [5, 10.75], [5.5, 12], [14.75, 12.5], [17.99, 10.75], [18, 10.5], [24, 10.5]
];
const AF_MC_5_LEGS = [
    [0, 0], [8.24, 0], [8.25, 12], [12, 12], [12.5, 11.5], [16, 8], [16.01, 0]
];
const AF_LC_1_OR_2_OR_3_LEGS =[
    [0, 12], [5, 12], [9, 14], [13, 14], [19, 12], [24, 12]
];
const AF_LC_4_LEGS =[
    [0, 11], [5, 11], [9, 13], [14, 13], [20, 11], [24, 11]
];
const interpolate = (value, steps) => {
    const ix = steps.findIndex(([x,]) => x > value);
    if (ix === -1) return steps[0][1];
    const [x1, y1] = steps[ix - 1];
    const [x2, y2] = steps[ix];
    const res = y1 + (((value - x1)/(x2 - x1)) * (y2 - y1));
    return res;
};
