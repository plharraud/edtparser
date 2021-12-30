module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'standard',
    'plugin:vue/vue3-recommended'
  ],
  rules: {
    'vue/no-unused-vars': 'warn',
    'no-unused-vars': 'warn',
    'vue/multi-word-component-names': 'off'
  }
}
