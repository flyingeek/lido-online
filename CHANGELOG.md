# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.20.29] - 2026-01-31

### Changed

- AIRAC 2601

## [1.20.28] - 2025-12-28

### Changed

- AIRAC 2513

## [1.20.27] - 2025-12-02

### Changed

- AIRAC 2512

### Fixed

- En cas de QRF sol, la page FTL tente d'afficher les limitations. Comme l'OFP est assez incohérent dans ce cas là, un warning reste présent pour vérifier que c'est bien l'heure du vol initialement programmé qui est utilisée.

## [1.20.26] - 2025-11-02

### Added

- Le code AIRAC s'affiche en rouge s'il n'est pas à jour (en bas de la carte à droite dans le champ d'attribution).

## [1.20.25] - 2025-11-01

### Changed

- AIRAC 2511

## [1.20.24] - 2025-08-18

### Changed

- AIRAC 2508
- Ajoût d'une mise en garde dans l'Aide sur le Wifi AF à la PPV qui bloque certaines fonctionnalités, il faut utiliser le partage de connexion de son téléphone perso.
- OFP2MAP devrait être compatible avec l'export PDF du vol disponible dans l'onglet "Plus" de Pilot Mission, y compris pour le calcul des FTL.

### Fixed

- Les waypoints peuvent ne pas être uniques (ex RBT sur SID et RBT VOR). La routine récupérant les estimées a du être corrigée.


## [1.20.23] - 2025-06-22

### Changed

- AIRAC 2506

### Fixed

- Les OFP intégrant un OFP additionel n'étaient pas reconnus (AF279/20Jun2025)
- Mise à jour de la base de données des points Ogimet

## [1.20.21] - 2025-05-14

### Fixed

- iOS 18.4.1 rendait l'utilisation hors ligne impossible, mise à jour du Service Worker pour tenter de réparer le dysfonctionnement. (MAJ faite depuis CUN où j'ai des problèmes de connexion pour tester, à suivre...)

## [1.20.20] - 2025-04-29

### Changed

- AIRAC 2504

## [1.20.19] - 2025-02-12

### Changed

- AIRAC 2501

## [1.20.18] - 2024-12-06

### Changed

- AIRAC 2412

## [1.20.17] - 2024-09-23

### Fixed

- Sur les OFP sans point d'entrée ETOPS (EEP), les cercles ETOPS ne s'affichaient pas. Le bug pouvait apparaitre dans le cas des OFP Inflight Released.

## [1.20.16] - 2024-08-18

### Changed

- AIRAC 2408
- MAJ WMO Ogimet

## [1.20.15] - 2024-06-20

### Fixed

- Amélioration de la précision du lever/coucher lorsque le soleil tangente l'horizon entre deux points.

## [1.20.14] - 2024-06-13

### Changed

- AIRAC 2406

## [1.20.13] - 2024-04-18

### Changed

- AIRAC 2404

## [1.20.12] - 2024-04-09

### Fixed

- Limitations TSV FTL PEQ3/PEQ4, l'extension de TSV d'une heure n'est appliquée que si une des étapes est strictement supérieure à 9h (précédemment 9h ou plus).

## [1.20.11] - 2024-04-04

### Fixed

- Les stations WMO de la Côte d'Ivoire étaient absentes.

## [1.20.10] - 2024-03-27

### Fixed

- La base Ogimet des WMO était incomplète. Brésil et Iran manquaient. Je m'en suis rendu compte en créant une carte des WMO disponible sur [mon github](https://flyingeek.github.io/scrapy-ogimet). Il y a un lien dans l'aide dans le chapitre sur le GRAMET.

## [1.20.9] - 2024-03-23

### Fixed

- Pour fiabiliser les WMO, je fais à présent une capture des stations WMO directement sur ogimet via le scraper scrapy-ogimet (sur mon github)
- Depuis ios 17.4, il y a des notifications de mise à jour sans raison, je tente de corriger le pb avec cette version...

### Changed

- AIRAC 2403

## [1.20.8] - 2024-03-19

### Fixed

- Toujours des soucis sur les WMO
- Lors des mises à jour, on ne devrait plus avoir l'alerte de devoir recharger l'OFP alors que l'OFP se rechargera automatiquement

## [1.20.7] - 2024-03-13

### Changed

- Toujours les WMO: possibilité à la compilation de mettre à jour la liste des stations WMO reconnues par Ogimet.
- Les aurores boréales sont considérées comme improbable au delà d'une latitude géomagnétique de 85N (centre de l'ovale).

## [1.20.6] - 2024-03-08

### Fixed

- Encore un correctif pour les WMO

## [1.20.5] - 2024-03-01

### Fixed

- Retour à l'ancienne source pour les WMO

## [1.20.4] - 2024-03-01

### Added

- Sur la carte, la popup des aéroports affiche le fuseau horaire. C'est le fuseau instantané (à la date et à l'heure actuelle).

### Changed

- Base de données des stations WMO mise à jour à partir d'une nouvelle source

## [1.20.3] - 2024-02-23

### Added

- AF flight status et l'indispensable Pile ou Face ajoutés au menu du pavé d'informations

### Changed

- Lien Aurora renommé Space Weather

### Fixed

- FTL: détection de rotation incohérente améliorée
- diverses améliorations de présentation pour les petites tailles d'écran

## [1.20.2] - 2024-02-22

### Added

- Prévisions de turbulences `turbli` ajoutées au menu du pavé d'informations de l'OFP. `turbli` n'a pas d'historique: ça ne fonctionne qu'avec les vols du jour. À voir s’il y a une plus-value par rapport au Gramet...

### Changed

- AIRAC 2402

## [1.20.1] - 2024-02-21

### Added

- Intégration des plugins de base dans OFP2MAP: nouvel onglet FTL et nouveau menu d'accès aux plugins (toujours en cliquant sur le pavé d'informations de l'OFP en haut à droite).
- Sur les vols ETOPS, la marge carburant mini ETOPS est directement affichée dans ce nouveau menu (le flag ETOPS jaune apparaît toujours si le carburant est proche des limitations).
- Nouvelle documentation pour les FTL et pour les plugins


## [1.19.30] - 2024-02-19

### Fixed

- Le cache du Kp causait une loupe infinie sous Safari (changement CORS du serveur NOAA)

## [1.19.29] - 2024-02-19

### Fixed

- WMO 84378 & 04282 removed

### Changed

- manifest.json (for PWABuilder testing)

## [1.19.28] - 2024-02-10

### Fixed

- WMO station LIMT removed

## [1.19.27] - 2024-02-07

### Changed

- AIRAC 2401

### Fixed

- WMO stations 04418 & 81003 removed

## [1.19.26] - 2024-01-08

### Info

- Problème avec les raccourcis sous ios 17 (iPad uniquement, iPhone ok): Les résultats d'un plugin ne s'affichent pas, il y a juste une barre blanche en haut de l'écran. **La solution temporaire est de faire une rotation de l'écran pour voir le résultat**.
Vous pouvez relire cet avertissement sur la page Aide -> Changelog

- Je recommande après avoir lancé OFP2MAP une première fois après la mise à jour sous ios 17.2 de forcer un redémarrage de l'ipad (Maintenir bouton on/off et appuyer sur volume +, faire éteindre puis rallumer l'iPad).

- Après un changement d'iPad on m'a indiqué que vider l'historique de Safari pouvait être nécessaire (Réglages/Safari -> Effacer historique, données de site).

### Changed

- AIRAC 2313

## [1.19.25] - 2023-11-15

### Changed

- AIRAC 2312

## [1.19.24] - 2023-11-15

### Changed

- AIRAC 2311

## [1.19.23] - 2023-10-25

### Changed

- AIRAC 2310

## [1.19.22] - 2023-08-20

### Fixed

- retrait station WMO LFPC

## [1.19.21] - 2023-08-14

### Fixed

- AIRAC2308

## [1.19.20] - 2023-08-08

### Fixed

- retrait station WMO 40280

## [1.19.19] - 2023-07-19

### Fixed

- mise à jour de la database des stations WMO

## [1.19.18] - 2023-07-15

### Fixed

- Suppression de stations WMO au Brésil qui ne sont plus reconnues par Ogimet mais le problème reste en cours d'investigation.

### Changed

- AIRAC 2307

## [1.19.17] - 2023-06-17

### Changed

- AIRAC 2304, à noter que le statut Fuel and Go est signalé comme ERA.

## [1.19.16] - 2023-04-27

### Changed

- AIRAC 2304

## [1.19.15] - 2023-04-06

### Fixed

- [OFP2MAP-FTL v13](https://www.icloud.com/shortcuts/eda9cdcdfcf241d0a4bbf976cc27d47f) corrige un oubli d'affichage de STD dans la rubrique Retard
- [OFP2MAP-ETOPS v8](https://www.icloud.com/shortcuts/a6b08496789943608ea28c15e359b64d) corrige l'affichage des heures suite à iOS16

## [1.19.14] - 2023-04-01

### Info

- Le plugin OFP2MAP-FAA WIPs ne fonctionne plus suite aux modifications du site de la FAA

### Changed

- AIRAC 2303

### Fixed

- [OFP2MAP-FTL v12](https://www.icloud.com/shortcuts/abff21a616a44b259135476770317b37) corrige un bug d'affichage suite à la mise à jour d'iOS16 (le tableau des horaires de l'étape s'affichait en local iso utc).

## [1.19.13] - 2023-02-02

### Fixed

- corrige un problème de cache offline sous ios 16.3

## [1.19.12] - 2023-01-27

### Changed

- AIRAC 2301

## [1.19.11] - 2022-12-29

### Changed

- AIRAC 2213
- [OFP2MAP-FTL v11](https://www.icloud.com/shortcuts/a4f679c90915403280bc866ec2587cf3) prend en compte la dernière révision du Manex pour vols les bi-tronçons. (première étape de moins de 2h et seconde étape de plus de 8h iso première étape de moins de 1h30).

## [1.19.10] - 2022-12-08

### Info

- J'ai fait le module FTL LC du e-S1... et je n'ai pas modifié OFP2MAP-FTL : on nous dit que le TSV FTL max PNC se baserait sur le repos mini AF (c'est absurde), et on nous dit le TSV FTL max des pilotes sur les vols retours non renforcés utiliserait 07.05.04.B (cela doit être programmé à l'avance)

### Changed

- Les fichiers FIR/Airports sont mis en cache immédiatement après la mise à jour de l'app pour couvrir un changement AIRAC. Ce sera utile pour ceux qui mettent à jour l'appli, mais qui ensuite attendent d'être en vol, et donc sans réseau pour charger l'OFP.
- Migration des cartes de Netlify pour utiliser la "Focal build" (sans impact pour OFP2MAP).
- Validation basique des fichiers Kp/FIR/Airports pour éviter une perte des données liée à la réponse WIFI de l'avion.

## [1.19.9] - 2022-12-07

### Fixed

- Affichage correct des prévisions de Kp pour les valeurs non entières
- L'estimée arrivée sur les vols avec RCF était incorrecte

## [1.19.8] - 2022-12-01

### Changed

- AIRAC 2212

## [1.19.7] - 2022-11-03

### Fixed

- [OFP2MAP-FTL v10](https://www.icloud.com/shortcuts/e84fc0d62fdb4243b005c0443281f1b0) corrige un bug d'affichage des blocs le jour d'un changement d'heure.

### Changed

- AIRAC 2211

## [1.19.6] - 2022-10-05

### Changed

- AIRAC 2210

## [1.19.5] - 2022-09-08

### Changed

- AIRAC 2209

## [1.19.4] - 2022-08-14

### Info

- Si vous ne pouvez pas changer de carte ou modifier l'heure de décollage, tuez l'app et relancez la. Lien sur le bug ios15 ajouté dans l'aide au niveau des Particularités de l'iPad.

### Changed

- AIRAC 2208

## [1.19.3] - 2022-07-15

### Changed

- AIRAC 2207
- prononciation d'OFP2MAP ajoutée  dans l'aide (OFP-TO-MAP)

### Fixed

- station météo ogimet 71872 désactivée

## [1.19.2] - 2022-06-26

### Changed

- [OFP2MAP-FTL v9](https://www.icloud.com/shortcuts/b1acb7e4402d49d191ef840eacb87b45) affiche la marge pour lever toute ambiguïté.
- retour visuel ajouté lorsque l'on clique sur 🧩

## [1.19.1] - 2022-06-18

### Fixed

- Le Gramet pouvait ne pas afficher la dernière version disponible

### Changed

- En vol le Gramet affiche ses coordonnées géographiques

## [1.19.0] - 2022-06-16

### Added

- JB Denizot a créé une projection stéréographique polaire (carte par défaut si la route passe au nord du 75N)
- Sur la Mercator, la route est cachée avec un zoom de niveau 7 (au lieu de 6) et les terrains de départ, destination et dégagement avec un zoom de 10. Pour limiter l'espace de stockage, le cache de niveau 7+ ne peut contenir qu'un seul vol, il est réinitialisé à chaque nouvelle mise en cache de la Mercator. Le téléchargement prend environ 1mn en fibre et 5mn en 3G. Une fois plusieurs vols mis en cache, il faudra 25s en fibre et 2mn en 3G.
- L'indicateur de mise en cache de la carte est animé durant la validation du cache

### Changed

- AIRAC 2206

### Fixed

- Affichage des FIR-REG correct sur toutes les projections

## [1.18.3] - 2022-06-09

### Fixed

- La route polaire Tokyo s'affiche correctement

## [1.18.2] - 2022-06-07

### Changed

- [OFP2MAP-FTL v8](https://www.icloud.com/shortcuts/1733d6e947864162ab5b5df7eb2a0700) précise que le plugin ne connait pas la compo PEQ: c'est le nombre de pilotes qui est surligné. Exemple: 3 PNT mais aucune suppléance, la compo réglementaire est PEQ2 mais pourtant c'est PEQ3 qui est surligné. Pour la butée TSV PNC, la butée FTL est la même que les PNT si le SV est identique et il n'y a pas de butée AF à proprement dit mais des repos additionnels qui sont accordés, une mention RADD est donc ajoutée.

## [1.18.1] - 2022-06-05

### Changed

- OFP2MAP affiché dans la barre de menu en mode landscape
- Le bouton de mise en cache de la projection reste affiché même sans connection (pour rappeler que la carte n'a pas été téléchargée).

### Added

- Tutoriels vidéos pour l'installation de l'application, le chargement de l'OFP et l'installation d'un plugin.

## [1.18.0] - 2022-05-29

### Changed

- {CBNAME} édition 2022 **Attention il faut remettre la {CBNAME} en cache**.
- Bootstrap CSS mis à jour en v5.1.3
- il est possible de charger l'OFP en cliquant sur "Choisir un OFP" et non plus seulement "Sélectionner".

### Fixed

- surlignage manquant dans le popup d'entrée du track corrigé

## [1.17.12] - 2022-05-19

### Changed

- AIRAC 2205

## [1.17.11] - 2022-04-28

### Changed

- AIRAC 2204

## [1.17.10] - 2022-04-04

### Fixed

- Lido utilise un nouveau format de nom des waypoints, cette version généralise le correctif de la v1.17.4 pour la récupération des estimées.
- [OFP2MAP-FTL v7](https://www.icloud.com/shortcuts/1fc3d479d1fd42629a617f83da76f2e6) corrige le calcul des limitations FTL en autorisant l'extension du TSV de 1h sur les vols mono-tronçons de plus de 9h en équipage renforcé. L'extension n'était appliquée qu'aux vols bi-tronçons. [Manex 07.05.04.C]

## [1.17.9] - 2022-03-25

### Changed

- AIRAC 2203
- L'étendue des zones interdites pose problème pour le rendu. L'algorithme a été modifié mais il subsiste des incohérences mineures sur the World et la Lambert Sud. Le calque FIR est désactivé sur le fond Artic.

## [1.17.8] - 2022-02-28

### Changed

- AIRAC 2202

## [1.17.7] - 2022-02-15

### Fixed

- Les liens des zones du mémo visuel refonctionnent parfaitement. (utilisation d'un SVG pour résoudre les problèmes que j'avais sous iOS15)

### Changed

- [OFP2MAP-FTL v6](https://www.icloud.com/shortcuts/bcc6585f63a94b85be846ad488c53a63) affiche en plus l'heure de fin des TSV AF et FTL

## [1.17.6] - 2022-02-15

### Fixed

- L'extraction des tracks pouvait planter
- Bug potentiel lors du rechargement de l'OFP corrigé

### Changed

- Aide sur les plugins modifiée avec un lien vers un tutoriel vidéo pour autoriser les raccourcis "non fiables"

## [1.17.5] - 2022-01-27

### Changed

- AIRAC 2201

## [1.17.4] - 2022-01-14

### Fixed

- Le point OFP N5928W10155 et le point de coordonnées N5928W10155.4 sont considérés comme identique pour l'extraction des estimées, il s'agit à priori d'un bug Lido qui aurait du utiliser le point 5AN01.

## [1.17.3] - 2022-01-12

### Fixed

- [OFP2MAP-FTL v5](https://www.icloud.com/shortcuts/5593ae084b214ae5942e0927a6497a36) corrige le TSV MAX AF sur MC: Seuls les repos minorés entrainent une limitation du TSV MAX AF (max = temps de repos en escale - 1h. ref: MANEX 07.08.03.D).

## [1.17.2] - 2022-01-03

### Fixed

- copyright des cartes n'était pas à jour pour NAM Physical et Artic
- le code de rechargement automatique de l'ofp empêchait le fonctionnement d'OFP2MAP sans ofp.

## [1.17.1] - 2022-01-02

### Fixed

- La projection précédente n'est rechargée que si l'OFP a lui même a été rechargé.

## [1.17.0] - 2021-12-28

### Added

- Artic une projection azimutale équivalente de Lambert centrée sur le pôle nord

## [1.16.22] - 2021-12-27

### Added

- le dernier OFP est automatiquement rechargé dans OFP2MAP pendant sa période de validité (date actuelle < heure bloc arrivée). L'OFP, la projection utilisée et l'heure de décollage sont rechargés.

### Changed

- [OFP2MAP-FTL v4](https://www.icloud.com/shortcuts/5e75b070441f49d397283253bd1f5947) devient un plugin autonome, les seules informations précalculées par la librairie lidojs sont le type de courrier AF (qui dépend de la distance des étapes et des fuseaux de référence traversés) et les fuseaux horaires nécessaires aux autres calculs (tzdb). Cette version corrige le calcul du type de courrier AF: la version précédente utilisait les fuseaux horaires traversés au lieu des fuseaux de référence traversés.
- AIRAC 2113

### Fixed

- station météo ogimet 41274 désactivée

### Deprecated

- Comme annoncé le 14 décembre, la v6 du plugin ETOPS ne fonctionne plus, il faut installer [OFP2MAP-ETOPS v7](https://www.icloud.com/shortcuts/c3bd42f263bf4f02869959e8d9815ea1). Pour rappel ce plugin n'est plus recommandé, Pilot Mission fait la même chose.

## [1.16.21] - 2021-12-15

### Changed

- [OFP2MAP-FTL v3](https://www.icloud.com/shortcuts/1cd8abf189a24452a66d43f02d5388c6) améliore la présentation

## [1.16.20] - 2021-12-14

IOS v15.2 est là! La vitesse d'execution des plugins est revenue à la normale, du coup, retour aux anciennes versions. Si vous êtes encore sous IOS v15.1, vous pouvez différer la mise à jour de ces plugins.

### Changed

- [OFP2MAP-MENU v3](https://www.icloud.com/shortcuts/ee982ff186cb4e34854e47b961397451) demande de choisir le dossier des plugins à l'installation. Pour la plupart d'entre vous, le dossier "Tous les raccourcis" est parfaitement adapté. Si jamais vous aviez plus de 96 raccourcis, il faudrait alors placer les plugins dans un dossier séparé: en effet, il est impossible de récupérer plus de 96 raccourcis sous iOS 15.2.
- [OFP2MAP-ETOPS v7](https://www.icloud.com/shortcuts/c3bd42f263bf4f02869959e8d9815ea1) est identique à la v5
- [OFP2MAP-PLUGIN v4](https://www.icloud.com/shortcuts/21d47d9f925b45d8a40bfd81e237ab2f) est identique à la v2

## [1.16.19] - 2021-12-12

### Fixed

- Si la connexion est interrompue pendant le chargement du cache des cartes, affiche l'erreur à la fin.
- Refactoring de l'aide pour rendre les liens directs plus robustes. Hélas, celà ne corrige pas les liens du mémo visuel qui parfois ne fonctionnent pas sous ios15.
- Corrige l'arrondi sur les TSV AF pour éviter des décalages d'une minute dans les résultats affichés.

### Changed

- Les étapes du calculs d'OFP2MAP-FTL ont été réordonnées pour mieux indiquer les paramètres utilisés à chaque étape.

## [1.16.18] - 2021-12-10

### Deprecated

- Le plugin OFP2MAP-ETOPS sera prochainement supprimé, Pilot Mission/FlightLog/ETOPS fait la même chose à présent.

### Changed

- Par défaut la position estimée est affichée sur la carte (c’est pour ceux qui ne lisent pas l’aide).
- Le plugin [OFP2MAP-FTL v2](https://www.icloud.com/shortcuts/52ac3c7d94a34a4d8899b5a918a13b98) est amélioré: sortie au format PDF, fuseaux horaires plus précis, quelques bugs corrigés. La v1 ne fonctionne plus donc mise à jour impérative.

## [1.16.17] - 2021-12-07

### Fixed

- Champ de saisie de l'heure de décollage pouvait ne pas s'actualiser au changement d'OFP

## [1.16.16] - 2021-12-04

### Added

- _plugin_ [OFP2MAP-FTL v1](https://www.icloud.com/shortcuts/1a5c7e8a5e3741b0b7d719fc8ea6f9aa) Calcul en réalisation des limitations TSV et des repos PNC

## [1.16.15] - 2021-12-02

### Changed

- AIRAC 2112
- Les infos de la Regul concernant les butées étant perfectibles: ajout des limitations FTL et AF dans l'export des plugins (plugin à venir).

## [1.16.14] - 2021-11-25

### Fixed

- J'ai pu contourner le bug IOS15/PilotPad. Si vous aviez fait la manip demandée dans la version précédente, vous pouvez réactiver l'option expérimentale WebGL via Metal: Depuis l'app **Réglages**, choisissez **Safari** dans la colonne de gauche, puis à droite en bas, choisir "**Avancé**", puis "**Experimental features**" et mettre sur ON le réglage "**WebGL via Metal**". Il faut ensuite quitter (tuer) OFP2MAP et le relancer. (Vous pouvez alternativement redémarrer l'iPad)

## [1.16.13] - 2021-11-25

~~Sur PilotPad et sous IOS 15, un bug oblige la modifification des réglages de Safari (désactiver l'option expérimentale WebGL via Metal). L'aide dans la rubrique BUG IOS 15 décrit la manip à réaliser. Si vous ne faites pas la manipulation, OFP2MAP fonctionne, mais pendant 5 secondes, tout est figé, lorsque l'application revient au premier plan.~~

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

- _plugin_ [OFP2MAP-ETOPS v5](https://www.icloud.com/shortcuts/365323227837445c9bd68e2be056e094) modifie la regex qui n'affichait pas l'EXP dans certains cas. Sous iOS15, ce plugin demande d'autoriser le partage vers (null), c'est un bug d'iOS, vous pouvez cliquer sur "Autoriser". De plus même, en choisissant "Toujours Autoriser", iOS15 ne mémorise pas votre choix :-(.

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

- _plugin_ [OFP2MAP-FAA WIPs v3](https://www.icloud.com/shortcuts/7e37cedd78d944bf8ceffb7477e356ec) affiche explicitement qu'il n'a pas trouvé d'infos pour un terrain dans le PDF de résultats.

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

- Styles \*/vert/rouge: les emergency orange sont affichés avec <span style="color: #D70;">✸</span> pour une meilleure différenciation avec les adéquats orange <span style="color: #D70; font-size: 70%;">●</span>.
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
- _plugin_ [OFP2MAP-FAA WIPs v2](https://www.icloud.com/shortcuts/17bd4ab2ebec430596137173b131ce38) ajoute les dégagements s'ils publient une carte.

### Added

- possibilité de choisir entre les noms ICAO (par défaut) et IATA pour les aéroports
- un mode FOCUS apparaît dans les réglages des calques. Par défaut il n'affiche que la route. Il est pensé pour utilisation de bascule rapide et ponctuelle. Ce mode peut aussi être utilisé comme un deuxième jeu de réglages, voir l'aide [RÉGLAGES DES CALQUES](#/help_reglages_des_calques).
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
- Safari ne sélectionne plus le texte des boutons de zoom lors de clics répétitifs (dans aspect général)

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
