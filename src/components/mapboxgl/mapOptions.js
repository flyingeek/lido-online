import blankStyle from './blankStyle';
// Pour réaliser les tiles dans Map Tiler
// - Choisir Andvanced Tiles -> Continue
// - Choisir le TIF geo-référencé -> Continue
// - choisir Custom dans presets
// - choisir "from output" et 512px x 512px
// - choisir Zoom: 0 à 4
// - choisir "Advanced Options" -> séléctionner JPEG, laisser sur Sparse Output et OpenGIS -> Close
// - choisir "Folder" -> Render
const query = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
const tilesResolution = (matchMedia(query).matches) ? 256 : 512;
const options = [
    {
        'label': 'Mercator',
        'id': 'mercator',
        'mapboxOptions': {
            //'style': 'mapbox://styles/flyingeek/ckc4yge17166a1ip66rkf0zhr',
            'style': 'mapbox://styles/flyingeek/cklgh38ep0xsr17qsvlrhth1e',
            'renderWorldCopies': false,
            'maxZoom': 12
        },
        'cacheName': 'CONF_MERCATOR',
        'cacheZoom': 6
    },
    {
        'label': 'Lambert North',
        'id': 'jb_north',
        'extent': [-7441575.32982940, -5719574.16449270, 7383398.17621086, 9105399.34154755],
        //'affineTransform': [2.63206100208865, -323662.179369435, 2.63502996130431, -10626687.7639946],
        'proj4': '+proj=lcc +lat_1=30 +lat_2=65 +lat_0=47.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        'mapboxOptions': {
            'style': blankStyle,
            'renderWorldCopies': false,
            'maxZoom': 5
        },
        'tiles': ['CONF_NORTH_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
        'cacheZoom': 4,
        'cacheName': 'CONF_NORTH',
        'cacheAll': true,
        'tileSize': tilesResolution
    },
    {
        'label': 'Lambert South',
        'id': 'jb_south',
        'extent': [-12613000.20107552, -12796118.19556621, 13437104.14597977, 13253986.15148908],
        'validity': [-12613903.56963206, -9420000.1608799, 13437054.51836624, 5862747.38325809],
        'proj4': '+proj=lcc +lat_1=-15 +lat_2=30 +lat_0=7.5 +lon_0=0 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        'mapboxOptions': {
            'style': blankStyle,
            'renderWorldCopies': false,
            'maxZoom': 5
        },
        'tiles': ['CONF_SOUTH_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
        'cacheZoom': 4,
        'cacheName': 'CONF_SOUTH',
        'cacheAll': true,
        'tileSize': tilesResolution
    },
    {
        'label': 'Lambert Pacific',
        'id': 'jb_pacific',
        'extent': [-8306365.14297095, -7788164.66141786, 6519185.45830619, 7037385.93985927],
        'proj4': '+proj=lcc +lat_1=-15 +lat_2=30 +lat_0=7.5 +lon_0=-140 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
        'mapboxOptions': {
            'style': blankStyle,
            'renderWorldCopies': false,
            'maxZoom': 5
        },
        'tiles': ['CONF_PACIFIC_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
        'cacheName': 'CONF_PACIFIC',
        'cacheZoom': 4,
        'cacheAll': true,
        'tileSize': tilesResolution
    },
    {
        'label': 'The World',
        'id': 'jb_theworld',
        // for wide map
        //'ratio': [16358, 10084], /* width, height, but we use affineTransform instead */
        //'affineTransform': [1.314746085506463, -40260.546626176685, 1.3162291162962998, 6490582.670755925]
        //'affineTransform': [1.314746085506463, -40260.546626176685, 1.3145 ,6475000],
        //1.314746085506463 -40260.546626176685 1.316835790740793 6484333.360029304
        //'affineTransform': [1.314746085506463, -45260.546626176685, 1.3162291881 ,6490582],
        'affineTransform': [1.314746085506463, -45260.546626176685, 1.315 ,6480000],
        "extent": [-15201502.45260082, -8478963.56607166, 15262747.04890729, 10300929.57326125],
        //
        // 10000x10000 px map adjust
        //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3435451202037834, -1086726.777713921],
        //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3425, -1095092],
        //'affineTransform': [1.342031311736757, 1178.4237424843013, 1.3421, -1100000],
        //"extent": [-14923314.11241390, -14113585.79413393, 14921557.93320679, 15731286.25148677],
        "proj4": "+proj=times +ellps=sphere +no_defs +wktext +lon_0=0 +x_0=0 +y_0=0",
        'mapboxOptions': {
            'style': blankStyle,
            'renderWorldCopies': false,
            'maxZoom': 5
        },
        'tiles': ['CONF_THEWORLD_TILES_BASE_URL/{z}/{x}/{y}.webp'],
        'matrix': [[1, 1], [2, 2], [4, 3], [8, 5], [16, 10], [32, 20], [64, 40]],
        'cacheZoom': 5,
        'cacheName': 'CONF_THEWORLD',
        'cacheAll': true,
        'tileSize': tilesResolution
    },
    {
        'label': '=Physique=',
        'id': 'ed_eqe_physical_fr',
        // for wide map
        //"ratio": [19268, 10630],
        //'affineTransform': [1.1037001869442906, 855.8520345054567, 1.1049451584091474, 9308847.034806727]
        'affineTransform': [1.104, -855.8520345054567, 1.10, 9310000],
        "extent": [-18145536.69460000, -10300589.33644032, 18143985.81684419, 9720047.17470000],
        "proj4": "+proj=eqearth +datum=WGS84 +wktext",
        'mapboxOptions': {
            'style': blankStyle,
            'renderWorldCopies': false,
            'maxZoom': 5
        },
        'tiles': ['CONF_EQE_PHYSICAL_FR_TILES_BASE_URL/{z}/{x}/{y}.webp'],
        'matrix': [[1, 1], [2, 2], [4, 3], [8, 5], [16, 9], [32, 18], [64, 36]],
        'cacheZoom': 5,
        'cacheName': 'CONF_EQE_PHYSICAL_FR',
        'cacheAll': true,
        'tileSize': tilesResolution
    }
    //,
    // {
    //     'label': '=Politique=',
    //     'id': 'ed_eqe_political_fr',
    //     // for wide map
    //     //"ratio": [19268, 10630],
    //     //'affineTransform': [1.1037001869442906, 855.8520345054567, 1.1049451584091474, 9308847.034806727]
    //     'affineTransform': [1.104, -855.8520345054567, 1.10, 9310000],
    //     "extent": [-18144998.39890000, -9405510.77770950, 18144670.32165249, 9729041.82040000],
    //     "proj4": "+proj=eqearth +datum=WGS84 +wktext",
    //     'mapboxOptions': {
    //         'style': blankStyle,
    //         'renderWorldCopies': false,
    //         'maxZoom': 6
    //     },
    //     'tiles': ['CONF_EQE_POLITICAL_FR_TILES_BASE_URL/{z}/{x}/{y}.jpg'],
    //     'matrix': [[1, 1], [2, 2], [4, 3], [8, 5], [16, 9], [32, 17], [64, 34]],
    //     'cacheZoom': 6,
    //     'cacheName': 'CONF_EQE_POLITICAL_FR',
    //     'cacheAll': true,
    //     'tileSize': tilesResolution
    // }
    // ,
    // {
    //     'label': 'JB Mercator',
    //     'id': 'mapbox_jb_mercator',
    //     'mapboxOptions': {
    //         'style': 'mapbox://styles/denizotjb/ckbi1x4ae0vp11jqtfulbtll5'
    //     }
    // }
];

export { options as default};