//.eslintrc.js
const config = {
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: 'eslint:recommended',
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    'no-console': 'warn',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
    ],
    '@typescript-eslint/explicit-function-return-type': 'warn', // Consider using explicit annotations for object literals and function return types even when they can be inferred.
    'no-empty': 'warn',
  },
};

// .eslintrc.json
// {
//     "extends": [
//       "airbnb",
//       "prettier",
//       "prettier/react",
//       "plugin:prettier/recommended",
//       "plugin:jest/recommended",
//       "plugin:unicorn/recommended"
//     ],
//     "plugins": ["prettier", "jest", "unicorn"],
//     "parserOptions": {
//       "sourceType": "module",
//       "ecmaFeatures": {
//         "jsx": true
//       }
//     },
//     "env": {
//       "es6": true,
//       "browser": true,
//       "jest": true
//     },
//     "settings": {
//       "import/resolver": {
//         "node": {
//           "extensions": [".js", ".jsx", ".ts", ".tsx"]
//         }
//       }
//     },
//     "overrides": [
//       {
//         "files": ["**/*.ts", "**/*.tsx"],
//         "parser": "typescript-eslint-parser",
//         "rules": {
//           "no-undef": "off"
//         }
//       }
//     ]
//   }
