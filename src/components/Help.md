<script>
    import Link from '../components/Link.svelte';
    import CircleProgress from '../components/CircleProgress.svelte';
    import EmbeddedVideo from '../components/EmbeddedVideo.svelte';
    import Speak from '../components/Speak.svelte';
    import {ofp, online} from '../stores.js';
    import plugins from "../plugins.json";
    $: ogimetURL = ($ofp) ? $ofp.ogimetData.url: 'http://www.ogimet.com';
    $: wmoWorldMapURL = 'https://flyingeek.github.io/scrapy-ogimet/' + (($ofp) ? '#' + $ofp.ogimetData.wmo.join('_') : '');
    const cbName = window.atob("Q2FydGFCb3NzeQ==");
</script>

<section id="/help">

## Préambule

OFP2MAP <Speak value="oefpé`toumape">[ofpˈtumæp]</Speak> est une application PWA (ou Web Application), elle peut être lancée soit depuis un navigateur, soit depuis l'écran d'accueil de l'iPad. Initialement, simple convertisseur de l'OFP en KML, OFP2MAP est devenu une vraie application de cartographie. OFP2MAP nécessite des navigateurs récents pour fonctionner. Safari 14 iOS/Mac est compatible, Chrome 83 fonctionne aussi.

L'OFP ne transite sur aucun serveur, seule une route calculée (basée sur au plus 21 stations météo) est transmise à l'hébergeur du proxy (voir plus bas) puis à Ogimet.com pour récupérer le Gramet. L'app ne collecte aucune donnée.

Avant d'utiliser OFP2MAP en vol, il est préférable de lire la rubrique [Mode hors ligne](#/help_offline). Ensuite le mémo visuel devrait vous permettre de vous débrouiller. Vos retours seront appréciés pour faire évoluer l'app. En cas de problèmes, merci de m'envoyer l'OFP concerné par mail.

</section>

<section id="/help_memovisuel">

## Mémo visuel

<svg viewBox="0 0 1194 834" style="width: 100%; height: auto; display: block">

  <image xlink:href="./images/map-help.webp" x="0" y="0" height="100%" width="100%"/>

  <a xlink:href="#/help_utilisation">
    <title>Choix projection</title>
    <rect x="7" y="64" width="147" height="137" fill="transparent"/>
  </a>
  <a xlink:href="#/help_offline">
    <title>Mode hors ligne</title>
    <rect x="162" y="74" width="151" height="162" fill="transparent"/>
  </a>
  <a xlink:href="#/help_ephemerides">
    <title>Éphémérides du vol</title>
    <polygon points="369,108,368,180,545,175,547,109,639,69,692,69,693,26,632,27,621,59,529,105" fill="transparent"/>
  </a>
  <a xlink:href="#/help_gramet">
    <title>GRAMET</title>
    <polygon points="576,142,575,252,753,250,753,142,702,142,739,64,791,64,792,26,720,25,725,62,685,142" fill="transparent"/>
  </a>
  <a xlink:href="#/help_position">
    <title>Position Estimée</title>
    <polygon points="820,25,821,137,790,136,791,240,874,247,879,146,938,142,926,90,898,88,903,26" fill="transparent"/>
  </a>
  <a xlink:href="#/help_gramet">
    <title>GRAMET</title>
    <polygon points="737,391,738,430,852,425,850,388" fill="transparent"/>
  </a>
  <a xlink:href="#/help_etops">
    <title>ETOPS</title>
    <polygon points="916,201,922,334,1021,310,1009,205,962,197,951,20,932,18,937,67,946,79,949,201" fill="transparent"/>
  </a>
  <a xlink:href="#/help_etops">
    <title>ETOPS</title>
    <rect x="559" y="568" width="215" height="104" fill="transparent"/>
  </a>
  <a xlink:href="#/help_export">
    <title>Export</title>
    <rect x="163" y="35" width="64" height="25" fill="transparent"/>
  </a>
  <a xlink:href="#/help_plugins">
    <title>Plugins</title>
    <polygon points="1023,26,1076,26,1076,66,1089,94,1084,127,967,125,964,95,1017,95" fill="transparent"/>
  </a>
  <a xlink:href="#/help_reglages_des_calques">
    <title>Réglages des calques</title>
    <rect x="1152" y="76" width="39" height="33" fill="transparent"/>
  </a>
  <a xlink:href="#/help_reglages_des_calques">
    <title>Réglages des calques</title>
    <rect x="1048" y="200" width="90" height="45" fill="transparent"/>
  </a>
  <a xlink:href="#/help_position">
    <title>Position GPS</title>
    <rect x="1068" y="293" width="112" height="89" fill="transparent"/>
  </a>
  <a xlink:href="#/help_position">
    <title>Position GPS</title>
    <rect x="1155" y="117" width="31" height="30" fill="transparent"/>
  </a>
  <a xlink:href="#/help_reglages_des_calques">
    <title>Style terrains</title>
    <rect x="88" y="541" width="144" height="97" fill="transparent"/>
  </a>
  <a xlink:href="#/help_updates">
    <title>Cycle AIRAC</title>
    <rect x="1108" y="721" width="82" height="58" fill="transparent"/>
  </a>
</svg>

</section>
<br/>
<section id="/help_utilisation">

## Utilisation

1. Dans Pilot Mission, onglet **Dossier de vol**, affichez le PDF nommé **Dossier de vol OFP**. Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez **Enregistrer dans Fichiers**. Dans l'app, c'est cet OFP qu'il faut ensuite sélectionner. {#if $online}<Link href="https://p169.p3.n0.cdn.getcloudapp.com/items/yAu14Y4x/23c3a918-e425-4d89-a53d-7f450449013b.mp4">Tutoriel&nbsp;vidéo</Link>.{/if}

2. La carte par défaut dépend de la distance: {cbName}, puis Mercator jusqu'à 1500nm puis Lambert. Il est possible sur la carte, en haut à gauche, de basculer sur d'autres projections&#8239;:
    - **Mercator**

        Projection Web Mercator avec un thème est inspiré des cartes VFR. Il y a 12 niveaux de zoom, dont 6 disponibles off-line

    - **Lambert North**

        Les parallèles sécants sont 30N et 65N, elle est recommandée au-dessus du 30N

    - **Lambert South & Pacific**

        Les parallèles sécants sont 30N et 15S, elles sont recommandées sous 30N

    - **Stéréographique**

        Une carte stéréographique polaire, son domaine d'utilisation est au dessus du 60N

    - **Artic**

        Une carte physique basée sur une projection azimutale équivalente de Lambert centrée sur le pôle nord

    - **The World**

        Un Atlas politique, c'est une projection Times. Les étiquettes sont en anglais.

    - **=Politique=**

        Un Atlas politique basé sur une projection Equal Earth (qui montre les continents et les pays à leur taille réelle). Les étiquettes sont en français. Cet Atlas est moins chargé que The World.

    - **=Physique=**

        Un Atlas physique basé sur une projection Equal Earth. Les étiquettes sont en français.

    - **NAM Physical**

        Un Atlas physique du continent Nord-Américain. Les étiquettes sont en anglais, les altitudes sont en mètres. C'est une projection azimutale de Lambert centrée sur 45N095W.

    - **{cbName} 2022**

        Une carte VFR qui couvre France/Belgique/Luxembourg/Suisse. {window.atob("VmluY2VudCBCb3NzeQ==")} a autorisé son utilisation. La dernière version est disponible sur <Link href="{`https://www.${cbName.toLowerCase()}.com`}">{cbName}.com</Link>.


3. Navigation dans la carte: on peut avec un doigt déplacer la carte, zoomer ou orienter la carte avec deux doigts.
__<span class="big">☞</span> Il est aussi possible de modifier l'angle de vue en balayant de bas en haut avec deux doigts__.

<br>

> OFP2MAP est compatible avec l'utilisation d'une souris, d'un trackpad ou d'un clavier, y compris sur iPad.<br/>
> <kbd>◀︎</kbd> <kbd>▶︎</kbd> <kbd>▲</kbd> <kbd>▼</kbd> pour translater, simultanément avec <kbd>**⇧**</kbd> pour tilter ou orienter. <kbd>+</kbd> et <kbd>-</kbd> pour le zoom. Il faut que la carte ait le focus (indiqué en bas à gauche par une bordure bleu), au besoin cliquez la carte ou utilisez <kbd>⇥</kbd>.

</section>
<section id="/help_ipad">

## Particularités de l'iPad

OFP2MAP ne peut être lancé que depuis l'écran d'accueil, l'application se lance en plein écran. On ne peut pas recharger la page comme dans un navigateur&#8239;: il faudra pour cela aller dans le menu d'aide (cet écran) ou un bouton spécifique sera affiché en haut en mode portrait et en bas à gauche en mode paysage. En mode "Split View" ou sur iPhone le bouton est dans le menu général (Hamburger).

Pour partager le lien vers OFP2MAP, utilisez le bouton situé en haut sur cette page, ou le lien situé sous le logo sur la page d'accueil, puis utilisez AirDrop. {#if navigator.standalone !== true}Pour mémoire, dans un navigateur, il suffit de partager l'url ou <Link href="http://flyingeek.github.io/lido-online/index.html">ce lien</Link>.{/if}

À noter que parfois, des bugs d'affichage peuvent apparaître&#8239;:  lorsque l'on retourne sur l'app, l'app est zoomée, il faut alors juste dézoomer en utilisant un pinch de deux doigts sur la barre de menu. Il est aussi possible de fermer (tuer) l'app,  même en mode déconnecté, pour la relancer.

Sous ios15 un <Link href="https://bugs.webkit.org/show_bug.cgi?id=238318">bug génant</Link> existe dans l'application: il est parfois impossible de changer de carte ou de mofifier l'heure de décollage. Il faut tuer l'app et la relancer.

> Sur un iPhone, sous iOS15+, il est recommandé d'installer OFP2MAP sur l'écran d'accueil

</section>
<section id="/help_offline">

## Mode hors ligne <span class="cacheButton"><CircleProgress value=0/></span>

Une fois un premier OFP chargé, il est possible même en mode déconnecté de charger un autre OFP pour l'exporter. Le cache de l'App vous permettra de naviguer sur les cartes déjà visualisées. Pour mettre en cache les cartes, il suffit de les consulter.

Pour mettre rapidement en cache un vol, il existe à droite du sélecteur de carte, un bouton de mise en cache de la projection&#8239;: <span class="cacheButton"><CircleProgress value=0/></span>. Ce bouton ne s'affiche que si la projection n'est pas encore dans le cache. Sur la MERCATOR, seule la route sera mise en cache et le niveau de détails sera limité à un zoom < 8 (jusqu'à zoom < 11 sur les terrains de départ, destination et dégagement). Pour les autres projections, c'est la totalité de la carte qui sera mise en cache.

Le bouton affiche la progression du téléchargement&#8239;: <span class="cacheButton cacheProgress"><CircleProgress value=33/></span>, puis il disparait une fois la projection en cache. En cas d'erreur, il affiche: <span class="cacheButton cacheError"><CircleProgress value=0/></span>, et vous pouvez faire une nouvelle tentative.

Les premières mises en cache peuvent prendre du temps&#8239;: sur la Mercator, un vol LC peut nécessiter le téléchargement de 70Mo de données. Les caches des autres projections utilisent&#8239;: 7Mo pour la NORTH, 4Mo pour la PACIFIC, 7Mo pour la SOUTH, 32Mo pour THE WORLD, 32Mo pour NAM Physical, 40Mo pour =Physique=, 45Mo pour =Politique=, 14Mo pour Artic, et 48Mo pour {cbName}.

Si vous êtes connecté à un réseau limité (4G AF, Wifi en vol), le cache peut ne pas se charger, dans ce cas, désactivez temporairement le réseau, fermez (tuez) l'application et rechargez l'OFP.

> Il faut penser à mettre en cache la Mercator à chaque vol et il n'est pas possible d'utiliser la 4G AF ou le Wifi PN en vol.

</section>
<section id="/help_reglages_des_calques">

## Réglages des calques <svg><use xlink:href="#layers-symbol"></use></svg>

<figure class="right">![layers settings help](./images/layers-settings.webp)<figcaption>Réglages des calques</figcaption></figure>La carte, en haut à droite, dispose d'un bouton pour personnaliser les calques et les couleurs. Un calque contient un type d'information, par exemple les cercles ETOPS, les FIR réglementées, les tracks, la route...
Il est possible d'afficher ou de masquer chaque calque en utilisant la coche qui précède son nom. La plupart des calques permettent de choisir la couleur et l'opacité.

Les réglages s'appliquent globalement, c'est à dire, pour toutes les projections. Exception&#8239;: pour les FIR, <svg class="eye"><use xlink:href="#eye-symbol"></use></svg> permet, en plus, de masquer le calque sur la projection actuelle. Il est alors indiqué <svg class="eye"><use xlink:href="#eye-off-symbol"></use></svg> calque masqué sur cette projection.
<br/>
Dans un soucis de lisibilité, certains calques sont automatiquement désactivés, il est alors indiqué  <svg class="eye deactivated"><use xlink:href="#eye-off-symbol"></use></svg> ⚠️ calque désactivé sur cette projection.

Pour les aéroports (le type avion est déterminé dans l'OFP), il est possible de choisir entre 5 styles:

- **statuts** reprend les couleurs du statut telles que définies dans le Manex C.
- **vert/rouge** reprend le code couleur des Regional Planning Chart, il y ajoute le symbole <span style="color: #062DF8;">✚</span> pour les terrains de support médical, et, pour les distinguer des adéquats orange, les emergency orange sont représentés par une étoile.
- **bleu/vert/rouge** permet de distinguer les adéquats de support médical par la couleur de l'icône.
- **médical** n'affiche que les terrains de support médical
- **reco & eao** n'affiche que les terrains de reconnaissance de type B et C. Les types C sont indiqués par le symbole ©, les types B disposant d'un EAO par 🎥

> Le statut est aussi disponible en cliquant sur un terrain (popup).

Trois boutons permettent la sauvegarde, la restauration ou un retour aux valeurs par défaut. Le bouton RESTAURER permet, après avoir fait des modifications temporaires (non sauvegardées), de revenir rapidement aux réglages précédents.

> Pour vous entraîner, je vous recommande de modifier la couleur des terrains en vert/rouge sur LC ou bleu/vert/rouge sur MC, et de sauvegarder votre choix.

**Mode FOCUS&#8239;**

C'est un mode pensé pour basculer rapidement sur d'autres réglages pour un usage ponctuel. Par défaut le mode FOCUS n'affiche que la route. Il s'active en cliquant sur FOCUS dans le champ ROUTE. Pour quitter ce mode, réaffichez les réglages et cliquez à nouveau sur le bouton.

Le mode FOCUS est personnalisable&#8239;: Après avoir activé le mode MODE FOCUS, réaffichez les réglages et modifiez les à votre convenance. Lorsque vous quitterez le mode FOCUS, ce jeu de réglages sera sauvegardé séparément et il sera rechargé à la prochaine activation.

Si nécessaire, un bouton permet de revenir aux valeurs par défaut.

> Idées pour utiliser ce mode&#8239;: changer la couleur de la route pour The World; avoir un jeu de réglages pour la présentation aux pax; ...

</section>
<section id="/help_gramet">

## GRAMET

Le GRAMET est un météogramme représentant le temps et l'espace. Il indique, en tout point de la route, et à l'heure de passage estimée, une coupe verticale de la météo prévue.
Le GRAMET est réalisé par <Link href="{ogimetURL}">ogimet.com</Link> à partir d'une route calculée. Il est possible d'afficher le GRAMET et sa route sur la carte. La route est particulièrement utile lors des vols océaniques car il n'y a aucune station en mer.

Pour construire la route du GRAMET, on utilise non pas les waypoints, mais au plus 21 stations météo (WMO). Il y a au total (<Link href="{wmoWorldMapURL}">13000 WMO dans le monde</Link>).Le GRAMET débute toujours à l'heure hh:00. Pour un decollage à 19h30, il débutera à 19h, pour un décollage à 19h31, il débutera à 20h. Pour les OFP anciens, c'est l'heure actuelle qui est envoyée. En mode déconnecté, OFP2MAP utilise la version du GRAMET qu'il a mis en cache pendant 48h. Après l'heure de décollage initialement prévue, vous pouvez forcer une mise à jour, soit en rechargeant l'ofp, soit en changeant brièvement de page.

Pour afficher le Gramet, cliquez sur sa miniature dans la barre de menu. Pour afficher la route, direction le réglage des calques de la carte. Par défaut elle est affichée en bleu. En fonction de l'heure de décollage (modifiable), le Gramet et sa miniature affichent la position avion. Avant l'horaire prévu de décollage, un bouton play <span class="btn-simulator-play" style="font-size: 24px; line-height:24px; --stroke-width: 2px"></span> permet de lancer une animation.

Pour mieux comprendre le GRAMET, je vous conseille son <Link href="http://www.ogimet.com/guia_gramet.phtml.en">Guide d'interprétation</Link>.

> Le site ogimet est indisponible lorsqu'il met à jour ses données, cela intervient le plus souvent entre minuit et 6h (heure française), il renvoie alors une erreur "503 no grib data". Par ailleurs, ogimet est saturé  dans la tranche 18h30-20h00, et cela peut entraîner des erreurs s'il met plus de 30 secondes à répondre. Cliquer sur <svg style="stroke: red; transform: rotate(180deg); height: 20px; width: 20px;"><use xlink:href="#info-symbol"></use></svg> vous affichera des consignes.

</section>
<section id="/help_position">

## Position avion <svg style="transform: scale(1.4,1.4); margin-left:5px;"><use xlink:href="#takeoff-symbol"></use></svg><svg style="transform: scale(1.4,1.4); margin-left:8px;"><use xlink:href="#geolocate-symbol"></use></svg>

L'avion dans la barre de menu <svg><use xlink:href="#takeoff-symbol"></use></svg> permet d'afficher ou de masquer la position estimée <svg style="color: var(--plane-color)"><use xlink:href="#location-symbol"></use></svg> sur la route en prenant en compte les estimées de l'OFP. En cas d'erreur lors de reconnaissance des waypoints, la position sera basée sur un simple ratio horaire, merci de me transmettre l'OFP dans ce cas (ce sera signalé par un avion rouge dans la barre de menu et par l'absence des éphémérides). L'heure de décollage est modifiable et permet d'ajuster la position estimée à la minute près.

La position estimée est affichée en permanence sur le GRAMET, la miniature du GRAMET et les timelines des éphémérides. Pour un OFP ancien, la position estimée sera toujours la destination.

OFP2MAP peut aussi utiliser un GPS. En cliquant sur <svg><use xlink:href="#geolocate-symbol"></use></svg>, la position GPS <svg style="color: #1da1f2"><use xlink:href="#location-symbol"></svg> sera affichée sur la carte. Si la localisation GPS semble ne pas fonctionner (au sol ou en vol avec un gps externe), vérifiez que vous n'avez pas désactivé la localisation dans iPad / Réglages / Confidentialité / Service de localisation / Sites Safari. Vous devez choisir «Lorsque l'app est active» ou «Demander la prochaine fois». Le Bouton <svg><use xlink:href="#geolocate-symbol"></use></svg> a trois positions: OFF, ON centré, ON non centré. Si, dans la position ON centré, vous déplacez la carte, il passe en ON non centré. L'appui suivant le repassera en ON centré. Un dernier appui le mettra sur OFF.

> C'est toujours la position estimée qui est utilisée pour les éphémérides

</section>
<section id="/help_etops">

## ETOPS

La capacité ETOPS est determinée depuis l'OFP et les cercles sont tracés. Un drapeau <span style="background-color: var(--bs-warning); padding: 0 3px; font-size: 9px;">ETOPS</span> apparait dans le pavé d'information de l'OFP si le carburant est limitatif (20mn, soit environ 2T de marge sur 777). La marge minimum de carburant ETOPS est affiché si vous cliquez sur le pavé d'information. Pour avoir plus d'informations, consultez Pilot&#xA0;Mission/FlightLog/ETOPS.

Les appuis ETOPS sont affichés avec l'icône <span class="big" style="color: #FC2403FF;">▲</span> (dans la couleur des cercles ETOPS). Les adéquats d'entrée et de sortie ETOPS avec le symbole <span class="big" style="color: #095;">▲</span> (dans la couleur des adéquats du style utilisé). La couleur des cercles des points d'entrée et de sortie est celle de la route.

> Il faut cliquer sur l’icône d’un appui ETOPS pour connaître son statut et son niveau sûreté

</section>
<section id="/help_ephemerides">

## Éphémérides ☀️🌘🔭

<figure class="right">![éphémerides exemple](./images/ephemerides.webp)<figcaption>Exemple avec aurore boréale prévue</figcaption></figure>

Les éphémérides du vol utilisent uniquement la position estimée (réglée par l'heure de décollage). Un clic sur le widget révèle les éphémérides avec 2 timelines. La première synthétise le jour et la nuit le long du vol ainsi que les zones favorables à l'observation des aurores boréales. La seconde montre les prévisions de Kp. Le Kp permet de prédire les aurores boréales. Entre ces deux timelines, la Lune est un objet dynamique: l'angle des cornes va se modifier en fonction de la position estimée et cet angle est également calculé pour les levers et les couchers. Pour le soleil, l'aube nautique est indiquée, car ce n'est pas tout à fait la nuit: en vol l'horizon est partiellement discernable, et au sol on distingue encore le relief.

Le symbole du widget est dynamique:

- ☀️ si le soleil est visible pendant le vol
- 🌕🌖🌗🌘🌑🌒🌓🌔 si seule la lune est visible pendant le vol
- 🔭 si vous restez dans le noir
- un <span class="aurora">halo vert</span> se superpose si les conditions sont favorables à l'observation d'aurores boréales

__Précision des calculs&#8239;:__ si vous avez bien recalé la position estimée d'OFP2MAP sur la carte (en modifiant l'heure de décollage), la précision attendue est de ±2 min sous 72° de latitude et de 10 min au-delà. Pour la lune, on est plutôt sur une précision de ±5 min. Le calcul n'est valable que pour la croisière, reportez vous à EWAS pour un calcul précis au départ ou à destination.

__Correction d'altitude&#8239;:__ Si votre niveau de vol est différent de l'OFP, appliquez une correction de 15s/1000ft pour le soleil. Exemple: FL OFP 400, FL réel 360, il faut ajouter 1min pour le lever, et soustraire 1min pour le coucher.

<details>
    <summary tabindex="-1"><b>Cliquez ici</b> pour afficher un rappel sur la chronologie des événements astronomiques</summary>
    <p>Pour le soleil:</p>
    <table class="table">
        <thead><tr><th>Angle</th><th>▲ Soleil levant</th><th>▼ Soleil couchant</th></tr></thead>
        <tbody>
            <tr><td>-0.83°</td><td>↑ Lever du soleil (fin aube civile)</td><td>↓ Coucher du soleil (début crépuscule civil)</td></tr>
            <tr><td>-6°</td><td>↑ début aube civile (jour civil)</td><td>↓ fin du crépuscule civil (début nuit civile)</td></tr>
            <tr><td>-12°</td><td>↑ début aube nautique (jour nautique)</td><td>↓ fin du crépuscule nautique (début nuit nautique)</td></tr>
        </tbody>
    </table>
    <p>Et pour la lune:</p>
    <table class="table moon">
        <thead><tr><th>Jour</th><th>Nom</th><th>Hémisphère nord</th><th>Hémisphère sud</th></tr></thead>
        <tbody>
            <tr><td>1</td><td>Nouvelle lune</td><td>🌑</td><td>🌑</td></tr>
            <tr><td></td><td>Premier croissant</td><td>🌒</td><td>🌘</td></tr>
            <tr><td>7</td><td>Premier quartier</td><td>🌓</td><td>🌗</td></tr>
            <tr><td></td><td>Lune gibbeuse croissante</td><td>🌔</td><td>🌖</td></tr>
            <tr><td>14</td><td>Pleine lune</td><td>🌕</td><td>🌕</td></tr>
            <tr><td></td><td>Lune gibbeuse décroissante</td><td>🌖</td><td>🌔</td></tr>
            <tr><td>21</td><td>Dernier quartier</td><td>🌗</td><td>🌓</td></tr>
            <tr><td></td><td>Dernier croissant</td><td>🌘</td><td>🌒</td></tr>
        </tbody>
    </table>
</details>

> Les éphémérides utilisent uniquement la position estimée. Si l'avion est rouge, les éphémérides ne s'affichent pas et il faut m'envoyer l'OFP par mail.

</section>
<section id="/help_export">

## Export KML

La Page Export permet d'exporter la route et les tracks au format KML, elle dispose de ses propres réglages pour générer le KML. Pour l'export il est possible d'ajouter des repères. Les repères sont utiles pour afficher des informations textuelles dans MapsMe ou Avenza. Le bouton [COMME CARTE] permet de récupérer les couleurs choisies pour la carte.

Sur iPad, lors du téléchargement, l'export des fichiers KML affiche une page un peu particulière, utilisez le bouton <svg style="vertical-align: bottom;"><use xlink:href="#share-symbol" /></svg> pour choisir l'app qui recevra le fichier. Cliquez en haut à gauche sur OK pour revenir à OFP2MAP. Alternativement, vous pouvez utiliser , sur cette même page, [Options...] pour définir une app qui recevra les fichiers kml par défaut, puis utiliser Ouvrir dans «&#8239;nom de l'app&#8239;».

 Un raccourci peut être lancé depuis la page Export, il recevra les fichiers KML, la route Lido et le Gramet. Le nom du raccourci est modifiable, il faut que le raccourci soit installé avant de le lancer.

</section>
<section id="/help_ftl">

## FTL

Le calcul FTL est effectué uniquement à partir de la rotation CDB incluse dans l'OFP.

La Page FTL calcule les limitations de TSV en réalisation conformément au Manex. OFP2MAP ne peut calculer que les limitations standard ou avec repos en vol (MANEX 07.05.04.A ou 07.05.04.C). Pilot Mission sur la page Equipage vous donnera (parfois) les limitations satisfaisant le MANEX 07.05.04.A ou 07.05.04.B.

Pour rappel dans le cas 07.05.04B (TSV avec prolongation sans repos envol), la marge CDB ne doit s'appliquer qu'en faisant le calcul standard (07.05.04A). Autrement dit **le calcul en incluant les marges d'OFP2MAP est toujours juste** puisqu'à ce jour AF ne fait pas se service fractionné (07.05.04.D).

**Concernant les PNC**, la butée n'est pas calculée car c'est inutile: Au départ de Paris, il y a une butée horaire de départ (la marge CDB ne s'applique pas), et sur les vols retours, le TSV AF peut être dépassé sous réserve d'adaptation du service et/ou de repos additionnel (RADD). Enfin, le TSV FTL max des PNC est toujours (à rotation identique) le TSV FTL max des pilotes, seul le repos devant être pris à bord change. OFP2MAP vous indique le repos PNC mini pour le TSV max FTL. Il est à noter que les limitations PNC de Pilot Mission sont calculées en considérant un repos à bord d'une durée correspondante au repos mini PNC AF, ce qui est peu utile...

</section>
<section id="/help_plugins">

## Plugins 🧩

Bug: Sur un iPad en ios 17 (iPadOS < 17.4), il faut faire une rotation de l'écran pour voir le résultat d'un plugin. Pour cette raison les plugins de base sont à présent intégrés à OFP2MAP.

Il reste néanmoins possible de lancer un plugin depuis le pavé d'informations du vol dans la barre de menu, en choisissant Plugins dans le menu.

<details>
    <summary tabindex="-1"><b>Cliquez ici</b> pour afficher l'ancienne documentation sur les plugins</summary>
    <div>
Les plugins sont des raccourcis qui doivent être installés au préalable. Si vous avez supprimé l'application Raccourcis, installez là depuis l'App Store et redémarrez votre iPad. Pour installer un plugin,
cliquez sur le raccourci désiré, puis vous revenez sur OFP2MAP, cliquez sur 🧩 et faites défiler pour sélectionner le plugin. En cas d'alerte "raccourcis non fiables", consultez cette <Link href="https://www.youtube.com/watch?v=Y7QdgkLEMtI">vidéo</Link>.

<EmbeddedVideo tabindex="-1" src="https://p169.p3.n0.cdn.getcloudapp.com/items/yAu14LGP/55eed601-f463-4eee-8d47-87d290d3ceb2.mp4" title="Installation\nPLUGIN" forcePreview={false} figcaption="🎥 Installation d'un plugin (internet requis)"/>

__Liste des plugins&#8239;:__

{#each Object.entries(plugins) as [name, {url, description, version}]}
    - <Link href="{url}">{name} v{version}</Link> {description}
{/each}

OFP2MAP-ETOPS et OFP2MAP-FTL fonctionnent en mode offline. Les autres plugins nécessitent d'être connecté. Vous pouvez sauvegarder leurs résultats au format PDF en utilisant <svg style="vertical-align: bottom;"><use xlink:href="#share-symbol" /></svg>.

> Pour un accès plus rapide aux plugins, je recommande d'installer OFP2MAP-MENU. Il faut ensuite le remonter dans le menu contextuel qui s'affiche en cliquant 🧩.

<EmbeddedVideo tabindex="-1" src="https://p169.p3.n0.cdn.getcloudapp.com/items/KouJeA4l/42ec3a9e-a573-41cb-bd34-763da10c514c.mp4" title="Utilisation\nOFP2MAP-MENU" forcePreview={false} figcaption="🎥 plugin OFP2MAP-MENU (internet requis)"/>
</div>
</details>


</section>
<section id="/help_updates">

## Mise à jour

L'app détecte les mises à jour automatiquement, normalement vous n'avez rien à faire. Eventuellement un prompt peut
apparaitre vous demandant d'autoriser cette mise à jour. La version AIRAC et le type avion détecté dans l'OFP sont affichés en bas à droite de la carte dans le champ d'attribution.

Après une mise à jour, les dernières nouveautés d'OFP2MAP s'affichent. Le bouton CHANGELOG en haut de cette page permet de consulter l'historique, et vous pouvez aussi consulter la <Link href="https://github.com/flyingeek/lido-online/commits/master">liste des commits</Link> sur GitHub. Je poste les nouveautés importantes dans Yammer/Mapsme et Teams/MyConcorde.

</section>
<section id="/help_credits">

## Crédits 🙏

- Les données terrains/FIR sont fournies par Olivier Ravet forum Yammer/Mapsme
- <Link href="https://equal-earth.com/physical/">=Physique=</Link>, <Link href="http://equal-earth.com">=Politique=</Link> et <Link href="http://www.shadedrelief.com/north-america/">NAM Physical</Link> sont des cartes mises dans le domaine public par Tom Patterson.
- Artic est une carte de <Link href="https://maps.lib.utexas.edu/maps/polar.html">The Perry-Castañeda Library</Link>
- La dernière version de la carte {cbName} est disponible sur le site <Link href="{`https://www.${cbName.toLowerCase()}.com`}">{cbName}.com</Link>
- Les autres cartes sont de Jean-Baptiste Denizot (OPL 777) forum Yammer/QGIS & Avenza Maps
- Le GRAMET provient du site ogimet.com
- Le site est développé en javascript à l'aide du framework SVELTE, les principales librairies utilisées sont PDFJS (conversion pdf en texte), MapboxGL (moteur de carte), proj4js (transformation de cooordonnées), Workbox (service workers).
- La partie serveur (un simple proxy pour pouvoir récupérer l'image du GRAMET) est en python.
- Eric Delord CDB 777 est l'auteur. Le code source est disponible sur GitHub pour <Link href="https://github.com/flyingeek/lido-online">l'app</Link> et <Link href="https://github.com/flyingeek/ofp-gramet-aws">le proxy</Link>

Vous pouvez me contacter sur l’email AF (erdelord@…), sur le canal Team/MyConcorde, sur les forums Yammer mentionnés, ou sur mon compte Twitter @flyingeek.

L'hébergement des images est normalement fourni par alwaysdata.com (pack gratuit) mais en raison d'un blacklistage sur le réseau internet d'AF, les fonds de cartes sont à présent hébergés sur netlify. Le proxy gramet est lui dorénavant hébergé sur aws. Le site est hébergé sur GitHub.

### Liens

- <Link href="https://flyingeek.github.io/flytax/" rel="noopener"><span class="flytax">Fly<span>Tax</span></span></Link> une aide aux calculs des frais professionnels (même auteur).
- <Link href="https://apps.apple.com/app/id364904503">The World HD</Link> un très bon atlas offline pour l'iPad (prix 3$).

</section>
