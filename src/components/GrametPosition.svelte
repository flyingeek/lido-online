<script>
    import {route, isFakeOfp, grametPosition, fl} from '../stores'; 

</script>
{#if $route === '/map' && !$isFakeOfp}
    <input bind:value={$fl} type="range" min=200 max=450 step=1/>{$fl}
    <input bind:value={$grametPosition} type="range" min=0 max=100 step=1/>
{/if}
<style>

</style>