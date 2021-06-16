<script>
    import Link from '../components/Link.svelte';
    import {ofp} from '../stores.js';
    $: ogimetURL = ($ofp) ? $ofp.ogimetData.url: 'http://www.ogimet.com';
    const cbName = window.atob("Q2FydGFCb3NzeQ==");
</script>

## Préambule

OFP2MAP est une application PWA (ou Web Application), elle peut être lancée soit depuis un navigateur, soit depuis l'écran d'accueil de l'iPad. Initialement, simple convertisseur de l'OFP en KML, OFP2MAP est devenu une vraie application de cartographie. OFP2MAP nécessite des navigateurs récents pour fonctionner. Safari 14 iOS/Mac est compatible, Chrome 83 fonctionne aussi.

L'OFP ne transite sur aucun serveur, seule une route calculée (basée sur au plus 21 stations météo) est transmise à l'hébergeur du proxy (voir plus bas) puis à Ogimet.com pour récupérer le Gramet. L'app ne collecte aucune donnée.

## Utilisation

1. Dans Pilot Mission, onglet «Dossier de vol», affichez le PDF nommé "Dossier de vol OFP". Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez «Enregistrer dans Fichiers». Dans l'app, c'est cet OFP qu'il faut ensuite sélectionner.

2. La carte par défaut dépend de la distance: {cbName} 2020, puis Mercator jusqu'à 1500nm puis LAMBERT, il est possible sur la carte, en haut à gauche, de basculer sur d'autres projections&#8239;:
    - LAMBERT NORTH (parallèles sécants N30 et N65) est recommandée au-dessus du N40
    - LAMBERT SOUTH & PACIFIC (sécants N30 et S15 ) sont recommandées sous N30
    - THE WORLD permet de disposer d'un Atlas off-line, c'est une projection Times
    - MERCATOR est une Web Mercator avec un thème est inspiré des cartes VFR. Il y a 12 niveaux de zoom, dont 6 disponibles off-line
    - =Physique= est un Atlas physique basé sur une projection Equal Earth (qui montre les continents et les pays à leur taille réelle) avec des étiquettes en français (par Tom Patterson).
    - {cbName} 2020 est une carte VFR, elle couvre France/Belgique/Luxembourg/Suisse et {window.atob("VmluY2VudCBCb3NzeQ==")} a autorisé son utilisation. Sur cette carte, déjà très dense en informations, la route Gramet, l'orthodromie et les FIR sont désactivées. La dernière version est disponible sur <Link href="{`https://www.${cbName.toLowerCase()}.com`}">{cbName}.com</Link>.


3. Navigation dans la carte: on peut avec un doigt déplacer la carte, zoomer ou orienter la carte avec deux doigts.  
__<big>☞</big> Il est aussi possible de modifier l'angle de vue en balayant de bas en haut avec deux doigts__.

## Mémo visuel

<img src="./images/map-help.webp" alt="mémo visuel" id="memovisuel"><br/>

## Réglages des calques

<figure>![layers settings help](./images/layers-settings.webp)<figcaption>Réglages des calques</figcaption></figure>La carte, en haut à droite, dispose d'un bouton pour personnaliser les calques et les couleurs. Un calque contient un type d'information, par exemple les cercles ETOPS, les FIR réglementées, les tracks, la route...
Il est possible d'afficher ou de masquer chaque calque en utilisant la coche qui précède son nom. La plupart des calques permettent de choisir la couleur et l'opacité, certains permettent de choisir une icône. Les icônes sont surtout utiles pour l’export dans les fichiers KML.
Pour les aéroports (le type avion est déterminé dans l'OFP), il est possible de choisir entre 2 thèmes: couleur du statut ou vert/rouge. Si vous optez pour le second, le statut reste accessible en cliquant sur un terrain (popup).
Enfin, trois boutons permettent la sauvegarde, la restauration ou un retour aux valeurs par défaut. Le bouton RESTAURER permet, après avoir fait des modifications temporaires (non sauvegardées), de revenir rapidement aux réglages précédents.

Pour vous entraîner, je vous recommande de modifier la couleur des terrains en vert/rouge et de sauvegarder votre choix.

## Particularités de l'iPad

OFP2MAP ne peut être lancé que depuis l'écran d'accueil, l'application se lance en plein écran. On ne peut pas recharger la page comme dans un navigateur&#8239;: il faudra pour cela aller dans le menu d'aide (cet écran) ou un bouton spécifique sera affiché en haut.

Pour partager le lien vers OFP2MAP, utilisez le bouton situé en haut sur cette page, ou le lien situé sous le logo sur la page d'accueil, puis utilisez AirDrop. {#if navigator.standalone !== true}Pour mémoire, dans un navigateur, il suffit de partager l'url ou <Link href="http://flyingeek.github.io/lido-online/index.html">ce lien</Link>.{/if}

À noter que parfois, des bugs d'affichage peuvent apparaître&#8239;:  lorsque l'on retourne sur l'app, l'app est zoomée, il faut alors juste dézoomer en utilisant un pinch de deux doigts sur la barre de menu. Il est aussi possible de tuer l'app,  même en mode déconnecté, pour la relancer.

## GRAMET

Le GRAMET est un météogramme représentant le temps et l'espace. Il indique, en tout point de la route, et à l'heure de passage estimée, une coupe verticale de la météo prévue.
Le GRAMET est réalisé par <Link href="{ogimetURL}">ogimet.com</Link> à partir d'une route calculée. Il est possible d'afficher le GRAMET et sa route sur la carte. La route est particulièrement utile lors des vols océaniques car il n'y a aucune station en mer.
Pour construire la route du GRAMET, on utilise non pas les waypoints, mais au plus 21 stations météo (WMO). Il y a au total 13000 WMO dans le monde. Le GRAMET débute toujours à l'heure hh:00. Pour un decollage à 19h30, il débutera à 19h, pour un décollage à 19h31, il débutera à 20h. Pour les OFP anciens, c'est l'heure actuelle qui est envoyée. En mode déconnecté, OFP2MAP utilise la version du GRAMET qu'il a mis en cache pendant 48h. Après l'heure de décollage initialement prévue, vous pouvez forcer une mise à jour, soit en rechargeant l'ofp, soit en changeant brièvement de page.

Pour afficher le Gramet, cliquez sur sa miniature à gauche de l'OFP. Pour afficher la route, direction le réglage des calques de la carte. Par défaut elle est affichée en bleu. En fonction de l'heure de décollage (modifiable), le Gramet et sa miniature affichent la position avion. Avant l'horaire prévu de décollage, un bouton play permet de lancer une animation.

Pour mieux comprendre le GRAMET, je vous conseille son <Link href="http://www.ogimet.com/guia_gramet.phtml.en">Guide d'interprétation</Link>.

## Position estimée / GPS

Il est possible d'afficher la position avion sur la carte (bouton en forme de mire). Si vous l'autorisez, la position GPS sera prise en compte. Si la localisation GPS semble ne pas fonctionner (au sol ou en vol avec un gps externe), vérifiez que vous n'avez pas désactivé la localisation dans iPad / Réglages / Confidentialité / Service de localisation / Sites Safari. Vous devez choisir «Lorsque l'app est active» ou «Demander la prochaine fois». Le Bouton a deux ou trois positions: OFF, ON centré, ON non centré. Si, dans la position ON centré, vous déplacez la carte, il passe en ON non centré. L'appui suivant le repassera en ON centré. Un dernier appui le mettra sur OFF.

En l'absence de GPS, l'avion dans la barre de menu (à gauche de l'heure de décollage) permet d'afficher la position estimée. Si la reconnaissance des waypoints s'est bien effectuée, les estimées de l'OFP seront prises en compte. Sinon, ce sera un simple ratio horaire, merci de me transmettre l'OFP dans ce cas (ce sera signalé par un avion rouge dans la barre de menu). L'heure de décollage est modifiable et permet toujours d'ajuster la position estimée.

## ETOPS

La capacité ETOPS est determinée depuis l'OFP et les cercles sont tracés. Un drapeau ETOPS apparait dans le pavé d'information de l'OFP si le carburant est limitatif (20mn, soit environ 2T de marge sur 777). Pour avoir plus d'informations vous pouvez utiliser un plugin (voir ci-dessous).

## Éphémérides

Un calcul astronomique de la position du soleil est effectué en tenant compte de la route de l’OFP, du FL de l’OFP, et de l’heure de décollage choisie dans l’application. La précision attendue de l’algorithme est de ±1 min sous 72° de latitude et de 10 min au-delà. Si vous êtes sur la route, que le FL est respecté et que l'heure de décollage a été ajustée en fonction de la position réelle, alors la précision attendue sous N72 est de +- 2min. Si votre FL est différent, la correction d'altitude est en gros de 15s/1000ft. Exemple: FL OFP 400, FL réel 360, alors ajouter 1min pour le lever, soustraire 1min pour le coucher.

Le symbole du widget est dynamique:

- ☀️ si le soleil est visible pendant le vol
- 🌕🌖🌗🌘🌑🌒🌓🌔 si la lune est visible pendant le vol
- 🔭 si vous restez dans le noir.

Le widget affiche éventuellement les heures de lever ou de coucher. Cliquer sur le widget affiche les éphémérides du vol, elles contiennent les aubes et crépuscules civils, nautiques, la phase de la lune et son illumination, les levers et couchers de lune. Le calcul du lever/coucher de lune est moins précis. Le calcul n'est valable que pour la croisière, se reporter à EWAS pour le calcul précis au départ ou à destination.

Si OFP2MAP n'a pas pu récupérer les estimées de l'OFP (voir le paragraphe sur la position estimée), le widget ne s'affichera pas.

Pour rappel, la chronologie des événements est:

<table class="table">
    <thead><tr><th>Angle</th><th>▲ Soleil levant</th><th>▼ Soleil couchant</th></tr></thead>
    <tbody>
        <tr><td></td><td>Jour</td><td>Jour</td></tr>
        <tr><td>-0.83°</td><td>↑ Lever du soleil (fin aube civile)</td><td>↓ Coucher du soleil (début crépuscule civil)</td></tr>
        <tr><td>-6°</td><td>↑ début aube civile (jour civil)</td><td>↓ fin du crépuscule civil (début nuit civile)</td></tr>
        <tr><td>-12°</td><td>↑ début aube nautique (jour nautique)</td><td>↓ fin du crépuscule nautique (début nuit nautique)</td></tr>
        <tr><td>-18°</td><td>↑ début aube astronomique (jour astronomique)</td><td>↓ fin du crépuscule astronomique (début nuit astronomique)</td></tr>
        <tr><td></td><td>↑ Nuit</td><td>↓ Nuit</td></tr>
    </tbody>
</table>

Durant l'aube/crépuscule nautique, en vol l'horizon est discernable, au sol on distingue encore le relief.

## Mode off-line / Cache

Une fois un premier OFP chargé, il est possible même en mode déconnecté de charger un autre OFP pour l'exporter. Le cache de l'App vous permettra de naviguer sur les cartes déjà visualisées. Pour mettre en cache les cartes, il suffit de les consulter.

Il existe aussi un bouton de mise en cache&#8239;: le pictogramme ↓ situé à droite du sélecteur de carte. Sur les cartes LAMBERT, THE WORLD, =Physique= et {cbName}, il mettra en cache la totalité de la carte. Sur la MERCATOR, seule la partie de carte incluant la route sera mise en cache.

Les premières mises en cache peuvent prendre du temps&#8239;: sur la Mercator, un vol LC peut nécessiter le téléchargement de 40Mo de données. Les caches des autres projections utilisent&#8239;: 7Mo pour la NORTH, 4Mo pour la PACIFIC, 7Mo pour la SOUTH, 32Mo pour THE WORLD, 40Mo pour =Physique= et 40Mo pour {cbName}.

## Export / Plugins (Raccourcis)

La page Export permet d'exporter la route et les tracks au format KML, elle dispose de ses propres réglages pour générer le KML. Par défaut les réglages sont ceux de la carte. Si vous avez déjà sauvegardé un réglage d'export, alors le bouton « COMME CARTE » permet de récupérer les réglages choisis pour la carte.

Sur iPad, l'export des fichiers KML affiche une page un peu particulière, utilisez le bouton <svg style="vertical-align: bottom;"><use xlink:href="#share-symbol" /></svg> pour choisir l'app qui recevra le fichier. Cliquez en haut à gauche sur OK pour revenir à OFP2MAP. Alternativement, vous pouvez utiliser « Options... » pour définir une app qui recevra les fichiers kml par défaut et utiliser Ouvrir dans « nom de l'app ».

 Un raccourci peut être lancé depuis la page Export, il recevra les fichiers KML, la route Lido et le Gramet. Le nom du raccourci est modifiable, il faut que le raccourci soit installé avant de le lancer.

__Plugins depuis la carte&#8239;:__ Il est aussi possible de lancer des raccourcis ayant accès au contenu de l'OFP depuis le pavé d'informations du vol dans la barre de menu. Il faut autoriser les raccourcis non fiables dans Réglages/Raccourcis, puis installer le(s) plugin(s).

Liste des plugins:

- <Link href="https://www.icloud.com/shortcuts/7a84be04b4f04607876d20a08c39c2ef">OFP2MAP-AURORA</Link> NOAA Aurora Forecast 30-90mn et prévisions à 3 jours.
- <Link href="https://www.icloud.com/shortcuts/85acce199353490c9f3a3db0618da19e">OFP2MAP-ETOPS</Link> calcule un cartouche ETOPS actualisé
- <Link href="https://www.icloud.com/shortcuts/ce764c49281643d4a63aec3d8bf848be">OFP2MAP-MENU</Link> menu affichant l'ensemble des plugins installés
- <Link href="https://www.icloud.com/shortcuts/db21157c4fb441919eed9fa7e2cb644f">OFP2MAP-PLANE FINDER</Link> recherche l'avion avec flightaware.com
- <Link href="https://www.icloud.com/shortcuts/1ef02bdaecb6406bb600429dccbdfac6">OFP2MAP-PLUGIN</Link> permet de visualiser les données (format json) si vous souhaitez développer un plugin.


## Mise à jour

L'app détecte les mises à jour automatiquement, normalement vous n'avez rien à faire. Eventuellement un prompt peut
apparaitre vous demandant d'autoriser cette mise à jour. La version AIRAC et le type avion détecté dans l'OFP sont affichés en bas à droite de la carte dans le champ d'attribution.

Pour connaître les dernières nouveautés d'OFP2MAP, je poste dans Yammer/Mapsme et Teams/MyConcorde. En attendant une solution plus conviviale, vous pouvez aussi consulter la <Link href="https://github.com/flyingeek/lido-online/commits/master">liste des commits</Link> sur GitHub (ce n'est pas "user friendly").

## Crédits

- Les données terrains/FIR sont fournies par Olivier Ravet forum Yammer/Mapsme
- =Physique= est une carte de Tom Patterson disponible sur <Link href="https://equal-earth.com/physical/">Equal Earth</Link>
- La dernière version de la carte {cbName} est disponible sur le site <Link href="{`https://www.${cbName.toLowerCase()}.com`}">{cbName}.com</Link>
- Les autres cartes sont de Jean-Baptiste Denizot forum Yammer/QGIS & Avenza Maps
- Le GRAMET provient du site ogimet.com
- Le site est développé en javascript à l'aide du framework SVELTE
- La partie serveur (un proxy pour pouvoir récupérer l'image du GRAMET) est en python.
- Eric Delord CDB 777 est l'auteur. Le code source est disponible sur GitHub pour <Link href="https://github.com/flyingeek/lido-online">l'app</Link> et <Link href="https://github.com/flyingeek/ofp2map-gramet">le proxy</Link>

## Hébergement

L'hébergement des images est normalement fourni par alwaysdata.com (pack gratuit) mais en raison d'un blacklistage sur le réseau internet d'AF, les fonds de cartes sont à présent hébergés sur netlify. Le proxy gramet est lui dorénavant hébergé sur vercel. Le site est hébergé sur GitHub.

## Liens

- <Link href="https://flyingeek.github.io/flytax/" rel="noopener"><span class="flytax">Fly<span>Tax</span></span></Link> une aide aux calculs des frais professionnels (même auteur).
