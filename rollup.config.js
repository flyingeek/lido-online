import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-css-only';
import watchAssets from 'rollup-plugin-watch-assets'; // also requires globby
import {version, config} from './package.json';
import lidojsPkg from './node_modules/@flyingeek/lidojs/package.json';
import md2json from 'md-2-json';
import fs from 'fs';
import workbox from 'rollup-plugin-workbox-inject';
import {markdown} from 'svelte-preprocess-markdown';
import path from 'path';
import Mustache from 'mustache';
import dotenv from 'dotenv'
dotenv.config();
import child_process from 'child_process';

const production = !process.env.ROLLUP_WATCH;
const debugWorkbox = !!process.env.DEBUG_WORKBOX;
const disableLiveReload = !!process.env.DISABLE_LIVERELOAD || debugWorkbox;

const northId = 'northv3';
const southId = 'southv3';
const pacificId = 'pacificv1';
const theworldId = 'theworldv2';
const mercatorId = 'denizotjbv2';
const eqePhysicalFrId = 'eqephysicalfrv1';
const namPhysicalMetersId = 'namphysicalmetersv1';
const cbId = 'cb2022v1';
const eqePoliticalFrId = 'eqepoliticalfrv1';
const articId = 'articv1';

// All URL, local or remote
const U = {
  'process.env.NODE_ENV': (production) ? JSON.stringify('production') : JSON.stringify('development'),
  'CONF_BOOTSTRAP_CSS': 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.1.3/css/bootstrap.min.css',
  'CONF_MAPBOXGL_CSS': 'https://unpkg.com/mapbox-gl@1.13.2/dist/mapbox-gl.css',
  'CONF_MAPBOXGL_JS': 'https://unpkg.com/mapbox-gl@1.13.2/dist/mapbox-gl.js',
  'CONF_PDFJS_WORKER_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js',
  'CONF_PDFJS_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js',
  'CONF_PROJ4_JS': 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js',
  'CONF_LIDOJS_JS': `./js/lidojs.${lidojsPkg.version}.min.js`,
  'CONF_WMO_JS': `./js/wmo.${lidojsPkg.version}.var.js`,
  'CONF_PINCHZOOM_JS': 'https://unpkg.com/pinch-zoom-element-js@1.1.2/dist/pinch-zoom-min.js',
  'CONF_BUNDLE_JS': './js/bundle.js',
  'CONF_BUNDLE_CSS': './css/bundle.css',
  'CONF_AIRAC': config.AIRAC,
  'CONF_NORTH': northId,
  'CONF_SOUTH': southId,
  'CONF_PACIFIC': pacificId,
  'CONF_THEWORLD': theworldId,
  'CONF_MERCATOR': mercatorId,
  'CONF_EQE_PHYSICAL_FR': eqePhysicalFrId,
  'CONF_NAM_PHYSICAL_METERS': namPhysicalMetersId,
  'CONF_CB': cbId,
  'CONF_EQE_POLITICAL_FR': eqePoliticalFrId,
  'CONF_ARTIC': articId,
  'CONF_TILES_DB': 'lido-tiles',
  'CONF_GRAMET_PROXY': "https://cjq5hglsy6.execute-api.eu-west-3.amazonaws.com/default/gramet/${data.proxy}__${data.route.name.replace(/[^a-z0-9\\-_]/giu, '_')}.png",
  'CONF_NORTH_TILES_BASE_URL': `https://ofp2map-${northId}.netlify.app/${northId}`,
  'CONF_SOUTH_TILES_BASE_URL': `https://ofp2map-${southId}.netlify.app/${southId}`,
  'CONF_PACIFIC_TILES_BASE_URL': `https://ofp2map-${pacificId}.netlify.app/${pacificId}`,
  'CONF_THEWORLD_TILES_BASE_URL': `https://ofp2map-${theworldId}.netlify.app/${theworldId}`,
  'CONF_EQE_PHYSICAL_FR_TILES_BASE_URL': `https://ofp2map-${eqePhysicalFrId}.netlify.app/${eqePhysicalFrId}`,
  'CONF_NAM_PHYSICAL_METERS_TILES_BASE_URL': `https://ofp2map-${namPhysicalMetersId}.netlify.app/${namPhysicalMetersId}`,
  'CONF_CB_TILES_BASE_URL': `https://ofp2map-${cbId}.netlify.app/${cbId}`,
  'CONF_EQE_POLITICAL_FR_TILES_BASE_URL': `https://ofp2map-${eqePoliticalFrId}.netlify.app/${eqePoliticalFrId}`,
  'CONF_ARTIC_TILES_BASE_URL': `https://ofp2map-${articId}.netlify.app/${articId}`,
  'CONF_NOAA_KP_JSON': 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'
};
U.CONF_GRAMET_PROXY_ORIGIN = new URL(U.CONF_GRAMET_PROXY).origin;

const relPath = (url) => url.replace('./', './public/'); // public path for a local url

function serve() {
  let server;

  function toExit() {
      if (server) server.kill(0);
  }

  return {
      writeBundle() {
          if (server) return;
          const command = (process.env.SERVE === 'start2') ? 'start2' : 'start';
          server = child_process.spawn('npm', ['run', command, '--', '--dev'], {
              stdio: ['ignore', 'inherit', 'inherit'],
              shell: true
          });

          process.on('SIGTERM', toExit);
          process.on('exit', toExit);
      }
  };
}

export default [{
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    dir: 'public',
    entryFileNames: U.CONF_BUNDLE_JS.replace('./', '')
  },
  plugins: [
    replace({...U, ...{
        'MAPBOX_TOKEN': (!production) ? process.env.MAPBOX_TOKEN : 'pk.eyJ1IjoiZmx5aW5nZWVrIiwiYSI6ImNrYXpmZzhuYjBpczUycW1pZzZ1b2Z4NjAifQ.5S-VzSXpJkui8NDMlTU51Q',
        'APP_VERSION': version,
        'preventAssignment': true
    }}),
    svelte({
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production
      },
      // we'll extract any component CSS out into
      // a separate file - better for performance
      extensions: ['.svelte','.md'],
      preprocess: markdown({
        headerPrefix: 'md_',
        headerIds: true
      })
    }),
    // we'll extract any component CSS out into
    // a separate file - better for performance

    //scss({ output: relPath(U.CONF_BUNDLE_CSS) }), // scss needs public/ prefix
    css({ output: U.CONF_BUNDLE_CSS.replace('./', '') }),
    json(),
    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),
    copy({
      targets: [
        {
          src: './node_modules/@flyingeek/lidojs/dist/lidojs.min.js',
          dest: path.dirname(relPath(U.CONF_LIDOJS_JS)),
          rename: path.basename(U.CONF_LIDOJS_JS)
        },
        {
          src: './node_modules/@flyingeek/lidojs/dist/lidojs.min.js.map',
          dest: path.dirname(relPath(U.CONF_LIDOJS_JS))
          //must not be renamed
        },
        {
          src: './node_modules/@flyingeek/lidojs/dist/wmo.var.js',
          dest: path.dirname(relPath(U.CONF_WMO_JS)),
          rename: path.basename(U.CONF_WMO_JS)
        },
        {
          src: './data/airports.geojson',
          dest: './public/data',
          rename: `airports.${U.CONF_AIRAC}.geojson`
        },
        {
          src: './data/fir-reg.geojson',
          dest: './public/data',
          rename: `fir-reg.${U.CONF_AIRAC}.geojson`
        }
        // {
        //   src: './data/fir-oceanic.geojson',
        //   dest: './public/data',
        //   rename: `fir-oceanic.geojson`
        // }
      ],
      copyOnce: true,
      verbose: true
    }),
    copy({
      targets: [{ src: 'assets/**/*', dest: 'public' }],
      flatten: false,
      copyOnce: true,
      verbose: true
    }),
    copy({
      targets: [{
        src: 'src/index.html',
        dest: 'public',
        transform: (contents) => Mustache.render(contents.toString(), U)
      }],
      verbose: true
    }),
    {
      name: 'generate-changelog-json',
      writeBundle() {
        const changelog = fs.readFileSync('./CHANGELOG.md', 'utf8');
        fs.writeFileSync(
          './public/CHANGELOG.json',
          JSON.stringify(md2json.parse(changelog))
        );
      },
    },
    // injectManifest({
    //   swSrc: 'src/sw.js',
    //   swDest: 'src/sw-injectManifest.js',
    //   globDirectory: "public/",
    //   globPatterns: [
    //     "index.html",
    //     "images/ofp2map-icons/icon-180x180.png",
    //     "images/ofp2map-icons/icon-128x128.png",
    //     "css/bundle.css",
    //     "js/bundle.js",
    //     "svg/*.svg",
    //     "sdf/*.png",
    //   ]
    // }),
    // watchAssets({ assets: [
    //   'src/sw.js',
    //   'src/index.html',
    //   'assets/images/ofp2map-icons/icon-180x180.png',
    //   "assets/images/ofp2map-icons/icon-128x128.png",
    //   'assets/svg/*.svg',
    //   'assets/sdf/*.png'
    // ] }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && !disableLiveReload && livereload({watch: 'public', port:35729, https: (process.env.SERVE === 'start2') ? {
      key: fs.readFileSync('localhost-key.pem'),
      cert: fs.readFileSync('localhost-cert.pem')
  } : null}),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser({
      'compress': {
          'drop_console': true
      },
    })
  ],
  watch: {
    clearScreen: false
  }
},
{
  input: 'src/sw.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'sw',
    file: 'public/sw.js'
  },
  plugins: [
    replace({...U, ...{
      'process.env.NODE_ENV': JSON.stringify('production'),
      'CONF_LIDOJS_VERSION': lidojsPkg.version,
      'APP_VERSION': version,
      'preventAssignment': true
    }}),
    commonjs(),
    resolve({
      browser: true
    }),
    watchAssets({ assets: ['public/index.html', 'public/js/*.js', 'public/css/*.css', 'rollup.config.js'] }),
    workbox({
      "globDirectory": "public/",
      "globPatterns": [
        "index.html",
        "images/ofp2map-icons/icon-180x180.png",
        "images/ofp2map-icons/icon-128x128.png",
        "images/map-help.webp",
        "images/layers-settings.webp",
        "images/ephemerides.webp",
        "images/65x70_northern-lights.webp",
        "images/stripe-orange.png",
        "images/stripe-red.png",
        "css/bundle.css",
        "js/bundle.js",
        "svg/*.svg",
        "sdf/*.png",
        "CHANGELOG.json"
      ]
    }),
    production && terser()
  ]
}
]
