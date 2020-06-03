import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace';
import json from '@rollup/plugin-json';
import watchAssets from 'rollup-plugin-watch-assets';
const workbox = require('rollup-plugin-workbox-inject');
require('dotenv').config();
const production = !process.env.ROLLUP_WATCH

export default [{
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js'
  },
  plugins: [
    replace({
      'MAPBOX_TOKEN': (!production) ? `"${process.env.MAPBOX_TOKEN}"`: '"pk.eyJ1IjoiZmx5aW5nZWVrIiwiYSI6ImNrYXpmZzhuYjBpczUycW1pZzZ1b2Z4NjAifQ.5S-VzSXpJkui8NDMlTU51Q"'
    }),
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
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    commonjs(),
    resolve({
      browser: true
    }),
    watchAssets({ assets: ['public/index.html', 'public/build/*.js', 'public/build/*.css'] }),
    workbox({
      "globDirectory": "public/",
      "globPatterns": [
        "index.html",
        "build/bundle.css",
        "build/bundle.js",
        "Air_France_Logo.svg",
        "worldmap.svg",
        "map*.png",
        "*-sdf.png",
      ],
      "modifyURLPrefix": {'': '/'}
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
