<script context="module">
    export const getMoonIlluminationPercent = (moonIllumination) => Math.round(moonIllumination.fraction * 100);
    export const getMoonEmoji = (moonIllumination) => {
        //https://fr.wikipedia.org/wiki/Phase_de_la_Lune
        const phase = moonIllumination.phase;
        const fraction = moonIllumination.fraction;
        if (!phase || !fraction) return "☽";
        if(fraction <= 0.02) {
            return '🌑';
        }else if (phase < 0.5 && fraction <= 0.34){
            return '🌒';
        }else if (phase < 0.5 && fraction <= 0.65){
            return '🌓';
        }else if (phase < 0.5 && fraction < 0.97){
            return '🌔';
        }else if (fraction >= 0.97){
            return '🌕';
        }else if (phase >= 0.5 && fraction > 0.65){
            return '🌖';
        }else if (phase >= 0.5 && fraction > 0.34){
            return '🌗';
        }else{
            return '🌘';
        }
    };
    export const getMoonName = (moonIllumination) => {
        //https://en.wikipedia.org/wiki/Lunar_phase
        //rounded to the nearest % integer
        const phase = moonIllumination.phase;
        const fraction = getMoonIlluminationPercent(moonIllumination);
        if(fraction <= 0) {
            return 'Nouvelle lune';
        }else if (phase < 0.5 && fraction < 50) {
            return 'Premier croissant';
        }else if (phase < 0.5 && fraction === 50) {
            return 'Premier quartier';
        }else if ((phase < 0.5 && fraction < 100)){
            return 'Gibbeuse croissante';
        }else if (fraction === 100){
            return 'Pleine Lune';
        }else if (phase >= 0.5 && fraction > 50){
            return 'Gibbeuse décroissante';
        }else if (phase >= 0.5 && fraction === 50){
            return 'Dernier quartier';
        }else{
            return 'Dernier croissant';
        }
    };
</script>
<script>
    import {getMoonIllumination, getMoonPosition} from './suncalc';

    export let date;
    export let position;
    export let type = null;

    $: moonEmojiStyle = () => {
        if (!date || !position) return 0;
        const mi = getMoonIllumination(date);
        const emojiOrientationCorrection = (mi.phase >= 0.5) ? Math.PI/2 : -Math.PI/2;
        const oa = mi.angle - getMoonPosition(date, position).parallacticAngle;
        return `transform: rotate(${ -oa + emojiOrientationCorrection}rad);`
    };
</script>
<span class="moon" class:rise={type==='moonrise'} style="{moonEmojiStyle()}"><slot></slot></span>

<style>
    .moon {
        display: inline-block;
        transform-origin: center;
    }
    .rise {
        color: #FCBF49;
    }
</style>
