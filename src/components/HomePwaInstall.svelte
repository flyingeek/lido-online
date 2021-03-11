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
            <p class="text">Si OFP2MAP est déjà sur l'écran d'accueil, ne l'installez pas une deuxième fois. Attention: l'installation ne peut se faire que depuis
                le navigateur Safari, ce n'est pas possible depuis une WebView (à l'intérieur d'une app).
            </p>
            {#if !requiredNavigator}
                <p class="guide error">Merci d'ouvrir cette page dans Safari</p>
            {:else}
                <ol class="guide">
                    <li>Dans la barre de menu, cliquez sur <svg><use xlink:href="#share" /></svg></li>
                    <li>Faites défiler, choisir&#8239;: <em>Sur l'écran d'accueil</em>
                        <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                    </li>
                    <li>Lancez l'application depuis l'écran d'accueil</li>
                </ol>
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
    }
    .text{
        font-size: 14px;
        line-height: 20px;
        margin: 0 0 1em;
        text-align: justify;
    }
    .guide{
        display: flex;
        font-size: 16px;
        justify-content: center;
        margin: 0;
        line-height: 35px;
        text-align: left;
        flex-direction: column;
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
    svg[fill=none]{
        fill: transparent;
        width: 22px;
        height: 22px;
        margin-left: 12px;
    }
    ol {
        list-style: none;
        counter-reset: guide-counter;
        margin-left: 60px !important;
    }
    ol li {
        counter-increment: guide-counter;
        text-align: left;
    }
    ol li::before {
        content: counter(guide-counter);
        color: var(--blueaf);
        font-weight: bold;
        font-size: large;
        margin-right: 10px;
    }

</style>