import pluginJs from '@eslint/js';
// import tseslint from 'typescript-eslint';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin'; // 导入 TypeScript ESLint 插件，用于针对 TypeScript 代码添加额外的 lint 规则等功能
import tsEslintParser from '@typescript-eslint/parser'; // 导入
import importPlugin from 'eslint-plugin-import';
import jsxPlugin from 'eslint-plugin-jsx-a11y';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'; // 导入 ESLint 插件 prettier 的推荐配置，用于结合 ESLint 和 Prettier 进行代码格式化和风格检查
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

// 定义针对 TypeScript 文件的特定配置
const customTsFlatConfig = [
  {
    // 配置项的名称，用于标识该配置，此处可理解为基于 'typescript-eslint/base' 的配置
    name: 'typescript-eslint/base',
    languageOptions: {
      parser: tsEslintParser, // 指定解析 TypeScript 文件所使用的解析器为 tsEslintParser
      sourceType: 'module',
    },
    files: ['**/*.{ts,tsx}'],
    rules: {
      ...tsEslintPlugin.configs.recommended.rules, // 合并 @typescript-eslint/eslint-plugin 推荐配置中的规则
      '@typescript-eslint/no-var-requires': 0, // 允许require
      '@typescript-eslint/no-unused-vars': 0, // 关掉ts自带的
      '@typescript-eslint/no-unused-expressions': 0, // 关掉ts自带的
      '@typescript-eslint/no-floating-promises': 0, // 允许promise
      '@typescript-eslint/no-unsafe-call': 0, // 允许call
      '@typescript-eslint/no-explicit-any': 0, // 允许any
      '@typescript-eslint/no-unsafe-return': 0,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/no-use-before-define': 1,
      '@typescript-eslint/restrict-template-expressions': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/ban-ts-comment': 1, // 禁止ts注释
      '@typescript-eslint/no-empty-function': 1, // 禁止空函数
      '@typescript-eslint/ban-types': 0, // 禁止类型
      '@typescript-eslint/no-for-in-array': 0, // 禁止for in
      '@typescript-eslint/require-await': 0,
      '@typescript-eslint/no-misused-promises': 0,
      // 保留any的使用，编码时尽量避免
      '@typescript-eslint/no-unsafe-argument': 0, // 允许参数
      '@typescript-eslint/no-unsafe-assignment': 0,
      '@typescript-eslint/no-unsafe-member-access': 0,
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin, // 注册 '@typescript-eslint' 插件，使其规则和功能在后续 ESLint 检查中可用
    },
  },
];

// React 相关配置项，用于对 React 项目代码进行规范检查和配置
const commonReactConfig = [
  {
    name: 'react-eslint',
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      react: reactPlugin, // 注册'react' 插件，用于支持 React 相关的规则检查
      'react-hooks': reactHooksPlugin, // 注册'react-hooks' 插件，用于支持 React Hooks 相关规则检查
      'jsx-a11y': jsxPlugin, // 注册'jsx-a11y' 插件，用于支持 JSX
      'unused-imports': unusedImportsPlugin, // 注册'unused-imports' 插件，用于检查未使用的导入
      'simple-import-sort': simpleImportSortPlugin, // 注册'simple-import-sort' 插件，用于检查导入语句的
      import: importPlugin, // 注册'import' 插件，用于支持导入相关规则检查
    },
    languageOptions: {
      // 合并'react' 插件推荐配置中的语言选项相关配置，例如设置支持的 JSX 相关语法等
      ...reactPlugin.configs.recommended.languageOptions,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules, // 合并'react' 插件推荐配置中的规则
      // react 规则
      'react/react-in-jsx-scope': 0,
      'react/jsx-uses-react': 2,
      'react/jsx-uses-vars': 2,
      'react/prop-types': 0,
      'react/jsx-one-expression-per-line': 0,
      'react/forbid-prop-types': 0,
      'react/jsx-indent': 0,
      'react/no-array-index-key': 1,
      'react/jsx-wrap-multilines': [2, { declaration: false, assignment: false }],
      'react/jsx-filename-extension': 0,
      'react/state-in-constructor': 0,
      'react/jsx-props-no-spreading': 0,
      'react/require-default-props': 0,
      'react/sort-comp': 0,
      'react/display-name': 0,
      'react/static-property-placement': 0,
      'react/jsx-no-bind': 0, // Should not check test file
      'react/no-find-dom-node': 0,
      'react/no-unused-prop-types': 1,
      'react/default-props-match-prop-types': 0,
      'react/function-component-definition': 0,
      'react/no-unused-class-component-methods': 1,
      'react/destructuring-assignment': 0,
      'react/no-unstable-nested-components': 0,
      // jsx
      'jsx-a11y/no-static-element-interactions': 0, // 允许静态元素交互
      'jsx-a11y/anchor-has-content': 0,
      'jsx-a11y/click-events-have-key-events': 0,
      'jsx-a11y/anchor-is-valid': 0,
      'jsx-a11y/no-noninteractive-element-interactions': 0,
      // label-has-for has been deprecated
      // https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/label-has-for.md
      'jsx-a11y/label-has-for': 0,

      // simple-import-sort
      'simple-import-sort/imports': 1, // 导入排序
      'simple-import-sort/exports': 1, // 导出排序
      // import
      'import/extensions': 0, // 允许import后缀,比如scss
      'import/no-cycle': 2, // 禁止循环引用
      'import/no-unresolved': 0, // 允许import未定义
      'import/prefer-default-export': 0, // 允许默认导出
      'import/exports-last': 1, // 导出必须放在最后
      'import/no-extraneous-dependencies': 0,
      // unused-imports
      'unused-imports/no-unused-imports': 2, // 禁止未使用的import
      'unused-imports/no-unused-vars': 2, // 禁止未使用的变量
    },
    settings: {
      react: {
        // 设置 React 版本为自动检测，让 ESLint 相关插件根据项目实际使用的 React 版本来应用合适的规则和检查逻辑
        version: 'detect',
      },
    },
  },
];

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  eslintPluginPrettierRecommended,
  // ...tseslint.configs.recommended,
  // pluginReact.configs.flat.recommended,
  ...customTsFlatConfig,
  ...commonReactConfig,
  {
    ignores: ['config/', 'build/', 'dist/', 'public/', 'scripts/', 'mock/', '.vscode/', '**/*.test.js'],
  },
];
