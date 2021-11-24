# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.16.12] - 2021-11-24

### Deprecated

- Raccourcis pour IOS15 manque de stabilité, les conversions de texte en JSON sont très lentes. Seules les valeurs utilisées par les plugins actuels restent dans l'export, le rawText n'est plus exporté, [OFP2MAP-ETOPS v6](https://www.icloud.com/shortcuts/75e470e51e9442768298dd16b73d8e84) est modifié en conséquence, l'ancienne version ne peut plus fonctionner.

### Changed

- [OFP2MAP-PLANE FINDER v3](https://www.icloud.com/shortcuts/c3f12a087f7247ec8693af535a1c098b) n'utilise plus de conversion du texte en json pour être plus réactif.
- [OFP2MAP-PLUGIN v3](https://www.icloud.com/shortcuts/6dd90c3c7a6f465da371997cbdd28430) contient un avertissement sur la désactivation du champ rawText.
- mapboxgl est en version 1.13.2 pour une meilleure compatibilité avec ios15
- le symbole de la loupe est associé à la carte Mercator dans le sélecteur de projection


## [1.16.11] - 2021-11-12

### Fixed

- les tracks EASTBOUND et WESTBOUND sont affichés si l'OFP contient les 2 messages de tracks; auparavant, seul le premier message était affiché.

## [1.16.10] - 2021-11-10

### Fixed

- l'app lancait des mises à jour du GRAMET inutiles lors du basculement en arrière-plan (bug orientationchange event ios)

## [1.16.9] - 2021-11-08

### Changed

- cache du gramet optimisé pour limiter la bande passante sur le serveur AWS

### Fixed

- sélecteur de projection désactivé pendant la mise en cache de la carte

## [1.16.8] - 2021-11-06

### Changed

- AIRAC 2111

## [1.16.7] - 2021-10-07

### Changed

- AIRAC 2110

## [1.16.6] - 2021-09-28

### Fixed

- *plugin* [OFP2MAP-ETOPS v5](https://www.icloud.com/shortcuts/365323227837445c9bd68e2be056e094) modifie la regex qui n'affichait pas l'EXP dans certains cas. Sous iOS15, ce plugin demande d'autoriser le partage vers (null), c'est un bug d'iOS, vous pouvez cliquer sur "Autoriser". De plus même, en choisissant "Toujours Autoriser", iOS15 ne mémorise pas votre choix :-(.

## [1.16.5] - 2021-09-28

### Fixed

- Reconnaissance du type A220
- parsing ETOPS en cas de saut de page mal placé

## [1.16.4] - 2021-09-27

### Changed

- La barre de menu affiche le bouton plugin sur un iPhone en mode portrait

### Fixed

- La vignette du GRAMET est reconstruite en cas de changement d'orientation (utile sur iPhone)

## [1.16.3] - 2021-09-26

### Changed

- *plugin* [OFP2MAP-FAA WIPs v3](https://www.icloud.com/shortcuts/7e37cedd78d944bf8ceffb7477e356ec) affiche explicitement qu'il n'a pas trouvé d'infos pour un terrain dans le PDF de résultats.

### Fixed

- Régression CSS dans l'aide corrigée

## [1.16.2] - 2021-09-25

### Changed

- OFP2MAP fonctionne parfaitement sur un iPhone iOS 15 (testé sur iPhone 13 mini en mode portrait et paysage). Il est recommandé d'installer l'app de la même manière que sur iPad (partager puis installer sur l'écran d'accueil). Si vous aviez installé l'app sur l'iPhone sous iOS 14, comme j'ai quelques doutes sur le fonctionnement des services workers, je recommande d'effacer l'app de l'écran d'accueil et de réinstaller.

## [1.16.1] - 2021-09-22

### Added

- Nouvelle carte: =Politique= est une carte politique du prolifique Tom Patterson, étiquettes en français et projection Equal Earth. La carte est moins chargée que The World.

## [1.16.0] - 2021-09-22

### Added

- Nouvelle carte: NAM Physical, un atlas physique du continent Nord-Américain, étiquettes en anglais, altitudes en mètres.

## [1.15.13] - 2021-09-21

### Changed

- Hébergement du proxy GRAMET sur Amazon AWS pour donner plus de temps à Ogimet pour répondre lorsqu’il est saturé. Les récupérations du GRAMET devraient générer moins d’erreurs dans la tranche horaire 18 h - 20 h.

### Fixed

- suppression d’une station météo non reconnue par Ogimet

## [1.15.12] - 2021-09-11

### Changed

- AIRAC 2109

## [1.15.11] - 2021-09-07

### Changed

- Ajout d'un halo léger aux icônes pour augmenter la lisibilité
- Style reco & eao: utilisation d'une icône en forme de caméra pour les terrains disposant d'EAO + distinguo adéquat/emergency
- Style medical: overlap des terrains forcés (similaire au style reco & eao)
- Des boutons d'aide sur la page EXPORT sont ajoutés et renvoient sur le chapitre correspondant, le menu AIDE n'est plus contextualisé pour la page EXPORT

## [1.15.10] - 2021-09-05

### Added

- Nouveau style **reco & eao** n'affiche que les terrains de reconnaissance de type B et C. Les types C sont indiqués par le symbole ©. Les types B disposant d'un EAO sont indiqués par le symbole ▶︎. Sur ce style l'overlap des terrains est forcé. Ce style ne dépend pas du type avion.
- La popup des terrains affiche le type de reconnaissance terrain et l'existence d'un EAO.

### Changed

- Styles */vert/rouge: les emergency orange sont affichés avec <span style="color: #D70;">✸</span> pour une meilleure différenciation avec les adéquats orange <span style="color: #D70; font-size: 70%;">●</span>.
- Style statuts: le security level des adéquats est uniquement indiqué par la couleur du label ce qui permet de réduire l'outline de l'icône. Les statuts 2 ERA passent de gris à jaune plus foncé.
- Légère réduction de la taille des labels route/etops/tracks, possible puisque le zoom sur la carte les grossit.

### Fixed

- le zoom sur les icônes est plus linéaire

## [1.15.9] - 2021-09-03

### Fixed

- décidément, j'ai du mal avec l'affichage des nouveautés, avec un comportement en production différent de la version dev. Code refait, utilisation du localStorage au lieu du sessionStorage.

## [1.15.8] - 2021-09-03

### Added

- Possibilité de masquer les FIR par projection en plus du réglage global avec <svg class="eye"><use xlink:href="#eye-symbol"></use></svg>

## [1.15.7] - 2021-09-02

### Changed

- Pour faciliter l'utilisation d'un clavier, le focus est donné prioritairement à la carte
- La touche <kbd>-</kbd> est correctement reconnue sur le clavier AZERTY du Logitech Combo Touch
- Aide mise à jour pour l'[utilisation d'un clavier](#/help_utilisation)

### Fixed

- CSS compatible avec Google Chrome pour les dernières modifications

## [1.15.6] - 2021-08-31

### Fixed

- Halo des étiquettes des EMER corrigé
- L'affichage du Changelog lors des nouveautés devrait reprendre à partir de la 1.15.7

## [1.15.4] - 2021-08-31

### Added

- support souris/trackpad externe: le survol (hover) affiche les popups.
- Les réglages montrent à présent si un calque est désactivé sur la projection actuelle
- La route du GRAMET est désactivée sur les Atlas

### Changed

- La symbologie ETOPS des aéroports est à présent affichée/masquée par le calque ETOPS
- Sur clavier externe les touches Tab et option Tab sont mieux gérées
- Réglages des calques: nouvelles icônes pour les boutons de l'aspect général

### Fixed

- Corrections css sur l'affichage du zoom de la Mercator
- Les points d'entrée du track de l'OFP n'avaient pas le "halo" dans le label
- logique du calque airports revue, les petits soucis d'affichage sont corrigés
- la page d'aide s'affiche correctement sur mobile, le problème venait de la vidéo ajoutée dans la rubrique Plugins

## [1.15.3] - 2021-08-29

### Added

- Gros travail sur l'aide avec la création d'un mode paysage, l'inclusion des symboles utilisés dans l'app, la navigation depuis le mémo visuel, la possibilité de créer des liens depuis le changelog. L'aide est même contextualisée pour chaque page (renvoi vers une rubrique différente).
- Affichage du niveau de zoom sur la Mercator. Rappel: à partir du zoom 7 (inclus), ce n'est plus garanti de rester dans le cache.
- Un thème bleu/vert/rouge fait son apparition. Bleu = adéquat médical. Si le niveau de sûreté du terrain est orange (seulement DTTA à ce jour), le symbole ✚ est accolé au nom. Ce thème me semble bien adapté au MC.

### Changed

- La page d'accueil a été modifiée, elle contient le minimum vital: le point 1 de la rubrique UTILISATION de l'aide
- icône de mise en cache légérement retravaillée pour un meilleur contraste
- Lors du zoom sur la carte, les icônes et les étiquettes sont grossies, du coup c'est bien plus lisible et agréable. Si vous aviez modifié les tailles par défaut des icônes et des labels (1.0), il faudra peut être les réajuster.
- Styles statuts et vert/rouge: retour en arrière pour les terrains de support médical: l'étiquette redevient noire. Le symbole ✚ reste bleu, il est légérement plus grand. La carte semble ainsi moins chargée à grande échelle.


## [1.15.2] - 2021-08-23

### Changed

- visibilité des labels améliorée
- utilisation de hachures pour les FIR REG

### Added

- la popup des aéroports indique le nom du pays et son drapeau

## [1.15.1] - 2021-08-23

### Fixed

- les nouveautés étaient affichées à chaque rechargement de l'app
- calque airports: changer de style ne modifie plus le nom en version IATA

## [1.15.0] - 2021-08-22

### Changed

- les réglages des calques sont simplifiés: il n'est plus possible d'utiliser des repères sur la carte. Le calque FIR-REG est remonté en première ligne, le tout me laisse de la place pour de nouvelles options. Les repères sont toujours disponibles pour l'export.
- le framework CSS (Bootstrap) a été mis à jour, merci de me remonter les éventuels problèmes d'affichage.
- *plugin* [OFP2MAP-FAA WIPs v2](https://www.icloud.com/shortcuts/17bd4ab2ebec430596137173b131ce38) ajoute les dégagements s'ils publient une carte.

### Added

- possibilité de choisir entre les noms ICAO (par défaut) et IATA pour les aéroports
- un mode FOCUS apparait dans les réglages des calques. Par défaut il n'affiche que la route. Il est pensé pour utilisation de bascule rapide et ponctuelle. Ce mode peut aussi être utilisé comme un deuxième jeu de réglages, voir l'aide [RÉGLAGES DES CALQUES](#/help_reglages_des_calques).
- il est possible de ne pas afficher les nouveautés lors des mises à jour. On peut changer d'avis à tout moment dans le CHANGELOG.

### Fixed

- un gel occasionnel de Safari en cas de double click sur les boutons de l'aspect général dans le réglage des calques

### Security

- tous les réglages sauvegardés sont correctement validés lors du chargement

## [1.14.3] - 2021-08-18

### Added

- La popup des tracks valide que le FL de l'OFP correspond au message TRACKSNAT. (surlignage discret vert ou rose du message)

### Changed

- Priorité d'affichage des points d'entrée et de sortie de track modifiée, avec une mise en évidence de ces points. Il est recommandé de ne plus sélectionner de repère pour les tracks dans OFP2MAP. Pour le réglage d'export, il vaut mieux toujours en choisir un.
- épaisseur de l'ortho et de la route Gramet légérement réduite pour que l'aspect général en zoomant/dézoomant les lignes soit plus agréable

### Fixed

- Le changement de couleur ETOPS n'était pas "réactif" pour la couleur des terrains ETOPS.
- Le paramètre d'épaisseur des lignes n'était pris en compte au chargement de l'OFP
- Safari ne sélectionne plus le texte des boutons de zoom  lors de clics répétitifs (dans aspect général)

## [1.14.2] - 2021-08-17

### Changed

- point d'entrée du track du vol est de la couleur de la route

### Fixed

- popup track: l'ETO n'était pas affichée pour les points d'entrées utilisant un format arinc
- changement de couleurs et de repères était buggué dans la 1.14.0

## [1.14.1] - 2021-08-17

### Fixed

- au changement d'ofp l'app pouvait crasher

## [1.14.0] - 2021-08-17

### Added

- pour une utilisation ponctuelle, le calque AIRPORTS ajoute un style qui n'affiche que les terrains de support médical. La couleur bleue est celle du livret Statuts des aérodromes/2.2/Appuis médicaux Europe.
- statut médical des aéroports ajouté, symbolisé par un label bleu et le symbole ✚ ajouté au nom (exemple <span style="color: #062DF8;">LFPG&thinsp;✚</span>). La popup des terrains ajoute un <span style="color: #062DF8; font-size: 1.25em">🄷</span> au nom.
- les aéroports de support médical sont prioritaires pour l'affichage à petite échelle
- ajout de l'Airbus 220 même si je ne suis pas sur de la codification de son type dans l'OFP
- pour les vols sur track océanique, une popup affiche les détails du point d'entrée
- *plugin* [OFP2MAP-FAA WIPs v1](https://www.icloud.com/shortcuts/6f341a7550d149a4be6c9ddacd6345bd) affiche le plan des travaux au sol sur les terrains US

### Changed

- couleur des tracks par défaut proche de la couleur des graticules, aucun pin par défaut pour les tracks, pensez à modifier le repère des tracks dans les réglages d'export pour conserver (à l'export) la visibilité du nom des tracks.
- modification de la présentation des tracks inspirée par eWAS: affichage des points d'entrée et de sortie, la lettre du track est affichée le long de la ligne du track. A l'export en raison des limitations des logiciels, l'aspect reste inchangé.
- popup des tracks modifiée, si le vol a lieu sur un track, le point d'entrée et de sortie affichent l'ETO en fonction de l'heure de décollage choisie
- *plugin* [OFP2MAP-ETOPS v4](https://www.icloud.com/shortcuts/271499bbcfea414eaa7d2d6ec96ae235): mise en évidence du ΔFUEL si proche des limitations (même condition que le flag ETOPS d'OFP2MAP)
- *plugin* [OFP2MAP-AURORA v3](https://www.icloud.com/shortcuts/0da61ab87f40469db1842622b4d951ff): indique la version du plugin dans les résultats

### Fixed

- en cas de changement de type avion, la popup des terrains ne se mettait pas à jour

## [1.13.6] - 2021-08-14

### Added

- à l'avenir les nouveautés du CHANGELOG s'afficheront après une mise à jour

## [1.13.5] - 2021-08-14

### Changed

- AIRAC 2108
- *plugin* [OFP2MAP-ETOPS v3](https://www.icloud.com/shortcuts/c8216ddf7e7446edab5577632d501232): meilleure présentation

## [1.13.4] - 2021-08-11

### Changed

- relooking du CHANGELOG

## [1.13.3] - 2021-08-10

### Added

- Un CHANGELOG fait son apparition dans l'aide.
- Le popup des terrains sur la carte affiche le code ICAO et le code IATA

### Fixed

- Les OFP provenant d'une reclairance en vol sont compatibles, seul problème restant: le point de départ de la route du GRAMET sera très éloigné du point de reclairance si celle ci survient en océanique.

## [1.13.2] - 2021-08-09

### Fixed

- clé groundDistance correctement calculée pour les plugins

## [1.13.1] - 2021-08-09

### Added

- OFP2MAP applique un thème à Safari dans OSX Monterey / iOS 15
- les plugins recoivent à présent la rotation, le service de vol et le type de trajet

### Changed

- Sur grand écran la carte occupe toute la fenêtre du navigateur

## [1.13.0] - 2021-08-07

### Added

- Possibilité pour un plugin de détecter une mise à jour

### Changed

- Clés exportées vers les plugins renommées

### Deprecated

- **Il faut mettre à jour tous les plugins** [Liste des Plugins](#/help_plugins)

## [1.12.15] - 2021-07-15

### Changed

- AIRAC 2107

## [1.12.14] - 2021-07-05

### Fixed

- lien vers plugin OFP2MAP-PLUGIN dans l'aide

## [1.12.13] - 2021-06-26

### Changed

- optimisation des calculs d'aurores boréales
- visuel des éphémérides amélioré

### Fixed

- retrait d'une station WMO non reconnue par Ogimet

## [1.12.12] - 2021-06-22

### Changed

- aide sur les éphémérides
- l'angle des cornes de la lune est dynamique (fontion de la position estimée)

## [1.12.11] - 2021-06-21

### Added

- timeline pour les prédictions de Kp ajoutée dans les éphémérides du vol

### Fixed

- La timeline s'actualise si on change l'heure de décollage

## [1.12.10] - 2021-06-18

### Added

- ajout des zones favorables aux aurores boréales dans les éphémérides

### Changed

- export de la route avec TTE et FL pour les plugins

## [1.12.9] - 2021-06-17

### Changed

- AIRAC 2106
