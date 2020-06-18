## Préambule

Cette app a été conçue pour le PilotPad. Elle nécessite des navigateurs récents pour fonctionner. Safari 13 iOS/Mac est compatible, Chrome 83 fonctionne aussi. Firefox dernière version devrait fonctionner (non testé).
L'OFP ne transite sur aucun serveur, seule une route calculée (basée sur au plus 21 stations météo) est transmise à l'hébergeur AlwaysData.com puis à Ogimet.com pour récupérer le Gramet. GitHub (détenu par Microsoft), hébergeur du site, utilise des cookies. L'app en elle même ne collecte aucune données.

## Utilisation

1. Dans Pilot Mission, onglet «Dossier de vol», affichez le PDF nommé "Dossier de vol OFP". Sur la gauche, cliquez sur le carré avec une flèche vers le haut. Choisissez «Enregister dans Fichiers». Dans l'app, c'est cet OFP qu'il faut ensuite sélectionner. Le "drag and drop" est également possible dans le champ d'input de l'OFP.

2. Après avoir ouvert ce site dans Safari sur iPad, il est possible d'afficher le menu de personnalisation en cliquant sur  l'icône en haut à droite (le "hamburger"). Dans les résolutions plus faibles, sur iPhone ou en mode "split view", ces réglages sont affichés sous la carte. Le type avion pour l'adéquation des terrains est détecté dans l'OFP.

3. Pour Exporter vers une app, direction le menu EXPORT, vous pouvez exporter une route pour mPilot, télécharger le KML (routes et tracks uniquement), ou envoyer vers l'app **Raccourcis** d'Apple.

4. La carte par défaut est une Web Mercator, il est possible sur la carte, en haut à gauche, de basculer sur une projection LAMBERT. La projection recommandée est en MAJUSCULE.

5. Navigation dans la carte: on peut avec un doigt déplacer la carte, zoomer ou orienter la carte avec deux doigts. Il est aussi possible de modifier l'angle de vue en balayant de haut en bas avec deux doigts.

## Mode off-line

Une fois un premier OFP chargé, il est possible même en mode déconnecté de charger un autre OFP pour l'exporter. Il est aussi probable que le cache de l'App (50Mo) vous permettra de naviguer sur les cartes déjà visualisées.

## Sauvegarde des paramètres

L'app permet de sauvegarder vos paramètres dans le navigateur. Toutefois Apple ne conserve plus les données au-delà
de 7 jours, vos réglages risquent donc de disparaître. La solution: après avoir paramétré l'app, mémorisez vos choix dans la "sidebar" puis, sauvegardez l'url de la page dans vos favoris.
L'URL contient l'ensemble des détails nécessaires à la restauration. Si vous utilisez cette méthode, pensez à bien 
sauvegarder l'URL après vos modifications. Dans un premier temps, contentez-vous de sauvegarder avec le bouton «Mémoriser»,
testez sur différents OFP, puis une fois satisfait, sauvegardez dans vos favoris.

## Installation sur l'écran d'accueil

L'app peut être installée sur l'écran d'accueil ce qui permet d'avoir la carte sur un écran plus grand. Il y a toutefois quelques inconvénients: durée de sauvegarde des paramétres ?, des bugs d'affichage apparaissent lorsque l'on retourne sur l'app (l'app est zoomée, il faut dézoomer en utilisant un pinch de deux doigts sur la barre de menu). Enfin l'app sur l'écran d'accueil ne permet pas de recharger la page si on rencontre un problème, il faudra pour cela aller dans le menu d'aide (cet écran) ou un bouton spécifique sera affiché en haut.

## Mise à jour

L'app détecte les mises à jour automatiquement, normalement vous n'avez rien à faire. Eventuellement un prompt peut 
apparaitre vous demandant d'autoriser cette mise à jour. La version AIRAC et le type avion détecté dans l'OFP sont affichés en bas à droite de la carte dans le champ d'attribution.

## Crédits

- Les données terrains/FIR sont fournies par Olivier Ravet forum Yammer/Mapsme
- Les cartes (autres que Mapbox streets) sont de Jean-Baptiste Denizot forum Yammer/QGIS & Avenza Maps
- Le GRAMET provient du site ogimet.com
- Le site est développé en javascript à l'aide du framework SVELTE
- La partie serveur (un proxy pour pouvoir récupérer l'image du GRAMET) est en python/Django
- L'hébergement serveur est fourni par alwaysdata.com (pack gratuit).
- Eric Delord CDB 777 est l'auteur. Le code source est disponible sur GitHub
