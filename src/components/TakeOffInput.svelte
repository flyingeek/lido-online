<script>
    import {ofp, simulate, takeOffTime, showPlaneOnMap} from '../stores';
    import blurAction from '../actions/blurAction';
    export let name="take-off";

    const getOfpTakeOffTime =  (currentOfp) => {
        const value = new Date(currentOfp.infos.datetime.getTime() + ($ofp.infos.taxitime * 60000));
        $takeOffTime = value;
        return value;
    };

    $: ofpTakeOff = getOfpTakeOffTime($ofp);

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
        if (newTakeOff.toISOString() !== ofpTakeOff.toISOString()) {
            e.target.classList.add("changed");
        }else{
            e.target.classList.remove("changed");
        }
    };
</script>

<div>
    <svg class:show={$showPlaneOnMap || $simulate >= 0} class:hide={!($showPlaneOnMap || $simulate >= 0)} on:click={() => $showPlaneOnMap = !$showPlaneOnMap}><use xlink:href="#takeoff-symbol"/></svg>
    <label for="{name}">Heure de décollage</label><!-- displayed in ios popup -->
    <input id="{name}" name="{name}" type="time" use:blurAction on:change={changeTime} value="{hm2input(ofpTakeOff.getUTCHours(), ofpTakeOff.getUTCMinutes())}" />
</div>

<style>
    label{
        display: none;
        /* position: absolute; */
        /* top: -50px; */
    }
    div {
        display: flex;
        align-items: flex-start;
        /* outline: 1px solid rgba(0,0,0,0.2); */
        /* outline-style: dashed; */
        outline: 1px solid #ced4da55;
        margin-top: -1px;
    }
    svg {
        width: 30px;
        height: 30px;
        display: inline-block;
        margin-right: 5px;
        margin-top: -1px;
        cursor: pointer;
    }
    svg.show {
        stroke: rgba(0,0,0,.9);
        fill: var(--plane-halo-color);
    }
    svg.hide {
        stroke:transparent;
        fill: rgba(0,0,0,.5);
    }
    input {
        background-color: var(--light);
        border-color: transparent;
        color:rgba(0,0,0,.5);
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
    }
    div :global(input.changed){
        color:rgba(0,0,0,.9);
    }
    @media not all and (min-resolution:.001dpcm) { /* Safari hack */
        @media all{
            input { 
                width: 60px;
            }
        }
        div {
            margin-right: 6px; /* just enough place for the outline */
        }
    }

</style>