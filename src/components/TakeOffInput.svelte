<script>
    import {ofp, takeOffTime} from '../stores';
    export let name="take-off";

    const ofpTakeOff = new Date($ofp.infos.datetime);
    ofpTakeOff.setUTCMinutes(ofpTakeOff.getMinutes() + $ofp.infos.taxitime);
    $takeOffTime = ofpTakeOff;

    const hm2input = (hours, minutes) => `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const changeTime = (e) => {
        let minutes, hours;
        if (e.target.value == ''){
            hours = ofpTakeOff.getUTCHours();
            minutes = ofpTakeOff.getUTCMinutes();
            e.target.blur();
            e.target.value = hm2input(hours, minutes);
        }else{
            hours = parseFloat(e.target.value.slice(0,2));
            minutes = parseFloat(e.target.value.slice(3));
        }

        let newTakeOff = new Date(ofpTakeOff);
        newTakeOff.setUTCMinutes(minutes);
        newTakeOff.setUTCHours(hours);
        const diff = (newTakeOff.getTime() - ofpTakeOff.getTime()) / 60000;
        if (diff < -720 ) {
            newTakeOff = new Date(newTakeOff.getTime() + (1440 * 60000)); // +1 day
        } else if (diff > 720 ){
            newTakeOff = new Date(newTakeOff.getTime() - (1440 * 60000)); // -1 day
        }
        $takeOffTime = newTakeOff;
    };
</script>

<div>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Aircraft_take_off" x="0px" y="0px" viewBox="0 0 20 20" enable-background="new 0 0 20 20" xml:space="preserve">
        <head/><path d="M19.87,6.453c0.119,0.257,0.127,1.29-4.884,3.642l-4.913,2.306c-1.71,0.803-4.191,1.859-5.285,2.151  c-0.766,0.204-1.497-0.316-1.497-0.316s-2.206-1.975-2.792-2.419c-0.585-0.444-0.535-0.67,0.215-0.91  c0.467-0.149,3.13,0.493,4.265,0.78c1.339-0.8,2.562-1.486,3.141-1.798c-1.396-1.033-4.008-2.962-4.841-3.55  c-0.799-0.565,0.01-0.768,0.01-0.768c0.368-0.099,1.162-0.228,1.562-0.144c2.721,0.569,7.263,2.071,7.611,2.186  c0.832-0.436,2.128-1.092,2.922-1.465C17.459,5.174,19.711,6.111,19.87,6.453z"/>
    </svg>
    <label for="{name}">Heure de décollage</label><!-- displayed in ios popup -->
    <input id="{name}" name="{name}" type="time" required="required" on:change={changeTime} value="{hm2input(ofpTakeOff.getUTCHours(), ofpTakeOff.getUTCMinutes())}" />
</div>

<style>
    label{
        display: none;
        /* position: absolute; */
        /* top: -50px; */
    }
    div {
        margin-right: 1rem;
        display: flex;
        align-items: flex-start;
    }
    svg {
        width: 30px;
        display: inline-block;
        margin-right: 2px;
        fill: rgba(0,0,0,.5);
        margin-top: -2px;
    }
    input {
        background-color: var(--light);
        border-color: transparent;
        color:rgba(0,0,0,.5);
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
    }
    @media not all and (min-resolution:.001dpcm) { /* Safari hack */
        @media all{
            input { 
                width: 60px;
            }
        }
        div {
            margin-right: 0;
        }
    }

</style>