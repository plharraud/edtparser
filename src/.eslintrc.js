module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'standard'
  ],
  rules: {
    'camelcase': 'off',
    'quote-props': 'off',
    'new-cap': 'off',
    'no-unused-vars': 'warn'
  }
}
