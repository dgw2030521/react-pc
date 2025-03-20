const prettierConfigStandard = require('prettier-config-standard');

module.exports = {
  ...prettierConfigStandard,
  jsxSingleQuote: true,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 120,
  proseWrap: 'never',
  arrowParens: 'avoid',
};