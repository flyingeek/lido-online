<script>
    import Link from '../components/Link.svelte';
</script>

## Préambule

OFP2MAP est une application PWA (ou Web Application), elle peut être lancée soit depuis un navigateur, soit depuis l'écran d'accueil de l'iPad. Initialement, simple convertisseur de l'OFP en KML, OFP2MAP est devenu une vraie application de cartographie.

OFP2MAP nécessite des navigateurs récents pour fonctionner. Safari 14 iOS/Mac est compatible, Chrome 83 fonctionne aussi.

L'OFP ne transite sur aucun serveur, seule une route calculée (basée sur au plus 21 stations météo) est transmise à l'hébergeur du proxy (voir plus bas) puis à Ogimet.com pour récupérer le Gramet. L'app ne collecte aucune données.

## Utilisation

1. Dans Pilot Mission, onglet «Dossier de vol», affichez le PDF nommé "Dossier de vol OFP". Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez «Enregistrer dans Fichiers». Dans l'app, c'est cet OFP qu'il faut ensuite sélectionner.

2. La carte dispose d'un bouton pour personnaliser les calques et les couleurs. Le type avion pour l'adéquation des terrains est détecté dans l'OFP. Pour vous entrainer, je vous recommande de modifier la couleur des terrains en vert/rouge et de sauvegarder votre choix.

3. Pour Exporter vers une app, direction le menu EXPORT, vous pouvez exporter une route pour mPilot, télécharger le KML (routes et tracks uniquement), ou envoyer vers l'app **Raccourcis** d'Apple.

4. La carte par défaut est une LAMBERT, il est possible sur la carte, en haut à gauche, de basculer sur d'autres projections.
    - LAMBERT NORTH (parallèles sécants N30 et N65) est recommandée au-dessus du N40
    - LAMBERT SOUTH & PACIFIC (parallèles sécants N30 et S15 ) sont recommandées sous N30
    - THE WORLD permet de disposer d'un Atlas off-line, c'est une projection Times
    - MERCATOR est une Web Mercator avec un thème est inspiré des cartes VFR. Il y a 12 niveaux de zoom, dont 6 disponibles off-line


5. Navigation dans la carte: on peut avec un doigt déplacer la carte, zoomer ou orienter la carte avec deux doigts. Il est aussi possible de modifier l'angle de vue en balayant de haut en bas avec deux doigts. Si vous activez le bouton de géolocalisation, la carte peut se centrer automatiquement.

## Particularités de l'iPad

OFP2MAP ne peut être lancé que depuis l'écran d'accueil, l'application se lance en plein écran. On ne peut pas recharger la page comme dans un navigateur&#8239;: il faudra pour cela aller dans le menu d'aide (cet écran) ou un bouton spécifique sera affiché en haut.

Pour partager le lien vers OFP2MAP, utilisez le bouton situé en haut sur cette page, ou le lien situé sous le logo sur la page d'accueil, puis utilisez AirDrop. {#if navigator.standalone !== true}Pour mémoire, dans un navigateur, il suffit de partager l'url ou [ce lien](http://flyingeek.github.io/lido-online/index.html).{/if}

L'export des fichiers KML affiche une page nommée "data:", utilisez le bouton <svg style="vertical-align: bottom;"><use xlink:href="#share-symbol" /></svg> pour choisir l'app qui recevra le fichier. Cliquez en haut à gauche sur OK pour revenir à OFP2MAP. En raison d'un bug d'iOS, il est impossible de nommer le fichier pour le moment.

À noter que parfois, des bugs d'affichage peuvent apparaître&#8239;:  lorsque l'on retourne sur l'app, l'app est zoomée, il faut alors juste dézoomer en utilisant un pinch de deux doigts sur la barre de menu. Il est aussi possible de tuer l'app,  même en mode déconnecté, pour la relancer.

## GRAMET

Le GRAMET est un météogramme représentant le temps et l'espace. Il indique, en tout point de la route, et à l'heure de passage estimée, une coupe verticale de la météo prévue.
Le GRAMET est réalisé par <Link href="http://www.ogimet.com">www.ogimet.com</Link> à partir d'une route calculée. Il est possible d'afficher le GRAMET et sa route sur la carte. La route est particulièrement utile lors des vols océaniques car il n'y a aucune station en mer.
Pour construire la route du GRAMET, on ne peut se baser sur des waypoints, il faut utiliser au plus 21 stations météo (WMO). Il y a au total 13000 WMO dans le monde.

Pour afficher le Gramet, cliquez sur sa miniature à gauche de l'OFP. Pour afficher la route, direction le réglages des calques de la carte. Par défaut elle est affichée en bleu. En fonction de l'heure de décollage (modifiable), le Gramet et sa miniature affiche la position avion.

Pour mieux comprendre le GRAMET, je vous conseille son <Link href="http://www.ogimet.com/guia_gramet.phtml.en">Guide d'interprétation</Link>.

## Mode off-line

Une fois un premier OFP chargé, il est possible même en mode déconnecté de charger un autre OFP pour l'exporter. Le cache de l'App vous permettra de naviguer sur les cartes déjà visualisées. Pour mettre en cache les cartes, il suffit de les consulter.

Il existe aussi un bouton de mise en cache&#8239;: le pictogramme ↓ situé à droite du sélecteur de carte. Sur les cartes LAMBERT ou THE WORLD, il mettra en cache la totalité de la carte. Sur la MERCATOR, seule la partie de carte incluant la route sera mise en cache.

Les premières mises en cache peuvent prendre du temps&#8239;: sur la Mercator, un vol LC peut nécessiter le téléchargement de 40Mo de données. Les caches des autres projections utilisent&#8239;: 7Mo pour la NORTH, 4Mo pour la PACIFIC, 7Mo pour la SOUTH et 32Mo pour THE WORLD.

## Mise à jour

L'app détecte les mises à jour automatiquement, normalement vous n'avez rien à faire. Eventuellement un prompt peut
apparaitre vous demandant d'autoriser cette mise à jour. La version AIRAC et le type avion détecté dans l'OFP sont affichés en bas à droite de la carte dans le champ d'attribution.

## Crédits

- Les données terrains/FIR sont fournies par Olivier Ravet forum Yammer/Mapsme
- Les cartes (autres que Mapbox streets) sont de Jean-Baptiste Denizot forum Yammer/QGIS & Avenza Maps
- Le GRAMET provient du site ogimet.com
- Le site est développé en javascript à l'aide du framework SVELTE
- La partie serveur (un proxy pour pouvoir récupérer l'image du GRAMET) est en python.
- Eric Delord CDB 777 est l'auteur. Le code source est disponible sur GitHub pour [l'app](https://github.com/flyingeek/lido-online) et [le proxy](https://github.com/flyingeek/ofp2map-gramet)

## Hébergement

L'hébergement des images est normalement fourni par alwaysdata.com (pack gratuit) mais en raison d'un blacklistage sur le réseau internet d'AF, les fonds de cartes sont à présent hébergés sur netlify. Le proxy gramet est lui dorénavant hébergé sur vercel.

## Liens

- <Link href="https://flyingeek.github.io/flytax/" rel="noopener"><span class="flytax">Fly<span>Tax</span></span></Link> une aide aux calculs des frais professionnels (même auteur).
