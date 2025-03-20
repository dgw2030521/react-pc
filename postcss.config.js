module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-import': {},
    'postcss-url': {},
    // 根据目标浏览器的兼容性要求，自动引入所需的Polyfill，提升代码的兼容性。
    'postcss-preset-env': {
      browsers: 'last 2 versions', // 指定只对最近 2 个版本的浏览器进行兼容性处理。
    },
    cssnano: {
      // 主要用来压缩和清理CSS代码。在Webpack中，cssnano和css-loader捆绑在一起，所以不需要自己加载它。
      preset: 'advanced', // 重复调用
      autoprefixer: false, // cssnext和cssnano都具有autoprefixer,事实上只需要一个，所以把默认的autoprefixer删除掉，然后把cssnano中的autoprefixer设置为false。
      'postcss-zindex': false, // 只要启用了这个插件，z-index的值就会重置为1
    },
  },
};