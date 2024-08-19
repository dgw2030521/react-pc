module.exports = {
  plugins: {
    autoprefixer: {}, // 用来给不同的浏览器自动添加相应前缀，如-webkit-，-moz-等等
    'postcss-px-to-viewport': {
      unitToConvert: 'px', // 要转化的单位
      viewportWidth: 1920, // UI设计稿的宽度
      unitPrecision: 5, // 转换后的精度，即小数点位数
      propList: ['*'], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
      viewportUnit: 'vw', // 指定需要转换成的视窗单位，默认vw
      fontViewportUnit: 'vw', // 指定字体需要转换成的视窗单位，默认vw
      selectorBlackList: ['.wrap', '.ignore', '.hairlines'], // 指定不转换为视窗单位的类名，
      minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
      // 媒体查询里的单位是否需要转换单位
      mediaQuery: false,
      replace: true, // 是否转换后直接更换属性值
      // 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
      exclude: [/node_modules/, /dist/, /.output/, /.nuxt/, /.vscode/],
      // 如果设置了include，那将只有匹配到的文件才会被转换
      // include: [/pages/, /assets\/styles\/*/],

      // 是否添加根据 landscapeWidth 生成的媒体查询条件 @media (orientation: landscape)
      landscape: false,
      // 横屏时使用的单位
      landscapeUnit: 'vw',
      // 横屏时使用的视口宽度
      landscapeWidth: 1338,
    },
  },
};
