<script>
    import Logo from './Logo.svelte';
    import SWUpdate from './SWUpdate.svelte';
    import {usingChromeOnIOS, usingSafari} from './utils';
    const requiredNavigator =  usingSafari && !usingChromeOnIOS;
</script>

<Logo/>
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
                <svg><use xlink:href="#share" /></svg>
                puis faites défiler pour choisir “<b>Sur l'écran d'accueil</b>”</p>
            {/if}
        </div>
    </div>
</div>
<SWUpdate/>
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
        line-height: 35px;
    }
    .guide.error{
        font-weight: 600;
        color: red;
    }
    svg{
        margin: 0 0 5px;
        width: 30px;
        height: 30px;
        fill: #007AFF;
    }

</style>