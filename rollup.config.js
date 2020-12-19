import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy'
import watchAssets from 'rollup-plugin-watch-assets'; // also requires globby
import {version, config} from './package.json';
import lidojsPkg from './node_modules/@flyingeek/lidojs/package.json';
const workbox = require('rollup-plugin-workbox-inject');
const {markdown} = require('svelte-preprocess-markdown');
const path = require('path');
const Mustache = require('mustache');
require('dotenv').config();
const production = !process.env.ROLLUP_WATCH 
const northId = 'northv3'
const southId = 'southv3'
const pacificId = 'pacificv1' 
// All URL, local or remote
const U = {
  'CONF_BOOTSTRAP_CSS': 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css',
  'CONF_MAPBOXGL_CSS': 'https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.css',
  'CONF_MAPBOXGL_JS': 'https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.js',
  'CONF_PDFJS_WORKER_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js',
  'CONF_PDFJS_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js',
  'CONF_PROJ4_JS': 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.6.2/proj4.min.js',
  'CONF_LIDOJS_JS': `./js/lidojs.${lidojsPkg.version}.min.js`,
  'CONF_WMO_JS': `./js/wmo.${lidojsPkg.version}.var.js`,
  'CONF_BUNDLE_JS': './js/bundle.js',
  'CONF_BUNDLE_CSS': './css/bundle.css',
  'CONF_AIRAC': config.AIRAC,
  'CONF_NORTH': northId,
  'CONF_SOUTH': southId,
  'CONF_PACIFIC': pacificId,
  //'CONF_GRAMET_PROXY': "https://editolido.alwaysdata.net/proxy_gramet2/${data.proxy}/${data.route.name.replace(/[^a-z0-9\\-_]/giu, '_')}.png",
  'CONF_GRAMET_PROXY': "https://ofp2map-gramet.vercel.app/api/${data.proxy}__${data.route.name.replace(/[^a-z0-9\\-_]/giu, '_')}.png",
  //'CONF_NORTH_TILES_BASE_URL': `https://editolido.alwaysdata.net/i/${northId}`,
  'CONF_NORTH_TILES_BASE_URL': `https://ofp2map-${northId}.netlify.app/${northId}`,
  //'CONF_SOUTH_TILES_BASE_URL': `https://editolido.alwaysdata.net/i/${southId}`,
  'CONF_SOUTH_TILES_BASE_URL': `https://ofp2map-${southId}.netlify.app/${southId}`,
  //'CONF_PACIFIC_TILES_BASE_URL': `https://editolido.alwaysdata.net/i/${pacificId}`
  'CONF_PACIFIC_TILES_BASE_URL': `https://ofp2map-${pacificId}.netlify.app/${pacificId}`
};
const relPath = (url) => url.replace('./', './public/'); // public path for a local url

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
      'APP_VERSION': version
    }}),
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      extensions: ['.svelte','.md'],
      preprocess: markdown(),
      css: css => {
        css.write(U.CONF_BUNDLE_CSS.replace('./', ''))
      }
    }),
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

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

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
      'CONF_LIDOJS_VERSION': lidojsPkg.version
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
        "apple-touch-icon.png",
        "css/bundle.css",
        "js/bundle.js",
        "svg/*.svg",
        "sdf/*.png"
      ]
    }),
    production && terser()
  ]
}]

function serve() {
  let started = false

  return {
    writeBundle() {
      if (!started) {
        started = true

        require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true
        })
      }
    }
  }
}
