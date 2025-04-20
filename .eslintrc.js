module.exports = {
  plugins: ['prettier'],
  extends: ['react-app', 'plugin:prettier/recommended'], // 使用推荐的配置
  rules: {
    'prettier/prettier': 'warn', // 把 Prettier 的规则作为一个错误处理
  },
};
