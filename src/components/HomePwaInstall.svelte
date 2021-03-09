<script>
    import Logo from './Logo.svelte';
    import SWUpdate from './SWUpdate.svelte';
    import {usingChromeOnIOS, usingSafari} from './utils';
    const requiredNavigator =  usingSafari && !usingChromeOnIOS;
</script>

<Logo></Logo>
<div class="prompt-container">
    <div class="prompt">
        <div class="icon-container">
            <img src="./images/ofp2map-icons/icon-128x128.png" alt="OFP2MAP">
        </div>
        <div class="prompt-content">
            <h3 class="title">Installez OFP2MAP</h3>
            <p class="text">En raison du cache utilisé pour le mode déconnecté, cette application doit,
                sur l'iPad, être installée sur l'écran d'accueil, puis être lancée depuis l'écran d'accueil.{#if !requiredNavigator}<span>&nbsp;L'installation ne peut se faire que depuis
                le navigateur Safari.</span>{/if}
            </p>
            {#if !requiredNavigator}
            <p class="guide error">Merci d'ouvrir cette page dans Safari</p>
            {:else}
            <p class="guide">Cliquez en haut sur 
                <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Partager</title><path d="M48.883,22.992L61.146,10.677L61.146,78.282C61.146,80.005 62.285,81.149 64,81.149C65.715,81.149 66.854,80.005 66.854,78.282L66.854,10.677L79.117,22.992C79.693,23.57 80.256,23.853 81.114,23.853C81.971,23.853 82.534,23.57 83.11,22.992C84.25,21.848 84.25,20.125 83.11,18.981L65.997,1.794C65.715,1.511 65.421,1.215 65.139,1.215C64.563,0.932 63.718,0.932 62.861,1.215C62.579,1.498 62.285,1.498 62.003,1.794L44.89,18.981C43.75,20.125 43.75,21.848 44.89,22.992C46.029,24.149 47.744,24.149 48.883,22.992ZM103.936,35.32L81.114,35.32L81.114,41.053L103.936,41.053L103.936,121.27L24.064,121.27L24.064,41.053L46.886,41.053L46.886,35.32L24.064,35.32C20.928,35.32 18.355,37.904 18.355,41.053L18.355,121.27C18.355,124.419 20.928,127.003 24.064,127.003L103.936,127.003C107.072,127.003 109.645,124.419 109.645,121.27L109.645,41.053C109.645,37.891 107.072,35.32 103.936,35.32Z"></path></svg>
                puis faites défiler pour choisir “<b>Sur l'écran d'accueil</b>”</p>
            {/if}
        </div>
    </div>
</div>
<SWUpdate></SWUpdate>
<style>
    .prompt-container {
        align-items: center;
        box-sizing: border-box;
        display: flex;
        height: 100%;
        justify-content: center;
        padding: 30px;
        position: fixed;
        width: 100%;
        margin-top: 3em;
    }
    .prompt{
        background: #FFF;
        border-radius: 2px;
        box-shadow: 0px 4px 8px rgba(0,0,0,0.125);
        box-sizing: border-box;
        color: #424242;
        font-family: sans-serif;
        max-width: 640px;
        position: relative;
        text-align: center;
        z-index: 1;
    }
    .icon-container{
        background: url("data:image/svg+xml,%3Csvg viewBox='0 0 70 70' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23F0F0F0' d='M65,17C65,10.377 59.623,5 53,5L17,5C10.377,5 5,10.377 5,17L5,53C5,59.623 10.377,65 17,65L53,65C59.623,65 65,59.623 65,53L65,17Z' /%3E%3C/svg%3E%0A") center center / 70px 70px repeat-x;
        margin: 40px 0 0;
    }
    .icon-container img {
        border-radius: 12px;
        display: block;
        margin: 0 auto;
        width: 64px;
    }
    .prompt-content{
        padding: 10px 35px;
    }
    h3 {
        font-size: 24px;
        margin: 0 0 20px;
    }
    .text{
        font-size: 14px;
        line-height: 20px;
        margin: 0 0 46px;
        text-align: justify;
    }
    .guide{
        align-items: center;
        display: flex;
        font-size: 16px;
        justify-content: center;
        margin: 0;
    }
    .guide.error{
        font-weight: 600;
        color: red;
    }
    svg{
        margin: 0 7px 6px 7px;
        width: 20px;
        stroke-width: 5;
        stroke: #007AFF;
    }

</style>