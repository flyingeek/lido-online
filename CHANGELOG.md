# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- _plugin_ [OFP2MAP-FAA WIPs v1](https://www.icloud.com/shortcuts/6f341a7550d149a4be6c9ddacd6345bd) affiche le plan des travaux au sol sur les terrains US

### Changed

- couleur des tracks par défaut proche de la couleur des graticules, aucun pin par défaut pour les tracks, pensez à modifier le repère des tracks dans les réglages d'export pour conserver (à l'export) la visibilité du nom des tracks.
- modification de la présentation des tracks inspirée par eWAS: affichage des points d'entrée et de sortie, la lettre du track est affichée le long de la ligne du track. A l'export en raison des limitations des logiciels, l'aspect reste inchangé.
- popup des tracks modifiée, si le vol a lieu sur un track, le point d'entrée et de sortie affichent l'ETO en fonction de l'heure de décollage choisie
- _plugin_ [OFP2MAP-ETOPS v4](https://www.icloud.com/shortcuts/271499bbcfea414eaa7d2d6ec96ae235): mise en évidence du ΔFUEL si proche des limitations (même condition que le flag ETOPS d'OFP2MAP)
- _plugin_ [OFP2MAP-AURORA v3](https://www.icloud.com/shortcuts/0da61ab87f40469db1842622b4d951ff): indique la version du plugin dans les résultats

### Fixed

- en cas de changement de type avion, la popup des terrains ne se mettait pas à jour

## [1.13.6] - 2021-08-14

### Added

- à l'avenir les nouveautés du CHANGELOG s'afficheront après une mise à jour

## [1.13.5] - 2021-08-14

### Changed

- AIRAC 2108
- _plugin_ [OFP2MAP-ETOPS v3](https://www.icloud.com/shortcuts/c8216ddf7e7446edab5577632d501232): meilleure présentation

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

- **Il faut mettre à jour tous les plugins** (liens dans l'aide)

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
