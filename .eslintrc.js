module.exports = {
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module'
  },
  env: {
    es6: true,
    browser: true,
    node: true
  },
  plugins: [
    'svelte3',
    'html'
  ],
  ignorePatterns: [
    'public/build/'
  ],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],
  extends: [
    'eslint:recommended'
  ]
}