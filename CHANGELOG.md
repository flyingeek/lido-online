# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.13.4]- 2021-08-XX

### Changed

- prise en compte du markdown dans le CHANGELOG

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

- **Il faut mettre à jour tous les plugins** (liens dans l'aide):

## [1.12.15] - 2021-07-15

### Changed

- AIRAC 2107
