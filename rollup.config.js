import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import watchAssets from 'rollup-plugin-watch-assets'; // also requires globby
const workbox = require('rollup-plugin-workbox-inject');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const production = !process.env.ROLLUP_WATCH 

const CONF_LIDOJS_JS = './build/lidojs.min.js';
const CONF_WMO_JS = './build/wmo.var.js';
const replaced = {
  'CONF_BOOTSTRAP_CSS': 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css',
  'CONF_MAPBOXGL_CSS': 'https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.css',
  'CONF_MAPBOXGL_JS': 'https://unpkg.com/mapbox-gl@1.10.1/dist/mapbox-gl.js',
  'CONF_PDFJS_WORKER_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.worker.min.js',
  'CONF_PDFJS_JS': 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.4.456/pdf.min.js',
  'CONF_LIDOJS_JS': CONF_LIDOJS_JS,
  'CONF_WMO_JS': CONF_WMO_JS
};

export default [{
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    replace({...replaced, ...{
      'MAPBOX_TOKEN': (!production) ? process.env.MAPBOX_TOKEN : 'pk.eyJ1IjoiZmx5aW5nZWVrIiwiYSI6ImNrYXpmZzhuYjBpczUycW1pZzZ1b2Z4NjAifQ.5S-VzSXpJkui8NDMlTU51Q'
    }}),
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write('public/build/bundle.css')
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
    {
      name: 'copy-lidojs',
      load() {
        this.addWatchFile(path.resolve('./node_modules/@flyingeek/lidojs/dist/lidojs.min.js'));
        this.addWatchFile(path.resolve('./node_modules/@flyingeek/lidojs/dist/wmo.var.js'));
      },
      generateBundle() {
        fs.copyFileSync(
          path.resolve('./node_modules/@flyingeek/lidojs/dist/lidojs.min.js'),
          path.resolve('./public/' + CONF_LIDOJS_JS)
        );
        fs.copyFileSync(
          path.resolve('./node_modules/@flyingeek/lidojs/dist/wmo.var.js'),
          path.resolve('./public/' + CONF_WMO_JS)
        );
      }
    },
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
    replace({...replaced, ...{
      'process.env.NODE_ENV': JSON.stringify('production'),
    }}),
    commonjs(),
    resolve({
      browser: true
    }),
    watchAssets({ assets: ['public/index.html', 'public/build/*.js', 'public/build/*.css', 'rollup.config.js'] }),
    workbox({
      "globDirectory": "public/",
      "globPatterns": [
        "index.html",
        "build/bundle.css",
        "build/bundle.js",
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
