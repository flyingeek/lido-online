/* globals editolido */
const parisBase = ['CDG', 'ORY'];
const getFlightTypePNC = (departure, destination) => {
    if (departure.longitude >= -30 && departure.longitude <= 40 && departure.latitude >=25 
        && destination.longitude >= -30 && destination.longitude <= 40 && destination.latitude >=25) {
        return "MC";
    }
    return "LC";
};
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
const isFrenchMetropolitan = (iata_or_icao) => {
    let icao;
    if (iata_or_icao.length === 4) {
        icao = iata_or_icao;
    }else{
        icao = editolido.iata2icao(iata_or_icao);
    }
    return icao.startsWith('LF');
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

const decimalToHHMM = (v) => `${Math.floor(v).toString().padStart(2,0)}:${((v - Math.floor(v)) * 60).toFixed(0).padStart(2,0)}`;
const minutesToHHMM = (v) => `${Math.floor(v/60).toString().padStart(2,0)}:${((v/60 - Math.floor(v/60)) * 60).toFixed(0).padStart(2,0)}`;
const dateToHHMM = (v) => `${v.getUTCHours().toString().padStart(2,0)}:${v.getUTCMinutes().toString().padStart(2,0)}`;
// returns french timezone (+1 or +2)
const iso2TZ = (isoString) => {
    const timeZone = "Europe/Paris";
    let event = new Date(Date.parse(isoString));
    // British English uses day/month/year order and 24-hour time without AM/PM
    const loc = event.toLocaleString("en-GB", {timeZone});
    const re = /(\d\d)\/(\d\d)\/(\d\d\d\d), (\d\d):(\d\d):\d\d/
    let match;
    if (null !== (match = re.exec(loc))) {
        const [, day, month, year, hour, minute] = match;
        let baseIsoString = `${year}-${month}-${day}T${hour}:${minute}`;
        const baseEvent = new Date(Date.parse(baseIsoString + "Z"));
        let tzOffset = (baseEvent - event)/3600000;
        if (tzOffset === 0) {
            return "+0";
        }
        let res = (tzOffset >= 0) ? '+' : '-';
        res += tzOffset.toFixed(1)
        return (res.endsWith('.0')) ? res.slice(0, -2) : res;
    }
};

const addDutyMeta = (duty) => {
    const lastLeg = duty.legs[duty.legs.length - 1];
    if (lastLeg) {
        duty.OUT = duty.legs[0].OUT;
        duty.textOUT = dateToHHMM(duty.OUT);
        duty.depTZ = duty.legs[0].depTZ;
        duty.depIATA = duty.legs[0].depIATA;
        duty.IN = lastLeg.IN;
        duty.textIN = dateToHHMM(duty.IN);
        duty.destIATA = lastLeg.destIATA;
        duty.destTZ = lastLeg.destTZ;
        duty.scheduledBlockTime = (duty.IN.getTime() - duty.OUT.getTime()) / 60000;
        //duty.TVSV = duty.legs.reduce((a, v) => v.blockTime + a, 0);
        // if (!isBase(base, lastLeg.destIATA)) {
        //     duty.layover = lastLeg.destIATA;
        //     duty.layoverTZ = lastLeg.destTZ;
        // }
    }
    const firstLeg = duty.legs[0]; // add first matching timezone for departure
    if (firstLeg && firstLeg.depTZ === undefined) {
        for (const leg of duty.legs.slice(1)) {
            if (leg.destIATA === firstLeg.depIATA || leg.destIATA === 'ORY' && firstLeg.depIATA === 'CDG' || leg.destIATA === 'CDG' && firstLeg.depIATA === 'ORY') {
                firstLeg.depTZ = leg.destTZ;
                duty.depTZ = firstLeg.depTZ;
                break;
            }
        }
    }
    return duty;
}

const addDutiesMeta = (duties, {base, flightTypeAircraft, baseTZ, flightTypePNT, isCargo}, steps) => {
    let previousReportingFTL, previousFTLTZ, previousEndTSVAF, previousDepIATA;
    const enhancedDuties = [];
    for (const [index, duty] of duties.entries()) {
        if (duty.legs.length <= 0) {
            enhancedDuties.push({...duty});
        }else{
            const isOFPDuty = duty.legs.reduce((a, leg) => a || leg.isOFP, false);
            const isLastDuty = index === duties.length - 1;
            // 1) COMPUTE START OF TSV FOR FLT AND AF
            let deltaAF=60, deltaFTL=60, courrierCroise = false;
            if (isBase(base, duty.legs[0].depIATA)) {
                if (base === "PAR") {
                    if (flightTypeAircraft === "LC") {
                        deltaFTL = 105;
                        deltaAF = 90;
                    } else {
                        deltaFTL = 90;
                        deltaAF = 75;
                    }
                    if (duty.legs[0].isMEP){
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
            if (isOFPDuty) steps.push(`SV débute par une MEP: ${(duty.legs[0].isMEP) ? "OUI" : "NON"}`);
            duty.reportingFTL = new Date(duty.legs[0].OUT.getTime() - (deltaFTL * 60000));
            duty.reportingAF = new Date(duty.legs[0].OUT.getTime() - (deltaAF * 60000));
            if (isOFPDuty) steps.push(`début TSV FTL: ${dateToHHMM(duty.reportingFTL)}z <cite>MANEX 07.05.01 & 07.05.05</cite>`);
            if (isOFPDuty) steps.push(`début TSV AF: ${dateToHHMM(duty.reportingAF)}z <cite>MANEX 07.08.01</cite>`);
            
            // 2) COMPUTE TSV FOR AF AND FDP FOR FTL
            duty.FDP = (duty.IN.getTime() - duty.reportingFTL.getTime()) / 60000;
            duty.textFDP = minutesToHHMM(duty.FDP);
            duty.TSVAF = (duty.IN.getTime() + (15 * 60000) - duty.reportingAF.getTime()) / 60000; //MANEX 07.08.01.A
            duty.textTSVAF = minutesToHHMM(duty.TSVAF);

            if (base === 'PAR' && isLastDuty && duties[0].depIATA !== duty.destIATA) { // courrier croisé
                if (isOFPDuty) steps.push(`Dernier SV d'un courrier croisé: OUI`);
                if (isOFPDuty) steps.push(`Le TSV AF se termine au bloc réel +75mn <cite>MANEX 07.08.01.A</cite>`);
                courrierCroise = true;
                duty.TSVAF += 60;
            }else{
                if (isOFPDuty) steps.push(`Dernier SV d'un courrier croisé: NON`);
                if (isOFPDuty) steps.push(`Le TSV AF se termine au bloc réel +15mn <cite>MANEX 07.08.01.A</cite>`);
            }
            if (isOFPDuty) steps.push(`TSV AF: ${minutesToHHMM(duty.TSVAF)} <cite>MANEX 07.08.01.A</cite>`);
            if (isOFPDuty) steps.push(`Le TSV FTL se termine au bloc réel <cite>MANEX 07.02.Définitions</cite>`);
            if (isOFPDuty) steps.push(`TSV FTL: ${minutesToHHMM(duty.FDP)} <cite>MANEX 07.02.Définitions</cite>`);

            // 3) COMPUTE ACCLIMATIZATION FOR FTL
            let acclimatization;
            if (previousReportingFTL && previousFTLTZ) {
                acclimatization = computeAcclimatization(previousReportingFTL, previousFTLTZ, previousDepIATA, duty, (isOFPDuty) ? steps : []);
            }else{
                acclimatization = {value: 'B', 'tz': duty.depTZ, 'iata': duty.depIATA};
            }
            if (isOFPDuty) steps.push(`ACCLIMATATION: "${acclimatization.value}"${(acclimatization.value !== 'X') ? ' fuseau GMT' + acclimatization.tz + ' (' + acclimatization.iata + ')': ''} <cite>MANEX 07.02.Définitions</cite>`);

            // 4) ACCORDING TO ACCLIMATIZATION COMPUTE FDP LIMITATIONS FOR PEQ2/PEQ3/PEQ4
            const refDate = new Date(duty.reportingFTL.getTime() + (parseFloat(acclimatization.tz) * 3600000));
            const refTime = refDate.getUTCHours() + (refDate.getUTCMinutes() / 60);
            const sgrf = false;
            let maxFDP_PEQ2;
            if (isOFPDuty) steps.push(`nombre de tronçons du SV au sens FTL: ${easaNumberOfLegs(duty.legs)} <cite>MANEX 07.05.05</cite>`);
            if (acclimatization.value === 'X') {
                maxFDP_PEQ2 = matchInTable([easaNumberOfLegs(duty.legs), sgrf], FDP_EASA_BASE_UNKNOWN_ACCLIMATIZATION_DATA)
                if (isOFPDuty) steps.push(`<b>accord spécifique SGRF: NON</b> -> ajouter 1h au TSV MAX si OUI`)
                if (isOFPDuty) steps.push(`TSV MAX FTL PEQ2: ${FDP_EASA_BASE_UNKNOWN_ACCLIMATIZATION_DATA.dataDisplay(maxFDP_PEQ2.value)} <cite>MANEX 07.05.04.A.b</cite>`);
            }else{
                maxFDP_PEQ2 = matchInTable([easaNumberOfLegs(duty.legs), refTime], FDP_EASA_BASE_ACCLIMATED_DATA);
                if (isOFPDuty) steps.push(`Heure de référence FTL: ${dateToHHMM(refDate)}`)
                if (isOFPDuty) steps.push(`TSV MAX FTL PEQ2: ${decimalToHHMM(maxFDP_PEQ2.value)} <cite>MANEX 07.05.04.A.a</cite>`);
            }
            if (isOFPDuty) steps.push(`<b>PEQ3/PEQ4 PRE considéré comme opérationnel</b>`);
            const maxFDP_PEQ3 = maxFDPWithRest(duty.legs, 3);
            if (isOFPDuty) steps.push(`TSV MAX FTL PEQ3: ${decimalToHHMM(maxFDP_PEQ3)} <cite>MANEX 07.05.04.C</cite>`);
            const maxFDP_PEQ4 = maxFDPWithRest(duty.legs, 4);
            if (isOFPDuty) steps.push(`TSV MAX FTL PEQ4: ${decimalToHHMM(maxFDP_PEQ4)} <cite>MANEX 07.05.04.C</cite>`);
            const maxTSVFTL = {
                'PEQ2': {'value': maxFDP_PEQ2.value, 'textValue': decimalToHHMM(maxFDP_PEQ2.value)},
                'PEQ3': {'value': maxFDP_PEQ3, 'textValue': decimalToHHMM(maxFDP_PEQ3)},
                'PEQ4': {'value': maxFDP_PEQ4, 'textValue': decimalToHHMM(maxFDP_PEQ4)}
            }
            // 5) COMPUTE REFTIME FOR AF TSV LIMITATIONS
            const refAFTZ = computeRefTimeTZAF(flightTypeAircraft, flightTypePNT, baseTZ, base, (duty.reportingAF.getTime() - duties[0].reportingAF.getTime())/3600000, duty, (isOFPDuty) ? steps : []);
            acclimatization.AF = refAFTZ;
            if (isOFPDuty) steps.push(`nombre de tronçons du SV au sens AF: ${afNumberOfLegs(duty.legs)} <cite>MANEX 07.08.03 & 07.08.05.D</cite>`);
            if (isOFPDuty) steps.push(`Fuseau de référence AF: GMT${refAFTZ} <cite>MANEX 07.08.01.A</cite>`);

            // 6) ACCORDING TO AF REFTIME COMPUTE TSV LIMITATIONS FOR PEQ2/PEQ3/PEQ4
            const refDateAF = new Date(duty.reportingAF.getTime() + (parseFloat(refAFTZ) * 3600000));
            if (isOFPDuty) steps.push(`Heure de référence AF: ${dateToHHMM(refDateAF)} <cite>MANEX 07.08.01.A</cite>`);
            const refTimeAF = refDateAF.getUTCHours() + (refDateAF.getUTCMinutes() / 60);
            let layoverRestTimeHours;
            if (previousEndTSVAF) {
                layoverRestTimeHours = (duty.reportingAF.getTime() - (previousEndTSVAF.getTime())) / 3600000;
                if (isOFPDuty) steps.push(`<b>Durée du repos en escale: ${decimalToHHMM(layoverRestTimeHours)}</b> -> TSV MAX AF ≤ repos`);
            }else{
                layoverRestTimeHours = 100; //big enough number
            }
            const maxTSVAF_PEQ2 = computeMaxTSVAF_PEQ2(duty.legs, flightTypeAircraft, refTimeAF, layoverRestTimeHours);
            if (isOFPDuty) steps.push(`TSV MAX AF PEQ2: ${decimalToHHMM(maxTSVAF_PEQ2.value)} ${(flightTypeAircraft === "LC") ? "<cite>MANEX 07.08.05.B</cite>" : "<cite>MANEX 07.08.03.B</cite>"}`);
            const maxTSVAF_PEQ3 = maxTSVWithRest(duty.legs, 3, isCargo);
            if (isOFPDuty) steps.push(`<b>Vol Cargo: ${(isCargo) ? "OUI" : "NON"}</b>`);
            if (isOFPDuty) steps.push(`TSV MAX AF PEQ3 (LC): ${decimalToHHMM(maxTSVAF_PEQ3)} <cite>MANEX 07.08.05.C</cite>`);
            const maxTSVAF_PEQ4 = maxTSVWithRest(duty.legs, 4, isCargo);
            if (isOFPDuty) steps.push(`TSV MAX AF PEQ4 (LC): ${decimalToHHMM(maxTSVAF_PEQ4)} <cite>MANEX 07.08.05.C</cite>`);
            const maxTSVAF = {
                'PEQ2': {'value': maxTSVAF_PEQ2.value, 'textValue': decimalToHHMM(maxTSVAF_PEQ2.value)},
                'PEQ3': {'value': maxTSVAF_PEQ3, 'textValue': decimalToHHMM(maxTSVAF_PEQ3)},
                'PEQ4': {'value': maxTSVAF_PEQ4, 'textValue': decimalToHHMM(maxTSVAF_PEQ4)}
            };
            // 7) COMPUTE THE LATEST IN VALUES FOR MAX FDP AND MAX TSV
            const afOffset = (courrierCroise) ? 75 : 15;
            const latestIN_AF_PEQ2 = new Date(duty.reportingAF.getTime() + (maxTSVAF_PEQ2.value * 3600000) - (afOffset * 60000));
            const latestIN_AF_PEQ3 = new Date(duty.reportingAF.getTime() + (maxTSVAF_PEQ3 * 3600000) - (afOffset * 60000));
            const latestIN_AF_PEQ4 = new Date(duty.reportingAF.getTime() + (maxTSVAF_PEQ4 * 3600000) - (afOffset * 60000));
            const latestIN_FTL_PEQ2 = new Date(duty.reportingFTL.getTime() + maxFDP_PEQ2.value * 3600000);
            const latestIN_FTL_PEQ3 = new Date(duty.reportingFTL.getTime() + maxFDP_PEQ3 * 3600000);
            const latestIN_FTL_PEQ4 = new Date(duty.reportingFTL.getTime() + maxFDP_PEQ4 * 3600000);

            // 8) DETERMINE IF LIMITATION COMES FROM FTL OR AF
            const maxTSV_PEQ2 = (latestIN_FTL_PEQ2 <= latestIN_AF_PEQ2) ? {'rule': 'FTL', 'value': maxFDP_PEQ2.value, 'IN': latestIN_FTL_PEQ2} : {'rule': 'AF', 'value': maxTSVAF_PEQ2.value, 'IN': latestIN_AF_PEQ2};
            const maxTSV_PEQ3 = (latestIN_FTL_PEQ3 <= latestIN_AF_PEQ3) ? {'rule': 'FTL', 'value': maxFDP_PEQ3, 'IN': latestIN_FTL_PEQ3} : {'rule': 'AF', 'value': maxTSVAF_PEQ3, 'IN': latestIN_AF_PEQ3};
            const maxTSV_PEQ4 = (latestIN_FTL_PEQ4 <= latestIN_AF_PEQ4) ? {'rule': 'FTL', 'value': maxFDP_PEQ4, 'IN': latestIN_FTL_PEQ4} : {'rule': 'AF', 'value': maxTSVAF_PEQ4, 'IN': latestIN_AF_PEQ4};
            const FORBIDDEN = 'interdit';
            maxTSV_PEQ2.textValue = decimalToHHMM(maxTSV_PEQ2.value);
            if (maxTSV_PEQ2.IN.getTime() < duty.IN.getTime()) {
                maxTSV_PEQ2.textIN = FORBIDDEN
            }else{
                maxTSV_PEQ2.textIN = dateToHHMM(maxTSV_PEQ2.IN) + 'z';
            }
            maxTSV_PEQ3.textValue = decimalToHHMM(maxTSV_PEQ3.value);
            if (maxTSV_PEQ3.IN.getTime() < duty.IN.getTime()) {
                maxTSV_PEQ3.textIN = FORBIDDEN
            }else{
                maxTSV_PEQ3.textIN = dateToHHMM(maxTSV_PEQ3.IN) + 'z';
            }
            maxTSV_PEQ4.textValue = decimalToHHMM(maxTSV_PEQ4.value);
            if (maxTSV_PEQ4.IN.getTime() < duty.IN.getTime()) {
                maxTSV_PEQ4.textIN = FORBIDDEN
            }else{
                maxTSV_PEQ4.textIN = dateToHHMM(maxTSV_PEQ4.IN) + 'z';
            }

            // 9) CALCULATE THE MINIMUM CABIN CREW REST TIME AT THE LIMITATION
            if (isOFPDuty) steps.push(`Calculs des repos en vol FTL pour le PNC au TSV MAX`);
            maxTSV_PEQ3.reposPNC =  minutesToHHMM(matchInTable([true, (maxTSV_PEQ3.rule === 'FTL') ? maxTSV_PEQ3.value : (maxTSV_PEQ3.IN.getTime() - duty.reportingFTL.getTime()) / 3600000], FDP_EASA_PNC_PRE_REST).value); // Repos PNC FTL à la butée PEQ3
            maxTSV_PEQ4.reposPNC =  minutesToHHMM(matchInTable([true, (maxTSV_PEQ4.rule === 'FTL') ? maxTSV_PEQ4.value : (maxTSV_PEQ3.IN.getTime() - duty.reportingFTL.getTime()) / 3600000], FDP_EASA_PNC_PRE_REST).value); // Repos PNC FTL à la butée PEQ4
            
            // 10) CALCULATE THE MINIMUM CABIN CREW REST TIME FOR THE SCHEDULED FLIGHT
            const FDP_PNC_REST = (duty.FDP /60 > maxFDP_PEQ2.value) ? matchInTable([true, duty.FDP/60], FDP_EASA_PNC_PRE_REST) : {"value" : 0}; //TODO 11h = cas le plus défavorable si 2 étapes pnc acclimatés ou non
            
            // 11) CALCULATE AF MINIMUM CABIN CREW REST TIME FOR THE FLIGHT
            // 12) CALCULATE THE MAXIMUM DELAY ON DEPARTURE FOR CABIN CREW
            // 13) IF OFP FLIGHT IS THE LAST FLIGHT OF THE DUTY, CALCULATE DEPARTURE TIME LIMITATIONS
            if (isOFPDuty) steps.push(`Le repos PNC en vol AF est basé sur le temps de vol OFP`);
            if (isOFPDuty) steps.push(`Le repos PNC en vol FTL est basé sur le <b>TSV FTL PNC supposé identique à celui du CDB</b>`);
            const ofpLeg = duty.legs.filter(leg => leg.isOFP).pop();
            if (ofpLeg) {
                const ofp_PNCAF_REST = (ofpLeg) ? ofpLeg.reposPNC : 0;
                const reposPNC = {
                    "AF": {'value': ofp_PNCAF_REST, 'textValue': minutesToHHMM(ofp_PNCAF_REST)},
                    "FTL":{'value': FDP_PNC_REST.value, 'textValue': FDP_EASA_PNC_PRE_REST.dataDisplay(FDP_PNC_REST.value)}
                }
                let retardPNC;
                const RETARD_PNC_TSVMAX_1730 = "TSV AF PNC maxi 17h30";
                const RETARD_PNC_TSVMAX_1500 = "TSV AF PNC maxi 15h00";
                if (isBase(base, ofpLeg.depIATA) && flightTypeAircraft === "LC") { // MANEX 07.09.06.B
                    retardPNC = {};
                    retardPNC.value = 360 - 30 * Math.ceil(Math.max((duty.scheduledBlockTime - 360), 0) / 60);
                    retardPNC.textValue = minutesToHHMM(retardPNC.value);
                    console.log(duty.legs.length, duty.scheduledBlockTime)
                    if (duty.legs.length === 1 && duty.scheduledBlockTime > 870) {
                        retardPNC.textValue = RETARD_PNC_TSVMAX_1730;
                    }else if (duty.legs.length > 1 && duty.scheduledBlockTime > 570) {
                        retardPNC.textValue = RETARD_PNC_TSVMAX_1500;
                    }else{
                        retardPNC.OUT = new Date(duty.OUT.getTime() + retardPNC.value * 60000);
                        retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
                    }
                    if (ofpLeg.destIATA === 'BEY' && isOFPDuty) {
                        steps.push(`<b class="warning">Vérifiez les conditions des vols BEY pour le retard PNC</b><cite>MANEX 07.09.06.B.b</cite>`);
                        retardPNC.textOUT = `<span class="warning">${retardPNC.textOUT}</span>`;
                    }
                    if (isOFPDuty) steps.push(`A la base, il y a un retard maximum pour les PNC LC de ${retardPNC.textValue} <b>(si service de vol identique)</b>`);
                }
                const blockTimeOFP = duty.legs[duty.legs.length - 1].blockTimeOFP;
                if (blockTimeOFP) { // on last leg perform departure computations
                    if (isOFPDuty) steps.push(`Dernière étape du SV, butées départ calculées avec le bloc: ${minutesToHHMM(blockTimeOFP)}`);
                    maxTSV_PEQ2.OUT = new Date(maxTSV_PEQ2.IN.getTime() - (blockTimeOFP * 60000));
                    maxTSV_PEQ3.OUT = new Date(maxTSV_PEQ3.IN.getTime() - (blockTimeOFP * 60000));
                    maxTSV_PEQ4.OUT = new Date(maxTSV_PEQ4.IN.getTime() - (blockTimeOFP * 60000));
                    maxTSV_PEQ2.textOUT = (maxTSV_PEQ2.textIN === FORBIDDEN) ? '' : `<span class="formula">${dateToHHMM(maxTSV_PEQ2.IN)}z - ${minutesToHHMM(blockTimeOFP)} = </span>${dateToHHMM(maxTSV_PEQ2.OUT)}z`; // easyer for shortcuts
                    maxTSV_PEQ3.textOUT = (maxTSV_PEQ3.textIN === FORBIDDEN) ? '' : `<span class="formula">${dateToHHMM(maxTSV_PEQ3.IN)}z - ${minutesToHHMM(blockTimeOFP)} = </span>${dateToHHMM(maxTSV_PEQ3.OUT)}z`;
                    maxTSV_PEQ4.textOUT = (maxTSV_PEQ4.textIN === FORBIDDEN) ? '' : `<span class="formula">${dateToHHMM(maxTSV_PEQ4.IN)}z - ${minutesToHHMM(blockTimeOFP)} = </span>${dateToHHMM(maxTSV_PEQ4.OUT)}z`;
                    if (retardPNC) {
                        const afOffset = (courrierCroise) ? 90 : 30;
                        if (retardPNC.textValue === RETARD_PNC_TSVMAX_1730) {
                            retardPNC.OUT = new Date(duty.reportingAF.getTime() + (17.5 * 3600000) - (afOffset * 60000) - (blockTimeOFP * 60000));
                            retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
                            if (ofpLeg.destIATA === 'BEY') {
                                retardPNC.textOUT = `<span class="warning">${retardPNC.textOUT}</span>`
                            }
                        }else if (retardPNC.textValue === RETARD_PNC_TSVMAX_1500) {
                            retardPNC.OUT = new Date(duty.reportingAF.getTime() + (15 * 3600000) - (afOffset * 60000) - (blockTimeOFP * 60000));
                            retardPNC.textOUT = dateToHHMM(retardPNC.OUT) + 'z';
                            if (ofpLeg.destIATA === 'BEY') {
                                retardPNC.textOUT = `<span class="warning">${retardPNC.textOUT}</span>`
                            }
                        }
                    }
                }else{
                    maxTSV_PEQ2.textOUT = 'calculé uniquement sur la dernière étape du SV';
                    maxTSV_PEQ3.textOUT = maxTSV_PEQ2.textOUT;
                    maxTSV_PEQ4.textOUT = maxTSV_PEQ2.textOUT;
                    if (retardPNC && (retardPNC.textValue === RETARD_PNC_TSVMAX_1730 || retardPNC.textValue === RETARD_PNC_TSVMAX_1500)) {
                        retardPNC.textOUT = retardPNC.textValue;
                    }
                }
                enhancedDuties.push({...duty, acclimatization, reposPNC, 'retardPNC': retardPNC || '', maxTSV_PEQ2, maxTSV_PEQ3, maxTSV_PEQ4, maxTSVFTL, maxTSVAF});
            }else{
                enhancedDuties.push({...duty})
            }
            previousReportingFTL = duty.reportingFTL;
            previousFTLTZ = duty.depTZ;
            previousDepIATA = duty.depIATA;
            previousEndTSVAF = new Date(duty.reportingAF.getTime() + (duty.TSVAF * 60000));
        }
    }
    steps.push(`Il est possible d'ajouter au TSV MAX une marge de 2h en PEQ2 et 3h en PEQ3/PEQ4 <cite>MANEX 07.06.07.B</cite>`);
    steps.push(`<b>La REGUL PN a toujours raison</b> (même s'il faut parfois insister...)`);
    return enhancedDuties;
}
export const pairingData = (ofp) => {
    //const results = {};
    if (!ofp) return {};
    let pairing = {};
    let duties = [];
    let steps = [];
    let scheduledTSV;
    let pattern, match;
    let pilotCount, pncCount;
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
            pilotCount = parseFloat(match[1]);
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
        let previousDestTZ, previousDestICAO;
        let duty = {"legs": []};
        let flightTypePNC = "MC";
        let flightTypePNT = "MC1";
        let base = undefined;
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
            const departure = editolido.iata2GeoPoint(depIATA);
            if (!base) base = (parisBase.includes(depIATA)) ? 'PAR' : depIATA;
            const destTZ = tzDec(match[6]);
            if (previousDestTZ === undefined && base === 'PAR') {
                previousDestTZ = iso2TZ(`${y}-${match[2]}-${match[1]}T${match[7]}:${match[8]}Z`);
            }
            const depTZ = (previousDestICAO && isFrenchMetropolitan(previousDestICAO)) ? iso2TZ(`${y}-${match[2]}-${match[1]}T${match[7]}:${match[8]}Z`) : previousDestTZ;
            const arrival = editolido.iata2GeoPoint(match[5]);
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
                duties.push(addDutyMeta(duty));
                duty = {"legs": []};
            }
            const isOFP = scheduledOut.toISOString() === ofp.infos.ofpOUT.toISOString();
            duty.legs.push({
                //"depPoint": {"latitude": departure.latitude.toFixed(6), "longitude": departure.longitude.toFixed(6)},
                "depICAO": departure.name,
                "depIATA": depIATA,
                //"destPoint": {"latitude": arrival.latitude.toFixed(6), "longitude": arrival.longitude.toFixed(6)},
                "destIATA": match[5],
                "destICAO": arrival.name,
                //"groundDistance": groundDistance,
                "destTZ": destTZ,
                "depTZ": depTZ,
                "OUT": scheduledOut,
                "IN": scheduledIN,
                "blockTime": blockTime,
                "blockTimeOFP": (isOFP) ? ofp.infos.blockTime : undefined,
                "isOFP": isOFP,
                "isMEP": isMep,
                "reposPNC": (isOFP) ? flightRestTimePNCAF((ofp.infos.ofpON - ofp.infos.ofpOFF) / 60000) : undefined
            });
            previousDestTZ = destTZ;
            previousDestICAO = arrival.name;
        }
        if (duty.legs.length > 0) duties.push(addDutyMeta(duty));
        pairing.baseTZ = previousDestTZ;
        pairing.base = base;
        if (duties.length > 0 && duties[0].depTZ === undefined && duties[0].legs.length > 0) {
            console.debug('depTz set via last flight of pairing');
            duties[0].legs[0].depTZ = previousDestTZ;
            duties[0].depTZ = previousDestTZ;
        }
        pairing.flightTypePNT = (flightTypePNT === "MC2" && getMeridians(base, parseFloat(pairing.baseTZ), duties) >= 4) ? "LC" : flightTypePNT;
        pairing.flightTypePNC = flightTypePNC;
        pairing.aircraftType = (ofp.infos) ? ofp.infos.aircraftType : '???';
        pairing.flightTypeAircraft = (['220', '318', '319', '320', '321'].includes(pairing.aircraftType)) ? "MC" : "LC";
        steps.push(`<b>la rotation satisfait au MANEX 07.05.04.A ou 07.05.04.C (standard ou avec repos en vol)</b>`);
        if (['PAR', 'TLS', 'MRS', 'NCE', 'PTP'].includes(base)){
            steps.push(`base ${base}`);
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
        
        //console.log(getMeridians(base, parseFloat(pairing.baseTZ), duties))
        duties = addDutiesMeta(duties, pairing, steps);
    } catch (err) {
        if (!(err instanceof editolido.StringExtractException)) {
            console.error(err);
        }
        steps.push(`<span class="error">Erreur pendant l'export d'OFP2MAP</span>`);
        duties = [];
    }
    //console.log(ofp.infos);


    //results.pairing = pairing;
    //results.pairing.duties = duties; 
    const duty = duties.filter(duty => duty.legs.reduce((a, v) => v.isOFP || a, false)).pop() || {};

    //results.scheduledTSV = scheduledTSV; //deprecated
    // if (duty) {
    //     duty.TSVOFP = scheduledTSV;
    //     // if (duty.legs.length > 0) {
    //     //     const lastLeg = duty.legs[duty.legs.length - 1];
    //     //     if (!isBase(pairing.base, lastLeg.destIATA)) {
    //     //         duty.layover = lastLeg.destIATA;
    //     //         duty.layoverTZ = lastLeg.destTZ;
    //     //     }
    //     // }
    // }
    //results.duty = duty;
    //return results;
    return {
        ...duty,
        'rules': pairing.flightTypeAircraft,
        'title': (duty.legs) ? duty.legs.reduce((a, leg) => a + '-' + leg.destIATA, duty.depIATA || '') : '',
        'isCargo': pairing.isCargo,
        pilotCount,
        pncCount,
        steps,
        scheduledTSV // deprecated
    }
}
const computeAcclimatization = (previousReporting, previousTZ, previousDepIATA, {reportingFTL, depTZ, depIATA}, steps) => {
    const ellapsedTimeMn = (reportingFTL.getTime() - previousReporting.getTime()) /60000;
    const meridians = Math.abs(parseFloat(depTZ) - parseFloat(previousTZ));
    let tzInfos = [`${previousDepIATA} ${previousTZ}`,`${depIATA} ${depTZ}`, `${meridians}`];
    if (!isFrenchMetropolitan(previousDepIATA)) {
        tzInfos[0] = `<b>${tzInfos[0]}</b>`;

    }
    if (!isFrenchMetropolitan(depIATA)){
        tzInfos[1] = `<b>${tzInfos[1]}</b>`;

    }
    steps.push(`Temps écoulé depuis dernière présentation FTL: ${minutesToHHMM(ellapsedTimeMn)}, méridiens traversés: ${tzInfos[2]} (${tzInfos[0]} -> ${tzInfos[1]})`);
    let tz = null, iata;
    const {x, y, ix, iy, value} = matchInTable([ellapsedTimeMn, meridians], EASA_ACCLIMATIZATION);
    if (value === "B"){
        tz = previousTZ;
        iata = previousDepIATA;
    }
    else if (value === "D") {
        tz = depTZ;
        iata = depIATA;
    }
    return {x, y, ix, iy, value, tz, 'iata': iata};
}
const computeRefTimeTZAF = (flightTypeAircraft, flightTypePNT, baseTZ, base, ellapsedHours, {depTZ, depIATA}, steps) => { //MANEX 07.08.01.A
    const deltaTZ = Math.abs(parseFloat(depTZ) - parseFloat(baseTZ));
    const tzFormat = tz => (tz >= 0) ? `+${tz}`: tz.toString();
    let tzInfos = `${depIATA} ${depTZ}`;
    if (!isFrenchMetropolitan(depIATA)) tzInfos = `<b>${tzInfos}</b>`;
    steps.push(`Temps d'absence AF depuis début de la rotation: ${decimalToHHMM(ellapsedHours)}, méridiens traversés: ${deltaTZ} ( ${base} ${baseTZ} ->  ${tzInfos})`);
    if (flightTypeAircraft === "LC" && flightTypePNT === "LC") {
        if (ellapsedHours < 24) {
            return baseTZ;
        }else if (ellapsedHours < 48){
            if (deltaTZ >= 3) {
                return tzFormat(parseFloat(baseTZ) + 3);
            }else if (deltaTZ <= -3) {
                return tzFormat(parseFloat(baseTZ) - 3);
            }else{
                return depTZ;
            }
        }else if (ellapsedHours < 96){
            if (deltaTZ >= 6) {
                return tzFormat(parseFloat(baseTZ) + 6);
            }else if (deltaTZ <= -6) {
                return tzFormat(parseFloat(baseTZ) - 6);
            }else{
                return depTZ;
            }
        }else{
            return depTZ;
        }
    } else {
        return baseTZ;
    }
};
const EASA_ACCLIMATIZATION = {
    "title": "Table MANEX 07.02.Défininitions",
    // 48h=2880mn 72h=4320mn 96h=5760mn 120h=7200mn
    "x": [x => x < 2880, x => x < 4320, x => x < 5760, x => x < 7200, x => x >= 7200],
    "xLabel": ['< 48:00', '48:00-71:59 ', '72:00-95:59', '96:00-119:59', '≥ 120:00'],
    "xLegend": "Time elapsed since reporting at reference time",
    "xDisplay": x => `${Math.floor(x/60)}:${(x % 60).toString().padStart(2,0)}`,
    "y": [y => y < 4, y => y <= 6, y => y <= 9, y => y <= 12],
    "yLabel": ['< 4', '≤ 6', '≤ 9', '≤ 12'],
    "yLegend": "Time difference (h) between reference time and local time where the crew member starts the next duty",
    "yDisplay": y => `${y}`,
    "data": [
        ["B", "D", "D", "D", "D"],
        ["B", "X", "D", "D", "D"],
        ["B", "X", "X", "D", "D"],
        ["B", "X", "X", "X", "D"],
    ],
    "dataDisplay": v => v,
};
const easaNumberOfLegs = (legs) => legs.length - ((legs.length > 0 && legs[0].isMEP) ? 1 : 0); //MANEX 07.05.05
const afNumberOfLegs = (legs) => legs.length - ((legs.length > 0 && legs[legs.length-1].isMEP) ? 1 : 0); //MANEX 07.08.03 & 07.08.05.D
const FDP_EASA_BASE_ACCLIMATED_DATA = {
    "title": "Table MANEX 07.05.04.A",
    "x": [x => x <= 2, x => x === 3, x => x === 4, x => x === 5, x => x === 6],
    "xLabel": ["1 à 2 étapes", "3 étapes", "4 étapes", "5 étapes", "6 étapes"],
    "xLegend": "TSV quotidien maximal de base – membres d’équipages acclimatés",
    "xDisplay": x => `${x} étape${(x > 1) ? 's' : ''}`,
    "y": [y => y>= 6 && y < 13.5, y => y >= 13.5 && y < 14, y => y >=14 && y < 14.5, y => y >= 14.5 && y < 15, y => y >= 15 && y < 15.5, y => y >= 15.5 && y < 16, y => y >= 16 && y < 16.5, y => y >= 16.5 && y < 17, y => (y>= 17 || y < 5), y => y >= 5 && y < 5.25, y => y >= 5.25 && y < 5.5, y => y >= 5.5 && y < 5.75, y => 5.75 && y < 6],
    "yLabel": ["06:00-13:29", "13:30-13:59", "14:00-14:29", "14:30-14:59", "15:00-15:29", "15:30-15:59", "16:00-16:29", "16:30-16:59", "17:00-04:59", "05:00-05:14", "05:15-05:29", "05:30-05:44", "05:45-05:59"],
    "yLegend": "Début du TSV à l'heure de référence",
    "yDisplay": decimalToHHMM,
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
    "dataDisplay": decimalToHHMM
};

const FDP_EASA_BASE_UNKNOWN_ACCLIMATIZATION_DATA = {
    "title": "Table MANEX 07.05.04.B",
    "x": [x => x <= 2, x => x === 3, x => x === 4, x => x === 5],
    "xLabel": ["1 à 2 étapes", "3 étapes", "4 étapes", "5 étapes"],
    "xLegend": "TSV quotidien maximal de base – acclimatation inconnue",
    "xDisplay": x => `${x} étape${(x > 1) ? 's' : ''}`,
    "y": [y => y === true, y => y === false],
    "yLabel": ["SGRF", "STD"],
    "yLegend": "accord SGRF",
    "yDisplay": y => ((y) ? "SGRF" : "STD"),
    "data": [
        [12.00, 11.50, 11.00, 10.50],
        [11.00, 10.50, 10.00,  9.50]
    ],
    "dataDisplay": decimalToHHMM
};
const FDP_EASA_PNC_PRE_REST = {
    "title": "Table MANEX 07.05.04.C.c",
    "x": [x => x === true, x => x === false],
    "xLabel": ["PRE", "PRE HS"],
    "xLegend": "Repos en vol PNC minimum",
    "xDisplay": x => (x) ? 'PRE' : 'PRE HS',
    "y": [y => y <= 14.5, y => y <= 15, y => y <= 15.5, y => y <= 16, y => y <= 16.5, y => y <= 17, y => y <= 17.5, y => y <= 18, () => true],
    "yLabel": ["jusqu'à 14:30", "14:31-15:00", "15:01-15:30", "15:31-16:00", "16:01-16:30", "16:31-17:00", "17:01-17:30", "17:31-18:00"],
    "yLegend": "TSV prolongé maximum",
    "yDisplay": decimalToHHMM,
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
    const numberOfLegs = easaNumberOfLegs(legs);
    let hasOneSectorOf9hours = false;
    const reducer = (p, leg) => Math.max(p, leg.blockTime);
    if (numberOfLegs === 2) {
        if (numberOfLegs < legs.length) {
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
const maxTSVWithRest = (legs, numberOfPilots, isCargo=false) => { // MANEX 07.08.05.C
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
            return (numberOfLegs === 1) ? 18 : (numberOfLegs === 2 ) ? 17.5 : 0;
        }
        if (numberOfLegs === 1 || (numberOfLegs === 2 && legs.length > 0 && legs[0].blockTime <= 90)) {
            return 16.5;
        }else if (numberOfLegs === 2 && legs.length > 0 && legs[0].depICAO === legs[1].destICAO ){ // AR
            return 14;
        }else if (numberOfLegs === 2){ // not AR
            if (legs.length > 0 && legs[0].depIATA === 'MEX' && legs[0].blockTime <= 210) { //retour MEX, première étable moins de 3h30
                return 16.5;
            }
            return 15;
        }else if (numberOfLegs === 3 && legs.length > 0){
            const localTimeOfDepartureDate = new Date(legs[0].OUT.getTime() + (parseFloat(legs[0].depTZ) * 3600000));
            const localTimeOfDeparture = localTimeOfDepartureDate.getUTCHours() + (localTimeOfDepartureDate.getUTCMinutes() / 60);
            if (localTimeOfDeparture <= 10.5) {
                const blockTimeCondition = legs.reduce((p, leg) => (p || leg.blockTime >= 330), false); //au moins une étape de plus de 5h30
                if (blockTimeCondition) {
                    return 14.5; // cargo tri tronçons afrique (TODO: Afrique non testé)
                }
            }
        }
    }
    return 0;
};

const computeMaxTSVAF_PEQ2 = (legs, flightTypeAircraft, refTime, previousRest) => {
    const numberOfLegs = afNumberOfLegs(legs);
    if (flightTypeAircraft === "LC") {
        return {"value": Math.min(interpolate(refTime, (numberOfLegs <= 3) ? AF_LC_1_OR_2_OR_3_LEGS : AF_LC_4_LEGS), previousRest), "legs": numberOfLegs, refTime, "type": flightTypeAircraft};
    }else{
        if (numberOfLegs <= 2) {
            return {"value": Math.min(interpolate(refTime, AF_MC_1_OR_2_LEGS), previousRest), "legs": numberOfLegs, refTime, "type": flightTypeAircraft};
        }else if (numberOfLegs === 3) {
            return {"value": Math.min(interpolate(refTime, AF_MC_3_LEGS), previousRest), "legs": numberOfLegs, refTime, "type": flightTypeAircraft};
        }else if (numberOfLegs === 4) {
            return {"value": Math.min(interpolate(refTime, AF_MC_4_LEGS), previousRest), "legs": numberOfLegs, refTime, "type": flightTypeAircraft};
        }else if (numberOfLegs === 5) {
            return {"value": Math.min(interpolate(refTime, AF_MC_5_LEGS), previousRest), "legs": numberOfLegs, refTime, "type": flightTypeAircraft};
        }
    }
};
const matchInTable = ([x, y], table) => {
    const ix = table.x.findIndex(fn => fn(x));
    const iy = table.y.findIndex(fn => fn(y));
    return {x, y, ix, iy, "value": (ix >=0 && iy >= 0) ? table.data[iy][ix] : undefined};
}
const AF_MC_1_OR_2_LEGS = [
    [0, 10.5], [4.5, 10.5], [6, 13], [8, 13], [12, 13], [18, 10.5], [24, 10.5]
];
const AF_MC_3_LEGS = [
    [0, 10.5], [4.9999, 10.5], [5, 10.75], [5.5, 12.5], [13.5, 12.5], [17.9999, 10.75], [18, 10.5], [24, 10.5]
];
const AF_MC_4_LEGS = [
    [0, 10.5], [4.9999, 10.5], [5, 10.75], [5.5, 12], [14.75, 12.5], [17.9999, 10.75], [18, 10.5], [24, 10.5]
];
const AF_MC_5_LEGS = [
    [0, 0], [8.2499, 0], [8.25, 12], [13, 12], [12.5, 11.5], [16, 8], [16.0001, 0]
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
